from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    context_docs: list[str] = []


class ChatResponse(BaseModel):
    response: str
    sources: list[str] = []
    tool_calls_made: list[str] = []
    trace_url: str | None = None  # null until MLflow Tracing is wired (Sprint 1.3)
    retrieved_context: list[str] = []  # actual retrieved doc chunks; used by eval FaithfulnessMetric


class ChatSessionSummary(BaseModel):
    session_id: str
    title: str    # first user message truncated to 60 chars; "New conversation" if none
    preview: str  # last assistant message truncated to 80 chars
    created_at: str
    updated_at: str


class ChatMessageOut(BaseModel):
    role: str
    content: str
    trace_url: str | None
    created_at: str
