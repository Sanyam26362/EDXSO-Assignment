from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.db_models import InterviewSession
from app.models.schemas import TextAnalysisRequest
from app.services.parser_service import parser_service
from app.services.llm_service import llm_service

router = APIRouter()


@router.get("/{session_id}")
async def get_session_details(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InterviewSession).where(InterviewSession.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    fit_dict = session.job_fit_analysis or {}

    return {
        "session_id": session.id,
        "role_title": session.role_title,
        "role_analysis": session.role_analysis or {},
        "candidate_profile": fit_dict.get("candidate_profile", {}),
        "job_fit": fit_dict.get("job_fit", {}),
        "current_level": session.current_level,
        "status": session.status,
        "created_at": str(session.created_at),
    }


@router.post("/match")
async def analyze_match_text(
    payload: TextAnalysisRequest,
    db: AsyncSession = Depends(get_db),
):
    if not payload.job_description.strip() or not payload.resume_text or not payload.resume_text.strip():
        raise HTTPException(status_code=400, detail="Both Job Description and Resume text are required.")

    try:
        role_data = llm_service.analyze_role(payload.job_description)
        candidate_profile, job_fit = llm_service.analyze_candidate_fit(
            payload.job_description, payload.resume_text
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"LLM analysis failed: {str(exc)}")

    session = InterviewSession(
        role_title=role_data.role_title,
        jd_text=payload.job_description,
        resume_text=payload.resume_text,
        role_analysis=role_data.model_dump(),
        job_fit_analysis={
            "candidate_profile": candidate_profile.model_dump(),
            "job_fit": job_fit.model_dump(),
        },
        current_level=1,
        status="ready",
    )
    try:
        db.add(session)
        await db.commit()
        await db.refresh(session)
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error saving session: {str(exc)}")

    return {
        "session_id": session.id,
        "role_analysis": role_data,
        "candidate_profile": candidate_profile,
        "job_fit": job_fit,
    }


@router.post("/upload")
async def analyze_match_files(
    jd_file: Optional[UploadFile] = File(None),
    jd_text: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    # Resolve JD content
    resolved_jd = ""
    if jd_file and jd_file.filename:
        resolved_jd = await parser_service.extract_text(jd_file)
    elif jd_text:
        resolved_jd = jd_text.strip()

    # Resolve resume content
    resolved_resume = ""
    if resume_file and resume_file.filename:
        resolved_resume = await parser_service.extract_text(resume_file)
    elif resume_text:
        resolved_resume = resume_text.strip()

    if not resolved_jd or not resolved_resume:
        raise HTTPException(
            status_code=400,
            detail="Both Job Description and Resume must be provided (upload file or paste text).",
        )

    try:
        role_data = llm_service.analyze_role(resolved_jd)
        candidate_profile, job_fit = llm_service.analyze_candidate_fit(resolved_jd, resolved_resume)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"LLM analysis failed: {str(exc)}")

    session = InterviewSession(
        role_title=role_data.role_title,
        jd_text=resolved_jd,
        resume_text=resolved_resume,
        role_analysis=role_data.model_dump(),
        job_fit_analysis={
            "candidate_profile": candidate_profile.model_dump(),
            "job_fit": job_fit.model_dump(),
        },
        current_level=1,
        status="ready",
    )
    try:
        db.add(session)
        await db.commit()
        await db.refresh(session)
    except Exception as exc:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error saving session: {str(exc)}")

    return {
        "session_id": session.id,
        "role_analysis": role_data,
        "candidate_profile": candidate_profile,
        "job_fit": job_fit,
    }
