from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.profile.models import (
    BudgetHealthSnapshot,
    MonthlyMetric,
    SpendSegment,
    TopSpendCategory,
    RecommendationItem,
    UserProfile,
    FinancialGoal,
    SalaryCredit,
    BudgetCategory,
)
from app.profile.schemas import (
    BudgetHealthOut,
    MonthlyMetricOut,
    SpendSegmentOut,
    TopSpendCategoryOut,
    RecommendationItemOut,
    DashboardResponse,
    UserProfileOut,
    TaxSummaryOut,
    FinancialGoalOut,
    SalaryCreditOut,
    BudgetCategoryOut,
    PersonalDataResponse,
)


async def get_dashboard(db: AsyncSession) -> DashboardResponse | None:
    snapshot = (await db.execute(select(BudgetHealthSnapshot).limit(1))).scalar_one_or_none()
    if snapshot is None:
        return None

    metrics = (await db.execute(select(MonthlyMetric).order_by(MonthlyMetric.sort_order))).scalars().all()
    segments = (await db.execute(select(SpendSegment).order_by(SpendSegment.sort_order))).scalars().all()
    categories = (await db.execute(select(TopSpendCategory).order_by(TopSpendCategory.sort_order))).scalars().all()
    rec_rows = (await db.execute(select(RecommendationItem).order_by(RecommendationItem.sort_order))).scalars().all()

    return DashboardResponse(
        budget_health=BudgetHealthOut(**snapshot.model_dump(
            include={
                "health_score", "health_score_change", "savings_rate_pct", "savings_rate_target",
                "dti_pct", "dti_limit", "net_worth_inr", "net_worth_change_inr",
                "emergency_months", "emergency_target_months", "monthly_surplus_inr",
                "monthly_income_inr", "ai_insight",
            }
        )),
        monthly_metrics=[MonthlyMetricOut(month=m.month, income=m.income, spend=m.spend) for m in metrics],
        spend_segments=[SpendSegmentOut(label=s.label, pct=s.pct, amount=s.amount, segment_type=s.segment_type) for s in segments],
        top_categories=[TopSpendCategoryOut(name=c.name, amount=c.amount, pct=c.pct, wow=c.wow, wow_dir=c.wow_dir) for c in categories],
        recommendations=[RecommendationItemOut(title=r.title, detail=r.detail, impact=r.impact, is_alert=r.is_alert) for r in rec_rows if not r.is_alert],
        alerts=[RecommendationItemOut(title=r.title, detail=r.detail, impact=r.impact, is_alert=r.is_alert) for r in rec_rows if r.is_alert],
    )


async def get_personal(db: AsyncSession) -> PersonalDataResponse | None:
    profile = (await db.execute(select(UserProfile).limit(1))).scalar_one_or_none()
    if profile is None:
        return None

    goals = (await db.execute(select(FinancialGoal).order_by(FinancialGoal.sort_order))).scalars().all()
    credits = (await db.execute(select(SalaryCredit).order_by(SalaryCredit.sort_order))).scalars().all()
    budget_cats = (await db.execute(select(BudgetCategory).order_by(BudgetCategory.sort_order))).scalars().all()

    return PersonalDataResponse(
        profile=UserProfileOut(
            full_name=profile.full_name,
            city=profile.city,
            employer=profile.employer,
            take_home_monthly=profile.take_home_monthly,
            annual_ctc=profile.annual_ctc,
            next_credit_date=profile.next_credit_date,
            tax_regime=profile.tax_regime,
        ),
        tax_summary=TaxSummaryOut(
            gross_annual=profile.gross_annual,
            standard_deduction=profile.standard_deduction,
            net_taxable=profile.net_taxable,
            tax_with_cess=profile.tax_with_cess,
        ),
        goals=[FinancialGoalOut(name=g.name, target=g.target, saved=g.saved, horizon=g.horizon) for g in goals],
        salary_credits=[SalaryCreditOut(month=c.month, expected_date=c.expected_date, credited_date=c.credited_date, amount=c.amount, status=c.status, doc_id=c.doc_id) for c in credits],
        budget_categories=[BudgetCategoryOut(name=b.name, budget=b.budget, spent=b.spent) for b in budget_cats],
    )
