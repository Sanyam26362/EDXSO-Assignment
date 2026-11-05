from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.db_models import InterviewSession, InterviewTurn, EvaluationReport
from app.services.interview_engine import interview_engine

router = APIRouter()


@router.post("/generate/{session_id}")
async def generate_report(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InterviewSession).where(InterviewSession.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    # Idempotency: return existing report if already generated
    rep_res = await db.execute(select(EvaluationReport).where(EvaluationReport.session_id == session_id))
    existing_rep = rep_res.scalars().first()
    if existing_rep:
        return _serialize_report(existing_rep)

    turns_res = await db.execute(
        select(InterviewTurn)
        .where(InterviewTurn.session_id == session_id)
        .order_by(InterviewTurn.turn_number.asc())
    )
    turns = turns_res.scalars().all()

    # ─────────────────────────────────────────────────────────────────────────
    # BUG FIX: If interview has zero turns the report would be empty/meaningless.
    # Return 400 with a clear message instead.
    # ─────────────────────────────────────────────────────────────────────────
    if not turns:
        raise HTTPException(
            status_code=400,
            detail="No interview turns found for this session. Complete the interview before generating a report."
        )

    turn_data = [
        {
            "turn": t.turn_number,
            "level": t.level,
            "question": t.question_text,
            "answer": t.candidate_response or "[No response provided]",
        }
        for t in turns
    ]

    # ─────────────────────────────────────────────────────────────────────────
    # BUG FIX: LLM unguarded — 503 bubbled as 500 ISE
    # ─────────────────────────────────────────────────────────────────────────
    try:
        report_dict = interview_engine.generate_final_report(
            role_title=session.role_title,
            jd_text=session.jd_text,
            resume_text=session.resume_text,
            turns=turn_data,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Report generation failed: {str(exc)}")

    evaluation = EvaluationReport(
        session_id=session.id,
        overall_score=report_dict.get("overall_score", 70),
        readiness_level=report_dict.get("readiness_level", "🟡 Interview Ready"),
        competency_scores=report_dict.get("competency_scores", {}),
        strengths=report_dict.get("strengths", []),
        weaknesses=report_dict.get("weaknesses", []),
        question_feedback=report_dict.get("question_feedback", []),
        preparation_gaps=report_dict.get("preparation_gaps", []),
    )
    db.add(evaluation)
    await db.commit()
    await db.refresh(evaluation)

    return _serialize_report(evaluation)


@router.get("/{session_id}")
async def get_report(session_id: str, db: AsyncSession = Depends(get_db)):
    rep_res = await db.execute(select(EvaluationReport).where(EvaluationReport.session_id == session_id))
    report = rep_res.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not generated yet for this session.")
    return _serialize_report(report)


def _serialize_report(report: EvaluationReport) -> dict:
    """
    BUG FIX: Returning raw SQLAlchemy ORM objects from FastAPI endpoints causes
    Pydantic serialization errors because ORM models are not JSON-serializable
    by default when the session is closed. Always return a plain dict.
    """
    return {
        "session_id": report.session_id,
        "overall_score": report.overall_score,
        "readiness_level": report.readiness_level,
        "competency_scores": report.competency_scores or {},
        "strengths": report.strengths or [],
        "weaknesses": report.weaknesses or [],
        "question_feedback": report.question_feedback or [],
        "preparation_gaps": report.preparation_gaps or [],
        "created_at": str(report.created_at),
    }
