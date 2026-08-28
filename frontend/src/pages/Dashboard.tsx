import { useQuery }            from '@tanstack/react-query'
import { useChat }              from '../contexts/ChatContext'
import { getDashboard }         from '../api/client'
import type {
  BudgetHealthData,
  MonthlyMetric,
  SpendSegment,
  TopCategory,
  RecommendationItem,
} from '../api/client'

import BudgetHealthCards      from '../components/BudgetHealthCards'
import type { MetricCard }    from '../components/BudgetHealthCards'
import SpendVsIncomeChart     from '../components/SpendVsIncomeChart'
import CategoryDonut          from '../components/CategoryDonut'
import SpendingTrendChart     from '../components/SpendingTrendChart'
import TopSpendingCategories  from '../components/TopSpendingCategories'
import SpendingBreakdown      from '../components/SpendingBreakdown'
import Recommendations        from '../components/Recommendations'

import { formatINRCompact, formatPct } from '../utils/currency'

function buildHealthCards(h: BudgetHealthData): MetricCard[] {
  return [
    { label: 'Health score',    value: String(h.health_score),              sub: `Good · +${h.health_score_change} pts`,                        subColor: 'pass',      trend: 'up',   testid: 'metric-health-score'    },
    { label: 'Savings rate',    value: formatPct(h.savings_rate_pct, 0),    sub: `↑ 2% · target ${h.savings_rate_target}%`,                      subColor: 'warn',      trend: 'up',   testid: 'metric-savings-rate'    },
    { label: 'DTI ratio',       value: formatPct(h.dti_pct, 0),             sub: `Within ${h.dti_limit}% limit`,                                  subColor: 'pass',      trend: 'flat', testid: 'metric-dti-ratio'       },
    { label: 'Net worth',       value: formatINRCompact(h.net_worth_inr),   sub: `↑ ${formatINRCompact(h.net_worth_change_inr)} this month`,       subColor: 'pass',      trend: 'up',   testid: 'metric-net-worth'       },
    { label: 'Emergency fund',  value: `${h.emergency_months} mo`,          sub: `Target ${h.emergency_target_months} months`,                    subColor: 'warn',      trend: 'flat', testid: 'metric-emergency-fund'  },
    { label: 'Monthly surplus', value: formatINRCompact(h.monthly_surplus_inr), sub: `of ${formatINRCompact(h.monthly_income_inr)} income`,       subColor: 'secondary', trend: 'flat', testid: 'metric-monthly-surplus' },
  ]
}

function DashboardContent() {
  const { chatState } = useChat()
  const chatDocked = chatState === 'docked'

  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn:  getDashboard,
    staleTime: 5 * 60 * 1000,
  })

  const healthCards = data ? buildHealthCards(data.budget_health) : undefined
  const monthlyMetrics = data?.monthly_metrics
  const spendTrend = data?.monthly_metrics.map((m: MonthlyMetric) => ({ month: m.month, spend: m.spend }))
  const donutSegs  = data?.spend_segments.filter((s: SpendSegment) => s.segment_type === 'donut')
  const breakdownSegs = data?.spend_segments
    .filter((s: SpendSegment) => s.segment_type === 'breakdown')
    .map((s: SpendSegment) => ({ label: s.label, pct: s.pct }))
  const topCats:    TopCategory[]       | undefined = data?.top_categories
  const recs:       RecommendationItem[] | undefined = data?.recommendations
  const alerts:     RecommendationItem[] | undefined = data?.alerts
  const aiInsight:  string               | undefined = data?.budget_health.ai_insight

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className={`px-5 py-5 gap-5 min-h-full ${chatDocked ? 'flex flex-col' : 'flex flex-col md:flex-row md:items-start'}`}>

        {/* Recommendations */}
        <div className={`${chatDocked ? 'w-full' : 'w-full md:w-64 lg:w-72 flex-shrink-0 order-1 md:order-2 md:sticky md:top-5 md:self-start'}`}>
          <p className="text-secondary font-medium uppercase mb-3" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
            Recommendations
          </p>
          <Recommendations recs={recs} alerts={alerts} aiInsight={aiInsight} />
        </div>

        {/* Budget Health + Charts */}
        <div className={`flex flex-col gap-5 min-w-0 ${chatDocked ? 'w-full' : 'flex-1 order-2 md:order-1'}`}>

          <div>
            <p className="text-secondary font-medium uppercase mb-3" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
              Budget health
            </p>
            <BudgetHealthCards cards={healthCards} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-card rounded-lg border-thin p-4">
              <p className="text-sm font-semibold text-ink mb-3">Monthly spend vs income</p>
              <SpendVsIncomeChart data={monthlyMetrics} />
            </div>

            <div className="bg-card rounded-lg border-thin p-4">
              <p className="text-sm font-semibold text-ink mb-3">Spending trend — last 6 months</p>
              <SpendingTrendChart data={spendTrend} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CategoryDonut segments={donutSegs} />
              <TopSpendingCategories categories={topCats} />
            </div>

            <div className="bg-card rounded-lg border-thin p-4">
              <p className="text-sm font-semibold text-ink mb-4">Spending breakdown</p>
              <SpendingBreakdown segments={breakdownSegs} />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <DashboardContent />
    </div>
  )
}
