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
