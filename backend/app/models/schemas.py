from typing import List, Optional
from pydantic import BaseModel, Field

# --- Input Models ---
class TextAnalysisRequest(BaseModel):
    job_description: str
    resume_text: Optional[str] = None

# --- Step 1: Role Analysis ---
class RoleAnalysis(BaseModel):
    role_title: str = Field(description="Normalized job title")
    key_responsibilities: List[str] = Field(description="Primary responsibilities of the position")
    required_skills: List[str] = Field(description="Must-have technical or domain skills")
    preferred_skills: List[str] = Field(description="Nice-to-have skills")
    technical_competencies: List[str] = Field(description="Core tools, frameworks, and architecture paradigms")
    behavioural_competencies: List[str] = Field(description="Soft skills and collaboration traits")
    experience_expectations: str = Field(description="Years of experience and seniority level")
    important_keywords: List[str] = Field(description="ATS-relevant industry terminology")
    important_concepts: List[str] = Field(description="Fundamental domain theories or problem spaces")
    key_qualifications: List[str] = Field(description="Degrees, certifications, or legal requirements")

# --- Step 2: Candidate & Job Fit Analysis ---
class CandidateProfile(BaseModel):
    candidate_skills: List[str]
    relevant_experience: List[str]
    relevant_projects: List[str]
    relevant_achievements: List[str]

class JobFitAnalysis(BaseModel):
    fit_score: int = Field(ge=0, le=100, description="Overall match percentage (0-100)")
    strong_matches: List[str] = Field(description="Skills or experiences directly fulfilling core requirements")
    partial_matches: List[str] = Field(description="Related skills needing slight translation or upskilling")
    missing_or_weak: List[str] = Field(description="Critical JD requirements absent or thin on the resume")
    resume_claims_to_probe: List[str] = Field(description="Vague or high-impact metrics to drill into during the interview")
    preparation_areas: List[str] = Field(description="High-priority topics the candidate must study")
    summary: str = Field(description="Concise 2-sentence executive summary of the alignment")

class FullAnalysisResponse(BaseModel):
    role_analysis: RoleAnalysis
    candidate_profile: CandidateProfile
    job_fit: JobFitAnalysis