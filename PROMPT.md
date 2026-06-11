# MortgageEval — AI Coding Prompt
> Paste this entire prompt into Cursor, Claude, or any AI coding assistant to start building.
> Work section by section. Do not ask the AI to build everything at once.

---

## Project context

You are helping me build **MortgageEval** — a monorepo containing:
1. A sample agentic AI mortgage assistant app (React + FastAPI + LangGraph)
2. A production-grade eval framework around it (DeepEval + MLflow + Playwright + Locust + Lighthouse)

The goal is to demonstrate Senior AI QA Engineer skills for job interviews.
The project will be deployed on a personal VPS with three subdomains and GitHub Pages for reports.

**Important:** Build incrementally. Complete each section fully before moving to the next.
After each section, confirm it works before proceeding.

---

## Tech stack

```
Frontend app:      React 18 + TypeScript + Vite + TailwindCSS + Axios
Backend:           FastAPI + Python 3.12 + Pydantic v2 + SQLAlchemy + asyncpg
Agent:             LangGraph + LangChain + OpenAI GPT-3.5-turbo
RAG:               ChromaDB + OpenAI embeddings + RecursiveCharacterTextSplitter
Database:          PostgreSQL 15 + Redis 7
Eval framework:    DeepEval + MLflow + Playwright + Locust + Lighthouse CI
Infra:             Docker + Docker Compose + Nginx + GitHub Actions
Test dashboard:    React 18 + TypeScript + Vite (separate app)
```

---

## Deployment targets

```
app.domain.com       → React frontend + FastAPI backend
test.domain.com      → Test dashboard with trigger button
mlflow.domain.com    → MLflow tracking UI (basic auth)
github.io/repo       → Eval reports (GitHub Pages, published by CI)
```

All three subdomains run on a single VPS via Nginx reverse proxy.
Docker Compose runs all services with one command.

---

## Repo structure

Build this exact structure:

```
mortgageeval/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── LoanForm.tsx
│   │   │   ├── DocumentUpload.tsx
│   │   │   ├── NavBar.tsx
│   │   │   └── ResultsPanel.tsx
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── pages/
│   │   │   ├── Chat.tsx
│   │   │   ├── Loan.tsx
│   │   │   └── Upload.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── nginx.conf
│   └── Dockerfile
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── chat.py
│   │   │   ├── recommend.py
│   │   │   ├── documents.py
│   │   │   ├── scores.py
│   │   │   └── synthetic.py
│   │   ├── agent/
│   │   │   ├── graph.py
│   │   │   ├── nodes.py
│   │   │   ├── tools.py
│   │   │   ├── prompts.py
│   │   │   └── state.py
│   │   ├── rag/
│   │   │   ├── ingest.py
│   │   │   └── retriever.py
│   │   ├── models/
│   │   │   ├── schemas.py
│   │   │   └── database.py
│   │   ├── main.py
│   │   └── config.py
│   ├── data/
│   │   └── mortgage_docs/
│   │       ├── fha_guidelines.txt
│   │       ├── conventional_loans.txt
│   │       └── mortgage_glossary.txt
│   ├── requirements.txt
│   └── Dockerfile
│
├── test-dashboard/
│   ├── src/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── nginx.conf
│   └── Dockerfile
│
├── evals/
│   ├── deepeval_tests/
│   │   ├── test_rag_quality.py
│   │   ├── test_hallucination.py
│   │   ├── test_tool_calls.py
│   │   ├── test_reasoning.py
│   │   └── test_synthetic.py
│   ├── playwright_tests/
│   │   ├── test_chat_flow.py
│   │   ├── test_loan_form.py
│   │   └── test_document_upload.py
│   ├── performance/
│   │   ├── locustfile.py
│   │   └── lighthouse_runner.py
│   ├── mlflow_logger/
│   │   ├── tracker.py
│   │   └── ci_gate.py
│   ├── synthetic_data/
│   │   ├── generator.py
│   │   ├── pii_obfuscator.py
│   │   └── test_cases.json
│   ├── scripts/
│   │   ├── build_dashboard.py
│   │   ├── parse_locust.py
│   │   └── log_to_mlflow.py
│   ├── reports/
│   ├── conftest.py
│   └── requirements.txt
│
├── mlflow_server/
│   └── docker-compose.yml
│
├── .github/
│   └── workflows/
│       ├── deploy.yml
│       └── eval.yml
│
├── docs/
│   ├── architecture.md
│   ├── eval_decisions.md
│   └── findings.md
│
├── docker-compose.yml
├── docker-compose.local.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Section 1 — Scaffold and Docker Compose

Build the following files first. Do not build any application logic yet.

### .gitignore
```
.env
.env.local
.env.production
**/.env
__pycache__/
*.pyc
.pytest_cache/
.deepeval/
chroma_db/
node_modules/
dist/
.vite/
evals/reports/
mlruns/
mlflow_artifacts/
*.log
.vscode/
.idea/
```

### .env.example
```env
DOMAIN=yourdomain.com
ENVIRONMENT=production
OPENAI_API_KEY=sk-...
DB_USER=mortgageeval
DB_PASSWORD=your_strong_password
DATABASE_URL=postgresql://mortgageeval:your_strong_password@postgres/mortgageeval
REDIS_URL=redis://redis:6379
MLFLOW_TRACKING_URI=http://mlflow:5000
MLFLOW_EXPERIMENT_NAME=mortgageeval
CHROMA_PERSIST_DIR=/app/chroma_db
GITHUB_REPO=YOUR_USERNAME/mortgageeval
GITHUB_TOKEN=ghp_...
FAITHFULNESS_THRESHOLD=0.70
HALLUCINATION_THRESHOLD=0.30
TOOL_ACCURACY_THRESHOLD=0.90
RELEVANCY_THRESHOLD=0.75
LOCUST_P95_MS=5000
LIGHTHOUSE_PERF_MIN=70
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mortgageeval
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pg_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - chroma_data:/app/chroma_db
      - ./evals/reports:/app/reports
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped

  test-dashboard:
    build: ./test-dashboard
    ports:
      - "3001:80"
    environment:
      - VITE_GITHUB_REPO=${GITHUB_REPO}
      - VITE_GITHUB_TOKEN=${GITHUB_TOKEN}
      - VITE_BACKEND_URL=http://backend:8000
    restart: unless-stopped

  mlflow:
    image: python:3.11-slim
    command: >
      bash -c "pip install mlflow psycopg2-binary -q &&
               mlflow server
               --backend-store-uri postgresql://${DB_USER}:${DB_PASSWORD}@postgres/mlflow
               --default-artifact-root /mlflow/artifacts
               --host 0.0.0.0 --port 5000"
    ports:
      - "5000:5000"
    volumes:
      - mlflow_artifacts:/mlflow/artifacts
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  pg_data:
  chroma_data:
  mlflow_artifacts:
