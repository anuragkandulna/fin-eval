type SubColor = 'pass' | 'warn' | 'fail' | 'secondary'

interface MetricCard {
  label:    string
  value:    string
  sub:      string
  subColor: SubColor
}

const METRICS: MetricCard[] = [
  { label: 'Health score',    value: '74',       sub: 'Good · +2 pts',         subColor: 'pass'      },
  { label: 'Savings rate',    value: '18%',      sub: '↑ 2% · target 20%',     subColor: 'warn'      },
  { label: 'DTI ratio',       value: '29%',      sub: 'Within 35% limit',       subColor: 'pass'      },
  { label: 'Net worth',       value: '₹18.4L',   sub: '↑ ₹32k this month',     subColor: 'pass'      },
  { label: 'Emergency fund',  value: '4.2 mo',   sub: 'Target 6 months',        subColor: 'warn'      },
  { label: 'Monthly surplus', value: '₹12k',     sub: 'of ₹80k income',         subColor: 'secondary' },
]

const subColorClass: Record<SubColor, string> = {
  pass:      'text-pass',
  warn:      'text-warn',
  fail:      'text-fail',
  secondary: 'text-secondary',
}

export default function BudgetHealthCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {METRICS.map(m => (
        <div key={m.label} className="bg-card rounded-lg border-thin p-3">
          <p
            className="text-secondary font-medium uppercase mb-2 leading-tight"
            style={{ fontSize: 10, letterSpacing: '0.08em' }}
          >
            {m.label}
          </p>
          <p className="text-2xl font-bold text-ink leading-none">{m.value}</p>
          <p className={`text-xs mt-1.5 leading-snug ${subColorClass[m.subColor]}`}>{m.sub}</p>
        </div>
      ))}
    </div>
  )
}
