# FinEval API Endpoints

> Status: **not yet wired in the frontend** — all frontend API calls use stub/mock data.
> Connect by replacing stubs in `frontend/src/components/ChatPanel.tsx` and `frontend/src/pages/Documents.tsx`.
>
> Base URL (dev): `http://localhost:8000`
> Base URL (prod): proxied via Nginx at `/`

---

## Chat

### `POST /chat`

Send a user message to the LangGraph RAG agent. Returns an AI-generated financial response with source citations.

**Request**

```json
{
  "message": "Why is my savings rate only 18%?",
  "session_id": "session-1-1717200000000",
  "context_docs": []
}
```

| Field         | Type       | Required | Description |
|---------------|------------|----------|-------------|
| `message`     | `string`   | yes      | User's natural-language question |
| `session_id`  | `string`   | yes      | Opaque session identifier — use a stable per-session UUID |
| `context_docs`| `string[]` | no       | Doc IDs to restrict retrieval scope (empty = all docs) |

**Response `200`**

```json
{
  "response": "Your wants category at 24% is eating into savings...",
  "sources": ["budgeting_basics.txt", "india_finance_basics.txt"],
  "tool_calls_made": ["rag_retrieve", "guardrail"],
  "trace_id": "abc123",
  "trace_url": "https://cloud.langfuse.com/trace/abc123"
}
```

| Field             | Type            | Description |
|-------------------|-----------------|-------------|
| `response`        | `string`        | Guardrail-sanitised AI response |
| `sources`         | `string[]`      | Filenames used in retrieval |
| `tool_calls_made` | `string[]`      | LangGraph nodes executed |
| `trace_id`        | `string`        | Langfuse trace ID |
| `trace_url`       | `string \| null`| Deep link to Langfuse trace |

**Frontend stub location**: `frontend/src/components/ChatPanel.tsx` → `mockSend()`

---

## Budget Analysis

### `POST /analyse`

Run the full analysis flow: budget calculation → optional debt/savings projections → LLM summary.

**Request**

```json
{
  "income": 80000,
  "needs": 38400,
  "wants": 19200,
  "current_savings": 14400,
  "savings_goal": 16000,
  "debts": [{ "name": "credit_card", "balance": 45000, "rate": 0.36 }],
  "monthly_debt_payment": 5000,
  "projection_years": 10,
  "annual_return": 0.08,
  "session_id": "session-1-1717200000000"
}
```

**Response `200`**

```json
{
  "response": "Your health score is 74...",
  "health_score": 74,
  "health_label": "good",
  "actual_savings": 14400,
  "surplus_deficit": -1600,
  "projected_value": 2613000,
  "tool_calls_made": ["rag_retrieve", "budget_analyser", "savings_projector", "guardrail"],
  "trace_id": "def456",
  "trace_url": null
}
```

---

## Documents

### `GET /documents`

List all documents in the Qdrant knowledge base.

**Response `200`**

```json
[
  {
    "doc_id": "f3a1b2c4",
    "filename": "budgeting_basics.txt",
    "status": "indexed",
    "chunks": 48,
    "size_bytes": 18842,
    "collection": "finance_docs",
    "created_at": "2026-06-30T10:00:00Z"
  }
]
```

---

### `POST /documents/upload`

Upload and index a financial document.

**Request**: `multipart/form-data`

| Field  | Type   | Required | Description |
|--------|--------|----------|-------------|
| `file` | binary | yes      | `.pdf`, `.txt`, `.md`, `.docx`, or `.csv` — max 10 MB |

**Response `200`**

```json
{
  "doc_id": "f3a1b2c4",
  "filename": "salary_slip_june.pdf",
  "chunks": 12,
  "status": "indexed"
}
```

**Error `422`** — unsupported file type or size exceeded.

**Frontend stub location**: `frontend/src/pages/Documents.tsx` → `stubUpload()`

> Note: Qdrant writes use `wait=True` — the response is returned only after indexing is complete.

---

### `GET /documents/{doc_id}`

Get metadata and eval coverage for a single document.

**Response `200`**

```json
{
  "doc_id": "f3a1b2c4",
  "filename": "budgeting_basics.txt",
  "status": "indexed",
  "chunks": 48,
  "chunk_size": 512,
  "overlap": 64,
  "embedding": "text-embedding-3-small",
  "collection": "finance_docs",
  "size_bytes": 18842,
  "created_at": "2026-06-30T10:00:00Z",
  "eval": {
    "test_cases": 14,
    "faithfulness": 0.82,
    "retrieval_hits_pct": 91
  }
}
```

---

### `DELETE /documents/{doc_id}`

Remove a document from the Qdrant collection.

**Response `200`**

```json
{ "deleted": true, "doc_id": "f3a1b2c4" }
```

---

### `POST /documents/{doc_id}/reindex`

Re-chunk and re-embed an existing document (e.g. after a chunk-size change).

**Response `200`**

```json
{ "doc_id": "f3a1b2c4", "chunks": 48, "status": "indexed" }
```

---

## Health

### `GET /health`

Liveness probe. Returns `200` when FastAPI is running and Qdrant/Neon connections are healthy.

**Response `200`**

```json
{ "status": "ok", "qdrant": "connected", "db": "connected" }
```

---

## Error format

All errors use the FastAPI default:

```json
{ "detail": "Human-readable error message" }
```

HTTP status codes follow REST conventions: `400` bad input, `404` not found, `422` validation, `500` server error.
