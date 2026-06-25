import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.database import init_db
from app.rag.ingest import ingest_directory, get_vectorstore
from app.routers import chat, analyse, documents
import structlog

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("starting_fineval_api")
    await init_db()

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(analyse.router)
app.include_router(documents.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "fineval-api"}
