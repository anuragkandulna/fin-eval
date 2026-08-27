import mlflow
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.config import settings
from app.agent.state import FinanceAgentState
from app.agent.prompts import (
    PROMPT_VERSION,
    FINANCE_QA_SYSTEM,
    BUDGET_ANALYSIS_SYSTEM,
    DOCUMENT_SUMMARY_SYSTEM,
    GUARDRAIL_SYSTEM,
)
from app.agent.tools import budget_analyser, debt_calculator, savings_projector
from app.rag.retriever import retrieve_docs


async def rag_node(state: FinanceAgentState) -> dict:
    query = state["user_query"]
    docs, sources = await retrieve_docs(query)
    return {
        "retrieved_docs":  docs,
        "doc_sources":     sources,
        "tool_calls_made": state.get("tool_calls_made", []) + ["rag_retrieval"],
    }


async def budget_node(state: FinanceAgentState) -> dict:
    fi = state.get("finance_input", {})
    if not fi:
        return {"budget_result": {}, "tool_calls_made": state.get("tool_calls_made", [])}

    result = budget_analyser.invoke({
        "income":          fi.get("income", 0),
        "needs":           fi.get("needs", 0),
        "wants":           fi.get("wants", 0),
        "current_savings": fi.get("current_savings", 0),
        "savings_goal":    fi.get("savings_goal", 0),
    })
    return {
        "budget_result":   result,
        "tool_calls_made": state.get("tool_calls_made", []) + ["budget_analyser"],
    }


async def debt_node(state: FinanceAgentState) -> dict:
    fi = state.get("finance_input", {})
    debts = fi.get("debts", [])
    if not debts:
        return {"debt_result": {}, "tool_calls_made": state.get("tool_calls_made", [])}

    result = debt_calculator.invoke({
        "debts":           debts,
        "monthly_payment": fi.get("monthly_debt_payment", 5000),
    })
    return {
        "debt_result":     result,
        "tool_calls_made": state.get("tool_calls_made", []) + ["debt_calculator"],
    }


async def savings_node(state: FinanceAgentState) -> dict:
    fi     = state.get("finance_input", {})
    budget = state.get("budget_result", {})

    monthly = budget.get("actual_savings") or fi.get("monthly_savings", 0)
    years   = fi.get("projection_years", 10)
    rate    = fi.get("annual_return", 0.08)

    if not monthly:
        return {"savings_result": {}, "tool_calls_made": state.get("tool_calls_made", [])}

    result = savings_projector.invoke({
        "monthly_savings": monthly,
        "years":           years,
        "annual_return":   rate,
    })
    return {
        "savings_result":  result,
        "tool_calls_made": state.get("tool_calls_made", []) + ["savings_projector"],
    }


async def response_node(state: FinanceAgentState) -> dict:
    llm  = ChatOpenAI(model="gpt-4o-mini", temperature=0.2, api_key=settings.openai_api_key)
    flow = state.get("flow_type", "chat")

    if flow == "analyse":
        prompt = BUDGET_ANALYSIS_SYSTEM.format(
            budget_result=state.get("budget_result", {}),
            debt_result=state.get("debt_result", {}),
            savings_result=state.get("savings_result", {}),
            prompt_version=PROMPT_VERSION,
        )
        messages = [SystemMessage(content=prompt)]
    elif flow == "summarise":
        prompt = DOCUMENT_SUMMARY_SYSTEM.format(prompt_version=PROMPT_VERSION)
        messages = [
            SystemMessage(content=prompt),
            HumanMessage(content=state.get("document_content", "")),
        ]
    else:
        context  = "\n\n".join(state.get("retrieved_docs", []))
        prompt   = FINANCE_QA_SYSTEM.format(
            context=context or "No relevant documents found.",
            prompt_version=PROMPT_VERSION,
        )
        messages = [
            SystemMessage(content=prompt),
            HumanMessage(content=state["user_query"]),
        ]

    with mlflow.start_span(name="response_node"):
        response = await llm.ainvoke(messages)
    return {
        "final_response":  response.content,
        "tool_calls_made": state.get("tool_calls_made", []) + ["llm_response_v3"],
    }


async def guardrail_node(state: FinanceAgentState) -> dict:
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.0, api_key=settings.openai_api_key)
    messages = [
        SystemMessage(content=GUARDRAIL_SYSTEM),
        HumanMessage(content=state["final_response"]),
    ]
    with mlflow.start_span(name="guardrail_node"):
        result = await llm.ainvoke(messages)
    return {
        "final_response":  result.content,
        "tool_calls_made": state.get("tool_calls_made", []) + ["guardrail"],
    }