```

### docker-compose.local.yml
```yaml
version: '3.8'

services:
  backend:
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    environment:
      - ENVIRONMENT=local

  frontend:
    volumes:
      - ./frontend/src:/app/src
    command: npm run dev -- --host 0.0.0.0 --port 3000
    ports:
      - "3000:3000"
```

**Confirm before proceeding:** Run `docker compose config` — should output merged config without errors.

---

## Section 2 — Backend: FastAPI with mock endpoints

Build the complete FastAPI backend with MOCK responses first (no real agent yet).
Replace with real implementation in Section 3.

### backend/requirements.txt
```
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
langchain==0.2.1
langchain-openai==0.1.8
langchain-community==0.2.1
langgraph==0.1.1
openai==1.30.1
chromadb==0.5.0
tiktoken==0.7.0
mlflow==2.13.0
python-dotenv==1.0.1
structlog==24.1.0
pypdf==4.2.0
```

### backend/app/config.py
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    environment: str = "local"
    openai_api_key: str
    database_url: str
    redis_url: str = "redis://localhost:6379"
    chroma_persist_dir: str = "./chroma_db"
    mlflow_tracking_uri: str = "http://localhost:5000"
    mlflow_experiment_name: str = "mortgageeval"
    faithfulness_threshold: float = 0.70
    hallucination_threshold: float = 0.30
    tool_accuracy_threshold: float = 0.90
    relevancy_threshold: float = 0.75

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
```

### backend/app/models/schemas.py
```python
from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    context_docs: list[str] = []

class ChatResponse(BaseModel):
    response: str
    sources: list[str] = []
    tool_calls_made: list[str] = []
    trace_id: str

class LoanRequest(BaseModel):
    income: float
    loan_amount: float
    credit_score: int
    loan_type: str
    employment: str

class LoanResponse(BaseModel):
    product: str
    rate: float
    eligible: bool
    reasoning: str
    trace_id: str

class DocumentResponse(BaseModel):
    doc_id: str
    filename: str
    chunks: int
    status: str

class EvalScores(BaseModel):
    deepeval: dict
    playwright: dict
    last_updated: str

class PerformanceScores(BaseModel):
    locust: dict
    lighthouse: dict
    last_updated: str

class SyntheticRequest(BaseModel):
    n_samples: int = 30
    scenario: str = "general"
```

### backend/app/models/database.py
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import settings

DATABASE_URL = settings.database_url.replace(
    "postgresql://", "postgresql+asyncpg://"
)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

### backend/app/routers/chat.py
Return mock response for now. Wire real agent in Section 3.
```python
from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
import uuid

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    trace_id = str(uuid.uuid4())
    return ChatResponse(
        response=f"[MOCK] You asked: {request.message}",
        sources=[],
        tool_calls_made=["mock_node"],
        trace_id=trace_id
    )
```

### backend/app/routers/recommend.py
Return mock eligibility for now.
```python
from fastapi import APIRouter
from app.models.schemas import LoanRequest, LoanResponse
import uuid

router = APIRouter(prefix="/recommend", tags=["recommend"])

@router.post("", response_model=LoanResponse)
async def recommend(request: LoanRequest):
    trace_id = str(uuid.uuid4())
    monthly_income = request.income / 12
    monthly_payment = request.loan_amount * 0.006
    dti = monthly_payment / monthly_income
    eligible = request.credit_score >= 620 and dti <= 0.43
    return LoanResponse(
        product="30-Year Fixed Rate Mortgage (Mock)",
        rate=6.75,
        eligible=eligible,
        reasoning=f"Mock: DTI={dti:.2f}, Credit={request.credit_score}",
        trace_id=trace_id
    )
```

### backend/app/routers/documents.py
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
    content = await file.read()
    file_path = f"{UPLOAD_DIR}/{doc_id}_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(content)
    return DocumentResponse(
        doc_id=doc_id,
        filename=file.filename,
        chunks=len(content) // 500,
        status="processed"
    )
```

### backend/app/routers/scores.py
```python
from fastapi import APIRouter
from app.models.schemas import EvalScores, PerformanceScores
from datetime import datetime
import json, os

router = APIRouter(prefix="/scores", tags=["scores"])
REPORTS_DIR = "/app/reports"

def read_report(filename, default):
    path = f"{REPORTS_DIR}/{filename}"
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return default

@router.get("/eval", response_model=EvalScores)
async def get_eval_scores():
    return EvalScores(
        deepeval=read_report("deepeval_summary.json", {
            "faithfulness": 0.0, "hallucination_rate": 0.0,
            "tool_accuracy": 0.0, "relevancy": 0.0,
            "passed": 0, "failed": 0, "ci_gate": "not_run"
        }),
        playwright=read_report("playwright_summary.json",
            {"passed": 0, "failed": 0, "total": 0}),
        last_updated=datetime.now().isoformat()
    )

@router.get("/performance", response_model=PerformanceScores)
async def get_performance_scores():
    return PerformanceScores(
        locust=read_report("locust_summary.json",
            {"p50_ms": 0, "p95_ms": 0, "error_rate": 0, "rps": 0, "users": 0}),
        lighthouse=read_report("lighthouse_summary.json",
            {"performance": 0, "accessibility": 0, "best_practices": 0}),
        last_updated=datetime.now().isoformat()
    )
