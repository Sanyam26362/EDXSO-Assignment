/**
 * Interview Accelerator — Type Definitions
 * Matching FastAPI Backend Schema at /api/v1
 */

// --- 1. Role Analysis ---
export interface RoleAnalysis {
  role_title: string;
  key_responsibilities: string[];
  required_skills: string[];
  preferred_skills: string[];
  technical_competencies: string[];
  behavioural_competencies: string[];
  experience_expectations: string;
  important_keywords: string[];
  important_concepts: string[];
  key_qualifications: string[];
}

// --- 2. Candidate Profile ---
export interface CandidateProfile {
  candidate_skills: string[];
  relevant_experience: string[];
  relevant_projects: string[];
  relevant_achievements: string[];
}

// --- 3. Job Fit Analysis ---
export interface JobFit {
  fit_score: number;
  strong_matches: string[];
  partial_matches: string[];
  missing_or_weak: string[];
  resume_claims_to_probe: string[];
  preparation_areas: string[];
  summary: string;
}

// Alias for compatibility
export type JobFitAnalysis = JobFit;

// --- 4. Analysis Session ---
export interface AnalysisSession {
  session_id: string;
  role_title?: string;
  role_analysis: RoleAnalysis;
  candidate_profile: CandidateProfile;
  job_fit: JobFit;
  current_level: number;
  status: "ready" | "in_progress" | "completed" | string;
  created_at?: string;
}

// --- 5. Speech & Delivery Metrics ---
export interface SpeechMetrics {
  word_count: number;
  words_per_minute: number;
  filler_word_count: number;
  filler_words_used: string[];
  pacing_assessment: "Optimal" | "Slow" | "Fast" | "No speech detected" | string;
}

// --- 6. Interview Turn ---
export interface InterviewTurn {
  turn_id?: string;
  turn_number?: number;
  current_level?: number;
  question?: string;
  focus_area?: string | null;
  interview_complete?: boolean;
  speech_metrics?: SpeechMetrics;
  message?: string;
  candidate_response?: string | null;
  speaking_duration_seconds?: number;
}

// Persisted Turn Record from GET /interview/{sessionId}/turns
export interface HistoricalInterviewTurn {
  id: string;
  turn_number: number;
  level: number;
  question_text: string;
  candidate_response: string | null;
  turn_evaluation?: {
    focus_area?: string;
    speech_metrics?: SpeechMetrics;
    [key: string]: unknown;
  } | null;
  speaking_duration_seconds: number;
}

// --- 7. Evaluation Report ---
export interface QuestionFeedback {
  question: string;
  candidate_answer: string;
  assessment: string;
  what_was_good: string;
  what_could_be_better: string;
  ideal_direction: string;
}

export interface PreparationGap {
  priority: number;
  topic: string;
  action_items: string[];
}

export interface EvaluationReport {
  id?: string;
  session_id: string;
  overall_score: number;
  readiness_level: string;
  competency_scores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  question_feedback: QuestionFeedback[];
  preparation_gaps: PreparationGap[];
  created_at?: string;
}

// --- 8. Request Payloads ---
export interface SubmitTurnAnswerPayload {
  session_id: string;
  answer_text: string;
  speaking_duration_seconds: number;
}

export interface TranscriptionResponse {
  transcript: string;
}

