from fastapi import APIRouter
from app.api.v1.endpoints import analysis, interview, voice, evaluation, auth

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & User Sync"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
api_router.include_router(interview.router, prefix="/interview", tags=["Interview Simulator"])
api_router.include_router(voice.router, prefix="/voice", tags=["Voice Engine"])
api_router.include_router(evaluation.router, prefix="/evaluation", tags=["Evaluation Report"])
