import uuid
from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


def utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    clerk_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    first_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    sessions: Mapped[list["InterviewSession"]] = relationship(
        "InterviewSession", back_populates="user", cascade="all, delete-orphan"
    )


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    role_title: Mapped[str] = mapped_column(String(255), default="Candidate Interview")
    jd_text: Mapped[str] = mapped_column(Text)
    resume_text: Mapped[str] = mapped_column(Text)

    # Pre-interview analysis cached as JSON
    role_analysis: Mapped[dict] = mapped_column(JSON, default=dict)
    job_fit_analysis: Mapped[dict] = mapped_column(JSON, default=dict)

    # State tracking
    current_level: Mapped[int] = mapped_column(Integer, default=1)  # 1: Screening, 2: Competency, 3: Deep Dive
    status: Mapped[str] = mapped_column(String(50), default="ready")  # ready, in_progress, completed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="sessions")
    turns: Mapped[list["InterviewTurn"]] = relationship(
        "InterviewTurn", back_populates="session", cascade="all, delete-orphan"
    )
    report: Mapped["EvaluationReport"] = relationship(
        "EvaluationReport", back_populates="session", uselist=False, cascade="all, delete-orphan"
    )


class InterviewTurn(Base):
    __tablename__ = "interview_turns"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("interview_sessions.id", ondelete="CASCADE")
    )
    turn_number: Mapped[int] = mapped_column(Integer)
    level: Mapped[int] = mapped_column(Integer, default=1)

    question_text: Mapped[str] = mapped_column(Text)
    candidate_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Turn-level micro-evaluations (relevance, depth, signals, metrics)
    turn_evaluation: Mapped[dict] = mapped_column(JSON, default=dict, nullable=True)
    speaking_duration_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    session: Mapped["InterviewSession"] = relationship("InterviewSession", back_populates="turns")


class EvaluationReport(Base):
    __tablename__ = "evaluation_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("interview_sessions.id", ondelete="CASCADE"), unique=True
    )

    overall_score: Mapped[int] = mapped_column(Integer)  # 0-100
    readiness_level: Mapped[str] = mapped_column(String(50))  # Not Ready, Needs Prep, Interview Ready, Strong Candidate

    # Detailed analytics
    competency_scores: Mapped[dict] = mapped_column(JSON, default=dict)
    question_feedback: Mapped[list] = mapped_column(JSON, default=list)
    strengths: Mapped[list] = mapped_column(JSON, default=list)
    weaknesses: Mapped[list] = mapped_column(JSON, default=list)
    preparation_gaps: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    session: Mapped["InterviewSession"] = relationship("InterviewSession", back_populates="report")