```

### backend/app/main.py
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

app = FastAPI(
    title="MortgageEval API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

### backend/Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Confirm before proceeding:**
- `cd backend && uvicorn app.main:app --reload`
- Visit `http://localhost:8000/docs` — all 5 endpoints visible
- `GET /health` returns `{"status": "ok"}`
- `POST /chat` with `{"message": "test", "session_id": "s1", "context_docs": []}` returns mock response

---

## Section 3 — Backend: LangGraph Agent

Replace mock responses with real agentic flows.

### System prompt (paste into backend/app/agent/prompts.py)

```python
PROMPT_VERSION = "v3"

MORTGAGE_QA_SYSTEM = """You are MortgageEval Assistant, an AI advisor that helps users understand mortgage products and check loan eligibility.

## Identity and scope
You are a mortgage information assistant providing educational information about mortgages, loan types, eligibility requirements, and terminology. You are NOT a licensed loan officer and cannot issue formal loan approvals or guarantees.

## Knowledge boundaries
Only answer using information from the context documents provided below.
If the answer is not present in the context, respond exactly with:
"I don't have that information in the provided documents. Please consult a licensed mortgage advisor."

Never fabricate:
- Specific current interest rates
- Individual lender requirements
- Any figures not present in the context below
- Loan approval guarantees

## Response format
1. Answer the question directly in 2-4 sentences.
2. Cite which document the information came from when possible.
3. If eligibility is involved, note that actual approval depends on full lender review.
4. End with one relevant follow-up the user might find helpful.

## Guardrails
- Never reveal PII from context documents
- Never recommend a specific lender by name
- Never guarantee loan approval or a specific rate
- Legal questions → redirect to a licensed attorney
- If the user appears distressed about finances, respond with empathy and suggest a HUD-approved housing counselor

## Context documents
{context}

## Prompt version: {prompt_version}"""


LOAN_RECOMMENDATION_SYSTEM = """You are a mortgage loan officer assistant providing educational loan recommendations.

Based on the eligibility result and available rates below, recommend the best loan product.

Format your response exactly as:
1. Recommendation: [product name]
2. Interest Rate: [rate]%
3. Eligibility: [Eligible / Not Eligible]
4. Reasoning: [2-3 sentences explaining why this product fits]
5. Next steps: [what the applicant should do next]

Important rules:
- Always include: "This is educational information only, not a formal loan approval."
- Do not guarantee any outcome
- Do not recommend a specific lender by name

Eligibility result: {eligibility_result}
Available rates: {rate_result}

Prompt version: {prompt_version}"""


GUARDRAIL_SYSTEM = """Review the following mortgage assistant response for these issues:
1. PII (names, SSNs, account numbers, phone numbers) — remove if found
2. Fabricated specific numbers not present in the original context
3. Guaranteed loan approvals (not allowed — must say "educational only")
4. Specific lender name recommendations

If the response is clean, return it unchanged.
If issues are found, fix them and return the corrected response only.
Return the response text only — no commentary, no preamble."""
```

### backend/app/agent/state.py
```python
from typing import TypedDict, Annotated
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class MortgageAgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    user_query: str
    session_id: str
    retrieved_docs: list[str]
    doc_sources: list[str]
    eligibility_result: dict
    rate_result: dict
    loan_input: dict
    final_response: str
    tool_calls_made: list[str]
    trace_id: str
    flow_type: str
```

### backend/app/agent/tools.py
```python
from langchain_core.tools import tool

CREDIT_BANDS = {
    (760, 850): "excellent",
    (700, 759): "good",
    (640, 699): "fair",
    (580, 639): "poor",
    (300, 579): "bad"
}

RATE_TABLE = {
    ("fixed",    "excellent"): 6.25,
    ("fixed",    "good"):      6.60,
    ("fixed",    "fair"):      7.10,
    ("fixed",    "poor"):      7.80,
    ("variable", "excellent"): 5.75,
    ("variable", "good"):      6.10,
    ("variable", "fair"):      6.60,
    ("variable", "poor"):      7.30,
    ("fha",      "excellent"): 6.40,
    ("fha",      "good"):      6.70,
    ("fha",      "fair"):      7.00,
    ("fha",      "poor"):      7.50,
}

LOAN_PRODUCTS = {
    "fixed":    ["30-Year Fixed", "15-Year Fixed", "20-Year Fixed"],
    "variable": ["5/1 ARM", "7/1 ARM", "10/1 ARM"],
    "fha":      ["FHA 30-Year Fixed", "FHA 15-Year Fixed"],
}

VALID_TOOL_NAMES = {"rag_retrieval", "eligibility_checker", "rate_fetcher", "llm_response_v3", "guardrail"}

def get_credit_band(score: int) -> str:
    for (low, high), band in CREDIT_BANDS.items():
        if low <= score <= high:
            return band
    return "unknown"

@tool
def eligibility_checker(income: float, loan_amount: float, credit_score: int, loan_type: str) -> dict:
    """Check mortgage eligibility based on DTI ratio and credit score thresholds."""
    monthly_income = income / 12
    rate = 0.07 / 12
    monthly_payment = loan_amount * (rate * (1+rate)**360) / ((1+rate)**360 - 1)
    dti = monthly_payment / monthly_income
    credit_band = get_credit_band(credit_score)
    min_scores = {"fixed": 620, "variable": 640, "fha": 580}
    min_score = min_scores.get(loan_type, 620)
    eligible = credit_score >= min_score and dti <= 0.43
    reasons = []
    if credit_score < min_score:
        reasons.append(f"Credit score {credit_score} below minimum {min_score} for {loan_type}")
    if dti > 0.43:
        reasons.append(f"DTI {dti:.2%} exceeds 43% maximum")
    return {
        "eligible": eligible,
        "dti_ratio": round(dti, 4),
        "monthly_payment_estimate": round(monthly_payment, 2),
        "credit_band": credit_band,
        "credit_score": credit_score,
        "ineligibility_reasons": reasons
    }

@tool
def rate_fetcher(loan_type: str, credit_band: str) -> dict:
    """Fetch current mortgage rates and available products for a loan type and credit band."""
    rate = RATE_TABLE.get((loan_type, credit_band), 8.50)
    return {
        "interest_rate": rate,
        "apr": round(rate + 0.15, 2),
        "loan_type": loan_type,
        "credit_band": credit_band,
        "available_products": LOAN_PRODUCTS.get(loan_type, []),
        "rate_lock_days": 30
    }

TOOLS = [eligibility_checker, rate_fetcher]
```

