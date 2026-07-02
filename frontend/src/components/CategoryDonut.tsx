const SEGMENTS = [
  { label: 'Needs',   pct: 50, color: 'var(--color-brand)',       amount: '₹34,000' },
  { label: 'Wants',   pct: 20, color: 'var(--color-warn)',        amount: '₹13,600' },
  { label: 'Savings', pct: 18, color: 'var(--color-pass)',        amount: '₹12,240' },
  { label: 'EMI',     pct: 12, color: 'var(--color-brand-light)', amount: '₹8,160'  },
]

const CX = 64
const CY = 64
const R  = 50
const INNER_R = 30
const CIRC = 2 * Math.PI * R

function segPath(pct: number): string {
  const len = (pct / 100) * CIRC
  const gap = CIRC - len
  return `${len} ${gap}`
}

export default function CategoryDonut() {
  let cumulative = 0

  return (
    <div data-testid="chart-category-donut" className="bg-card rounded-lg border-thin p-4 h-full flex flex-col">
      <p className="text-sm font-semibold text-ink mb-3">Spend breakdown</p>

      <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 flex-1">
        {/* SVG donut */}
        <div className="flex-shrink-0 self-center">
          <svg viewBox="0 0 128 128" width={128} height={128}>
            {/* Background ring */}
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={R - INNER_R}
            />

            {SEGMENTS.map(seg => {
              const dasharray = segPath(seg.pct)
              const dashoffset = -(cumulative / 100) * CIRC
              cumulative += seg.pct
              return (
                <circle
                  key={seg.label}
                  cx={CX} cy={CY} r={R}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={R - INNER_R}
                  strokeDasharray={dasharray}
                  strokeDashoffset={dashoffset}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${CX} ${CY})`}
                />
              )
            })}

            {/* Center label */}
            <text x={CX} y={CY - 5} textAnchor="middle" fontSize={10} fill="var(--color-secondary)">Total</text>
            <text x={CX} y={CY + 9} textAnchor="middle" fontSize={12} fontWeight="600" fill="var(--color-ink)">₹68k</text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 flex-1 min-w-0 w-full">
          {SEGMENTS.map(seg => (
            <div key={seg.label} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <div className="min-w-0">
                <span className="text-xs text-ink leading-tight break-words">{seg.label}</span>
                <p className="text-[11px] text-secondary mt-0.5">{seg.amount}</p>
              </div>
              <span className="text-xs font-medium text-ink flex-shrink-0">{seg.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
