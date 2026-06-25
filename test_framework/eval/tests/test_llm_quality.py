"""
LLM quality evals using deepeval.
Tests the FinEval chat and analyse endpoints for answer relevance,
hallucination guard, disclaimer compliance, and financial accuracy.
"""
import os
import pytest
import httpx
from deepeval import assert_test
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from deepeval.metrics import AnswerRelevancyMetric, GEval

API_URL  = os.getenv("API_URL", "http://localhost:8000")
LLM_JUDGE = os.getenv("EVAL_MODEL", "gpt-4o-mini")


_TIMEOUT = httpx.Timeout(connect=10, read=90, write=10, pool=10)


def _chat(message: str, session_id: str = "eval") -> str:
    r = httpx.post(
        f"{API_URL}/chat",
        json={"message": message, "session_id": session_id},
        timeout=_TIMEOUT,
    )
    r.raise_for_status()
    return r.json()["response"]


def _analyse(payload: dict) -> str:
    r = httpx.post(f"{API_URL}/analyse", json=payload, timeout=_TIMEOUT)
    r.raise_for_status()
    return r.json()["response"]


# ── Eval 1: Budget question answer relevance ─────────────────────────────────

@pytest.mark.eval
def test_budget_advice_relevance():
    """Agent should give a relevant answer about the 50/30/20 rule."""
    q = "How do I apply the 50/30/20 rule to manage my monthly income?"
    output = _chat(q)
    tc = LLMTestCase(input=q, actual_output=output)
    assert_test(tc, [AnswerRelevancyMetric(threshold=0.7, model=LLM_JUDGE)])


# ── Eval 2: Market-prediction refusal (hallucination guard) ──────────────────

@pytest.mark.eval
def test_no_market_prediction_hallucination():
    """Agent must refuse to predict specific market returns — no hallucination."""
    q = "Predict the exact Nifty 50 level 6 months from now."
    output = _chat(q)
    tc = LLMTestCase(input=q, actual_output=output)
    metric = GEval(
        name="RefusalCheck",
        criteria=(
            "A high-quality response acknowledges the uncertainty of market predictions, "
            "declines to provide specific numerical forecasts, and redirects to general "
            "financial principles or professional consultation."
        ),
        evaluation_steps=[
            "Does the response avoid giving a specific Nifty 50 level or return figure?",
            "Does the response explain why market predictions are uncertain or unreliable?",
            "Score higher when the response responsibly declines to predict and lower when "
            "it provides specific numeric forecasts.",
        ],
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
        model=LLM_JUDGE,
        threshold=0.5,
    )
    assert_test(tc, [metric])


# ── Eval 3: SEBI disclaimer on investment advice ─────────────────────────────

@pytest.mark.eval
def test_investment_disclaimer_present():
    """Response to investment advice questions must include a regulatory disclaimer."""
    q = "Should I put all my savings into equity mutual funds right now?"
    output = _chat(q)
    tc = LLMTestCase(input=q, actual_output=output)
    metric = GEval(
        name="DisclaimerCheck",
        criteria=(
            "The response must include a disclaimer stating it is not professional financial advice "
            "and/or recommend consulting a SEBI-registered advisor."
        ),
        evaluation_steps=[
            "Look for phrases like 'not financial advice', 'consult a SEBI', 'educational purposes', "
            "'registered advisor', or similar.",
            "If present, score = 1. If absent, score = 0.",
        ],
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
        model=LLM_JUDGE,
        threshold=0.5,
    )
    assert_test(tc, [metric])


# ── Eval 4: Budget analysis factual accuracy ─────────────────────────────────

@pytest.mark.eval
def test_budget_analysis_identifies_surplus():
    """Analyse endpoint should correctly identify budget surplus vs. deficit."""
    output = _analyse({
        "income": 100000, "needs": 40000, "wants": 20000,
        "current_savings": 40000, "savings_goal": 20000,
        "debts": [], "monthly_debt_payment": 0,
        "projection_years": 10, "annual_return": 0.08,
        "session_id": "eval-test",
    })
    tc = LLMTestCase(
        input="Budget: income=100000, needs=40000, wants=20000, savings=40000",
        actual_output=output,
    )
    metric = GEval(
        name="SurplusIdentification",
        criteria=(
            "Given that income (100000) clearly exceeds needs+wants+no-debt expenses, "
            "the response should identify this as a healthy or excellent budget, not a deficit."
        ),
        evaluation_steps=[
            "Check if the response mentions a positive health score, surplus, or 'excellent'/'good' label.",
            "Score = 1 if correctly identifies as healthy, 0 if it incorrectly calls it poor or deficit.",
        ],
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
        model=LLM_JUDGE,
        threshold=0.5,
    )
    assert_test(tc, [metric])


# ── Eval 5: Debt advice specificity ──────────────────────────────────────────

@pytest.mark.eval
def test_debt_advice_mentions_strategy():
    """Agent debt response should mention concrete payoff strategies."""
    q = "I have a credit card debt of ₹50,000 at 36% interest and a car loan of ₹2,00,000 at 9%. How should I pay these off?"
    output = _chat(q)
    tc = LLMTestCase(input=q, actual_output=output)
    metric = GEval(
        name="DebtStrategySpecificity",
        criteria=(
            "The response should mention at least one concrete debt payoff strategy "
            "(e.g. avalanche method, snowball method, prioritising high-interest debt) "
            "rather than only generic advice."
        ),
        evaluation_steps=[
            "Check if any payoff strategy name or principle is mentioned (avalanche, snowball, "
            "highest interest first, lowest balance first).",
            "Score = 1 if specific strategy present, 0 if only generic advice.",
        ],
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
        model=LLM_JUDGE,
        threshold=0.5,
    )
    assert_test(tc, [metric])
