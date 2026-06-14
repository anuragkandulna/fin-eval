from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    environment: str = "local"
    domain: str = "localhost"

    openai_api_key: str

    database_url: str
    redis_url: str = "redis://localhost:6379"

    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "mortgage_docs"

    mlflow_tracking_uri: str = "http://localhost:5000"
    mlflow_experiment_name: str = "mortgageeval"

    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    langfuse_host: str = "http://localhost:3002"

    faithfulness_threshold: float = 0.70
    hallucination_threshold: float = 0.30
    tool_accuracy_threshold: float = 0.90
    relevancy_threshold: float = 0.75

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
