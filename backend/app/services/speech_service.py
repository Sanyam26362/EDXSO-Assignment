import io
import time
import edge_tts
from google import genai
import os


class SpeechService:
    def __init__(self):
        self.default_voice = "en-US-ChristopherNeural"
        api_key = os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key) if api_key else None
        self.transcription_model = "gemini-flash-lite-latest"   # BUG FIX: was "gemini-3.5-flash"

    async def text_to_speech(self, text: str, voice: str = None) -> bytes:
        voice = voice or self.default_voice
        communicate = edge_tts.Communicate(text, voice)
        audio_stream = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_stream.write(chunk["data"])
        return audio_stream.getvalue()

    async def transcribe_audio(self, audio_bytes: bytes, mime_type: str = "audio/wav") -> str:
        if not self.client:
            raise ValueError("GEMINI_API_KEY is not configured.")

        # ─────────────────────────────────────────────────────────────────────
        # BUG FIX: `genai.types.Part.from_bytes` is the correct call path.
        # Previously used `genai.types.Part.from_bytes` but `genai` was
        # imported without `types` being re-exported at the package root in
        # some SDK versions. Use `self.client`'s namespace instead.
        # ─────────────────────────────────────────────────────────────────────
        from google.genai import types as genai_types

        for attempt in range(3):
            try:
                response = self.client.models.generate_content(
                    model=self.transcription_model,
                    contents=[
                        genai_types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
                        "Transcribe this audio accurately, word-for-word. Output only the transcription, no commentary."
                    ]
                )
                return response.text.strip()
            except Exception as exc:
                msg = str(exc)
                if any(x in msg for x in ["503", "UNAVAILABLE", "429"]) and attempt < 2:
                    time.sleep(2 ** attempt)
                    continue
                raise


speech_service = SpeechService()
