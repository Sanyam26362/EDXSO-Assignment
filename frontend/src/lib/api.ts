import {
  AnalysisSession,
  InterviewTurn,
  HistoricalInterviewTurn,
  EvaluationReport,
  SubmitTurnAnswerPayload,
  TranscriptionResponse,
} from "@/types/interview";

function normalizeApiUrl(rawUrl?: string): string {
  const url = (rawUrl || "http://127.0.0.1:8000/api/v1").trim().replace(/\/+$/, "");
  if (url.endsWith("/api/v1")) {
    return url;
  }
  if (url.endsWith("/api")) {
    return `${url}/v1`;
  }
  return `${url}/api/v1`;
}

export const API_BASE_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

export class ApiError extends Error {
  public status: number;
  public detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Helper to process JSON responses and handle FastAPI error schemas
 */
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail: unknown = null;
    let message = `Request failed with status ${res.status}`;

    try {
      const data = await res.json();
      errorDetail = data;
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        // FastAPI validation errors
        message = data.detail
          .map((err: { loc?: (string | number)[]; msg?: string }) =>
            err.loc ? `[${err.loc.join(".")}] ${err.msg}` : err.msg || "Validation error"
          )
          .join(", ");
      } else if (data.message) {
        message = data.message;
      }
    } catch {
      message = res.statusText || message;
    }

    throw new ApiError(res.status, message, errorDetail);
  }

  return res.json() as Promise<T>;
}

/**
 * 1. Upload JD and Resume (Files or Text) for Ingestion and Fit Analysis
 * Endpoint: POST /analysis/upload
 */
export async function uploadAndAnalyze(formData: FormData): Promise<AnalysisSession> {
  const res = await fetch(`${API_BASE_URL}/analysis/upload`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<AnalysisSession>(res);
}

/**
 * 2. Get Analysis Details for an Existing Session
 * Endpoint: GET /analysis/${sessionId}
 */
export async function getSessionAnalysis(sessionId: string): Promise<AnalysisSession> {
  const res = await fetch(`${API_BASE_URL}/analysis/${encodeURIComponent(sessionId)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
  return handleResponse<AnalysisSession>(res);
}

/**
 * 3. Start Interview Simulator (Generate Level 1 Question 1)
 * Endpoint: POST /interview/start
 */
export async function startInterview(sessionId: string): Promise<InterviewTurn> {
  const res = await fetch(`${API_BASE_URL}/interview/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ session_id: sessionId }),
  });
  return handleResponse<InterviewTurn>(res);
}

/**
 * 4. Submit Candidate Answer for Turn, Calculate Speech Metrics & Get Next Question
 * Endpoint: POST /interview/turn
 */
export async function submitTurnAnswer(
  payload: SubmitTurnAnswerPayload
): Promise<InterviewTurn> {
  const res = await fetch(`${API_BASE_URL}/interview/turn`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<InterviewTurn>(res);
}

/**
 * 5. Retrieve all Completed/Historical Interview Turns for a Session
 * Endpoint: GET /interview/${sessionId}/turns
 */
export async function getInterviewTurns(
  sessionId: string
): Promise<HistoricalInterviewTurn[]> {
  const res = await fetch(
    `${API_BASE_URL}/interview/${encodeURIComponent(sessionId)}/turns`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );
  return handleResponse<HistoricalInterviewTurn[]>(res);
}

/**
 * 6. Generate Text-to-Speech Audio for Interview Question
 * Endpoint: POST /voice/speak
 * Returns raw audio/mpeg Blob for playback
 */
export async function fetchQuestionAudio(text: string): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/voice/speak`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    let message = `TTS request failed with status ${res.status}`;
    try {
      const err = await res.json();
      if (err.detail) message = err.detail;
    } catch {}
    throw new ApiError(res.status, message);
  }

  return res.blob();
}

/**
 * 7. Transcribe Candidate Audio Recording (Speech-to-Text)
 * Endpoint: POST /voice/transcribe
 * Multipart form submission with audio file
 */
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResponse> {
  const formData = new FormData();
  // Provide appropriate extension/filename based on blob mime type
  const extension = audioBlob.type.includes("webm")
    ? "webm"
    : audioBlob.type.includes("wav")
    ? "wav"
    : audioBlob.type.includes("mp4")
    ? "m4a"
    : "mp3";

  formData.append("file", audioBlob, `recording.${extension}`);

  const res = await fetch(`${API_BASE_URL}/voice/transcribe`, {
    method: "POST",
    body: formData,
  });

  return handleResponse<TranscriptionResponse>(res);
}

/**
 * 8. Trigger Synthesis and Generation of Evaluation Report
 * Endpoint: POST /evaluation/generate/${sessionId}
 */
export async function generateReport(sessionId: string): Promise<EvaluationReport> {
  const res = await fetch(
    `${API_BASE_URL}/evaluation/generate/${encodeURIComponent(sessionId)}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    }
  );
  return handleResponse<EvaluationReport>(res);
}

/**
 * 9. Retrieve Existing Evaluation Report for Session
 * Endpoint: GET /evaluation/${sessionId}
 */
export async function getReport(sessionId: string): Promise<EvaluationReport> {
  const res = await fetch(
    `${API_BASE_URL}/evaluation/${encodeURIComponent(sessionId)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );
  return handleResponse<EvaluationReport>(res);
}

/**
 * 10. Synchronize Clerk User Profile to Backend Database
 * Endpoint: POST /auth/sync
 */
export async function syncClerkUser(userPayload: {
  clerk_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
}): Promise<{ status: string; user_id: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(userPayload),
  });
  return handleResponse<{ status: string; user_id: string }>(res);
}

/**
 * 11. Link Interview Session to Clerk User
 * Endpoint: POST /auth/link-session
 */
export async function linkSessionToUser(
  sessionId: string,
  clerkId: string
): Promise<{ status: string; session_id: string; user_id: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/link-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      clerk_id: clerkId,
    }),
  });
  return handleResponse<{ status: string; session_id: string; user_id: string }>(res);
}

// Unified API Client Object
export const api = {
  uploadAndAnalyze,
  getSessionAnalysis,
  startInterview,
  submitTurnAnswer,
  getInterviewTurns,
  fetchQuestionAudio,
  transcribeAudio,
  generateReport,
  getReport,
  syncClerkUser,
  linkSessionToUser,
};

export default api;

