import uuid
from fastapi import APIRouter, HTTPException
from langchain_core.messages import HumanMessage

from app.agent.graph import finance_agent
from app.config import settings
from app.models.schemas import AnalyseRequest, AnalyseResponse

router = APIRouter(prefix="/analyse", tags=["analyse"])


@router.post("", response_model=AnalyseResponse)
async def analyse(request: AnalyseRequest):
    trace_id = str(uuid.uuid4())
    try:
        finance_input = {
            "income":               request.income,
            "needs":                request.needs,
            "wants":                request.wants,
            "current_savings":      request.current_savings,
            "savings_goal":         request.savings_goal,
            "debts":                [d.model_dump() for d in request.debts],
            "monthly_debt_payment": request.monthly_debt_payment,
            "projection_years":     request.projection_years,
            "annual_return":        request.annual_return,
        }

        result = await finance_agent.ainvoke({
            "user_query":       "Analyse my budget and financial health",
            "session_id":       request.session_id,
            "messages":         [HumanMessage(content="Analyse my budget and financial health")],
            "flow_type":        "analyse",
            "finance_input":    finance_input,
            "document_content": "",
            "trace_id":         trace_id,
            "retrieved_docs":   [],
            "doc_sources":      [],
            "budget_result":    {},
            "debt_result":      {},
            "savings_result":   {},
            "tool_calls_made":  [],
        })

        langfuse_base = settings.langfuse_host.replace(
            "http://langfuse:3000", f"https://trace.{settings.domain}"
        )
        trace_url = f"{langfuse_base}/trace/{trace_id}" if settings.langfuse_public_key else None

        budget  = result.get("budget_result",  {})
        savings = result.get("savings_result", {})

        return AnalyseResponse(
            response=result["final_response"],
            health_score=budget.get("health_score"),
            health_label=budget.get("health_label"),
            actual_savings=budget.get("actual_savings"),
            surplus_deficit=budget.get("surplus_deficit"),
            projected_value=savings.get("projected_value"),
            tool_calls_made=result.get("tool_calls_made", []),
            trace_id=trace_id,
            trace_url=trace_url,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
