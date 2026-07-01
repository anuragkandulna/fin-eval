type SubColor = 'pass' | 'warn' | 'secondary'

interface MetricCard {
  label: string
  value: string
  sub: string
  subColor: SubColor
}

const METRICS: MetricCard[] = [
  { label: 'Health score',  value: '74',    sub: 'Good',             subColor: 'pass' },
  { label: 'Savings rate',  value: '18%',   sub: 'Below 20% target', subColor: 'warn' },
  { label: 'Debt DTI',      value: '29%',   sub: 'Within limit',     subColor: 'pass' },
  { label: 'Budget left',   value: '₹12k',  sub: 'of ₹80k income',   subColor: 'secondary' },
]

const subColorClass: Record<SubColor, string> = {
  pass:      'text-pass',
  warn:      'text-warn',
  secondary: 'text-secondary',
}

export default function BudgetHealthCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {METRICS.map(m => (
        <div key={m.label} className="bg-card rounded-lg border-thin p-4">
          <p
            className="text-secondary font-medium uppercase mb-2"
            style={{ fontSize: 11, letterSpacing: '0.08em' }}
          >
            {m.label}
          </p>
          <p className="text-3xl font-bold text-ink leading-none">{m.value}</p>
          <p className={`text-sm mt-1.5 ${subColorClass[m.subColor]}`}>{m.sub}</p>
        </div>
      ))}
    </div>
  )
}
