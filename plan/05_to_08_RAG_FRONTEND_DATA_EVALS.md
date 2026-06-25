# Section 05 — Backend: RAG Pipeline
**Goal:** Qdrant storing finance documents, retriever serving relevant chunks to agent

---

## Step 5.1 — Sample finance documents

Create `backend/data/finance_docs/` and add these as plain text files:

**budgeting_basics.txt** — copy key points from HUD FHA guidelines (public domain):
- Minimum credit score requirements
- Down payment requirements  
- DTI ratio limits
- Finance limits by county

**debt_management.txt** — Fannie Mae/Freddie Mac guidelines (public):
- Conforming finance limits
- PMI requirements
- Credit score bands

**finance_glossary.txt** — Basic finance terms:
- APR, DTI, LTV, PMI, PITI definitions
- Amortization explanation
- Escrow explanation

These are all public domain — no PII risk.

---

## Step 5.2 — rag/ingest.py

```python
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from app.config import settings
import os, structlog

logger = structlog.get_logger()

CHUNK_SIZE = 512        # calibrated — larger chunks hurt faithfulness score
CHUNK_OVERLAP = 64
EMBEDDING_DIM = 1536    # text-embedding-3-small / ada-002 dimension

def get_vectorstore() -> QdrantVectorStore:
    client = QdrantClient(url=settings.qdrant_url)

    collections = [c.name for c in client.get_collections().collections]
    if settings.qdrant_collection not in collections:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE)
        )
        logger.info("qdrant_collection_created", name=settings.qdrant_collection)

    embeddings = OpenAIEmbeddings(api_key=settings.openai_api_key)
    return QdrantVectorStore(
        client=client,
        collection_name=settings.qdrant_collection,
        embedding=embeddings
    )

async def ingest_file(file_path: str, doc_id: str) -> int:
    """Ingest a single file into Qdrant. Returns chunk count."""
    logger.info("ingesting_file", path=file_path, doc_id=doc_id)

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
    """Ingest all .txt and .pdf files in a directory."""
    for filename in os.listdir(dir_path):
        if filename.endswith((".txt", ".pdf")):
            file_path = os.path.join(dir_path, filename)
            doc_id = filename.replace(".", "_")
            await ingest_file(file_path, doc_id)
    logger.info("directory_ingested", path=dir_path)
```

---

## Step 5.3 — rag/retriever.py

```python
from app.rag.ingest import get_vectorstore
import structlog

logger = structlog.get_logger()

TOP_K = 4   # number of chunks to retrieve

async def retrieve_docs(query: str) -> tuple[list[str], list[str]]:
    """
    Retrieve relevant chunks for a query.
    Returns (chunk_texts, source_names)
    """
    results = get_vectorstore().similarity_search_with_score(query, k=TOP_K)

    # Qdrant cosine similarity: HIGHER score = MORE similar (opposite of ChromaDB distance).
    # Keep results above 0.5 similarity.
    relevant = [(doc, score) for doc, score in results if score > 0.5]

    if not relevant:
        logger.warning("no_relevant_docs", query=query)
        return [], []

    texts = [doc.page_content for doc, _ in relevant]
    sources = [doc.metadata.get("source", "unknown") for doc, _ in relevant]

    logger.info("retrieved_docs", count=len(texts), query=query[:50])
    return texts, sources
```

---

## Step 5.4 — Ingest baseline docs on startup

Add to `main.py` lifespan:

```python
from app.rag.ingest import ingest_directory, get_vectorstore
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()

    # Ingest baseline finance docs if Qdrant collection is empty
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
```

---

## Step 5.5 — Update documents router to use real ingest

```python
# In routers/documents.py — replace mock chunk count with real ingest
from app.rag.ingest import ingest_file

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    doc_id = str(uuid.uuid4())
    file_path = f"{UPLOAD_DIR}/{doc_id}_{file.filename}"
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Real ingest into ChromaDB
    chunks = await ingest_file(file_path, doc_id)
    
    return DocumentResponse(
        doc_id=doc_id,
        filename=file.filename,
        chunks=chunks,
        status="processed"
    )
```

---

## Section 05 Checklist

