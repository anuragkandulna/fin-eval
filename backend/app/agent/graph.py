from langgraph.graph import StateGraph, START, END
from app.agent.state import FinanceAgentState
from app.agent.nodes import (
    rag_node,
    budget_node,
    debt_node,
    savings_node,
    response_node,
    guardrail_node,
)


def _route_after_rag(state: FinanceAgentState) -> str:
    if state.get("finance_input") and state.get("flow_type") == "analyse":
        return "budget"
    if state.get("flow_type") == "summarise":
        return "response"
    return "response"


def _route_after_budget(state: FinanceAgentState) -> str:
    fi = state.get("finance_input", {})
    if fi.get("debts"):
        return "debt"
    if fi.get("monthly_savings") or state.get("budget_result", {}).get("actual_savings"):
        return "savings"
    return "response"


def _route_after_debt(state: FinanceAgentState) -> str:
    fi = state.get("finance_input", {})
    if fi.get("monthly_savings") or state.get("budget_result", {}).get("actual_savings"):
        return "savings"
    return "response"


def build_graph():
    graph = StateGraph(FinanceAgentState)

    graph.add_node("rag",      rag_node)
    graph.add_node("budget",   budget_node)
    graph.add_node("debt",     debt_node)
    graph.add_node("savings",  savings_node)
    graph.add_node("response", response_node)
    graph.add_node("guardrail", guardrail_node)

    graph.add_edge(START, "rag")
    graph.add_conditional_edges(
        "rag",
        _route_after_rag,
        {"budget": "budget", "response": "response"},
    )
    graph.add_conditional_edges(
        "budget",
        _route_after_budget,
        {"debt": "debt", "savings": "savings", "response": "response"},
    )
    graph.add_conditional_edges(
        "debt",
        _route_after_debt,
        {"savings": "savings", "response": "response"},
    )
    graph.add_edge("savings",  "response")
    graph.add_edge("response", "guardrail")
    graph.add_edge("guardrail", END)

    return graph.compile()


finance_agent = build_graph()
