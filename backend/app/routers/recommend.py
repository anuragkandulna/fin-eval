from fastapi import APIRouter, HTTPException
from app.models.schemas import LoanRequest, LoanResponse
from app.agent.graph import mortgage_agent
from langchain_core.messages import HumanMessage
import uuid
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/recommend", tags=["recommend"])


@router.post("", response_model=LoanResponse)
async def recommend(request: LoanRequest):
    trace_id = str(uuid.uuid4())
    loan_input = {
        "income": request.income,
        "loan_amount": request.loan_amount,
        "credit_score": request.credit_score,
        "loan_type": request.loan_type,
        "employment": request.employment,
    }
    query = (
        f"Recommend a mortgage: income={request.income}, "
        f"loan={request.loan_amount}, credit={request.credit_score}, type={request.loan_type}"
    )
    try:
        result = await mortgage_agent.ainvoke({
            "user_query": query,
            "session_id": trace_id,
            "messages": [HumanMessage(content=query)],
            "flow_type": "recommend",
            "loan_input": loan_input,
            "trace_id": trace_id,
            "retrieved_docs": [],
            "doc_sources": [],
            "eligibility_result": {},
            "rate_result": {},
            "tool_calls_made": [],
        })

        eligibility = result.get("eligibility_result", {})
        rate = result.get("rate_result", {})

        return LoanResponse(
            product=rate.get("available_products", ["Standard Mortgage"])[0],
            rate=rate.get("interest_rate", 7.5),
            eligible=eligibility.get("eligible", False),
            reasoning=result["final_response"],
            trace_id=trace_id,
        )
    except Exception as e:
        logger.error("recommend_error", error=str(e), trace_id=trace_id)
        raise HTTPException(status_code=500, detail=str(e))
