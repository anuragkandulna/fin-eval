interface Rec {
  color: string
  title: string
  detail: string
}

const RECS: Rec[] = [
  { color: 'var(--color-warn)', title: 'Savings gap',      detail: 'Increase SIP by ₹2,000 to hit 20% savings rate' },
  { color: 'var(--color-pass)', title: 'Debt on track',    detail: 'Credit card cleared in 8 months' },
  { color: 'var(--color-brand)',title: 'Tax opportunity',  detail: '₹34k 80C headroom remaining' },
]

export default function Recommendations() {
  return (
    <div className="bg-card rounded-lg border-thin p-4 flex flex-col gap-3">
      <p className="text-sm font-semibold text-ink">Recommendations</p>
      {RECS.map(r => (
        <div key={r.title} className="flex gap-3 items-start">
          <span
            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
            style={{ backgroundColor: r.color }}
          />
          <div>
            <p className="text-sm font-medium text-ink leading-tight">{r.title}</p>
            <p className="text-xs text-secondary mt-0.5 leading-snug">{r.detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
