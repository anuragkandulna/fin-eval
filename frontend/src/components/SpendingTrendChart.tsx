const DATA   = [38, 41, 40, 44, 47, 54]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

const W = 500, H = 120
const PL = 10, PR = 10, PT = 15, PB = 28
const CW = W - PL - PR
const CH = H - PT - PB
const MIN = 35, MAX = 56

export default function SpendingTrendChart() {
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

      {gridYs.map(y => (
        <line key={y} x1={PL} y1={y} x2={W - PR} y2={y}
          stroke="var(--color-grid)" strokeWidth="0.5" />
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