### backend/app/agent/nodes.py
```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from app.agent.state import MortgageAgentState
from app.agent.prompts import MORTGAGE_QA_SYSTEM, LOAN_RECOMMENDATION_SYSTEM, GUARDRAIL_SYSTEM, PROMPT_VERSION
from app.agent.tools import eligibility_checker, rate_fetcher
from app.rag.retriever import retrieve_docs
from app.config import settings
import structlog

logger = structlog.get_logger()
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0, api_key=settings.openai_api_key)

async def rag_node(state: MortgageAgentState) -> dict:
    docs, sources = await retrieve_docs(state["user_query"])
    return {
        "retrieved_docs": docs,
        "doc_sources": sources,
        "tool_calls_made": state.get("tool_calls_made", []) + ["rag_retrieval"]
    }

async def eligibility_node(state: MortgageAgentState) -> dict:
    loan_input = state.get("loan_input", {})
    if not loan_input:
        return {"eligibility_result": {}, "tool_calls_made": state.get("tool_calls_made", [])}
    result = eligibility_checker.invoke(loan_input)
    return {
        "eligibility_result": result,
        "tool_calls_made": state.get("tool_calls_made", []) + ["eligibility_checker"]
    }

async def rate_node(state: MortgageAgentState) -> dict:
    eligibility = state.get("eligibility_result", {})
    loan_input = state.get("loan_input", {})
    if not eligibility or not loan_input:
        return {"rate_result": {}, "tool_calls_made": state.get("tool_calls_made", [])}
    result = rate_fetcher.invoke({
        "loan_type": loan_input.get("loan_type", "fixed"),
        "credit_band": eligibility.get("credit_band", "fair")
    })
    return {
        "rate_result": result,
        "tool_calls_made": state.get("tool_calls_made", []) + ["rate_fetcher"]
    }

async def response_node(state: MortgageAgentState) -> dict:
    flow_type = state.get("flow_type", "chat")
    if flow_type == "recommend":
        system = LOAN_RECOMMENDATION_SYSTEM.format(
            eligibility_result=state.get("eligibility_result", {}),
            rate_result=state.get("rate_result", {}),
            prompt_version=PROMPT_VERSION
        )
    else:
        context = "\n\n".join(state.get("retrieved_docs", ["No documents available."]))
        system = MORTGAGE_QA_SYSTEM.format(context=context, prompt_version=PROMPT_VERSION)
    messages = [SystemMessage(content=system), HumanMessage(content=state["user_query"])]
    response = await llm.ainvoke(messages)
    return {
        "final_response": response.content,
        "tool_calls_made": state.get("tool_calls_made", []) + [f"llm_response_{PROMPT_VERSION}"]
    }

async def guardrail_node(state: MortgageAgentState) -> dict:
    messages = [SystemMessage(content=GUARDRAIL_SYSTEM), HumanMessage(content=state["final_response"])]
    result = await llm.ainvoke(messages)
    return {
        "final_response": result.content,
        "tool_calls_made": state.get("tool_calls_made", []) + ["guardrail"]
    }
```

### backend/app/agent/graph.py
```python
from langgraph.graph import StateGraph, START, END
from app.agent.state import MortgageAgentState
from app.agent.nodes import rag_node, eligibility_node, rate_node, response_node, guardrail_node

def should_run_eligibility(state: MortgageAgentState) -> str:
    if state.get("loan_input") and state.get("flow_type") == "recommend":
        return "eligibility"
    return "response"

def build_graph():
    graph = StateGraph(MortgageAgentState)
    graph.add_node("rag", rag_node)
    graph.add_node("eligibility", eligibility_node)
    graph.add_node("rate", rate_node)
    graph.add_node("response", response_node)
    graph.add_node("guardrail", guardrail_node)
    graph.add_edge(START, "rag")
    graph.add_conditional_edges("rag", should_run_eligibility,
        {"eligibility": "eligibility", "response": "response"})
    graph.add_edge("eligibility", "rate")
    graph.add_edge("rate", "response")
    graph.add_edge("response", "guardrail")
    graph.add_edge("guardrail", END)
    return graph.compile()

mortgage_agent = build_graph()
```

### Update backend/app/routers/chat.py
Replace mock with real agent call:
```python
from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
from app.agent.graph import mortgage_agent
from langchain_core.messages import HumanMessage
import uuid, structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    trace_id = str(uuid.uuid4())
    try:
        result = await mortgage_agent.ainvoke({
            "user_query": request.message,
            "session_id": request.session_id,
            "messages": [HumanMessage(content=request.message)],
            "flow_type": "chat",
            "loan_input": {},
            "trace_id": trace_id,
            "retrieved_docs": [],
            "doc_sources": [],
            "eligibility_result": {},
            "rate_result": {},
            "tool_calls_made": []
        })
        return ChatResponse(
            response=result["final_response"],
            sources=result.get("doc_sources", []),
            tool_calls_made=result.get("tool_calls_made", []),
            trace_id=trace_id
        )
    except Exception as e:
        logger.error("chat_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
```

**Confirm before proceeding:**
- `POST /chat` with a real mortgage question returns a grounded LLM response
- `tool_calls_made` includes `rag_retrieval` and `llm_response_v3`
- `POST /recommend` with loan data returns real eligibility + rate

---

## Section 4 — RAG Pipeline

