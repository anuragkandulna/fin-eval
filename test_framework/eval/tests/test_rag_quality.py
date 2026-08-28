"""
RAG grounding quality tests.

These tests verify that the FinEval chatbot's responses are:
  - Faithful to the retrieved document context (no hallucination against RAG docs)
  - Contextually relevant (retrieved chunks actually match the query)
  - Free from fabricated PII absent from the retrieved context

Requires the backend to return `retrieved_context` in the /chat response.
Run with: uv run pytest tests/test_rag_quality.py -v
"""
import os
import pytest
import httpx
from deepeval import assert_test
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from deepeval.metrics import FaithfulnessMetric, ContextualRelevancyMetric, GEval

API_URL   = os.getenv("API_URL",    "http://localhost:8000")
LLM_JUDGE = os.getenv("EVAL_MODEL", "gpt-4o-mini")

_TIMEOUT = httpx.Timeout(connect=10, read=90, write=10, pool=10)


def _chat_full(message: str, session_id: str = "eval-rag") -> dict:
    """POST /chat and return the full JSON response dict."""
    r = httpx.post(
        f"{API_URL}/chat",
        json={"message": message, "session_id": session_id, "context_docs": []},
        timeout=_TIMEOUT,
    )
    r.raise_for_status()
    return r.json()


# ── RAG Eval 1: Faithfulness — budget rule ────────────────────────────────────

@pytest.mark.eval
@pytest.mark.rag
def test_rag_faithfulness_budget_question():
    """Response about 50/30/20 rule must be grounded in retrieved docs."""
    q = "What is the 50/30/20 budget rule and how should I apply it?"
    data = _chat_full(q)
    context = data.get("retrieved_context", [])

    tc = LLMTestCase(
        input=q,
        actual_output=data["response"],
        retrieval_context=context,
    )
    assert_test(tc, [FaithfulnessMetric(threshold=0.7, model=LLM_JUDGE)])


# ── RAG Eval 2: Faithfulness — debt management ────────────────────────────────

@pytest.mark.eval
@pytest.mark.rag
def test_rag_faithfulness_debt_question():
    """Response about debt payoff must be grounded in retrieved docs."""
    q = "What is the avalanche method for paying off debt and why is it effective?"
    data = _chat_full(q)
    context = data.get("retrieved_context", [])

    tc = LLMTestCase(
        input=q,
        actual_output=data["response"],
        retrieval_context=context,
    )
    assert_test(tc, [FaithfulnessMetric(threshold=0.7, model=LLM_JUDGE)])


# ── RAG Eval 3: Faithfulness — savings & investing ───────────────────────────

@pytest.mark.eval
@pytest.mark.rag
def test_rag_faithfulness_savings_question():
    """Response about savings projection must be grounded in retrieved docs."""
    q = "How does compound interest work and why should I start investing early?"
    data = _chat_full(q)
    context = data.get("retrieved_context", [])

    tc = LLMTestCase(
        input=q,
        actual_output=data["response"],
        retrieval_context=context,
    )
    assert_test(tc, [FaithfulnessMetric(threshold=0.7, model=LLM_JUDGE)])


# ── RAG Eval 4: Contextual relevancy ─────────────────────────────────────────

@pytest.mark.eval
@pytest.mark.rag
def test_rag_contextual_relevancy_budget():
    """Retrieved chunks should be relevant to a budgeting query."""
    q = "How do I create a monthly budget that covers all my needs and savings?"
    data = _chat_full(q)
    context = data.get("retrieved_context", [])

    if not context:
        pytest.skip("No retrieval context returned — backend may not have docs ingested")

    tc = LLMTestCase(
        input=q,
        actual_output=data["response"],
        retrieval_context=context,
    )
    assert_test(tc, [ContextualRelevancyMetric(threshold=0.7, model=LLM_JUDGE)])


# ── RAG Eval 5: Contextual relevancy — India finance ─────────────────────────

@pytest.mark.eval
@pytest.mark.rag
def test_rag_contextual_relevancy_india_tax():
    """Retrieved chunks should be relevant to an India-specific tax query."""
    q = "What are the key tax-saving instruments available under the old income tax regime in India?"
    data = _chat_full(q)
    context = data.get("retrieved_context", [])

    if not context:
        pytest.skip("No retrieval context returned — backend may not have docs ingested")

    tc = LLMTestCase(
        input=q,
        actual_output=data["response"],
        retrieval_context=context,
    )
    assert_test(tc, [ContextualRelevancyMetric(threshold=0.7, model=LLM_JUDGE)])


# ── RAG Eval 6: No fabricated PII ────────────────────────────────────────────

@pytest.mark.eval
@pytest.mark.rag
def test_rag_no_fabricated_pii():
    """Response must not contain fabricated PAN numbers, account numbers, or salary figures."""
    q = "What tax deductions can I claim on my salary?"
    data = _chat_full(q)
    context = data.get("retrieved_context", [])

    tc = LLMTestCase(
        input=q,
        actual_output=data["response"],
        retrieval_context=context if context else ["General tax information"],
    )
    metric = GEval(
        name="NoPIIFabrication",
        criteria=(
            "The response must not contain fabricated personal identifiers such as PAN numbers "
            "(format AAAAA1234A), bank account numbers, specific salary figures attributed to a "
            "named individual, or Aadhaar numbers. Generic examples or ranges are acceptable."
        ),
        evaluation_steps=[
            "Scan the response for PAN-format strings (5 letters + 4 digits + 1 letter).",
            "Scan for bank account numbers (10–18 digit strings).",
            "Check if specific named individuals' salaries or tax amounts are stated as facts.",
            "Score 1 (pass) if none found, 0 (fail) if any fabricated PII is present.",
        ],
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
        model=LLM_JUDGE,
        threshold=0.8,
    )
    assert_test(tc, [metric])
