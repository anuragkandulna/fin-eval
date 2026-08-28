from pydantic import BaseModel
from typing import Optional


class BudgetHealthOut(BaseModel):
    health_score: int
    health_score_change: int
    savings_rate_pct: int
    savings_rate_target: int
    dti_pct: int
    dti_limit: int
    net_worth_inr: int
    net_worth_change_inr: int
    emergency_months: float
    emergency_target_months: float
    monthly_surplus_inr: int
    monthly_income_inr: int
    ai_insight: str


class MonthlyMetricOut(BaseModel):
    month: str
    income: int
    spend: int


class SpendSegmentOut(BaseModel):
    label: str
    pct: int
    amount: Optional[int] = None
    segment_type: str


class TopSpendCategoryOut(BaseModel):
    name: str
    amount: int
    pct: int
    wow: int
    wow_dir: str


class RecommendationItemOut(BaseModel):
    title: str
    detail: str
    impact: str
    is_alert: bool


class DashboardResponse(BaseModel):
    budget_health: BudgetHealthOut
    monthly_metrics: list[MonthlyMetricOut]
    spend_segments: list[SpendSegmentOut]
    top_categories: list[TopSpendCategoryOut]
    recommendations: list[RecommendationItemOut]
    alerts: list[RecommendationItemOut]


class UserProfileOut(BaseModel):
    full_name: str
    city: str
    employer: str
    take_home_monthly: int
    annual_ctc: int
    next_credit_date: str
    tax_regime: str


class TaxSummaryOut(BaseModel):
    gross_annual: int
    standard_deduction: int
    net_taxable: int
    tax_with_cess: int


class FinancialGoalOut(BaseModel):
    name: str
    target: int
    saved: int
    horizon: str


class SalaryCreditOut(BaseModel):
    month: str
    expected_date: str
    credited_date: str
    amount: int
    status: str
    doc_id: Optional[str] = None


class BudgetCategoryOut(BaseModel):
    name: str
    budget: int
    spent: int


class PersonalDataResponse(BaseModel):
    profile: UserProfileOut
    tax_summary: TaxSummaryOut
    goals: list[FinancialGoalOut]
    salary_credits: list[SalaryCreditOut]
    budget_categories: list[BudgetCategoryOut]
