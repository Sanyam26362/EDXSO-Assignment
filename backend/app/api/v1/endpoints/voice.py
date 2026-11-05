from fastapi import APIRouter, UploadFile, File, Response, HTTPException
from pydantic import BaseModel
from app.services.speech_service import speech_service

router = APIRouter()


class TTSRequest(BaseModel):
    text: str


@router.post("/speak")
async def generate_speech(payload: TTSRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    # ─────────────────────────────────────────────────────────────────────────
    # BUG FIX: Unguarded edge_tts network call — wrap to return a clean 502
    # ─────────────────────────────────────────────────────────────────────────
    try:
        audio_data = await speech_service.text_to_speech(payload.text)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Text-to-speech generation failed: {str(exc)}")

    if not audio_data:
        raise HTTPException(status_code=502, detail="TTS returned empty audio. Check voice engine availability.")

    return Response(content=audio_data, media_type="audio/mpeg")


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty.")

    # ─────────────────────────────────────────────────────────────────────────
    # BUG FIX: `file.content_type` can be None when browser sends
    # audio/webm without explicit MIME. Default safely to audio/webm.
    # ─────────────────────────────────────────────────────────────────────────
    mime = file.content_type or "audio/webm"

    try:
        transcript = await speech_service.transcribe_audio(audio_bytes, mime_type=mime)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Transcription failed: {str(exc)}")

    return {"transcript": transcript}
