# Section 03 — Backend: FastAPI
**Goal:** All API endpoints working with mock responses before wiring the real agent

---

## Step 3.1 — requirements.txt

```txt
fastapi==0.111.0
uvicorn[standard]==0.29.0
pydantic==2.7.0
pydantic-settings==2.2.1
sqlalchemy==2.0.30
asyncpg==0.29.0
alembic==1.13.1
redis==5.0.4
python-multipart==0.0.9
httpx==0.27.0

# LLM + Agent
langchain==0.2.1
langchain-openai==0.1.8
langchain-community==0.2.1
langgraph==0.1.1
openai==1.30.1

# RAG
chromadb==0.5.0
tiktoken==0.7.0

# Eval logging
mlflow==2.13.0

# Utils
python-dotenv==1.0.1
structlog==24.1.0
```

---

## Step 3.2 — config.py

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App
    environment: str = "local"
    
    # OpenAI
    openai_api_key: str
    
    # Database
    database_url: str
    redis_url: str = "redis://localhost:6379"
    
    # ChromaDB
    chroma_persist_dir: str = "./chroma_db"
    
    # MLflow
    mlflow_tracking_uri: str = "http://localhost:5000"
    mlflow_experiment_name: str = "mortgageeval"
    
    # Thresholds
    faithfulness_threshold: float = 0.70
    hallucination_threshold: float = 0.30
    tool_accuracy_threshold: float = 0.90
    relevancy_threshold: float = 0.75

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
```

---

## Step 3.3 — models/schemas.py

```python
from pydantic import BaseModel
from typing import Optional

# Chat
class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    context_docs: list[str] = []

class ChatResponse(BaseModel):
    response: str
    sources: list[str] = []
    tool_calls_made: list[str] = []
    trace_id: str
    eval_scores: Optional[dict] = None

# Loan recommendation
class LoanRequest(BaseModel):
    income: float
    loan_amount: float
    credit_score: int
    loan_type: str           # fixed | variable | fha
    employment: str          # employed | self_employed | retired

class LoanResponse(BaseModel):
    product: str
    rate: float
    eligible: bool
    reasoning: str
    trace_id: str

# Document upload
class DocumentResponse(BaseModel):
    doc_id: str
    filename: str
    chunks: int
    status: str

# Eval scores
class EvalScores(BaseModel):
    deepeval: dict
    playwright: dict
    last_updated: str

class PerformanceScores(BaseModel):
    locust: dict
    lighthouse: dict
    last_updated: str

# Synthetic data
class SyntheticRequest(BaseModel):
    n_samples: int = 30
    scenario: str = "general"

class SyntheticSample(BaseModel):
    input: str
    expected_output: str
    context: str
    scenario: str
```

---

## Step 3.4 — models/database.py

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import settings

# Use asyncpg driver
DATABASE_URL = settings.database_url.replace(
    "postgresql://", "postgresql+asyncpg://"
)

engine = create_async_engine(DATABASE_URL, echo=False)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

---

## Step 3.5 — routers/chat.py

```python
from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
import uuid

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    trace_id = str(uuid.uuid4())
    
    try:
        # Phase 1: return mock response (replace with agent in Section 04)
        response = f"Mock response to: {request.message}"
        
        return ChatResponse(
            response=response,
            sources=[],
            tool_calls_made=[],
            trace_id=trace_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Step 3.6 — routers/recommend.py

```python
from fastapi import APIRouter, HTTPException
from app.models.schemas import LoanRequest, LoanResponse
import uuid

router = APIRouter(prefix="/recommend", tags=["recommend"])

@router.post("", response_model=LoanResponse)
async def recommend(request: LoanRequest):
    trace_id = str(uuid.uuid4())
    
    try:
        # Phase 1: mock response
        # DTI check
        monthly_income = request.income / 12
        monthly_payment = request.loan_amount * 0.006  # rough estimate
        dti = monthly_payment / monthly_income
        eligible = request.credit_score >= 620 and dti <= 0.43

        return LoanResponse(
            product="30-Year Fixed Rate Mortgage (Mock)",
            rate=6.75,
            eligible=eligible,
            reasoning=f"Mock reasoning: DTI={dti:.2f}, Credit={request.credit_score}",
            trace_id=trace_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Step 3.7 — routers/documents.py

```python
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.schemas import DocumentResponse
import uuid, os

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")
    
    doc_id = str(uuid.uuid4())
    file_path = f"{UPLOAD_DIR}/{doc_id}_{file.filename}"
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Phase 1: mock chunk count (replace with real ingest in Section 05)
    chunks = len(content) // 500
    
    return DocumentResponse(
        doc_id=doc_id,
        filename=file.filename,
        chunks=chunks,
        status="processed"
    )
```

---

## Step 3.8 — routers/scores.py

```python
from fastapi import APIRouter
from app.models.schemas import EvalScores, PerformanceScores
from datetime import datetime
import json, os

router = APIRouter(prefix="/scores", tags=["scores"])

REPORTS_DIR = "/app/reports"

def read_report(filename: str, default: dict) -> dict:
    path = f"{REPORTS_DIR}/{filename}"
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return default

@router.get("/eval", response_model=EvalScores)
async def get_eval_scores():
    deepeval = read_report("deepeval_summary.json", {
        "faithfulness": 0.0,
        "hallucination_rate": 0.0,
        "tool_accuracy": 0.0,
        "relevancy": 0.0,
        "passed": 0,
        "failed": 0,
        "ci_gate": "not_run"
    })
    playwright = read_report("playwright_summary.json", {
        "passed": 0, "failed": 0, "total": 0
    })
    return EvalScores(
        deepeval=deepeval,
        playwright=playwright,
        last_updated=datetime.now().isoformat()
    )

@router.get("/performance", response_model=PerformanceScores)
async def get_performance_scores():
    locust = read_report("locust_summary.json", {
        "p50_ms": 0, "p95_ms": 0, "error_rate": 0, "rps": 0, "users": 0
    })
    lighthouse = read_report("lighthouse_summary.json", {
        "performance": 0, "accessibility": 0, "best_practices": 0
    })
    return PerformanceScores(
        locust=locust,
        lighthouse=lighthouse,
        last_updated=datetime.now().isoformat()
    )
```

---

## Step 3.9 — main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routers import chat, recommend, documents, scores
from app.models.database import init_db
import structlog

logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting MortgageEval API")
    await init_db()
    yield
    logger.info("Shutting down MortgageEval API")

app = FastAPI(
    title="MortgageEval API",
    description="Agentic mortgage assistant with eval framework",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(recommend.router)
app.include_router(documents.router)
app.include_router(scores.router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "mortgageeval-api"}
```

---

## Step 3.10 — Dockerfile (backend)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Section 03 Checklist

- [ ] `requirements.txt` created
- [ ] `config.py` reading from `.env`
- [ ] All Pydantic schemas defined
- [ ] All 5 routers created (chat, recommend, documents, scores, synthetic)
- [ ] `main.py` wiring all routers with CORS
- [ ] `Dockerfile` created
- [ ] Local test: `cd backend && uvicorn app.main:app --reload`
- [ ] Visit `http://localhost:8000/docs` — FastAPI Swagger UI should show all endpoints
- [ ] Test `/health` returns `{"status": "ok"}`
- [ ] Test `/chat` with mock body returns mock response
- [ ] Test `/recommend` returns mock loan recommendation
- [ ] Commit: `git commit -m "feat: backend FastAPI with mock endpoints"`

**Before proceeding:** All endpoints return 200 in Swagger UI with mock data.
