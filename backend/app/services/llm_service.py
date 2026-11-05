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
        self._init_groq_client()

    def _init_client(self):
        if not self.api_keys:
            self.client = None
            return
        current_key = self.api_keys[self._key_index]
        self.client = genai.Client(
            api_key=current_key,
            http_options=types.HttpOptions(timeout=35000),  # 35s timeout to prevent endless hanging
        )

    def _init_groq_client(self):
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            try:
                from groq import Groq
                self.groq_client = Groq(api_key=groq_key)
            except Exception:
                self.groq_client = None
        else:
            self.groq_client = None

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

    def _analyze_unified_groq(
        self, jd_text: str, resume_text: str
    ) -> tuple[RoleAnalysis, CandidateProfile, JobFitAnalysis]:
        if not self.groq_client:
            raise ValueError("GROQ_API_KEY not configured.")

        prompt = (
            f"You are an elite Technical Hiring Principal and Executive Evaluator.\n"
            f"Analyze the target Job Description and Candidate Resume, and output valid JSON matching the schema.\n\n"
            f"=== TARGET JOB DESCRIPTION ===\n{jd_text}\n\n"
            f"=== CANDIDATE RESUME ===\n{resume_text}\n\n"
            f"Output JSON with keys: 'role_analysis', 'candidate_profile', 'job_fit'.\n"
            f"role_analysis keys: role_title, key_responsibilities (list), required_skills (list), preferred_skills (list), technical_competencies (list), behavioural_competencies (list), experience_expectations (str), important_keywords (list), important_concepts (list), key_qualifications (list).\n"
            f"candidate_profile keys: candidate_skills (list), relevant_experience (list), relevant_projects (list), relevant_achievements (list).\n"
            f"job_fit keys: fit_score (int 0-100), strong_matches (list), partial_matches (list), missing_or_weak (list), resume_claims_to_probe (list), preparation_areas (list), summary (str).\n"
        )
        res = self.groq_client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[
                {"role": "system", "content": "You are a professional technical hiring evaluator. You always output valid, raw JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        data = json.loads(res.choices[0].message.content)
        parsed = FullAnalysisResponse.model_validate(data)
        return parsed.role_analysis, parsed.candidate_profile, parsed.job_fit

    def analyze_unified(
        self, jd_text: str, resume_text: str
    ) -> tuple[RoleAnalysis, CandidateProfile, JobFitAnalysis]:
        """
        Unified single-pass extraction that decomposes role and calculates candidate fit.
        Runs Gemini first; if Google Gemini returns 503 high demand or 429 quota exhausted,
        it automatically fails over to Groq in under 5 seconds.
        """
        # Try Gemini first
        try:
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
        except Exception as gemini_err:
            if self.groq_client:
                print(f"[LLM] Gemini request failed ({gemini_err}); failing over to Groq...")
                return self._analyze_unified_groq(jd_text, resume_text)
            raise gemini_err

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