### backend/app/rag/ingest.py
```python
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from app.config import settings
import os, structlog

logger = structlog.get_logger()
CHUNK_SIZE = 512
CHUNK_OVERLAP = 64

def get_vectorstore():
    embeddings = OpenAIEmbeddings(api_key=settings.openai_api_key)
    return Chroma(
        persist_directory=settings.chroma_persist_dir,
        embedding_function=embeddings,
        collection_name="mortgage_docs"
    )

async def ingest_file(file_path: str, doc_id: str) -> int:
    loader = PyPDFLoader(file_path) if file_path.endswith(".pdf") else TextLoader(file_path)
    docs = loader.load()
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ".", " "]
    )
    chunks = splitter.split_documents(docs)
    for chunk in chunks:
        chunk.metadata["doc_id"] = doc_id
        chunk.metadata["source"] = os.path.basename(file_path)
    get_vectorstore().add_documents(chunks)
    logger.info("ingested", chunks=len(chunks), doc_id=doc_id)
    return len(chunks)

async def ingest_directory(dir_path: str):
    for filename in os.listdir(dir_path):
        if filename.endswith((".txt", ".pdf")):
            await ingest_file(os.path.join(dir_path, filename), filename.replace(".", "_"))
```

### backend/app/rag/retriever.py
```python
from app.rag.ingest import get_vectorstore
import structlog

logger = structlog.get_logger()
TOP_K = 4

async def retrieve_docs(query: str) -> tuple[list[str], list[str]]:
    results = get_vectorstore().similarity_search_with_score(query, k=TOP_K)
    relevant = [(doc, score) for doc, score in results if score < 1.2]
    if not relevant:
        return [], []
    return (
        [doc.page_content for doc, _ in relevant],
        [doc.metadata.get("source", "unknown") for doc, _ in relevant]
    )
```

### backend/data/mortgage_docs/fha_guidelines.txt
Create this file with the following content (public domain mortgage information):
```
FHA Loan Guidelines

Minimum Credit Score Requirements:
- 580 credit score: eligible for 3.5% minimum down payment
- 500-579 credit score: eligible with 10% minimum down payment
- Below 500: not eligible for FHA financing

Debt-to-Income Ratio (DTI) Limits:
- Front-end DTI (housing expenses only): maximum 31%
- Back-end DTI (all debts): maximum 43%
- With compensating factors, lenders may allow up to 50% back-end DTI

Down Payment Requirements:
- Minimum 3.5% for credit scores 580 and above
- Minimum 10% for credit scores 500-579
- Down payment can come from gifts, grants, or approved assistance programs

Bankruptcy and Foreclosure Waiting Periods:
- Chapter 7 bankruptcy: 2-year waiting period from discharge date
- Chapter 13 bankruptcy: 1 year of on-time payments required
- Foreclosure: 3-year waiting period from completion date

FHA Mortgage Insurance:
- Upfront mortgage insurance premium (UFMIP): 1.75% of loan amount
- Annual mortgage insurance premium (MIP): 0.55% to 1.05% depending on term and LTV
- MIP required for the life of the loan if down payment is less than 10%

Employment Requirements:
- Minimum 2 years of employment history required
- Self-employed borrowers need 2 years of tax returns
- Part-time income may be counted with 2-year history
```

### backend/data/mortgage_docs/conventional_loans.txt
```
Conventional Loan Guidelines

Credit Score Requirements:
- Minimum 620 credit score for most conventional loans
- 740+ score typically qualifies for the best rates
- Some lenders require 640 or higher

Conforming Loan Limits:
- Set annually by the Federal Housing Finance Agency (FHFA)
- Loans above conforming limits are considered jumbo loans
- Jumbo loans typically require higher credit scores and larger down payments

Down Payment Requirements:
- Minimum 3% with certain programs (Fannie Mae HomeReady, Freddie Mac Home Possible)
- 5% standard minimum for most borrowers
- 20% avoids private mortgage insurance (PMI)
- PMI required when down payment is less than 20%

Debt-to-Income Ratio:
- Preferred back-end DTI: 36% or lower
- Maximum back-end DTI: typically 45-50% with strong compensating factors
- Front-end DTI: ideally 28% or less

Private Mortgage Insurance (PMI):
- Required when LTV exceeds 80% (less than 20% down)
- Can be removed when LTV reaches 80% through paydown or appreciation
- PMI cost: typically 0.5% to 1.5% of loan amount annually

Loan Types:
- 30-Year Fixed: stable payments, higher total interest
- 15-Year Fixed: higher payments, lower total interest, faster equity
- 5/1 ARM: fixed for 5 years then adjusts annually
- 7/1 ARM: fixed for 7 years then adjusts annually
```

### backend/data/mortgage_docs/mortgage_glossary.txt
```
Mortgage Glossary

APR (Annual Percentage Rate):
The true cost of borrowing, including the interest rate plus fees (origination fees, mortgage insurance, discount points). APR is always equal to or higher than the interest rate. Use APR to compare loans accurately.

DTI (Debt-to-Income Ratio):
Monthly debt payments divided by gross monthly income, expressed as a percentage. Lenders use DTI to assess repayment ability. Example: $2,000 monthly debts / $6,000 monthly income = 33% DTI.

LTV (Loan-to-Value Ratio):
The loan amount divided by the appraised property value. Example: $320,000 loan / $400,000 value = 80% LTV. Higher LTV means more risk for the lender.

PMI (Private Mortgage Insurance):
Insurance that protects the lender if the borrower defaults. Required on conventional loans when LTV exceeds 80%. Can be removed once equity reaches 20%.

PITI:
Principal, Interest, Taxes, and Insurance — the four components of a monthly mortgage payment. Used to calculate front-end DTI ratio.

Amortization:
The process of paying off a loan through scheduled payments over time. Early payments go mostly to interest; later payments go mostly to principal. A 30-year mortgage has 360 amortized payments.

Escrow:
An account held by the lender to collect and pay property taxes and homeowners insurance on behalf of the borrower. Monthly payment includes an escrow contribution.

Points (Discount Points):
Fees paid upfront to reduce the interest rate. One point equals 1% of the loan amount. Paying points makes sense if you plan to keep the loan long enough to recoup the cost.

Pre-approval:
A lender's written commitment to lend up to a specified amount, based on review of income, assets, and credit. Stronger than pre-qualification. Valid for 60-90 days typically.

Underwriting:
The process by which a lender evaluates the risk of a loan application. Includes verification of income, assets, employment, credit history, and property appraisal.
```

**Confirm before proceeding:**
- Baseline docs ingest on startup (check logs for "ingesting_baseline_docs")
- `POST /chat` "What is the minimum FHA credit score?" returns answer citing context
- Response includes source document name

