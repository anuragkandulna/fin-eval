import { IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-react'

type Trend = 'up' | 'down' | 'flat'
type SubColor = 'pass' | 'warn' | 'fail' | 'secondary'

export interface MetricCard {
  label:    string
  value:    string
  sub:      string
  subColor: SubColor
  trend:    Trend
  testid:   string
}

const METRICS: MetricCard[] = [
  { label: 'Health score',    value: '74',       sub: 'Good · +2 pts',         subColor: 'pass',      trend: 'up',   testid: 'metric-health-score'    },
  { label: 'Savings rate',    value: '18%',      sub: '↑ 2% · target 20%',     subColor: 'warn',      trend: 'up',   testid: 'metric-savings-rate'    },
  { label: 'DTI ratio',       value: '29%',      sub: 'Within 35% limit',       subColor: 'pass',      trend: 'flat', testid: 'metric-dti-ratio'       },
  { label: 'Net worth',       value: '₹18.4L',   sub: '↑ ₹32k this month',     subColor: 'pass',      trend: 'up',   testid: 'metric-net-worth'       },
  { label: 'Emergency fund',  value: '4.2 mo',   sub: 'Target 6 months',        subColor: 'warn',      trend: 'flat', testid: 'metric-emergency-fund'  },
  { label: 'Monthly surplus', value: '₹12k',     sub: 'of ₹80k income',         subColor: 'secondary', trend: 'flat', testid: 'metric-monthly-surplus' },
]

const subColorClass: Record<SubColor, string> = {
  pass:      'text-pass',
  warn:      'text-warn',
  fail:      'text-fail',
  secondary: 'text-secondary',
}

const TrendIcon = ({ trend }: { trend: Trend }) => {
  if (trend === 'up')   return <IconTrendingUp   size={12} stroke={2} aria-hidden="true" />
  if (trend === 'down') return <IconTrendingDown  size={12} stroke={2} aria-hidden="true" />
  return                       <IconMinus         size={12} stroke={2} aria-hidden="true" />
}

interface Props {
  cards?: MetricCard[]
}

export default function BudgetHealthCards({ cards }: Props) {
  const metrics = cards ?? METRICS
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {metrics.map(m => (
        <div
          key={m.label}
          data-testid={m.testid}
          className="bg-card rounded-lg border-thin p-3"
        >
          <p
            className="text-secondary font-medium uppercase mb-2 leading-tight"
            style={{ fontSize: 10, letterSpacing: '0.08em' }}
          >
            {m.label}
          </p>
          <p className="text-2xl font-bold text-ink leading-none">{m.value}</p>
          <p className={`flex items-center gap-1 text-xs mt-1.5 leading-snug ${subColorClass[m.subColor]}`}>
            <TrendIcon trend={m.trend} />
            {m.sub}
          </p>
        </div>
      ))}
    </div>
  )
}
