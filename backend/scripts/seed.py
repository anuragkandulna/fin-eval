"""
Seed script — populates Neon PostgreSQL with demo profile data for John Doe.

Run from repo root:
    uv run python backend/scripts/seed.py
"""
import asyncio
import sys
import os

# Make sure backend/app is importable when running from repo root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlmodel import SQLModel, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import engine, AsyncSessionLocal
import app.chat.models       # noqa: F401 — register ChatSession / ChatMessage
import app.documents.models  # noqa: F401 — register DocumentRecord (keep for create_all)
import app.profile.models    # noqa: F401 — register all profile tables

from app.profile.models import (
    UserProfile,
    BudgetHealthSnapshot,
    MonthlyMetric,
    SpendSegment,
    TopSpendCategory,
    FinancialGoal,
    SalaryCredit,
    BudgetCategory,
    RecommendationItem,
)


# ── Seed data ──────────────────────────────────────────────────────────────────

PROFILE = UserProfile(
    full_name="John Doe",
    city="Bangalore, KA",
    employer="TechCorp Pvt Ltd",
    take_home_monthly=80_000,
    annual_ctc=1_440_000,
    next_credit_date="Jul 1, 2026",
    tax_regime="New regime · FY 2025-26",
    gross_annual=1_440_000,
    standard_deduction=75_000,
    net_taxable=1_365_000,
    tax_with_cess=91_666,
)

HEALTH = BudgetHealthSnapshot(
    health_score=74,
    health_score_change=2,
    savings_rate_pct=18,
    savings_rate_target=20,
    dti_pct=29,
    dti_limit=35,
    net_worth_inr=1_840_000,
    net_worth_change_inr=32_000,
    emergency_months=4.2,
    emergency_target_months=6.0,
    monthly_surplus_inr=12_000,
    monthly_income_inr=80_000,
    ai_insight=(
        "Your spend pattern is healthy overall, but entertainment is trending 22% "
        "above your 4-week average. Redirecting ₹2,000/month there would close your "
        "savings gap and fund an ELSS top-up in one move."
    ),
)

MONTHLY = [
    MonthlyMetric(month="Jan", income=80_000, spend=62_000, sort_order=1),
    MonthlyMetric(month="Feb", income=80_000, spend=58_400, sort_order=2),
    MonthlyMetric(month="Mar", income=82_000, spend=71_200, sort_order=3),
    MonthlyMetric(month="Apr", income=80_000, spend=60_800, sort_order=4),
    MonthlyMetric(month="May", income=80_000, spend=65_600, sort_order=5),
    MonthlyMetric(month="Jun", income=80_000, spend=68_000, sort_order=6),
]

SEGMENTS = [
    # Donut segments
    SpendSegment(label="Needs",   pct=50, amount=34_000, segment_type="donut",     sort_order=1),
    SpendSegment(label="Wants",   pct=20, amount=13_600, segment_type="donut",     sort_order=2),
    SpendSegment(label="Savings", pct=18, amount=12_240, segment_type="donut",     sort_order=3),
    SpendSegment(label="EMI",     pct=12, amount=8_160,  segment_type="donut",     sort_order=4),
    # Breakdown segments
    SpendSegment(label="Needs",    pct=48, segment_type="breakdown", sort_order=1),
    SpendSegment(label="Wants",    pct=24, segment_type="breakdown", sort_order=2),
    SpendSegment(label="Savings",  pct=18, segment_type="breakdown", sort_order=3),
    SpendSegment(label="Debt EMI", pct=10, segment_type="breakdown", sort_order=4),
    SpendSegment(label="Surplus",  pct=0,  segment_type="breakdown", sort_order=5),
]

TOP_CATS = [
    TopSpendCategory(name="Housing",       amount=25_000, pct=37, wow=0,   wow_dir="flat", sort_order=1),
    TopSpendCategory(name="Food & dining", amount=9_800,  pct=14, wow=8,   wow_dir="up",   sort_order=2),
    TopSpendCategory(name="Entertainment", amount=6_100,  pct=9,  wow=22,  wow_dir="up",   sort_order=3),
    TopSpendCategory(name="Transport",     amount=3_200,  pct=5,  wow=-11, wow_dir="down", sort_order=4),
    TopSpendCategory(name="Health",        amount=2_800,  pct=4,  wow=3,   wow_dir="up",   sort_order=5),
]