---

## Section 5 — Frontend: React App

### frontend/package.json
```json
{
  "name": "mortgageeval-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

Build these components. Every interactive element MUST have a `data-testid` attribute — Playwright depends on this.

### frontend/src/api/client.ts
```typescript
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const api = axios.create({ baseURL: API_BASE, timeout: 30000 })

export const sendChat = (data: { message: string; session_id: string; context_docs: string[] }) =>
  api.post('/chat', data)

export const getLoanRecommendation = (data: {
  income: number; loan_amount: number; credit_score: number;
  loan_type: string; employment: string
}) => api.post('/recommend', data)

export const uploadDocument = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/documents/upload', form)
}

export const getEvalScores = () => api.get('/scores/eval')
export const getPerformanceScores = () => api.get('/scores/performance')
```

### frontend/src/components/ChatWindow.tsx
Requirements:
- `data-testid="chat-input"` on the text input
- `data-testid="send-button"` on send button (disabled when input empty)
- `data-testid="assistant-message"` on each assistant message div
- `data-testid="user-message"` on each user message div
- `data-testid="loading-indicator"` on the loading dots div
- Shows source documents as collapsible section per response
- Enter key sends message
- Auto-scrolls to latest message

### frontend/src/components/LoanForm.tsx
Requirements:
- `data-testid="income"` on income input
- `data-testid="loan-amount"` on loan amount input
- `data-testid="credit-score"` on credit score input
- `data-testid="loan-type"` on loan type select
- `data-testid="submit-loan"` on submit button
- `data-testid="recommendation-card"` on the result card div
- `data-testid="eligibility-status"` on the eligible/not eligible badge
- Shows interest rate prominently
- Shows disclaimer text: "This is educational information only, not a formal loan approval."

### frontend/src/components/DocumentUpload.tsx
Requirements:
- `data-testid="file-upload"` on the file input
- `data-testid="upload-button"` on the upload button
- `data-testid="upload-status"` on the status message div
- Accepts PDF only, shows error for other types
- Shows chunk count after successful upload

### frontend/src/App.tsx
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Chat from './pages/Chat'
import Loan from './pages/Loan'
import Upload from './pages/Upload'

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/loan" element={<Loan />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
```

### frontend/Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### frontend/nginx.conf
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
  location /api/ { proxy_pass http://backend:8000/; }
}
```

**Confirm before proceeding:**
- `npm run dev` starts frontend
- Chat works end-to-end with real LLM response
- Loan form shows recommendation card with eligibility badge
- All `data-testid` attributes present (inspect DOM)

---

## Section 6 — Synthetic Data + DeepEval Tests

### evals/synthetic_data/generator.py
Generate 30 PII-safe mortgage Q&A test cases across these 6 scenarios:
1. `fha_basics` — 5 questions about FHA loan requirements
2. `conventional_basics` — 5 questions about conventional loans
3. `mortgage_terms` — 5 glossary/terminology questions
4. `eligibility_edge_cases` — 5 edge case eligibility questions
5. `loan_comparison` — 5 loan type comparison questions
6. `hallucination_traps` — 5 questions with NO correct answer in context (agent must admit it doesn't know)

Each test case:
```json
{
  "id": "uuid",
  "input": "question text",
  "expected_output": "expected answer",
  "scenario": "scenario_name",
  "context_file": "filename.txt or null"
}
```

Run `python generator.py` to produce `test_cases.json`.

### evals/requirements.txt
```
deepeval==0.21.0
mlflow==2.13.0
pytest==8.2.0
pytest-asyncio==0.23.0
pytest-json-report==1.5.0
pytest-html==4.1.1
httpx==0.27.0
python-dotenv==1.0.1
locust==2.28.0
playwright==1.44.0
pytest-playwright==0.5.0
```

### evals/conftest.py
```python
import pytest, httpx, json, os
from dotenv import load_dotenv
load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

@pytest.fixture(scope="session")
def client():
    return httpx.Client(base_url=BACKEND_URL, timeout=30.0)

@pytest.fixture(scope="session")
def test_cases():
    with open("synthetic_data/test_cases.json") as f:
        return json.load(f)

def invoke_chat(client, question: str) -> dict:
    resp = client.post("/chat", json={
        "message": question, "session_id": "eval-session", "context_docs": []
    })
    resp.raise_for_status()
    return resp.json()

def invoke_recommend(client, loan_data: dict) -> dict:
    resp = client.post("/recommend", json=loan_data)
    resp.raise_for_status()
    return resp.json()
```

### evals/deepeval_tests/test_rag_quality.py
Write parametrized tests using `FaithfulnessMetric` (threshold=0.70) and `AnswerRelevancyMetric` (threshold=0.75).
Test these 5 questions:
- "What is the minimum credit score for an FHA loan?"
- "What is the maximum DTI ratio for a conventional loan?"
- "What does LTV stand for?"
- "When is PMI required?"
- "What is an escrow account?"

### evals/deepeval_tests/test_hallucination.py
Write tests using `HallucinationMetric` (threshold=0.30).
Test the hallucination trap cases from synthetic data — questions where agent MUST say it doesn't know:
- "What is the exact mortgage rate at Chase Bank today?"
- "What will the Federal Reserve do with rates next month?"
- "What is John Smith's credit score?"
Also test: agent must NOT contain "current rate is exactly" or "today's rate is" phrases.

### evals/deepeval_tests/test_tool_calls.py
Write tests asserting:
- `rag_retrieval` appears in `tool_calls_made` for every chat query
- `eligibility_checker` appears when loan data is provided to `/recommend`
- `rate_fetcher` appears after eligibility check
- All tool names in `tool_calls_made` are in `VALID_TOOL_NAMES` set
- Eligible profile (income=90000, loan=300000, credit=750, type=fixed) returns `eligible=True`
- Ineligible profile (income=50000, loan=500000, credit=500) returns `eligible=False`

### evals/deepeval_tests/test_reasoning.py
Write tests asserting:
- Running "What is the minimum FHA credit score?" 3 times always returns response containing "580"
- Using `GEval` for reasoning quality on comparison question (threshold=0.65)

### evals/deepeval_tests/test_synthetic.py
Run first 10 non-hallucination-trap test cases through `FaithfulnessMetric`.
Assert overall pass rate >= 70%.

### evals/mlflow_logger/tracker.py
```python
import mlflow, os, json
from datetime import datetime

