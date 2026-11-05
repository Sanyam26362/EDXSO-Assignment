import os
import json
import time
from typing import List
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv

from app.models.schemas import RoleAnalysis, CandidateProfile, JobFitAnalysis
from app.core.prompts import ROLE_ANALYSIS_SYSTEM_PROMPT, CANDIDATE_FIT_SYSTEM_PROMPT

load_dotenv()

# Priority order for models: stable high-speed aliases first
MODEL_PREFERENCE = [
    "gemini-3.5-flash",
    "gemini-3.8-flash",
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
        api_key = os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key) if api_key else None
        self._active_model: str = MODEL_PREFERENCE[0]

    @property
    def model_name(self) -> str:
        return self._active_model

    def _generate_with_retry(self, contents, config, retries: int = 3) -> types.GenerateContentResponse:
        """
        Generate content with automatic exponential back-off and multi-model fallback.
        """
        if not self.client:
            raise ValueError("GEMINI_API_KEY is missing from environment variables.")

        models_to_try = [self._active_model] + [m for m in MODEL_PREFERENCE if m != self._active_model]
        last_error = None

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
                continue  # Try next model in preference list immediately

        raise last_error

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
