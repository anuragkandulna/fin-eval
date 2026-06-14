from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
from app.agent.graph import mortgage_agent
from app.config import settings
from langchain_core.messages import HumanMessage
import uuid
import structlog

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
            "tool_calls_made": [],
        })

        langfuse_base = settings.langfuse_host.replace(
            "http://langfuse:3000", f"https://trace.{settings.domain}"
        )
        trace_url = f"{langfuse_base}/trace/{trace_id}" if settings.langfuse_public_key else None

        return ChatResponse(
            response=result["final_response"],
            sources=result.get("doc_sources", []),
            tool_calls_made=result.get("tool_calls_made", []),
            trace_id=trace_id,
            trace_url=trace_url,
        )
    except Exception as e:
        logger.error("chat_error", error=str(e), trace_id=trace_id)
        raise HTTPException(status_code=500, detail=str(e))
