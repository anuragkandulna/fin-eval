export interface BreakdownSegment {
  label: string
  pct:   number
}

const LABEL_COLOR: Record<string, string> = {
  Needs:      'var(--color-brand)',
  Wants:      'var(--color-brand-light)',
  Savings:    'var(--color-pass)',
  'Debt EMI': 'var(--color-warn)',
  Surplus:    'var(--color-secondary)',
}
const DEFAULT_COLOR = 'var(--color-secondary)'

const DEFAULT_SEGMENTS: BreakdownSegment[] = [
  { label: 'Needs',    pct: 48 },
  { label: 'Wants',    pct: 24 },
  { label: 'Savings',  pct: 18 },
  { label: 'Debt EMI', pct: 10 },
  { label: 'Surplus',  pct: 0  },
]

interface Props {
  segments?: BreakdownSegment[]
}

// Both bar and label use the same flex so columns stay aligned.
// 0% items get a minimum of 7 flex units so the label always has readable space.
const flexFor = (pct: number) => (pct === 0 ? 7 : pct)

export default function SpendingBreakdown({ segments }: Props) {
  const SEGMENTS = segments ?? DEFAULT_SEGMENTS
  return (
    <div>
      {/* Stacked bar */}
      <div className="flex h-8 rounded-md overflow-hidden gap-px">
        {SEGMENTS.map(s => (
          <div
            key={s.label}
            style={{
              flex:            flexFor(s.pct),
              backgroundColor: LABEL_COLOR[s.label] ?? DEFAULT_COLOR,
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
