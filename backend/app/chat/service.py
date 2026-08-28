import json
import openai
from langchain_core.messages import HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession

from app.agent.graph import finance_agent
from app.chat.repo import ChatRepo
from app.chat.schemas import ChatRequest, ChatResponse
from app.config import settings
from app.exceptions import AgentInvocationError

try:
    import redis.asyncio as aioredis
    _redis_client: "aioredis.Redis | None" = aioredis.from_url(
        settings.redis_url, decode_responses=True
    )
except Exception:
    _redis_client = None

_CONV_TTL = 3600       # 1 hour sliding window
_CONV_MAX_MESSAGES = 20  # keep last 10 turns (user + assistant pairs)


async def _read_cache(session_id: str) -> list[dict]:
    if _redis_client is None:
        return []
    try:
        raw = await _redis_client.get(f"conv:{session_id}")
        return json.loads(raw) if raw else []
    except Exception:
        return []


async def _write_cache(session_id: str, window: list[dict]) -> None:
    if _redis_client is None:
        return
    try:
        await _redis_client.setex(
            f"conv:{session_id}", _CONV_TTL, json.dumps(window[-_CONV_MAX_MESSAGES:])
        )
    except Exception:
        pass


async def chat(request: ChatRequest, db: AsyncSession) -> ChatResponse:
    cached = await _read_cache(request.session_id)

    try:
        result = await finance_agent.ainvoke({
            "user_query":       request.message,
            "session_id":       request.session_id,
            "messages":         [HumanMessage(content=request.message)],
            "flow_type":        "chat",
            "finance_input":    {},
            "document_content": "",
            "trace_id":         "",
            "retrieved_docs":   [],
            "doc_sources":      [],
            "budget_result":    {},
            "debt_result":      {},
            "savings_result":   {},
            "tool_calls_made":  [],
        })
    except openai.APIError as exc:
        raise AgentInvocationError(f"OpenAI error: {exc}") from exc
    except Exception as exc:
        # Catches Qdrant, LangChain, LangGraph, and any other agent-layer failures.
        # Re-raised as AgentInvocationError so the router surfaces a 500 with detail.
        raise AgentInvocationError(f"Agent error: {type(exc).__name__}: {exc}") from exc

    final_response = result["final_response"]
    trace_url: str | None = None  # populated once MLflow Tracing is wired

    new_window = cached + [
        {"role": "user",      "content": request.message},
        {"role": "assistant", "content": final_response},
    ]
    await _write_cache(request.session_id, new_window)

    repo = ChatRepo(db)
    chat_session = await repo.get_or_create_session(request.session_id)
    await repo.save_message(chat_session.id, "user", request.message)
    await repo.save_message(chat_session.id, "assistant", final_response, trace_url=trace_url)
    await db.commit()

    return ChatResponse(
        response=final_response,
        sources=result.get("doc_sources", []),
        tool_calls_made=result.get("tool_calls_made", []),
        trace_url=trace_url,
        retrieved_context=result.get("retrieved_docs", []),
    )
