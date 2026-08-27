from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = "local"
    domain: str = "localhost"

    openai_api_key: str

    database_url: str
    redis_url: str = "redis://localhost:6379"

    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""
    qdrant_collection: str = "finance_docs"

    mlflow_tracking_uri: str = "http://localhost:5000"
    mlflow_experiment: str = "fineval-evals"

    class Config:
        env_file = (".env", "../.env")  # works from both backend/ and project root
        extra = "ignore"


settings = Settings()