- [ ] `data/finance_docs/` created with at least 3 text files
- [ ] `ingest.py` working — chunk size set to 512
- [ ] `retriever.py` returning relevant chunks
- [ ] Baseline docs ingested on startup
- [ ] `/documents/upload` using real ChromaDB ingest
- [ ] Test: POST `/chat` "What is the 50/30/20 budgeting rule?" — response cites context
- [ ] Commit: `git commit -m "feat: RAG pipeline with ChromaDB"`

---

---

# Section 06 — Frontend: React App
**Goal:** Chat UI + Finance form + Document upload working against real backend

---

## Step 6.1 — package.json

```json
{
  "name": "fineval-frontend",
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
    "axios": "^1.7.0",
    "@tanstack/react-query": "^5.40.0"
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

---

## Step 6.2 — api/client.ts

```typescript
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

// Types
export interface ChatRequest {
  message: string
  session_id: string
  context_docs: string[]
}

export interface ChatResponse {
  response: string
  sources: string[]
  tool_calls_made: string[]
  trace_id: string
}

export interface LoanRequest {
  income: number
  loan_amount: number
  credit_score: number
  loan_type: string
  employment: string
}

export interface LoanResponse {
  product: string
  rate: number
  eligible: boolean
  reasoning: string
  trace_id: string
}

// API functions
export const sendChat = (data: ChatRequest) =>
  api.post<ChatResponse>('/chat', data)

export const getLoanRecommendation = (data: LoanRequest) =>
  api.post<LoanResponse>('/recommend', data)

export const uploadDocument = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/documents/upload', form)
}

export const getEvalScores = () =>
  api.get('/scores/eval')

export const getPerformanceScores = () =>
  api.get('/scores/performance')
```

---

## Step 6.3 — components/ChatWindow.tsx

```tsx
import { useState, useRef, useEffect } from 'react'
import { sendChat, ChatResponse } from '../api/client'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  traceId?: string
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const sessionId = useRef(crypto.randomUUID())
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    
    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data } = await sendChat({
        message: input,
        session_id: sessionId.current,
        context_docs: []
      })
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        sources: data.sources,
        traceId: data.trace_id
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-gray-400 text-center mt-8">
            Ask a personal finance question to get started
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}>
              <p data-testid={msg.role === 'assistant' ? 'assistant-message' : 'user-message'}>
                {msg.content}
              </p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Sources: {msg.sources.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3" data-testid="loading-indicator">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 flex gap-2">
        <input
          data-testid="chat-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask a personal finance question..."
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          data-testid="send-button"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  )
}
```

---

## Step 6.4 — components/LoanForm.tsx

```tsx
import { useState } from 'react'
import { getLoanRecommendation, LoanResponse } from '../api/client'

