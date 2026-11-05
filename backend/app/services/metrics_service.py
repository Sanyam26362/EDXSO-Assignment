import re

class MetricsService:
    FILLER_WORDS = {
        "um", "uh", "erm", "ah", "like", "basically", 
        "actually", "literally", "sort of", "kind of", "you know"
    }

    @staticmethod
    def analyze_speech_delivery(transcript: str, duration_seconds: float = 0.0) -> dict:
        text = transcript.strip().lower()
        if not text:
            return {
                "word_count": 0,
                "words_per_minute": 0,
                "filler_word_count": 0,
                "filler_words_used": [],
                "pacing_assessment": "No speech detected"
            }

        # Tokenize words
        words = re.findall(r"\b[a-z']+\b", text)
        total_words = len(words)

        # Detect filler words
        detected_fillers = []
        for filler in MetricsService.FILLER_WORDS:
            occurrences = len(re.findall(r"\b" + re.escape(filler) + r"\b", text))
            if occurrences > 0:
                detected_fillers.extend([filler] * occurrences)

        # Calculate Speaking Pace (Ideal conversational interview pace: 120 - 160 WPM)
        wpm = 0
        if duration_seconds > 0:
            wpm = round((total_words / duration_seconds) * 60)

        if wpm == 0:
            pacing = "Optimal"
        elif wpm < 110:
            pacing = "Slow"
        elif 110 <= wpm <= 165:
            pacing = "Optimal"
        else:
            pacing = "Fast"

        return {
            "word_count": total_words,
            "words_per_minute": wpm,
            "filler_word_count": len(detected_fillers),
            "filler_words_used": list(set(detected_fillers)),
            "pacing_assessment": pacing
        }

metrics_service = MetricsService()