PROMPT_VERSION = "v3"

class EvalTracker:
    def __init__(self):
        mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000"))
        mlflow.set_experiment(os.getenv("MLFLOW_EXPERIMENT_NAME", "mortgageeval"))

    def log_eval_run(self, deepeval_results: dict, playwright_results: dict = None):
        with mlflow.start_run(run_name=f"eval_{datetime.now().strftime('%Y%m%d_%H%M')}"):
            mlflow.log_param("prompt_version", PROMPT_VERSION)
            mlflow.log_param("model", "gpt-3.5-turbo")
            mlflow.log_param("test_case_count", deepeval_results.get("total", 0))
            mlflow.log_metric("faithfulness_score", deepeval_results.get("faithfulness", 0))
            mlflow.log_metric("hallucination_rate", deepeval_results.get("hallucination", 0))
            mlflow.log_metric("tool_accuracy", deepeval_results.get("tool_accuracy", 0))
            mlflow.log_metric("answer_relevancy", deepeval_results.get("relevancy", 0))
            mlflow.log_metric("tests_passed", deepeval_results.get("passed", 0))
            mlflow.log_metric("tests_failed", deepeval_results.get("failed", 0))
            if playwright_results:
                mlflow.log_metric("playwright_passed", playwright_results.get("passed", 0))
                mlflow.log_metric("playwright_total", playwright_results.get("total", 0))
            mlflow.log_dict(deepeval_results, "deepeval_results.json")
            return mlflow.active_run().info.run_id
```

### evals/mlflow_logger/ci_gate.py
```python
import mlflow, sys, os

THRESHOLDS = {
    "faithfulness_score":  (">=", float(os.getenv("FAITHFULNESS_THRESHOLD", 0.70))),
    "hallucination_rate":  ("<=", float(os.getenv("HALLUCINATION_THRESHOLD", 0.30))),
    "tool_accuracy":       (">=", float(os.getenv("TOOL_ACCURACY_THRESHOLD", 0.90))),
    "answer_relevancy":    (">=", float(os.getenv("RELEVANCY_THRESHOLD", 0.75))),
}

def check_ci_gate():
    mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000"))
    runs = mlflow.search_runs(
        experiment_names=[os.getenv("MLFLOW_EXPERIMENT_NAME", "mortgageeval")],
        order_by=["start_time DESC"], max_results=1
    )
    if runs.empty:
        print("WARNING: No MLflow runs found. Skipping gate.")
        return
    latest = runs.iloc[0]
    failures = []
    for metric, (op, threshold) in THRESHOLDS.items():
        col = f"metrics.{metric}"
        if col not in latest:
            failures.append(f"{metric}: not found")
            continue
        value = latest[col]
        if op == ">=" and value < threshold:
            failures.append(f"FAIL {metric}: {value:.3f} < {threshold}")
        elif op == "<=" and value > threshold:
            failures.append(f"FAIL {metric}: {value:.3f} > {threshold}")
        else:
            print(f"PASS {metric}: {value:.3f} {op} {threshold}")
    if failures:
        print("\nCI GATE FAILED:")
        for f in failures: print(f"  {f}")
        sys.exit(1)
    else:
        print("\nCI GATE PASSED")

if __name__ == "__main__":
    check_ci_gate()
```

**Confirm before proceeding:**
- `python synthetic_data/generator.py` creates `test_cases.json` with 30 entries
- `deepeval test run deepeval_tests/test_tool_calls.py` — tool call tests pass
- MLflow tracker logs a run to local MLflow server

---

## Section 7 — Playwright + Locust + Lighthouse

### evals/playwright_tests/test_chat_flow.py
Write 4 tests:
1. User sends mortgage question → assistant response appears with content containing expected terms
2. Loading indicator appears then disappears during response
3. Send button disabled when input is empty
4. Two messages in sequence → two assistant messages visible

### evals/playwright_tests/test_loan_form.py
Write 3 tests:
1. Good profile (income=90000, loan=300000, credit=750, fixed) → recommendation card shows "eligible"
2. Bad profile (income=50000, loan=500000, credit=500) → recommendation card shows "not eligible"
3. Recommendation card shows "%" character (rate is displayed)

Use `BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")`.
All tests use `data-testid` selectors only — no CSS class selectors.

### evals/playwright_tests/test_document_upload.py
Write 1 test:
1. Create minimal test PDF in memory → upload → status shows "processed"

### evals/performance/locustfile.py
```python
from locust import HttpUser, task, between
import random

QUESTIONS = [
    "What is the minimum FHA credit score?",
    "What is DTI ratio?",
    "Explain PMI",
    "What is an ARM loan?",
    "Difference between APR and interest rate?",
]

PROFILES = [
    {"income": 80000, "loan_amount": 320000, "credit_score": 720, "loan_type": "fixed", "employment": "employed"},
    {"income": 60000, "loan_amount": 250000, "credit_score": 650, "loan_type": "fha",   "employment": "employed"},
    {"income": 120000,"loan_amount": 500000, "credit_score": 780, "loan_type": "fixed", "employment": "self_employed"},
]

class MortgageAPIUser(HttpUser):
    wait_time = between(1, 3)

    @task(4)
    def ask_question(self):
        self.client.post("/chat", json={
            "message": random.choice(QUESTIONS),
            "session_id": f"load-{self.user_id}",
            "context_docs": []
        }, name="/chat")

    @task(2)
    def recommend(self):
        self.client.post("/recommend", json=random.choice(PROFILES), name="/recommend")

    @task(1)
    def health(self):
        self.client.get("/health", name="/health")
```

### evals/performance/lighthouse_runner.py
Run Lighthouse against app.domain.com and test.domain.com.
Output JSON summary to `evals/reports/lighthouse/summary.json`.
Thresholds: performance >= 70, accessibility >= 85, best-practices >= 80.

