from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routers import chat, recommend, documents
from app.models.database import init_db
from app.rag.ingest import ingest_directory, get_vectorstore
from app.config import settings
import os
import structlog

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("starting_mortgageeval_api")
    await init_db()

    docs_dir = "/app/data/mortgage_docs"
    if os.path.exists(docs_dir):
        try:
            count = get_vectorstore().client.count(settings.qdrant_collection).count
        except Exception:
            count = 0
        if count == 0:
            logger.info("ingesting_baseline_docs")
            await ingest_directory(docs_dir)

    yield
    logger.info("shutting_down_mortgageeval_api")


app = FastAPI(
    title="MortgageEval API",
    description="Agentic mortgage assistant with eval framework",
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
app.include_router(recommend.router)
app.include_router(documents.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "mortgageeval-api"}
