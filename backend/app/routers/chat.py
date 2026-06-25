import uuid
from fastapi import APIRouter, HTTPException
from langchain_core.messages import HumanMessage

from app.agent.graph import finance_agent
from app.config import settings
from app.models.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    trace_id = str(uuid.uuid4())
    try:
        result = await finance_agent.ainvoke({
            "user_query":       request.message,
            "session_id":       request.session_id,
            "messages":         [HumanMessage(content=request.message)],
            "flow_type":        "chat",
            "finance_input":    {},
            "document_content": "",
            "trace_id":         trace_id,
            "retrieved_docs":   [],
            "doc_sources":      [],
            "budget_result":    {},
            "debt_result":      {},
            "savings_result":   {},
            "tool_calls_made":  [],
        })

        return ChatResponse(
            response=result["final_response"],
            sources=result.get("doc_sources", []),
            tool_calls_made=result.get("tool_calls_made", []),
            trace_id=trace_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
