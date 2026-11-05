import io
import time
import edge_tts
from google import genai
import os


class SpeechService:
    def __init__(self):
        self.default_voice = "en-US-ChristopherNeural"
        raw_keys = os.getenv("GEMINI_API_KEY", "")
        self.api_keys = [k.strip() for k in raw_keys.split(",") if k.strip()]
        self._key_index = 0
        self.transcription_models = ["gemini-3.5-flash", "gemini-flash-latest"]
        self._init_client()

    def _init_client(self):
        if not self.api_keys:
            self.client = None
            return
        current_key = self.api_keys[self._key_index]
        self.client = genai.Client(api_key=current_key)

    def _rotate_key(self):
        if len(self.api_keys) > 1:
            self._key_index = (self._key_index + 1) % len(self.api_keys)
            self._init_client()

    async def text_to_speech(self, text: str, voice: str = None) -> bytes:
        voice = voice or self.default_voice
        communicate = edge_tts.Communicate(text, voice)
        audio_stream = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_stream.write(chunk["data"])
        return audio_stream.getvalue()

    async def transcribe_audio(self, audio_bytes: bytes, mime_type: str = "audio/wav") -> str:
        if not self.api_keys:
            raise ValueError("GEMINI_API_KEY is not configured.")

        from google.genai import types as genai_types

        max_key_attempts = max(len(self.api_keys), 1)
        last_error = None
        for _ in range(max_key_attempts):
            for model in self.transcription_models:
                try:
                    response = self.client.models.generate_content(
                        model=model,
                        contents=[
                            genai_types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
                            "Transcribe this audio accurately, word-for-word. Output only the transcription, no commentary."
                        ]
                    )
                    return response.text.strip()
                except Exception as exc:
                    last_error = exc
                    continue
            self._rotate_key()

        raise last_error


speech_service = SpeechService()
