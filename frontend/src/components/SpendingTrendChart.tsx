export interface SpendTrendPoint {
  month: string
  spend: number
}

const DEFAULT_POINTS: SpendTrendPoint[] = [
  { month: 'Jan', spend: 38000 },
  { month: 'Feb', spend: 41000 },
  { month: 'Mar', spend: 40000 },
  { month: 'Apr', spend: 44000 },
  { month: 'May', spend: 47000 },
  { month: 'Jun', spend: 54000 },
]

const W = 500, H = 148
const PL = 42, PR = 16, PT = 12, PB = 32
const CW = W - PL - PR
const CH = H - PT - PB

interface Props {
  data?: SpendTrendPoint[]
}

export default function SpendingTrendChart({ data }: Props) {
  const points = data ?? DEFAULT_POINTS
  const MONTHS = points.map(p => p.month)
  // Values in ₹k for chart scale
  const DATA = points.map(p => Math.round(p.spend / 1000))
  const rawMin = Math.min(...DATA)
  const rawMax = Math.max(...DATA)
  const pad = Math.max(2, Math.round((rawMax - rawMin) * 0.15))
  const MIN = Math.max(0, rawMin - pad)
  const MAX = rawMax + pad
  const step = Math.ceil((MAX - MIN) / 3)
  const Y_TICKS = [MIN, MIN + step, MIN + step * 2, MAX]

  const pts = DATA.map((v, i) => ({
    x: PL + (i / (DATA.length - 1)) * CW,
    y: PT + (1 - (v - MIN) / (MAX - MIN)) * CH,
  }))

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1].x},${PT + CH} L${pts[0].x},${PT + CH} Z`
  const gridYs = [PT, PT + CH / 3, PT + (2 * CH) / 3, PT + CH]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: 120 }}
      aria-label="Spending trend — last 6 months"
    >
      <defs>
        <linearGradient id="spend-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="var(--color-brand)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridYs.map((y, index) => (
        <g key={y}>
          <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="var(--color-grid)" strokeWidth="0.5" />
          <text x={PL - 8} y={y + 3} textAnchor="end" fontSize="10" fill="var(--color-secondary)">
            {Y_TICKS[index]}k
          </text>
        </g>
      ))}

      <path d={area} fill="url(#spend-area)" />

      <polyline
        points={pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x.toFixed(1)}
          cy={p.y.toFixed(1)}
          r={i === pts.length - 1 ? 5 : 3}
          fill={i === pts.length - 1 ? 'var(--color-brand)' : 'var(--color-card)'}
          stroke="var(--color-brand)"
          strokeWidth={i === pts.length - 1 ? 0 : 2}
        />
      ))}

      {MONTHS.map((m, i) => (
        <text
          key={m}
          x={(PL + (i / (DATA.length - 1)) * CW).toFixed(1)}
          y={H - 4}
          textAnchor="middle"
          fontSize="11"
          fill="var(--color-secondary)"
          fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
        >
          {m}
        </text>
      ))}
    </svg>
  )
}
