import os
import json
import time
from typing import List
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv

from app.models.schemas import RoleAnalysis, CandidateProfile, JobFitAnalysis, FullAnalysisResponse
from app.core.prompts import ROLE_ANALYSIS_SYSTEM_PROMPT, CANDIDATE_FIT_SYSTEM_PROMPT

load_dotenv()

# Priority order for models: stable high-speed aliases first
MODEL_PREFERENCE = [
    "gemini-3.5-flash",
    "gemini-flash-latest",
]


class CombinedFitSchema(BaseModel):
    # CandidateProfile fields
    candidate_skills: List[str]
    relevant_experience: List[str]
    relevant_projects: List[str]
    relevant_achievements: List[str]
    # JobFitAnalysis fields
    fit_score: int
    strong_matches: List[str]
    partial_matches: List[str]
    missing_or_weak: List[str]
    resume_claims_to_probe: List[str]
    preparation_areas: List[str]
    summary: str


class LLMService:
    def __init__(self):
        raw_keys = os.getenv("GEMINI_API_KEY", "")
        # Support comma-separated keys or single key
        self.api_keys = [k.strip() for k in raw_keys.split(",") if k.strip()]
        self._key_index = 0
        self._active_model: str = MODEL_PREFERENCE[0]
        self._init_client()

    def _init_client(self):
        if not self.api_keys:
            self.client = None
            return
        current_key = self.api_keys[self._key_index]
        self.client = genai.Client(
            api_key=current_key,
            http_options=types.HttpOptions(timeout=35000),  # 35s timeout to prevent endless hanging
        )

    def _rotate_key(self):
        if len(self.api_keys) > 1:
            self._key_index = (self._key_index + 1) % len(self.api_keys)
            self._init_client()

    @property
    def model_name(self) -> str:
        return self._active_model

    def _generate_with_retry(self, contents, config) -> types.GenerateContentResponse:
        """
        Generate content with automatic key rotation and multi-model fallback.
        """
        if not self.api_keys:
            raise ValueError("GEMINI_API_KEY is missing from environment variables.")

        models_to_try = [self._active_model] + [m for m in MODEL_PREFERENCE if m != self._active_model]
        last_error = None

        max_key_attempts = max(len(self.api_keys), 1)
        for _ in range(max_key_attempts):
            for model in models_to_try:
                try:
                    response = self.client.models.generate_content(
                        model=model,
                        contents=contents,
                        config=config,
                    )
                    self._active_model = model
                    return response
                except Exception as exc:
                    last_error = exc
                    msg = str(exc)
                    # If this model is 503 or 404, immediately try next model
                    if any(x in msg for x in ["503", "UNAVAILABLE", "404", "NOT_FOUND"]):
                        continue
                    # If this key is quota exhausted / 429, break to rotate key
                    if any(x in msg for x in ["429", "RESOURCE_EXHAUSTED", "quota"]):
                        break
                    continue
            self._rotate_key()

        raise last_error

        raise last_error

    def analyze_unified(
        self, jd_text: str, resume_text: str
    ) -> tuple[RoleAnalysis, CandidateProfile, JobFitAnalysis]:
        """
        Unified single-call extraction that decomposes role and calculates candidate fit
        simultaneously. Reduces latency and API roundtrips by 50%.
        """
        prompt = (
            f"You are an elite Technical Hiring Principal and Executive Evaluator.\n"
            f"Perform a comprehensive analysis of the target Job Description and Candidate Resume.\n"
            f"Extract all role expectations, assess candidate fit score (0-100), identify match vectors, "
            f"detect suspicious claims to probe, and output the result adhering to the FullAnalysisResponse schema.\n\n"
            f"=== TARGET JOB DESCRIPTION ===\n{jd_text}\n\n"
            f"=== CANDIDATE RESUME ===\n{resume_text}\n"
        )
        response = self._generate_with_retry(
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=FullAnalysisResponse,
                temperature=0.2,
            ),
        )
        data = FullAnalysisResponse.model_validate_json(response.text)
        return data.role_analysis, data.candidate_profile, data.job_fit

    def analyze_role(self, jd_text: str) -> RoleAnalysis:
        response = self._generate_with_retry(
            contents=f"Job Description:\n{jd_text}",
            config=types.GenerateContentConfig(
                system_instruction=ROLE_ANALYSIS_SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=RoleAnalysis,
                temperature=0.2,
            ),
        )
        return RoleAnalysis.model_validate_json(response.text)

    def analyze_candidate_fit(self, jd_text: str, resume_text: str) -> tuple[CandidateProfile, JobFitAnalysis]:
        prompt = f"JOB DESCRIPTION:\n{jd_text}\n\nCANDIDATE RESUME:\n{resume_text}"
        response = self._generate_with_retry(
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=CANDIDATE_FIT_SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=CombinedFitSchema,
                temperature=0.2,
            ),
        )
        data = json.loads(response.text)
        candidate = CandidateProfile(**{k: data[k] for k in CandidateProfile.model_fields if k in data})
        job_fit = JobFitAnalysis(**{k: data[k] for k in JobFitAnalysis.model_fields if k in data})
        return candidate, job_fit


llm_service = LLMService()
