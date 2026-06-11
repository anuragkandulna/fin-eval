# Section 04 — Backend: LangGraph Agent
**Goal:** Real agentic flow replacing mock responses — RAG + eligibility + rate tools

---

## Step 4.1 — agent/state.py

```python
from typing import TypedDict, Annotated
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class MortgageAgentState(TypedDict):
    # Conversation
    messages: Annotated[list[BaseMessage], add_messages]
    user_query: str
    session_id: str
    
    # RAG
    retrieved_docs: list[str]
    doc_sources: list[str]
    
    # Tool results
    eligibility_result: dict
    rate_result: dict
    
    # Loan input (optional — only for /recommend flow)
    loan_input: dict
    
    # Output
    final_response: str
    tool_calls_made: list[str]
    
    # Tracing
    trace_id: str
    flow_type: str    # "chat" | "recommend"
```

---

## Step 4.2 — agent/tools.py

```python
from langchain_core.tools import tool

CREDIT_BANDS = {
    (760, 850): "excellent",
    (700, 759): "good",
    (640, 699): "fair",
    (580, 639): "poor",
    (300, 579): "bad"
}

RATE_TABLE = {
    ("fixed",    "excellent"): 6.25,
    ("fixed",    "good"):      6.60,
    ("fixed",    "fair"):      7.10,
    ("fixed",    "poor"):      7.80,
    ("variable", "excellent"): 5.75,
    ("variable", "good"):      6.10,
    ("variable", "fair"):      6.60,
    ("variable", "poor"):      7.30,
    ("fha",      "excellent"): 6.40,
    ("fha",      "good"):      6.70,
    ("fha",      "fair"):      7.00,
    ("fha",      "poor"):      7.50,
}

LOAN_PRODUCTS = {
    "fixed":    ["30-Year Fixed", "15-Year Fixed", "20-Year Fixed"],
    "variable": ["5/1 ARM", "7/1 ARM", "10/1 ARM"],
    "fha":      ["FHA 30-Year Fixed", "FHA 15-Year Fixed"],
}

def get_credit_band(score: int) -> str:
    for (low, high), band in CREDIT_BANDS.items():
        if low <= score <= high:
            return band
    return "unknown"

@tool
def eligibility_checker(
    income: float,
    loan_amount: float,
    credit_score: int,
    loan_type: str
) -> dict:
    """
    Check mortgage eligibility based on DTI ratio and credit score.
    Returns eligibility status, DTI ratio, and credit band.
    """
    monthly_income = income / 12
    # Estimate monthly payment (simplified: rate/12 * principal / (1 - (1+rate/12)^-360))
    rate = 0.07 / 12
    monthly_payment = loan_amount * (rate * (1+rate)**360) / ((1+rate)**360 - 1)
    dti = monthly_payment / monthly_income
    credit_band = get_credit_band(credit_score)
    
    # Eligibility rules
    min_scores = {"fixed": 620, "variable": 640, "fha": 580}
    min_score = min_scores.get(loan_type, 620)
    
    eligible = credit_score >= min_score and dti <= 0.43
    
    reasons = []
    if credit_score < min_score:
        reasons.append(f"Credit score {credit_score} below minimum {min_score} for {loan_type}")
    if dti > 0.43:
        reasons.append(f"DTI ratio {dti:.2%} exceeds maximum 43%")
    
    return {
        "eligible": eligible,
        "dti_ratio": round(dti, 4),
        "monthly_payment_estimate": round(monthly_payment, 2),
        "credit_band": credit_band,
        "credit_score": credit_score,
        "ineligibility_reasons": reasons
    }

@tool
def rate_fetcher(loan_type: str, credit_band: str) -> dict:
    """
    Fetch current mortgage rates and available products for a given
    loan type and credit band.
    """
    rate = RATE_TABLE.get((loan_type, credit_band), 8.50)
    products = LOAN_PRODUCTS.get(loan_type, [])
    
    return {
        "interest_rate": rate,
        "apr": round(rate + 0.15, 2),   # APR typically ~0.15% above rate
        "loan_type": loan_type,
        "credit_band": credit_band,
        "available_products": products,
        "rate_lock_days": 30,
        "points": 0
    }

TOOLS = [eligibility_checker, rate_fetcher]
TOOL_NAMES = {t.name for t in TOOLS}
```

---

## Step 4.3 — agent/prompts.py

