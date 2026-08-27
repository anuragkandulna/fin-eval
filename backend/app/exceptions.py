class AgentInvocationError(Exception):
    """Agent graph invocation failed (maps to HTTP 500)."""


class DocumentIngestError(Exception):
    """Qdrant ingest failed after file was accepted (maps to HTTP 422)."""


class UnsupportedFileTypeError(Exception):
    """Uploaded file extension is not in the allowed set (maps to HTTP 415)."""


class SessionNotFoundError(Exception):
    """Requested session_id does not exist in Neon (maps to HTTP 404)."""


class RAGRetrievalError(Exception):
    """Qdrant similarity search failed (maps to HTTP 500)."""


class GuardrailTriggeredError(Exception):
    """Guardrail node blocked or redacted the response (maps to HTTP 422)."""
