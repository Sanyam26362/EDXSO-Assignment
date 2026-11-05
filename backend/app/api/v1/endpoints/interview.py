from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.db_models import InterviewSession, InterviewTurn
from app.services.interview_engine import interview_engine
from app.services.metrics_service import metrics_service

router = APIRouter()


class StartInterviewRequest(BaseModel):
    session_id: str


class SubmitAnswerRequest(BaseModel):
    session_id: str
    answer_text: str
    speaking_duration_seconds: float = 0.0


@router.get("/{session_id}/turns")
async def get_interview_turns(session_id: str, db: AsyncSession = Depends(get_db)):
    turns_res = await db.execute(
        select(InterviewTurn)
        .where(InterviewTurn.session_id == session_id)
        .order_by(InterviewTurn.turn_number.asc())
    )
    turns = turns_res.scalars().all()
    return [
        {
            "id": t.id,
            "turn_number": t.turn_number,
            "level": t.level,
            "question_text": t.question_text,
            "candidate_response": t.candidate_response,
            "turn_evaluation": t.turn_evaluation,
            "speaking_duration_seconds": t.speaking_duration_seconds,
        }
        for t in turns
    ]


@router.post("/start")
async def start_interview(payload: StartInterviewRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InterviewSession).where(InterviewSession.id == payload.session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    # ─────────────────────────────────────────────────────────────────────────
    # Idempotency: if interview already started, return the current active turn
    # (unanswered turn if one exists, or latest turn) instead of duplicating turn 1.
    # ─────────────────────────────────────────────────────────────────────────
    existing_turns_res = await db.execute(
        select(InterviewTurn)
        .where(InterviewTurn.session_id == payload.session_id)
        .order_by(InterviewTurn.turn_number.asc())
    )
    existing_turns = existing_turns_res.scalars().all()
    if existing_turns:
        active_turn = next(
            (t for t in existing_turns if t.candidate_response is None),
            existing_turns[-1],
        )
        return {
            "session_id": session.id,
            "turn_id": active_turn.id,
            "turn_number": active_turn.turn_number,
            "current_level": active_turn.level,
            "question": active_turn.question_text,
            "focus_area": (active_turn.turn_evaluation or {}).get("focus_area"),
        }

    claims = (session.job_fit_analysis or {}).get("job_fit", {}).get("resume_claims_to_probe", [])

    # ─────────────────────────────────────────────────────────────────────────
    # BUG FIX: LLM call guarded with 502 status
    # ─────────────────────────────────────────────────────────────────────────
    try:
        first_q_data = interview_engine.generate_next_question(
            role_title=session.role_title,
            jd_text=session.jd_text,
            resume_text=session.resume_text,
            claims_to_probe=claims,
            current_level=1,
            history=[],
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Question generation failed: {str(exc)}")

    turn = InterviewTurn(
        session_id=session.id,
        turn_number=1,
        level=1,
        question_text=first_q_data["question"],
        turn_evaluation={"focus_area": first_q_data.get("focus_area", "Introduction")},
    )
    session.status = "in_progress"
    db.add(turn)
    await db.commit()
    await db.refresh(turn)

    return {
        "session_id": session.id,
        "turn_id": turn.id,
        "turn_number": 1,
        "current_level": 1,
        "question": turn.question_text,
        "focus_area": first_q_data.get("focus_area"),
    }


@router.post("/turn")
async def process_interview_turn(payload: SubmitAnswerRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InterviewSession).where(InterviewSession.id == payload.session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    turns_res = await db.execute(
        select(InterviewTurn)
        .where(InterviewTurn.session_id == payload.session_id)
        .order_by(InterviewTurn.turn_number.asc())
    )
    existing_turns = turns_res.scalars().all()

    if not existing_turns:
        raise HTTPException(status_code=400, detail="No active question found to answer. Call /start first.")

    # Compute speech metrics
    delivery_metrics = metrics_service.analyze_speech_delivery(
        payload.answer_text,
        payload.speaking_duration_seconds,
    )

    last_turn = existing_turns[-1]

    # ─────────────────────────────────────────────────────────────────────────
    # BUG FIX (BUG-006): If the last turn already has a response (candidate double-clicks
    # Submit), do NOT create a duplicate next question. Return 409 Conflict.
    # ─────────────────────────────────────────────────────────────────────────
    if last_turn.candidate_response is not None:
        raise HTTPException(
            status_code=409,
            detail="This turn has already been answered. Wait for the next question to be ready.",
        )

    last_turn.candidate_response = payload.answer_text
    last_turn.speaking_duration_seconds = payload.speaking_duration_seconds
    current_eval = dict(last_turn.turn_evaluation or {})
    current_eval["speech_metrics"] = delivery_metrics
    last_turn.turn_evaluation = current_eval
    await db.commit()

    total_turns_completed = len(existing_turns)

    # Level progression: 2 turns per level (Turns 1-2: Level 1, Turns 3-4: Level 2, Turns 5-6: Level 3)
    if total_turns_completed < 2:
        next_level = 1
    elif total_turns_completed < 4:
        next_level = 2
    elif total_turns_completed < 6:
        next_level = 3
    else:
        # Interview is complete after 6 turns
        session.status = "completed"
        session.current_level = 3
        await db.commit()
        return {
            "interview_complete": True,
            "session_id": session.id,
            "message": "All interview levels completed. Proceed to evaluation report.",
            "speech_metrics": delivery_metrics,
        }

    session.current_level = next_level
    await db.commit()

    history = [
        {"question": t.question_text, "answer": t.candidate_response or ""}
        for t in existing_turns
    ]
    claims = (session.job_fit_analysis or {}).get("job_fit", {}).get("resume_claims_to_probe", [])

    # ─────────────────────────────────────────────────────────────────────────
    # BUG FIX: LLM call guarded with 502 status
    # ─────────────────────────────────────────────────────────────────────────
    try:
        next_q = interview_engine.generate_next_question(
            role_title=session.role_title,
            jd_text=session.jd_text,
            resume_text=session.resume_text,
            claims_to_probe=claims,
            current_level=next_level,
            history=history,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Next question generation failed: {str(exc)}")

    new_turn = InterviewTurn(
        session_id=session.id,
        turn_number=total_turns_completed + 1,
        level=next_level,
        question_text=next_q["question"],
        turn_evaluation={"focus_area": next_q.get("focus_area")},
    )
    db.add(new_turn)
    await db.commit()
    await db.refresh(new_turn)

    return {
        "interview_complete": False,
        "session_id": session.id,
        "turn_id": new_turn.id,
        "turn_number": new_turn.turn_number,
        "current_level": next_level,
        "question": new_turn.question_text,
        "focus_area": next_q.get("focus_area"),
        "speech_metrics": delivery_metrics,
    }