```python
# Versioned prompts — each change logged to MLflow

PROMPT_VERSION = "v3"

MORTGAGE_QA_SYSTEM = """You are a helpful and accurate mortgage advisor assistant.

Rules you must follow:
1. Only answer using information from the provided context documents.
2. If the answer is not in the context, say "I don't have that information in the provided documents."
3. Never fabricate interest rates, loan limits, or eligibility criteria.
4. Be concise but complete. Use plain language.
5. If asked about specific eligibility, encourage the user to consult a licensed loan officer.

Context documents:
{context}
"""

LOAN_RECOMMENDATION_SYSTEM = """You are a mortgage loan officer assistant.

Based on the eligibility check and available rates provided, recommend the best loan product.
Format your response as:
1. Recommendation: [product name]
2. Interest Rate: [rate]%
3. Eligibility: [Eligible/Not Eligible]
4. Reasoning: [2-3 sentences explaining why this product fits]
5. Next steps: [what the applicant should do]

Important: Always include a disclaimer that this is not a formal loan approval.
Do not guarantee any outcome.

Eligibility result: {eligibility_result}
Available rates: {rate_result}
"""

GUARDRAIL_SYSTEM = """Review the following mortgage assistant response for:
1. PII (names, SSNs, account numbers) — remove if found
2. Fabricated specific numbers not in the context
3. Guaranteed loan approvals (not allowed)

If the response is clean, return it unchanged.
If issues found, fix them and return the corrected response.
Return only the response text, no commentary.
"""
```

---

## Step 4.4 — agent/nodes.py

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from app.agent.state import MortgageAgentState
from app.agent.prompts import (
    MORTGAGE_QA_SYSTEM, LOAN_RECOMMENDATION_SYSTEM,
    GUARDRAIL_SYSTEM, PROMPT_VERSION
)
from app.agent.tools import eligibility_checker, rate_fetcher
from app.rag.retriever import retrieve_docs
from app.config import settings
import structlog

logger = structlog.get_logger()
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0, api_key=settings.openai_api_key)

async def rag_node(state: MortgageAgentState) -> dict:
    """Retrieve relevant document chunks for the user query."""
    logger.info("rag_node", query=state["user_query"])
    
    docs, sources = await retrieve_docs(state["user_query"])
    
    return {
        "retrieved_docs": docs,
        "doc_sources": sources,
        "tool_calls_made": state.get("tool_calls_made", []) + ["rag_retrieval"]
    }

async def eligibility_node(state: MortgageAgentState) -> dict:
    """Run eligibility check if loan input is provided."""
    loan_input = state.get("loan_input", {})
    
    if not loan_input:
        logger.info("eligibility_node: skipped — no loan input")
        return {"eligibility_result": {}, "tool_calls_made": state.get("tool_calls_made", [])}
    
    logger.info("eligibility_node", loan_input=loan_input)
    result = eligibility_checker.invoke(loan_input)
    
    return {
        "eligibility_result": result,
        "tool_calls_made": state.get("tool_calls_made", []) + ["eligibility_checker"]
    }

async def rate_node(state: MortgageAgentState) -> dict:
    """Fetch rates based on eligibility result."""
    eligibility = state.get("eligibility_result", {})
    loan_input = state.get("loan_input", {})
    
    if not eligibility or not loan_input:
        return {"rate_result": {}, "tool_calls_made": state.get("tool_calls_made", [])}
    
    result = rate_fetcher.invoke({
        "loan_type": loan_input.get("loan_type", "fixed"),
        "credit_band": eligibility.get("credit_band", "fair")
    })
    
    return {
        "rate_result": result,
        "tool_calls_made": state.get("tool_calls_made", []) + ["rate_fetcher"]
    }

async def response_node(state: MortgageAgentState) -> dict:
    """Generate final LLM response using retrieved context and tool results."""
    flow_type = state.get("flow_type", "chat")
    
    if flow_type == "recommend":
        system = LOAN_RECOMMENDATION_SYSTEM.format(
            eligibility_result=state.get("eligibility_result", {}),
            rate_result=state.get("rate_result", {})
        )
        user_msg = state["user_query"]
    else:
        context = "\n\n".join(state.get("retrieved_docs", ["No documents available."]))
        system = MORTGAGE_QA_SYSTEM.format(context=context)
        user_msg = state["user_query"]
    
    messages = [SystemMessage(content=system), HumanMessage(content=user_msg)]
    response = await llm.ainvoke(messages)
    
    return {
        "final_response": response.content,
        "tool_calls_made": state.get("tool_calls_made", []) + [f"llm_response_{PROMPT_VERSION}"]
    }

