from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langfuse.callback import CallbackHandler
from app.agent.state import MortgageAgentState
from app.agent.prompts import (
    MORTGAGE_QA_SYSTEM,
    LOAN_RECOMMENDATION_SYSTEM,
    GUARDRAIL_SYSTEM,
    PROMPT_VERSION,
)
from app.agent.tools import eligibility_checker, rate_fetcher
from app.rag.retriever import retrieve_docs
from app.config import settings
import structlog

logger = structlog.get_logger()
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0, api_key=settings.openai_api_key)


def _langfuse_handler(state: MortgageAgentState) -> CallbackHandler | None:
    if not settings.langfuse_public_key:
        return None
    return CallbackHandler(
        public_key=settings.langfuse_public_key,
        secret_key=settings.langfuse_secret_key,
        host=settings.langfuse_host,
        trace_id=state["trace_id"],
        session_id=state["session_id"],
        metadata={
            "flow_type": state.get("flow_type", "chat"),
            "prompt_version": PROMPT_VERSION,
        },
    )


def _invoke_config(state: MortgageAgentState) -> dict:
    handler = _langfuse_handler(state)
    if handler:
        return {"callbacks": [handler]}
    return {}


async def rag_node(state: MortgageAgentState) -> dict:
    logger.info("rag_node", query=state["user_query"])
    docs, sources = await retrieve_docs(state["user_query"])
    return {
        "retrieved_docs": docs,
        "doc_sources": sources,
        "tool_calls_made": state.get("tool_calls_made", []) + ["rag_retrieval"],
    }


async def eligibility_node(state: MortgageAgentState) -> dict:
    loan_input = state.get("loan_input", {})
    if not loan_input:
        return {
            "eligibility_result": {},
            "tool_calls_made": state.get("tool_calls_made", []),
        }
    logger.info("eligibility_node", loan_input=loan_input)
    result = eligibility_checker.invoke(loan_input)
    return {
        "eligibility_result": result,
        "tool_calls_made": state.get("tool_calls_made", []) + ["eligibility_checker"],
    }


async def rate_node(state: MortgageAgentState) -> dict:
    eligibility = state.get("eligibility_result", {})
    loan_input = state.get("loan_input", {})
    if not eligibility or not loan_input:
        return {
            "rate_result": {},
            "tool_calls_made": state.get("tool_calls_made", []),
        }
    result = rate_fetcher.invoke({
        "loan_type": loan_input.get("loan_type", "fixed"),
        "credit_band": eligibility.get("credit_band", "fair"),
    })
    return {
        "rate_result": result,
        "tool_calls_made": state.get("tool_calls_made", []) + ["rate_fetcher"],
    }


async def response_node(state: MortgageAgentState) -> dict:
    flow_type = state.get("flow_type", "chat")
    if flow_type == "recommend":
        system = LOAN_RECOMMENDATION_SYSTEM.format(
            eligibility_result=state.get("eligibility_result", {}),
            rate_result=state.get("rate_result", {}),
            prompt_version=PROMPT_VERSION,
        )
    else:
        context = "\n\n".join(state.get("retrieved_docs", ["No documents available."]))
        system = MORTGAGE_QA_SYSTEM.format(context=context, prompt_version=PROMPT_VERSION)

    messages = [SystemMessage(content=system), HumanMessage(content=state["user_query"])]
    response = await llm.ainvoke(messages, config=_invoke_config(state))
    return {
        "final_response": response.content,
        "tool_calls_made": state.get("tool_calls_made", []) + [f"llm_response_{PROMPT_VERSION}"],
    }


async def guardrail_node(state: MortgageAgentState) -> dict:
    messages = [
        SystemMessage(content=GUARDRAIL_SYSTEM),
        HumanMessage(content=state["final_response"]),
    ]
    result = await llm.ainvoke(messages, config=_invoke_config(state))
    return {
        "final_response": result.content,
        "tool_calls_made": state.get("tool_calls_made", []) + ["guardrail"],
    }
