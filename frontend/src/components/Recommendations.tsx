import { IconAlertTriangle } from '@tabler/icons-react'

interface Rec {
  color:   string
  title:   string
  detail:  string
  impact:  'high' | 'medium' | 'low'
}

const RECS: Rec[] = [
  { color: 'var(--color-warn)',  title: 'Savings gap',     detail: 'Increase SIP by ₹2,000/month to hit 20% savings rate.',   impact: 'high'   },
  { color: 'var(--color-pass)',  title: 'Debt on track',   detail: 'Credit card clears in 8 months at current EMI pace.',       impact: 'medium' },
  { color: 'var(--color-brand)', title: 'Advance tax',     detail: 'Sept instalment due — set aside ≈ ₹22,900 by Sep 15.',   impact: 'high'   },
]

const ALERTS = [
  { text: 'Entertainment spend 22% above last week', color: 'var(--color-fail)' },
  { text: 'Emergency fund below 6-month target',     color: 'var(--color-warn)' },
]

const IMPACT_BADGE: Record<Rec['impact'], string> = {
  high:   'status-fail',
  medium: 'status-warn',
  low:    'status-idle',
}

export default function Recommendations() {
  return (
    <div className="bg-card rounded-lg border-thin p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Recommendations</p>
        <span className="text-[10px] font-mono text-secondary uppercase tracking-wide">AI · prompt v3</span>
      </div>

      {/* Threshold alerts */}
      {ALERTS.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {ALERTS.map(a => (
            <div key={a.text} className="flex items-center gap-2 rounded-md px-2.5 py-1.5" style={{ background: 'var(--color-snow)' }}>
              <IconAlertTriangle size={12} stroke={2} style={{ color: a.color, flexShrink: 0 }} />
              <span className="text-xs text-ink">{a.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actionable items */}
      <div className="flex flex-col gap-3">
        {RECS.map(r => (
          <div key={r.title} data-testid={`rec-${r.title.toLowerCase().replace(/\s+/g, '-')}`} className="flex gap-3 items-start">
            <span
              className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
              style={{ backgroundColor: r.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-medium text-ink leading-tight">{r.title}</p>
                <span className={`text-[10px] font-medium rounded px-1 py-0.5 ${IMPACT_BADGE[r.impact]}`}>
                  {r.impact}
                </span>
              </div>
              <p className="text-xs text-secondary leading-snug">{r.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AI insight */}
      <div
        className="rounded-md px-3 py-2.5"
        style={{ background: 'var(--color-brand-tint)', border: '0.5px solid var(--color-grid)' }}
      >
        <p className="text-xs text-ink leading-relaxed">
          <span className="font-semibold text-brand">AI insight · </span>
          Your spend pattern is healthy overall, but entertainment is trending 22% above your 4-week average.
          Redirecting ₹2,000/month there would close your savings gap and fund an ELSS top-up in one move.
        </p>
      </div>
    </div>
  )
}
