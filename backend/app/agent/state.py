from typing import TypedDict, Annotated
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class FinanceAgentState(TypedDict):
    messages:         Annotated[list[BaseMessage], add_messages]
    user_query:       str
    session_id:       str

    retrieved_docs:   list[str]
    doc_sources:      list[str]

    budget_result:    dict
    debt_result:      dict
    savings_result:   dict

    finance_input:    dict   # income, needs, wants, debts, savings_goal, etc.
    document_content: str    # for document summariser flow

    final_response:   str
    tool_calls_made:  list[str]

    trace_id:         str
    flow_type:        str    # "chat" | "analyse" | "summarise"
