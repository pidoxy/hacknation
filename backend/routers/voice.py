import io
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse

from config import get_settings
from models.queries import TTSRequest

router = APIRouter()


@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech using ElevenLabs TTS API."""
    settings = get_settings()

    try:
        from elevenlabs import ElevenLabs

        client = ElevenLabs(api_key=settings.elevenlabs_api_key)

        voice_settings = {
            "stability": settings.elevenlabs_voice_stability,
            "similarity_boost": settings.elevenlabs_voice_similarity_boost,
            "style": settings.elevenlabs_voice_style,
            "use_speaker_boost": settings.elevenlabs_voice_use_speaker_boost,
        }

        def _convert(model_id: str, use_settings: bool = True):
            if use_settings:
                return client.text_to_speech.convert(
                    voice_id=settings.elevenlabs_voice_id,
                    text=request.text,
                    model_id=model_id,
                    output_format="mp3_44100_128",
                    voice_settings=voice_settings,
                )
            return client.text_to_speech.convert(
                voice_id=settings.elevenlabs_voice_id,
                text=request.text,
                model_id=model_id,
                output_format="mp3_44100_128",
            )

        try:
            try:
                audio_generator = _convert(settings.elevenlabs_model_id, use_settings=True)
            except TypeError:
                audio_generator = _convert(settings.elevenlabs_model_id, use_settings=False)
        except Exception:
            fallback_model = "eleven_turbo_v2_5"
            if settings.elevenlabs_model_id != fallback_model:
                try:
                    audio_generator = _convert(fallback_model, use_settings=False)
                except Exception as e:
                    return {"error": f"TTS failed: {str(e)}"}
            else:
                raise

        # Collect audio bytes from generator
        audio_bytes = b""
        for chunk in audio_generator:
            audio_bytes += chunk

        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=response.mp3"},
        )
    except ImportError:
        return {"error": "ElevenLabs SDK not installed"}
    except Exception as e:
        return {"error": f"TTS failed: {str(e)}"}


@router.post("/stt")
async def speech_to_text(audio: UploadFile = File(...)):
    """Convert speech to text using ElevenLabs Scribe v2."""
    settings = get_settings()

    try:
        from elevenlabs import ElevenLabs

        client = ElevenLabs(api_key=settings.elevenlabs_api_key)

        audio_bytes = await audio.read()

        result = client.speech_to_text.convert(
            file=io.BytesIO(audio_bytes),
            model_id="scribe_v1",
            language_code="en",
        )

        return {
            "text": result.text,
            "language": getattr(result, "language_code", "en"),
        }
    except ImportError:
        return {"error": "ElevenLabs SDK not installed", "text": ""}
    except Exception as e:
        return {"error": f"STT failed: {str(e)}", "text": ""}


@router.get("/status")
def voice_status():
    """Check if ElevenLabs is configured."""
    settings = get_settings()
    return {
        "configured": bool(settings.elevenlabs_api_key),
        "voice_id": settings.elevenlabs_voice_id,
        "model_id": settings.elevenlabs_model_id,
        "note": "English only. Twi/Akan not currently supported by ElevenLabs.",
    }
