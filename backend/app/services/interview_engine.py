import json
import time
import re
import os
from google import genai
from google.genai import types
from app.core.prompts import INTERVIEW_QUESTION_SYSTEM_PROMPT, FINAL_EVALUATION_SYSTEM_PROMPT

MODEL_PREFERENCE = [
    "gemini-3.5-flash",
    "gemini-flash-latest",
]


class InterviewEngine:
    def __init__(self):
        raw_keys = os.getenv("GEMINI_API_KEY", "")
        self.api_keys = [k.strip() for k in raw_keys.split(",") if k.strip()]
        self._key_index = 0
        self._active_model = MODEL_PREFERENCE[0]
        self._init_client()
        self._init_groq_client()

    def _init_client(self):
        if not self.api_keys:
            self.client = None
            return
        current_key = self.api_keys[self._key_index]
        self.client = genai.Client(
            api_key=current_key,
            http_options=types.HttpOptions(timeout=35000),
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

    def _generate_with_retry(self, contents, config) -> types.GenerateContentResponse:
        """Retry on transient errors with model fallback, key rotation, and Groq backup."""
        if not self.api_keys and not self.groq_client:
            raise ValueError("Neither GEMINI_API_KEY nor GROQ_API_KEY is configured.")

        models_to_try = [self._active_model] + [m for m in MODEL_PREFERENCE if m != self._active_model]
        last_error = None

        if self.api_keys:
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
                        if any(x in msg for x in ["503", "UNAVAILABLE", "404", "NOT_FOUND"]):
                            continue
                        if any(x in msg for x in ["429", "RESOURCE_EXHAUSTED", "quota"]):
                            break
                        continue
                self._rotate_key()

        # If Gemini exhausted all attempts or not configured, fall back to Groq
        if self.groq_client:
            try:
                print("[InterviewEngine] Falling back to Groq...")
                system_inst = getattr(config, "system_instruction", "") if config else ""
                res = self.groq_client.chat.completions.create(
                    model="qwen/qwen3.8-27b",
                    messages=[
                        {"role": "system", "content": system_inst or "You are an expert AI Technical Interviewer. Always output valid JSON."},
                        {"role": "user", "content": contents if isinstance(contents, str) else str(contents)}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3,
                )
                class GroqResponseWrapper:
                    def __init__(self, text_content):
                        self.text = text_content
                return GroqResponseWrapper(res.choices[0].message.content)
            except Exception as groq_exc:
                last_error = groq_exc

        raise last_error

    def _safe_parse_json(self, raw_text: str, default: dict) -> dict:
        """Safely parse JSON text even if wrapped in markdown code fences or slightly malformed."""
        raw = raw_text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        try:
            return json.loads(raw)
        except Exception:
            # Fallback regex extraction if model returned mixed text
            q_match = re.search(r'"question"\s*:\s*"([^"]+)"', raw)
            if q_match:
                return {"question": q_match.group(1), "focus_area": "Technical Assessment"}
            return default

    def generate_next_question(
        self,
        role_title: str,
        jd_text: str,
        resume_text: str,
        claims_to_probe: list,
        current_level: int,
        history: list[dict],
    ) -> dict:
        context_payload = {
            "role_title": role_title,
            "current_interview_level": current_level,
            "claims_flagged_for_probing": claims_to_probe,
            "prior_turns": history,
            "jd_excerpt": jd_text[:2000],
            "resume_excerpt": resume_text[:2000],
        }

        prompt = f"INTERVIEW CONTEXT:\n{json.dumps(context_payload, indent=2)}\n\nGenerate the next question."

        response = self._generate_with_retry(
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=INTERVIEW_QUESTION_SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.4,
            ),
        )

        fallback = {
            "question": f"Could you walk me through your core experience as a {role_title} and your recent technical decisions?",
            "focus_area": "Core Competencies",
        }
        parsed = self._safe_parse_json(response.text, fallback)
        if not parsed.get("question"):
            parsed["question"] = fallback["question"]
        if not parsed.get("focus_area"):
            parsed["focus_area"] = "Technical Depth"
        return parsed

    def generate_final_report(
        self,
        role_title: str,
        jd_text: str,
        resume_text: str,
        turns: list[dict],
    ) -> dict:
        payload = {
            "role_title": role_title,
            "jd_context": jd_text[:1500],
            "resume_context": resume_text[:1500],
            "transcript": turns,
        }

        prompt = f"COMPLETE INTERVIEW TRANSCRIPT:\n{json.dumps(payload, indent=2)}\n\nGenerate the complete evaluation report."

        response = self._generate_with_retry(
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=FINAL_EVALUATION_SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )

        fallback = {
            "overall_score": 75,
            "readiness_level": "🟡 Interview Ready",
            "competency_scores": {
                "role_fit": 75,
                "technical_knowledge": 75,
                "problem_solving": 70,
                "communication": 80,
                "confidence": 75,
                "depth_of_understanding": 70,
                "behavioural_fit": 80,
            },
            "strengths": ["Demonstrated solid foundational understanding across the target stack."],
            "weaknesses": ["Further depth on system trade-offs and edge-case handling recommended."],
            "question_feedback": [],
            "preparation_gaps": [],
        }

        return self._safe_parse_json(response.text, fallback)


interview_engine = InterviewEngine()