async def guardrail_node(state: MortgageAgentState) -> dict:
    """Check response for PII and fabricated content."""
    messages = [
        SystemMessage(content=GUARDRAIL_SYSTEM),
        HumanMessage(content=state["final_response"])
    ]
    result = await llm.ainvoke(messages)
    
    return {"final_response": result.content}
```

---

## Step 4.5 — agent/graph.py

```python
from langgraph.graph import StateGraph, START, END
from app.agent.state import MortgageAgentState
from app.agent.nodes import (
    rag_node, eligibility_node, rate_node,
    response_node, guardrail_node
)

def should_run_eligibility(state: MortgageAgentState) -> str:
    """Route to eligibility check only if loan data was provided."""
    if state.get("loan_input") and state.get("flow_type") == "recommend":
        return "eligibility"
    return "response"

def build_graph():
    graph = StateGraph(MortgageAgentState)
    
    # Add nodes
    graph.add_node("rag", rag_node)
    graph.add_node("eligibility", eligibility_node)
    graph.add_node("rate", rate_node)
    graph.add_node("response", response_node)
    graph.add_node("guardrail", guardrail_node)
    
    # Edges
    graph.add_edge(START, "rag")
    
    # Conditional: go to eligibility or skip to response
    graph.add_conditional_edges(
        "rag",
        should_run_eligibility,
        {"eligibility": "eligibility", "response": "response"}
    )
    
    graph.add_edge("eligibility", "rate")
    graph.add_edge("rate", "response")
    graph.add_edge("response", "guardrail")
    graph.add_edge("guardrail", END)
    
    return graph.compile()

# Singleton — compiled once at startup
mortgage_agent = build_graph()
```

---

## Step 4.6 — Update routers/chat.py to use real agent

```python
from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
from app.agent.graph import mortgage_agent
from langchain_core.messages import HumanMessage
import uuid, structlog

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
            "tool_calls_made": []
        })
        
        return ChatResponse(
            response=result["final_response"],
            sources=result.get("doc_sources", []),
            tool_calls_made=result.get("tool_calls_made", []),
            trace_id=trace_id
        )
    except Exception as e:
        logger.error("chat_error", error=str(e), trace_id=trace_id)
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Step 4.7 — Update routers/recommend.py to use real agent

```python
from fastapi import APIRouter, HTTPException
from app.models.schemas import LoanRequest, LoanResponse
from app.agent.graph import mortgage_agent
from langchain_core.messages import HumanMessage
import uuid

router = APIRouter(prefix="/recommend", tags=["recommend"])

@router.post("", response_model=LoanResponse)
async def recommend(request: LoanRequest):
    trace_id = str(uuid.uuid4())
    
    loan_input = {
        "income": request.income,
        "loan_amount": request.loan_amount,
        "credit_score": request.credit_score,
        "loan_type": request.loan_type,
        "employment": request.employment
    }
    
    query = f"Recommend a mortgage for: income={request.income}, loan={request.loan_amount}, credit={request.credit_score}, type={request.loan_type}"
    
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
        "tool_calls_made": []
    })
    
    eligibility = result.get("eligibility_result", {})
    rate = result.get("rate_result", {})
    
    return LoanResponse(
        product=rate.get("available_products", ["Standard Mortgage"])[0],
        rate=rate.get("interest_rate", 7.5),
        eligible=eligibility.get("eligible", False),
        reasoning=result["final_response"],
        trace_id=trace_id
    )
```

---

## Section 04 Checklist

- [ ] `state.py` with full TypedDict defined
- [ ] `tools.py` — eligibility_checker and rate_fetcher working
- [ ] `prompts.py` — three prompt templates with version tag
- [ ] `nodes.py` — all 5 nodes implemented
- [ ] `graph.py` — StateGraph compiled with conditional routing
- [ ] `chat.py` updated to use real agent
- [ ] `recommend.py` updated to use real agent
- [ ] Local test: POST `/chat` with "What is the DTI limit for FHA loans?" returns real LLM response
- [ ] Local test: POST `/recommend` with sample loan data returns rate + eligibility
- [ ] Verify tool_calls_made list shows which nodes ran
- [ ] Commit: `git commit -m "feat: LangGraph agent with RAG + eligibility + rate tools"`

**Before proceeding:** Both `/chat` and `/recommend` return real LLM responses, not mocks.
