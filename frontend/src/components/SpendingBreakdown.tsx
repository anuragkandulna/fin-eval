interface Segment {
  label:    string
  pct:      number
  color:    string
}

const SEGMENTS: Segment[] = [
  { label: 'Needs',    pct: 48, color: 'var(--color-brand)' },
  { label: 'Wants',    pct: 24, color: 'var(--color-brand-light)' },
  { label: 'Savings',  pct: 18, color: 'var(--color-pass)' },
  { label: 'Debt EMI', pct: 10, color: 'var(--color-warn)' },
  { label: 'Surplus',  pct: 0,  color: 'var(--color-secondary)' },
]

export default function SpendingBreakdown() {
  return (
    <div>
      {/* Stacked bar */}
      <div className="flex h-8 rounded-md overflow-hidden gap-px">
        {SEGMENTS.map(s => (
          <div
            key={s.label}
            style={{
              flex: Math.max(s.pct, s.pct === 0 ? 0 : 1),
              backgroundColor: s.color,
              opacity: s.pct === 0 ? 0.25 : 1,
            }}
            title={`${s.label}: ${s.pct}%`}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="flex mt-2 gap-px">
        {SEGMENTS.map(s => (
          <div
            key={s.label}
            className="text-center overflow-hidden"
            style={{ flex: Math.max(s.pct, s.pct === 0 ? 2 : 1) }}
          >
            <p className="text-xs text-secondary truncate">{s.label}</p>
            <p className="text-xs font-semibold text-ink">{s.pct}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}
