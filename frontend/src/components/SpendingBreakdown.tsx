interface Segment {
  label: string
  pct:   number
  color: string
}

const SEGMENTS: Segment[] = [
  { label: 'Needs',    pct: 48, color: 'var(--color-brand)' },
  { label: 'Wants',    pct: 24, color: 'var(--color-brand-light)' },
  { label: 'Savings',  pct: 18, color: 'var(--color-pass)' },
  { label: 'Debt EMI', pct: 10, color: 'var(--color-warn)' },
  { label: 'Surplus',  pct: 0,  color: 'var(--color-secondary)' },
]

// Both bar and label use the same flex so columns stay aligned.
// 0% items get a minimum of 7 flex units so the label always has readable space.
const flexFor = (pct: number) => (pct === 0 ? 7 : pct)

export default function SpendingBreakdown() {
  return (
    <div>
      {/* Stacked bar */}
      <div className="flex h-8 rounded-md overflow-hidden gap-px">
        {SEGMENTS.map(s => (
          <div
            key={s.label}
            style={{
              flex:            flexFor(s.pct),
              backgroundColor: s.color,
              opacity:         s.pct === 0 ? 0 : 1,
            }}
            title={`${s.label}: ${s.pct}%`}
          />
        ))}
      </div>

      {/* Labels — same flex as bars so text aligns under its segment */}
      <div className="flex mt-2 gap-px">
        {SEGMENTS.map(s => (
          <div
            key={s.label}
            className="text-center"
            style={{ flex: flexFor(s.pct), minWidth: 0 }}
          >
            <p className="text-xs text-secondary truncate">{s.label}</p>
            <p className="text-xs font-semibold text-ink">{s.pct}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}
