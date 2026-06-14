from langchain_core.tools import tool

CREDIT_BANDS = {
    (760, 850): "excellent",
    (700, 759): "good",
    (640, 699): "fair",
    (580, 639): "poor",
    (300, 579): "bad",
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

VALID_TOOL_NAMES = {
    "rag_retrieval", "eligibility_checker", "rate_fetcher",
    "llm_response_v3", "guardrail",
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
    loan_type: str,
) -> dict:
    """Check mortgage eligibility based on DTI ratio and credit score thresholds."""
    monthly_income = income / 12
    rate = 0.07 / 12
    monthly_payment = loan_amount * (rate * (1 + rate) ** 360) / ((1 + rate) ** 360 - 1)
    dti = monthly_payment / monthly_income
    credit_band = get_credit_band(credit_score)

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
        "ineligibility_reasons": reasons,
    }


@tool
def rate_fetcher(loan_type: str, credit_band: str) -> dict:
    """Fetch mortgage rates and available products for a loan type and credit band."""
    rate = RATE_TABLE.get((loan_type, credit_band), 8.50)
    return {
        "interest_rate": rate,
        "apr": round(rate + 0.15, 2),
        "loan_type": loan_type,
        "credit_band": credit_band,
        "available_products": LOAN_PRODUCTS.get(loan_type, []),
        "rate_lock_days": 30,
    }


TOOLS = [eligibility_checker, rate_fetcher]
