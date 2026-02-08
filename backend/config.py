from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    openai_api_key: str = ""
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "EXAVITQu4vr4xnSDxMaL"
    elevenlabs_model_id: str = "eleven_multilingual_v2"
    elevenlabs_voice_stability: float = 0.5
    elevenlabs_voice_similarity_boost: float = 0.75
    elevenlabs_voice_style: float = 0.6
    elevenlabs_voice_use_speaker_boost: bool = True
    embedding_model: str = "text-embedding-3-small"
    csv_path: str = "data/ghana_facilities.csv"
    host: str = "0.0.0.0"
    port: int = 8000

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