GOALS = [
    FinancialGoal(name="Emergency fund",    target=240_000,   saved=120_000, horizon="12 months", sort_order=1),
    FinancialGoal(name="Vacation — Bali",   target=50_000,    saved=18_500,  horizon="6 months",  sort_order=2),
    FinancialGoal(name="Home down payment", target=1_200_000, saved=180_000, horizon="5 years",   sort_order=3),
]

SALARY = [
    SalaryCredit(month="Jun 2026", expected_date="Jun 1", credited_date="Jun 1", amount=80_000, status="on-time", doc_id="salary_slip_june", sort_order=1),
    SalaryCredit(month="May 2026", expected_date="May 1", credited_date="May 2", amount=80_000, status="late",    doc_id=None,               sort_order=2),
    SalaryCredit(month="Apr 2026", expected_date="Apr 1", credited_date="Apr 1", amount=80_000, status="on-time", doc_id=None,               sort_order=3),
    SalaryCredit(month="Mar 2026", expected_date="Mar 1", credited_date="Mar 1", amount=82_000, status="on-time", doc_id=None,               sort_order=4),
    SalaryCredit(month="Feb 2026", expected_date="Feb 1", credited_date="Feb 3", amount=80_000, status="late",    doc_id=None,               sort_order=5),
    SalaryCredit(month="Jan 2026", expected_date="Jan 1", credited_date="Jan 1", amount=80_000, status="on-time", doc_id=None,               sort_order=6),
]

BUDGET_CATS = [
    BudgetCategory(name="Housing",      budget=25_000, spent=25_000, sort_order=1),
    BudgetCategory(name="Food & dining",budget=12_000, spent=9_800,  sort_order=2),
    BudgetCategory(name="Transport",    budget=5_000,  spent=3_200,  sort_order=3),
    BudgetCategory(name="Entertainment",budget=5_000,  spent=6_100,  sort_order=4),
    BudgetCategory(name="Health",       budget=4_000,  spent=2_800,  sort_order=5),
    BudgetCategory(name="Shopping",     budget=8_000,  spent=5_400,  sort_order=6),
    BudgetCategory(name="Savings / SIP",budget=16_000, spent=14_400, sort_order=7),
]

RECS = [
    # Alerts (is_alert=True)
    RecommendationItem(title="Entertainment spend 22% above last week", detail="", impact="high", is_alert=True,  sort_order=1),
    RecommendationItem(title="Emergency fund below 6-month target",     detail="", impact="high", is_alert=True,  sort_order=2),
    # Recommendations (is_alert=False)
    RecommendationItem(title="Savings gap",   detail="Increase SIP by ₹2,000/month to hit 20% savings rate.",     impact="high",   is_alert=False, sort_order=3),
    RecommendationItem(title="Debt on track", detail="Credit card clears in 8 months at current EMI pace.",        impact="medium", is_alert=False, sort_order=4),
    RecommendationItem(title="Advance tax",   detail="Sept instalment due — set aside ≈ ₹22,900 by Sep 15.",     impact="high",   is_alert=False, sort_order=5),
]


# ── Seed runner ────────────────────────────────────────────────────────────────

async def seed() -> None:
    print("Creating tables (additive)...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async with AsyncSessionLocal() as db:
        await _clear(db)
        await _insert(db)
        await db.commit()

    print("Done.")


async def _clear(db: AsyncSession) -> None:
    tables = [
        RecommendationItem, BudgetCategory, SalaryCredit, FinancialGoal,
        TopSpendCategory, SpendSegment, MonthlyMetric,
        BudgetHealthSnapshot, UserProfile,
    ]
    for model in tables:
        rows = (await db.execute(select(model))).scalars().all()
        for row in rows:
            await db.delete(row)
    await db.flush()
    print(f"  Cleared {len(tables)} tables.")


async def _insert(db: AsyncSession) -> None:
    db.add(PROFILE)
    db.add(HEALTH)
    for row in [*MONTHLY, *SEGMENTS, *TOP_CATS, *GOALS, *SALARY, *BUDGET_CATS, *RECS]:
        db.add(row)
    await db.flush()
    print(f"  Inserted: 1 profile, 1 health snapshot, {len(MONTHLY)} monthly metrics, "
          f"{len(SEGMENTS)} segments, {len(TOP_CATS)} top categories, {len(GOALS)} goals, "
          f"{len(SALARY)} salary credits, {len(BUDGET_CATS)} budget categories, {len(RECS)} recs.")


if __name__ == "__main__":
    asyncio.run(seed())
