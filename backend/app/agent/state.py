from typing import TypedDict, Annotated
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class MortgageAgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    user_query: str
    session_id: str

    retrieved_docs: list[str]
    doc_sources: list[str]

    eligibility_result: dict
    rate_result: dict
    loan_input: dict

    final_response: str
    tool_calls_made: list[str]

    trace_id: str
    flow_type: str   # "chat" | "recommend"