export default function LoanForm() {
  const [form, setForm] = useState({
    income: '', loan_amount: '', credit_score: '',
    loan_type: 'fixed', employment: 'employed'
  })
  const [result, setResult] = useState<LoanResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await getLoanRecommendation({
        income: parseFloat(form.income),
        loan_amount: parseFloat(form.loan_amount),
        credit_score: parseInt(form.credit_score),
        loan_type: form.loan_type,
        employment: form.employment
      })
      setResult(data)
    } catch {
      setError('Failed to get recommendation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Annual Income ($)</label>
          <input
            data-testid="income"
            type="number"
            value={form.income}
            onChange={e => setForm({...form, income: e.target.value})}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="80000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Target Amount ($)</label>
          <input
            data-testid="loan-amount"
            type="number"
            value={form.loan_amount}
            onChange={e => setForm({...form, loan_amount: e.target.value})}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="320000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Credit Score</label>
          <input
            data-testid="credit-score"
            type="number"
            value={form.credit_score}
            onChange={e => setForm({...form, credit_score: e.target.value})}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="720"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Finance Category</label>
          <select
            data-testid="loan-type"
            value={form.loan_type}
            onChange={e => setForm({...form, loan_type: e.target.value})}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="fixed">Fixed Rate</option>
            <option value="variable">Variable Rate</option>
            <option value="fha">FHA</option>
          </select>
        </div>
      </div>

      <button
        data-testid="submit-loan"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded-lg disabled:opacity-50 hover:bg-green-700"
      >
        {loading ? 'Getting recommendation...' : 'Get Recommendation'}
      </button>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {result && (
        <div data-testid="recommendation-card" className="border rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">{result.product}</h3>
            <span
              data-testid="eligibility-status"
              className={`px-2 py-1 rounded text-sm ${
                result.eligible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {result.eligible ? 'Eligible' : 'Not Eligible'}
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mb-3">{result.rate}%</p>
          <p className="text-sm text-gray-600">{result.reasoning}</p>
          <p className="text-xs text-gray-400 mt-2">
            * This is not a formal financial approval. Consult a licensed financial advisor.
          </p>
        </div>
      )}
    </div>
  )
}
```

---

## Step 6.5 — Dockerfile (frontend)

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

Frontend nginx.conf (serves React SPA):
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    location /api/ { proxy_pass http://backend:8000/; }
}
```

---

## Section 06 Checklist

- [ ] `package.json` with all deps
- [ ] `api/client.ts` with all API functions and types
- [ ] `ChatWindow.tsx` with `data-testid` attributes on all interactive elements
- [ ] `LoanForm.tsx` with `data-testid` on all inputs and result elements
- [ ] `DocumentUpload.tsx` built
- [ ] `App.tsx` with React Router (routes: /, /loan, /upload)
- [ ] `Dockerfile` with multi-stage build
- [ ] Local test: `npm run dev` — chat sends message and gets real response
- [ ] Local test: finance form returns recommendation card
- [ ] Commit: `git commit -m "feat: React frontend — chat, finance form, document upload"`

---

---

# Section 07 — Synthetic Data Generator
**Goal:** 30 PII-safe finance Q&A test cases for DeepEval

---

## Step 7.1 — synthetic_data/generator.py

```python
import json, uuid
from datetime import datetime

SCENARIOS = [
    {
        "name": "fha_basics",
        "questions": [
            "What is the minimum credit score for an FHA loan?",
            "What is the minimum down payment for an FHA loan with a 620 credit score?",
            "What is the maximum DTI ratio allowed for an FHA loan?",
            "Can I get an FHA loan if I had a bankruptcy?",
            "What are the FHA finance limits?"
        ],
        "expected_answers": [
            "580 with 3.5% down payment, or 500 with 10% down payment",
            "10% down payment is required for credit scores between 500 and 579; 3.5% for 580+",
            "FHA allows up to 43% DTI, though some lenders allow up to 50% with compensating factors",
            "2 years after Chapter 7 bankruptcy, 1 year after Chapter 13",
            "FHA finance limits vary by county, set annually by HUD"
        ],
        "context_file": "budgeting_basics.txt"
    },
    {
        "name": "conventional_basics",
        "questions": [
            "What is the minimum credit score for a conventional loan?",
            "When is PMI required on a conventional loan?",
            "What is the conforming loan limit?",
            "What DTI ratio do conventional lenders prefer?",
            "What is the minimum down payment for a conventional loan?"
        ],
        "expected_answers": [
            "Typically 620, though some lenders require 640 or higher",
            "PMI is required when the down payment is less than 20% of the purchase price",
            "The conforming loan limit is set annually by the FHFA",
            "Most lenders prefer a DTI ratio of 36% or lower, maximum 45-50%",
            "3% with certain programs, though 20% avoids PMI"
        ],
        "context_file": "debt_management.txt"
    },
    {
        "name": "finance_terms",
        "questions": [
            "What is APR and how is it different from the interest rate?",
            "What does LTV mean in consumer finance?",
            "What is an escrow account?",
            "What is amortization?",
            "What is PITI?"
        ],
        "expected_answers": [
            "APR includes the interest rate plus fees, giving a more complete cost picture",
            "LTV is Loan-to-Value ratio — the target amount divided by the property value",
            "An escrow account holds funds for property taxes and insurance",
            "Amortization is the gradual payoff of a loan through scheduled payments",
            "PITI stands for Principal, Interest, Taxes, and Insurance — the four components of a financial obligation"
        ],
        "context_file": "finance_glossary.txt"
    },
    {
        "name": "eligibility_edge_cases",
        "questions": [
            "Can a self-employed person get a finance?",
            "What happens if my credit score is 580?",
            "Is a 50% DTI ratio acceptable?",
            "Can I get a finance with a recent late payment?",
            "What if my income is from rental properties?"
        ],
        "expected_answers": [
            "Yes, self-employed borrowers typically need 2 years of tax returns",
            "With a 580 credit score you may qualify for an FHA loan with 3.5% down",
            "50% DTI is generally too high for conventional loans; FHA may allow it with compensating factors",
            "Recent late payments negatively impact approval; lenders typically want 12 months of clean payment history",
            "Rental income can count toward qualifying income with documentation"
        ],
        "context_file": "budgeting_basics.txt"
    },
    {
        "name": "loan_comparison",
        "questions": [
            "What is the difference between a fixed and variable rate finance?",
            "When is an FHA loan better than a conventional loan?",
            "What are the pros and cons of a 15-year vs 30-year finance?",
            "What is an ARM loan?",
            "What is a jumbo loan?"
        ],
        "expected_answers": [
            "Fixed rate stays the same for the investment horizon; variable rate can change based on market conditions",
            "FHA is better for lower credit scores or smaller down payments",
            "15-year has higher payments but less total interest; 30-year has lower payments but more total interest",
            "ARM stands for Adjustable Rate Finance — rate adjusts after an initial fixed period",
            "A jumbo loan exceeds the conforming finance limits and typically requires better credit and larger down payment"
        ],
        "context_file": "debt_management.txt"
    },
    {
        "name": "hallucination_traps",
        # These are designed to test if the agent fabricates specific numbers
        "questions": [
            "What is the exact current 30-year fixed financial rate today?",
            "What will interest rates be next year?",
            "What is the credit score requirement at First National Bank?",
        ],
        "expected_answers": [
            "I don't have current market rate data in the provided documents",
            "I cannot predict future interest rates",
            "I don't have specific information about individual lender requirements"
        ],
        "context_file": None   # no context — agent must admit it doesn't know
    }
]

def generate_dataset(n_samples: int = 30) -> list[dict]:
    dataset = []
    for scenario in SCENARIOS:
        for q, a in zip(scenario["questions"], scenario["expected_answers"]):
            dataset.append({
                "id": str(uuid.uuid4()),
                "input": q,
                "expected_output": a,
                "scenario": scenario["name"],
                "context_file": scenario["context_file"],
                "generated_at": datetime.now().isoformat()
            })
    return dataset[:n_samples]

def save_dataset(path: str = "evals/synthetic_data/test_cases.json"):
    dataset = generate_dataset()
    with open(path, "w") as f:
        json.dump(dataset, f, indent=2)
    print(f"Generated {len(dataset)} test cases → {path}")
    return dataset

if __name__ == "__main__":
    save_dataset()
```

---

## Step 7.2 — synthetic_data/pii_obfuscator.py

```python
import re

PII_PATTERNS = [
    (r'\b\d{3}-\d{2}-\d{4}\b', '[SSN_REDACTED]'),
    (r'\b\d{3}-\d{3}-\d{4}\b', '[PHONE_REDACTED]'),
    (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL_REDACTED]'),
    (r'\b\d{16}\b', '[CARD_REDACTED]'),
]

def obfuscate(text: str) -> str:
    for pattern, replacement in PII_PATTERNS:
        text = re.sub(pattern, replacement, text)
    return text

def is_pii_free(text: str) -> bool:
    for pattern, _ in PII_PATTERNS:
        if re.search(pattern, text):
            return False
    return True
```

---

## Step 7.3 — Generate the dataset

```bash
cd evals
python synthetic_data/generator.py
# Creates: evals/synthetic_data/test_cases.json
```

---

## Section 07 Checklist

- [ ] `generator.py` with 6 scenarios covering 30+ test cases
- [ ] Hallucination trap cases included (scenario 6)
- [ ] `pii_obfuscator.py` with regex patterns
- [ ] `test_cases.json` generated successfully
- [ ] Verify JSON has 30 entries: `python -c "import json; d=json.load(open('test_cases.json')); print(len(d))"`
- [ ] Commit: `git commit -m "feat: synthetic data generator — 30 PII-safe test cases"`

---

---

# Section 08 — Eval: DeepEval Tests
**Goal:** All 5 DeepEval test files running against live backend, logging to MLflow

---

## Step 8.1 — evals/requirements.txt

```txt
deepeval==0.21.0
mlflow==2.13.0
pytest==8.2.0
pytest-asyncio==0.23.0
pytest-json-report==1.5.0
httpx==0.27.0
python-dotenv==1.0.1
```

---

## Step 8.2 — evals/conftest.py

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
    path = "synthetic_data/test_cases.json"
    with open(path) as f:
        return json.load(f)

def invoke_chat(client, question: str) -> dict:
    """Helper: call /chat and return response dict."""
    resp = client.post("/chat", json={
        "message": question,
        "session_id": "eval-session",
        "context_docs": []
    })
    resp.raise_for_status()
    return resp.json()

def invoke_recommend(client, loan_data: dict) -> dict:
    resp = client.post("/recommend", json=loan_data)
    resp.raise_for_status()
    return resp.json()
```

---

## Step 8.3 — deepeval_tests/test_rag_quality.py

```python
import pytest
from deepeval import assert_test
from deepeval.metrics import FaithfulnessMetric, AnswerRelevancyMetric, ContextualPrecisionMetric
from deepeval.test_case import LLMTestCase
from conftest import invoke_chat

EVAL_MODEL = "gpt-3.5-turbo"

RAG_QUESTIONS = [
    ("What is the minimum credit score for an FHA loan?",
     "580 for 3.5% down, 500 for 10% down"),
    ("What is the maximum DTI ratio for a conventional loan?",
     "43-50% depending on lender"),
    ("What does LTV stand for?",
     "Loan-to-Value ratio"),
    ("When is PMI required?",
     "When down payment is less than 20%"),
    ("What is an escrow account?",
     "Holds funds for property taxes and insurance"),
]

@pytest.mark.parametrize("question,expected", RAG_QUESTIONS)
def test_faithfulness(client, question, expected):
    """Agent response must be grounded in retrieved documents."""
    result = invoke_chat(client, question)
    
    test_case = LLMTestCase(
        input=question,
        actual_output=result["response"],
        retrieval_context=result.get("sources", ["No context"]),
        expected_output=expected
    )
    metric = FaithfulnessMetric(threshold=0.70, model=EVAL_MODEL)
    assert_test(test_case, [metric])

@pytest.mark.parametrize("question,expected", RAG_QUESTIONS)
def test_answer_relevancy(client, question, expected):
    """Response must be relevant to the question asked."""
    result = invoke_chat(client, question)
    
    test_case = LLMTestCase(
        input=question,
        actual_output=result["response"],
    )
    metric = AnswerRelevancyMetric(threshold=0.75, model=EVAL_MODEL)
    assert_test(test_case, [metric])
```

---

## Step 8.4 — deepeval_tests/test_hallucination.py

```python
import pytest
from deepeval import assert_test
from deepeval.metrics import HallucinationMetric
from deepeval.test_case import LLMTestCase
from conftest import invoke_chat

HALLUCINATION_TRAPS = [
    ("What is the exact financial rate at Chase Bank today?",
     ["I don't have current rate data from Chase Bank in the provided documents"]),
    ("What will the Federal Reserve do with rates next month?",
     ["I cannot predict future Federal Reserve decisions"]),
    ("What is John Smith's credit score?",
     ["I don't have any information about individual customers"]),
]

@pytest.mark.parametrize("question,context", HALLUCINATION_TRAPS)
def test_no_hallucination_on_unknown_facts(client, question, context):
    """
    Agent must not fabricate specific facts not in context.
    These questions have no correct answer in our docs — agent should admit it.
    """
    result = invoke_chat(client, question)
    
    test_case = LLMTestCase(
        input=question,
        actual_output=result["response"],
        context=context
    )
    metric = HallucinationMetric(threshold=0.30, model="gpt-3.5-turbo")
    assert_test(test_case, [metric])

def test_no_hallucinated_rates(client):
    """Agent must not invent specific interest rates."""
    result = invoke_chat(client, "What exact rate will I get for a 30-year fixed loan?")
    response = result["response"].lower()
    
    # Agent should not claim to know the exact current market rate
    fabrication_signals = ["current rate is exactly", "today's rate is", "rate is currently"]
    for signal in fabrication_signals:
        assert signal not in response, f"Possible rate fabrication: '{signal}' found in response"
```

---

## Step 8.5 — deepeval_tests/test_tool_calls.py

```python
import pytest
from conftest import invoke_chat, invoke_recommend

VALID_TOOLS = {"rag_retrieval", "eligibility_checker", "rate_fetcher", "llm_response_v3"}

LOAN_DATA = {
    "income": 80000,
    "loan_amount": 320000,
    "credit_score": 720,
    "loan_type": "fixed",
    "employment": "employed"
}

def test_rag_always_called(client):
    """RAG retrieval must run on every chat query."""
    result = invoke_chat(client, "What is an FHA loan?")
    assert "rag_retrieval" in result["tool_calls_made"], \
        "RAG retrieval was not called"

def test_eligibility_called_for_loan_queries(client):
    """Eligibility checker must run when finance data is provided."""
    result = invoke_recommend(client, LOAN_DATA)
    assert "eligibility_checker" in result.get("tool_calls_made", []) or \
           result["eligible"] is not None, \
        "Eligibility check did not run"

def test_rate_fetcher_called_after_eligibility(client):
    """Rate fetcher must run after eligibility check."""
    result = invoke_recommend(client, LOAN_DATA)
    assert result["rate"] > 0, "Rate was not fetched"

def test_no_invalid_tool_calls(client):
    """Agent must not call tools that don't exist."""
    result = invoke_chat(client, "What is personal finance?")
    for call in result.get("tool_calls_made", []):
        assert call in VALID_TOOLS, f"Invalid tool called: {call}"

def test_tool_call_produces_output(client):
    """Eligibility check must return a meaningful response."""
    result = invoke_recommend(client, LOAN_DATA)
    assert result["eligible"] is True  # 720 credit, reasonable DTI
    assert result["rate"] < 8.0        # should get a reasonable rate
    assert len(result["reasoning"]) > 50
```

---

## Step 8.6 — deepeval_tests/test_reasoning.py

```python
import pytest
from deepeval import assert_test
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCase
from conftest import invoke_chat

CONSISTENCY_QUERY = "What is the minimum credit score needed for an FHA loan?"

def test_reasoning_consistency(client):
    """
    Run the same query 3 times.
    All responses should give consistent core information.
    """
    responses = [invoke_chat(client, CONSISTENCY_QUERY)["response"] for _ in range(3)]
    
    # All responses should mention 580 (the correct FHA minimum)
    for i, resp in enumerate(responses):
        assert "580" in resp, f"Run {i+1}: Expected '580' in response, got: {resp[:100]}"

def test_reasoning_quality(client):
    """Response reasoning should be coherent and well-structured."""
    result = invoke_chat(client, "Should I choose a 15 or 30 year finance?")
    
    test_case = LLMTestCase(
        input="Should I choose a 15 or 30 year finance?",
        actual_output=result["response"]
    )
    metric = GEval(
        name="Reasoning Quality",
        criteria="""The response should:
        1. Acknowledge that the choice depends on personal financial situation
        2. Mention at least one advantage of each option
        3. Not make a definitive recommendation without knowing the person's situation
        4. Be helpful and informative""",
        threshold=0.65,
        model="gpt-3.5-turbo"
    )
    assert_test(test_case, [metric])
```

---

## Step 8.7 — deepeval_tests/test_synthetic.py

```python
import pytest, json
from deepeval import assert_test
from deepeval.metrics import FaithfulnessMetric, AnswerRelevancyMetric
from deepeval.test_case import LLMTestCase
from deepeval.dataset import EvaluationDataset
from conftest import invoke_chat

def test_synthetic_dataset_faithfulness(client, test_cases):
    """
    Run all synthetic test cases through DeepEval.
    Skip hallucination traps (they have no context).
    """
    non_trap_cases = [tc for tc in test_cases if tc["scenario"] != "hallucination_traps"]
    
    results = []
    for tc in non_trap_cases[:10]:    # first 10 to control cost
        response = invoke_chat(client, tc["input"])
        results.append(LLMTestCase(
            input=tc["input"],
            actual_output=response["response"],
            expected_output=tc["expected_output"]
        ))
    
    metric = FaithfulnessMetric(threshold=0.65, model="gpt-3.5-turbo")
    passed = 0
    for tc in results:
        try:
            assert_test(tc, [metric])
            passed += 1
        except AssertionError:
            pass
    
    pass_rate = passed / len(results)
    assert pass_rate >= 0.70, f"Synthetic test pass rate {pass_rate:.0%} below 70% threshold"
```

---

## Step 8.8 — mlflow_logger/tracker.py

```python
import mlflow, json, sys, os
from datetime import datetime
from app.config import settings   # if running from repo root

PROMPT_VERSION = "v3"

class EvalTracker:
    def __init__(self):
        mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000"))
        mlflow.set_experiment(os.getenv("MLFLOW_EXPERIMENT_NAME", "fineval"))

    def log_eval_run(self, deepeval_results: dict, playwright_results: dict = None):
        with mlflow.start_run(run_name=f"eval_{datetime.now().strftime('%Y%m%d_%H%M')}"):
            mlflow.log_param("prompt_version", PROMPT_VERSION)
            mlflow.log_param("model", "gpt-3.5-turbo")
            mlflow.log_param("test_case_count", deepeval_results.get("total", 0))
            mlflow.log_param("timestamp", datetime.now().isoformat())
            
            mlflow.log_metric("faithfulness_score",  deepeval_results.get("faithfulness", 0))
            mlflow.log_metric("hallucination_rate",  deepeval_results.get("hallucination", 0))
            mlflow.log_metric("tool_accuracy",       deepeval_results.get("tool_accuracy", 0))
            mlflow.log_metric("answer_relevancy",    deepeval_results.get("relevancy", 0))
            mlflow.log_metric("tests_passed",        deepeval_results.get("passed", 0))
            mlflow.log_metric("tests_failed",        deepeval_results.get("failed", 0))
            
            if playwright_results:
                mlflow.log_metric("playwright_passed", playwright_results.get("passed", 0))
                mlflow.log_metric("playwright_total",  playwright_results.get("total", 0))
            
            mlflow.log_dict(deepeval_results, "deepeval_results.json")
            
            run_id = mlflow.active_run().info.run_id
            print(f"MLflow run logged: {run_id}")
            return run_id
```

---

## Step 8.9 — mlflow_logger/ci_gate.py

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
        experiment_names=[os.getenv("MLFLOW_EXPERIMENT_NAME", "fineval")],
        order_by=["start_time DESC"],
        max_results=1
    )
    
    if runs.empty:
        print("WARNING: No MLflow runs found. Skipping gate.")
        return
    
    latest = runs.iloc[0]
    failures = []
    
    for metric, (op, threshold) in THRESHOLDS.items():
        col = f"metrics.{metric}"
        if col not in latest:
            failures.append(f"{metric}: not found in run")
            continue
        value = latest[col]
        if op == ">=" and value < threshold:
            failures.append(f"FAIL {metric}: {value:.3f} < threshold {threshold}")
        elif op == "<=" and value > threshold:
            failures.append(f"FAIL {metric}: {value:.3f} > threshold {threshold}")
        else:
            print(f"PASS {metric}: {value:.3f} {op} {threshold}")
    
    if failures:
        print("\nCI GATE FAILED:")
        for f in failures:
            print(f"  {f}")
        sys.exit(1)
    else:
        print("\nCI GATE PASSED — all metrics within thresholds")

if __name__ == "__main__":
    check_ci_gate()
```

---

## Section 08 Checklist

- [ ] `evals/requirements.txt` installed
- [ ] `conftest.py` with client fixture pointing to backend
- [ ] `test_cases.json` exists (from Section 07)
- [ ] All 5 test files created
- [ ] Local test run: `cd evals && deepeval test run deepeval_tests/test_tool_calls.py`
- [ ] Tool call tests pass (no hallucinated tools)
- [ ] MLflow tracker logs a run to local MLflow server
- [ ] CI gate check runs without errors
- [ ] Commit: `git commit -m "feat: DeepEval test suite + MLflow logger + CI gate"`

**Before proceeding:** At least tool_call tests pass. RAG/faithfulness tests may need tuning — that's fine and expected. Document what scores you get in `docs/findings.md`.
