import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class UserProfile(SQLModel, table=True):
    __tablename__ = "user_profiles"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    full_name: str = Field(max_length=255)
    city: str = Field(max_length=255)
    employer: str = Field(max_length=255)
    take_home_monthly: int
    annual_ctc: int
    next_credit_date: str = Field(max_length=64)
    tax_regime: str = Field(max_length=128)
    gross_annual: int
    standard_deduction: int
    net_taxable: int
    tax_with_cess: int
    created_at: datetime = Field(default_factory=_utcnow)


class BudgetHealthSnapshot(SQLModel, table=True):
    __tablename__ = "budget_health_snapshots"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
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
    created_at: datetime = Field(default_factory=_utcnow)


class MonthlyMetric(SQLModel, table=True):
    __tablename__ = "monthly_metrics"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    month: str = Field(max_length=16)
    income: int
    spend: int
    sort_order: int = 0


class SpendSegment(SQLModel, table=True):
    __tablename__ = "spend_segments"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    label: str = Field(max_length=64)
    pct: int
    amount: Optional[int] = Field(default=None)
    segment_type: str = Field(max_length=16)  # "donut" | "breakdown"
    sort_order: int = 0


class TopSpendCategory(SQLModel, table=True):
    __tablename__ = "top_spend_categories"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=64)
    amount: int
    pct: int
    wow: int
    wow_dir: str = Field(max_length=8)  # "up" | "down" | "flat"
    sort_order: int = 0


class FinancialGoal(SQLModel, table=True):
    __tablename__ = "financial_goals"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=128)
    target: int
    saved: int
    horizon: str = Field(max_length=64)
    sort_order: int = 0


class SalaryCredit(SQLModel, table=True):
    __tablename__ = "salary_credits"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    month: str = Field(max_length=16)
    expected_date: str = Field(max_length=16)
    credited_date: str = Field(max_length=16)
    amount: int
    status: str = Field(max_length=16)  # "on-time" | "late" | "pending"
    doc_id: Optional[str] = Field(default=None, max_length=255)
    sort_order: int = 0


class BudgetCategory(SQLModel, table=True):
    __tablename__ = "budget_categories"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=64)
    budget: int
    spent: int
    sort_order: int = 0


class RecommendationItem(SQLModel, table=True):
    __tablename__ = "recommendation_items"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(max_length=128)
    detail: str
    impact: str = Field(max_length=8)  # "high" | "medium" | "low"
    is_alert: bool = False
    sort_order: int = 0
