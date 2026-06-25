import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

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

frontend_dist = Path("/app/frontend_dist")
if not frontend_dist.exists():
    frontend_dist = Path(__file__).resolve().parents[2] / "frontend_dist"

assets_dir = frontend_dist / "assets"
index_file = frontend_dist / "index.html"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "fineval-api"}


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    if not index_file.exists():
        raise HTTPException(status_code=404, detail="Frontend build not found")

    requested = frontend_dist / full_path
    if full_path and requested.exists() and requested.is_file():
        return FileResponse(requested)

    return FileResponse(index_file)