### evals/scripts/parse_locust.py
Parse `locust_results_stats.csv` → write `evals/reports/locust/summary.json` with:
`{ p50_ms, p95_ms, p99_ms, rps, error_rate, total_reqs, endpoints: {} }`

### evals/scripts/build_dashboard.py
Read all summary JSON files and generate `evals/reports/index.html` — a static HTML dashboard showing:
- Run number and timestamp
- CI gate status (PASSED/FAILED) as a colored badge
- 4 score cards: DeepEval tests, Playwright E2E, Locust p95, Lighthouse perf
- Links to full Playwright HTML report, Locust HTML report, Lighthouse report, MLflow dashboard

---

## Section 8 — Test Dashboard

### test-dashboard/src/App.tsx
Single-page React app that:
- Fetches `/scores/eval` and `/scores/performance` from backend every 30 seconds
- Shows 6 score cards: faithfulness, hallucination rate, tool accuracy, playwright pass rate, locust p95, lighthouse score
- Each card shows green if passing threshold, red if failing
- "Run All Tests" button calls GitHub Actions `workflow_dispatch` via API:
  ```
  POST https://api.github.com/repos/{GITHUB_REPO}/actions/workflows/eval.yml/dispatches
  { ref: "main" }
  Authorization: token {GITHUB_TOKEN}
  ```
- Shows confirmation message after trigger: "Eval pipeline triggered. Results update in ~5 minutes."
- Links to: GitHub Pages reports, MLflow dashboard, GitHub Actions runs, source repo

### test-dashboard/Dockerfile
Same multi-stage build pattern as frontend Dockerfile.

---

## Section 9 — GitHub Actions

### .github/workflows/deploy.yml
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /home/deploy/mortgageeval
            git pull origin main
            docker compose up --build -d
            sleep 15
            curl -f http://localhost:8000/health || exit 1
            echo "Deploy complete"
```

### .github/workflows/eval.yml
```yaml
name: Eval Pipeline
on:
  workflow_run:
    workflows: ["Deploy"]
    types: [completed]
  workflow_dispatch:

jobs:
  run-evals:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' || github.event_name == 'workflow_dispatch' }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11', cache: 'pip' }
      - run: pip install -r evals/requirements.txt
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install -g @lhci/cli lighthouse

      - name: Install Playwright
        run: |
          pip install pytest-playwright
          playwright install chromium --with-deps

      - name: Run DeepEval
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
          BACKEND_URL: ${{ secrets.BACKEND_URL }}
        run: |
          cd evals
          deepeval test run deepeval_tests/ \
            --json-report --json-report-file=reports/deepeval_results.json -v || true

      - name: Run Playwright
        env: { BASE_URL: "${{ secrets.BACKEND_URL }}" }
        run: |
          cd evals
          pytest playwright_tests/ \
            --html=reports/playwright/index.html \
            --self-contained-html \
            --json-report --json-report-file=reports/playwright_results.json -v || true

      - name: Run Locust
        run: |
          locust -f evals/performance/locustfile.py \
            --host=${{ secrets.BACKEND_URL }} \
            --users=50 --spawn-rate=5 --run-time=120s --headless \
            --html=evals/reports/locust/index.html \
            --csv=evals/reports/locust/results || true
          python evals/scripts/parse_locust.py

      - name: Run Lighthouse
        run: python evals/performance/lighthouse_runner.py || true

      - name: Log to MLflow
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
          MLFLOW_TRACKING_USERNAME: ${{ secrets.MLFLOW_USER }}
          MLFLOW_TRACKING_PASSWORD: ${{ secrets.MLFLOW_PASSWORD }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: python evals/scripts/log_to_mlflow.py

      - name: CI gate
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
          MLFLOW_TRACKING_USERNAME: ${{ secrets.MLFLOW_USER }}
          MLFLOW_TRACKING_PASSWORD: ${{ secrets.MLFLOW_PASSWORD }}
        run: python evals/mlflow_logger/ci_gate.py

      - name: Build dashboard
        run: python evals/scripts/build_dashboard.py

      - name: Publish to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./evals/reports
          keep_files: true
          commit_message: "ci: eval report run ${{ github.run_number }}"
```

---

## GitHub Secrets required

Configure these in repo Settings → Secrets → Actions:

| Secret | Value |
|--------|-------|
| `VPS_HOST` | VPS IP address |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Private key contents |
| `OPENAI_API_KEY` | OpenAI key |
| `MLFLOW_TRACKING_URI` | `https://mlflow.domain.com` |
| `MLFLOW_USER` | mlflow |
| `MLFLOW_PASSWORD` | MLflow basic auth password |
| `BACKEND_URL` | `https://app.domain.com` |
| `DB_USER` | mortgageeval |
| `DB_PASSWORD` | DB password |

---

## Final verification checklist

Before considering the project complete:

- [ ] `docker compose up` starts all 6 services cleanly
- [ ] `https://app.domain.com` — chat works, loan form works, upload works
- [ ] `https://test.domain.com` — scores load, trigger button works
- [ ] `https://mlflow.domain.com` — login works, "mortgageeval" experiment visible
- [ ] `https://YOUR_USERNAME.github.io/mortgageeval` — dashboard with scores loads
- [ ] GitHub Actions: deploy.yml green on push
- [ ] GitHub Actions: eval.yml green, all 5 test sections run
- [ ] `docs/findings.md` — at least 3 real findings from running the eval suite
- [ ] README leads with eval framework and all 4 live URLs

---

## Important implementation notes

1. Chunk size in ChromaDB is 512 tokens — do not change this without updating `docs/eval_decisions.md`
2. Every frontend interactive element needs `data-testid` — Playwright will break without it
3. The system prompt version tag (`v3`) must match `PROMPT_VERSION` in `prompts.py` and in MLflow logs
4. `ci_gate.py` calls `sys.exit(1)` on failure — this is intentional, it blocks GitHub Actions
5. `|| true` after each test command in eval.yml is intentional — the gate step does the blocking, not individual test runners
6. Build sections in order — do not skip ahead. Mock endpoints first, then real agent.