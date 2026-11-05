from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.db_models import User, InterviewSession

router = APIRouter()


class ClerkSyncRequest(BaseModel):
    clerk_id: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    image_url: Optional[str] = None


class LinkSessionRequest(BaseModel):
    session_id: str
    clerk_id: str


@router.post("/sync")
async def sync_clerk_user(payload: ClerkSyncRequest, db: AsyncSession = Depends(get_db)):
    """
    Upsert user data from Clerk into our database.
    Called on frontend when user signs in or signs up via Clerk.
    """
    if not payload.clerk_id:
        raise HTTPException(status_code=400, detail="clerk_id is required")

    result = await db.execute(select(User).where(User.clerk_id == payload.clerk_id))
    user = result.scalars().first()

    if user:
        # Update existing user record with latest profile info
        if payload.email is not None:
            user.email = payload.email
        if payload.first_name is not None:
            user.first_name = payload.first_name
        if payload.last_name is not None:
            user.last_name = payload.last_name
        if payload.image_url is not None:
            user.image_url = payload.image_url
    else:
        # Create new user record
        user = User(
            clerk_id=payload.clerk_id,
            email=payload.email,
            first_name=payload.first_name,
            last_name=payload.last_name,
            image_url=payload.image_url,
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)

    return {
        "status": "success",
        "user": {
            "id": user.id,
            "clerk_id": user.clerk_id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "image_url": user.image_url,
            "created_at": str(user.created_at),
        },
    }


@router.get("/user/{clerk_id}")
async def get_user_profile(clerk_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve user details and interview session history."""
    result = await db.execute(select(User).where(User.clerk_id == clerk_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch user sessions
    sess_result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.user_id == user.id)
        .order_by(InterviewSession.created_at.desc())
    )
    sessions = sess_result.scalars().all()

    return {
        "user": {
            "id": user.id,
            "clerk_id": user.clerk_id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "image_url": user.image_url,
            "created_at": str(user.created_at),
        },
        "sessions": [
            {
                "session_id": s.id,
                "role_title": s.role_title,
                "status": s.status,
                "current_level": s.current_level,
                "created_at": str(s.created_at),
            }
            for s in sessions
        ],
    }


@router.post("/link-session")
async def link_session_to_user(payload: LinkSessionRequest, db: AsyncSession = Depends(get_db)):
    """Link an existing interview session to an authenticated user."""
    user_res = await db.execute(select(User).where(User.clerk_id == payload.clerk_id))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sess_res = await db.execute(select(InterviewSession).where(InterviewSession.id == payload.session_id))
    session = sess_res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    session.user_id = user.id
    await db.commit()

    return {"status": "linked", "session_id": session.id, "user_id": user.id}

