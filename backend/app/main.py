import os
from contextlib import asynccontextmanager

import mlflow
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.rag.ingest import ingest_directory, get_vectorstore

from app.chat.router import router as chat_router
from app.analyse.router import router as analyse_router
from app.documents.router import router as documents_router
from app.health.router import router as health_router

# Import models so SQLModel.metadata.create_all picks them up
import app.chat.models  # noqa: F401

import structlog

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("starting_fineval_api")
    await init_db()

    mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
    mlflow.set_experiment(settings.mlflow_experiment)
    mlflow.langchain.autolog()

    docs_dir = "/app/data/finance_docs"
    if os.path.exists(docs_dir):
        try:
            count = get_vectorstore().client.count(settings.qdrant_collection).count
        except Exception:
            count = 0
        if count == 0:
            logger.info("ingesting_baseline_docs")
            await ingest_directory(docs_dir)

    yield
    logger.info("shutting_down_fineval_api")


app = FastAPI(
    title="FinEval API",
    description="Agentic personal finance assistant with eval framework",
    version="1.0.0",
    lifespan=lifespan,
)

_allowed_origins = [
    f"https://{settings.domain}",
    f"https://app.{settings.domain}",
]
if settings.environment != "production":
    _allowed_origins.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(analyse_router)
app.include_router(documents_router)
app.include_router(health_router)
