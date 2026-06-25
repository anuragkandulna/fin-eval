from langchain_core.tools import tool

VALID_TOOL_NAMES = {
    "rag_retrieval",
    "budget_analyser",
    "debt_calculator",
    "savings_projector",
    "llm_response_v3",
    "guardrail",
}


@tool
def budget_analyser(
    income: float,
    needs: float,
    wants: float,
    current_savings: float,
    savings_goal: float,
) -> dict:
    """
    Analyse budget health using the 50/30/20 rule.
    Returns budget health score, category analysis, and surplus/deficit.
    Income and all amounts should be monthly figures in INR.
    """
    total_expenses = needs + wants
    actual_savings = income - total_expenses

    recommended_needs   = income * 0.50
    recommended_wants   = income * 0.30
    recommended_savings = income * 0.20

    needs_pct   = round(needs / income * 100, 1) if income > 0 else 0
    wants_pct   = round(wants / income * 100, 1) if income > 0 else 0
    savings_pct = round(actual_savings / income * 100, 1) if income > 0 else 0

    score = 100
    if needs_pct > 50:   score -= (needs_pct - 50) * 1.5
    if wants_pct > 30:   score -= (wants_pct - 30) * 2
    if savings_pct < 10: score -= (10 - savings_pct) * 3
    score = max(0, min(100, round(score)))

    health_label = (
        "excellent" if score >= 80 else
        "good"      if score >= 60 else
        "fair"      if score >= 40 else
        "poor"
    )

    issues = []
    if needs > recommended_needs:
        issues.append(
            f"Needs spending ({needs_pct}%) exceeds 50% benchmark by Rs {needs - recommended_needs:,.0f}"
        )
    if wants > recommended_wants:
        issues.append(
            f"Wants spending ({wants_pct}%) exceeds 30% benchmark by Rs {wants - recommended_wants:,.0f}"
        )
    if actual_savings < savings_goal:
        issues.append(
            f"Current savings Rs {actual_savings:,.0f} is below your goal of Rs {savings_goal:,.0f}"
        )

    return {
        "health_score":         score,
        "health_label":         health_label,
        "actual_savings":       round(actual_savings, 2),
        "actual_savings_rate":  savings_pct,
        "recommended_savings":  round(recommended_savings, 2),
        "surplus_deficit":      round(actual_savings - savings_goal, 2),
        "needs_percentage":     needs_pct,
        "wants_percentage":     wants_pct,
        "issues":               issues,
        "on_track":             actual_savings >= savings_goal,
    }


@tool
def debt_calculator(debts: list, monthly_payment: float) -> dict:
    """
    Calculate debt payoff timeline using avalanche and snowball methods.
    debts: list of dicts with keys 'name' (str), 'balance' (float), 'rate' (float, annual as decimal e.g. 0.36).
    monthly_payment: total extra amount available for debt repayment above minimums.
    """
    if not debts:
        return {"error": "No debts provided"}

    total_debt       = sum(d["balance"] for d in debts)
    monthly_interest = sum(d["balance"] * d["rate"] / 12 for d in debts)

    avalanche_order = sorted(debts, key=lambda x: x["rate"], reverse=True)
    snowball_order  = sorted(debts, key=lambda x: x["balance"])

    def estimate_months(ordered_debts: list, extra_payment: float) -> int:
        remaining = {d["name"]: d["balance"] for d in ordered_debts}
        month = 0
        while any(b > 0 for b in remaining.values()) and month < 600:
            month += 1
            freed = 0.0
            for d in ordered_debts:
                name    = d["name"]
                rate    = d["rate"] / 12
                balance = remaining[name]
                if balance <= 0:
                    continue
                interest = balance * rate
                payment  = min(balance + interest, extra_payment + freed)
                remaining[name] = max(0.0, balance + interest - payment)
                if remaining[name] == 0:
                    freed += extra_payment
        return month

    avalanche_months = estimate_months(avalanche_order, monthly_payment)
    snowball_months  = estimate_months(snowball_order,  monthly_payment)

    return {
        "total_debt":              round(total_debt, 2),
        "monthly_interest_cost":   round(monthly_interest, 2),
        "avalanche_payoff_months": avalanche_months,
        "snowball_payoff_months":  snowball_months,
        "recommended_strategy":    "avalanche",
        "interest_saved_avalanche": round(
            (snowball_months - avalanche_months) * monthly_interest * 0.5, 2
        ),
        "highest_rate_debt":          max(debts, key=lambda x: x["rate"])["name"],
        "priority_order_avalanche":   [d["name"] for d in avalanche_order],
    }


@tool
def savings_projector(
    monthly_savings: float,
    years: int,
    annual_return: float = 0.08,
) -> dict:
    """
    Project savings growth using compound interest over time.
    Does NOT recommend specific funds or guarantee returns.
    annual_return is an assumed rate only — actual returns vary.
    """
    months         = years * 12
    monthly_return = annual_return / 12

    if monthly_return > 0:
        future_value = monthly_savings * ((1 + monthly_return) ** months - 1) / monthly_return
    else:
        future_value = monthly_savings * months

    total_invested = monthly_savings * months
    growth         = future_value - total_invested
    rule_of_72     = round(72 / (annual_return * 100), 1) if annual_return > 0 else 0

    return {
        "projected_value":  round(future_value, 2),
        "total_invested":   round(total_invested, 2),
        "total_growth":     round(growth, 2),
        "growth_multiple":  round(future_value / total_invested, 2) if total_invested > 0 else 0,
        "years":            years,
        "assumed_return":   f"{annual_return * 100}%",
        "doubling_years":   rule_of_72,
        "disclaimer":       (
            "Projection uses an assumed annual return rate. "
            "Actual returns vary and are not guaranteed. "
            "This is educational only, not investment advice."
        ),
    }


TOOLS = [budget_analyser, debt_calculator, savings_projector]
