from langgraph.graph import StateGraph, START, END
from app.agent.state import MortgageAgentState
from app.agent.nodes import rag_node, eligibility_node, rate_node, response_node, guardrail_node


def should_run_eligibility(state: MortgageAgentState) -> str:
    if state.get("loan_input") and state.get("flow_type") == "recommend":
        return "eligibility"
    return "response"


def build_graph():
    graph = StateGraph(MortgageAgentState)

    graph.add_node("rag", rag_node)
    graph.add_node("eligibility", eligibility_node)
    graph.add_node("rate", rate_node)
    graph.add_node("response", response_node)
    graph.add_node("guardrail", guardrail_node)

    graph.add_edge(START, "rag")
    graph.add_conditional_edges(
        "rag",
        should_run_eligibility,
        {"eligibility": "eligibility", "response": "response"},
    )
    graph.add_edge("eligibility", "rate")
    graph.add_edge("rate", "response")
    graph.add_edge("response", "guardrail")
    graph.add_edge("guardrail", END)

    return graph.compile()


mortgage_agent = build_graph()
