const DATA = [
  { month: 'Jan', income: 80000, spend: 62000 },
  { month: 'Feb', income: 80000, spend: 58400 },
  { month: 'Mar', income: 82000, spend: 71200 },
  { month: 'Apr', income: 80000, spend: 60800 },
  { month: 'May', income: 80000, spend: 65600 },
  { month: 'Jun', income: 80000, spend: 68000 },
]

const W = 360
const H = 140
const PAD_L = 36
const PAD_R = 8
const PAD_T = 8
const PAD_B = 24
const CHART_W = W - PAD_L - PAD_R
const CHART_H = H - PAD_T - PAD_B
const MAX_VAL = 90000
const BAR_W   = Math.floor((CHART_W / DATA.length) * 0.36)
const GROUP_W = CHART_W / DATA.length

function fmt(v: number) {
  return v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`
}

function yPos(v: number) {
  return PAD_T + CHART_H - (v / MAX_VAL) * CHART_H
}

const Y_TICKS = [0, 20000, 40000, 60000, 80000]

export default function SpendVsIncomeChart() {
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {/* Y-axis ticks */}
        {Y_TICKS.map(t => {
          const y = yPos(t)
          return (
            <g key={t}>
              <line x1={PAD_L} x2={W - PAD_R} y1={y} y2={y} stroke="var(--color-border)" strokeWidth={0.5} />
              <text x={PAD_L - 4} y={y + 3.5} textAnchor="end" fontSize={9} fill="var(--color-secondary)">
                {fmt(t)}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {DATA.map((d, i) => {
          const cx   = PAD_L + i * GROUP_W + GROUP_W / 2
          const incH = (d.income / MAX_VAL) * CHART_H
          const spdH = (d.spend  / MAX_VAL) * CHART_H
          return (
            <g key={d.month}>
              {/* Income bar */}
              <rect
                x={cx - BAR_W - 1}
                y={PAD_T + CHART_H - incH}
                width={BAR_W}
                height={incH}
                rx={2}
                fill="var(--color-brand)"
                opacity={0.25}
              />
              {/* Spend bar */}
              <rect
                x={cx + 1}
                y={PAD_T + CHART_H - spdH}
                width={BAR_W}
                height={spdH}
                rx={2}
                fill="var(--color-warn)"
                opacity={0.75}
              />
              {/* Month label */}
              <text
                x={cx}
                y={H - 6}
                textAnchor="middle"
                fontSize={9}
                fill="var(--color-secondary)"
              >
                {d.month}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-xs text-secondary">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'var(--color-brand)', opacity: 0.5 }} />
          Income
        </span>
        <span className="flex items-center gap-1.5 text-xs text-secondary">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'var(--color-warn)', opacity: 0.75 }} />
          Spend
        </span>
      </div>
    </div>
  )
}
