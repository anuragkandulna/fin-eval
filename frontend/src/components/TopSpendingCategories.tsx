const CATEGORIES = [
  { name: 'Housing',       amount: 25000, pct: 37, wow:  0,  wowDir: 'flat' as const },
  { name: 'Food & dining', amount: 9800,  pct: 14, wow:  8,  wowDir: 'up'   as const },
  { name: 'Entertainment', amount: 6100,  pct: 9,  wow:  22, wowDir: 'up'   as const },
  { name: 'Transport',     amount: 3200,  pct: 5,  wow: -11, wowDir: 'down' as const },
  { name: 'Health',        amount: 2800,  pct: 4,  wow:  3,  wowDir: 'up'   as const },
]

const MAX_AMOUNT = CATEGORIES[0].amount

export default function TopSpendingCategories() {
  return (
    <div className="bg-card rounded-lg border-thin p-4 flex flex-col gap-3 h-full">
      <p className="text-sm font-semibold text-ink">Top categories</p>

      <div className="flex flex-col gap-3">
        {CATEGORIES.map((cat, i) => (
          <div key={cat.name} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="text-[10px] font-mono text-secondary w-3 flex-shrink-0"
                  style={{ fontSize: 9 }}
                >
                  {i + 1}
                </span>
                <span className="text-xs text-ink truncate">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {cat.wowDir !== 'flat' && (
                  <span
                    className={`text-[10px] font-medium ${cat.wowDir === 'up' ? 'text-fail' : 'text-pass'}`}
                    style={{ fontSize: 10 }}
                  >
                    {cat.wowDir === 'up' ? '↑' : '↓'}{Math.abs(cat.wow)}%
                  </span>
                )}
                <span className="text-xs font-mono text-ink">₹{(cat.amount / 1000).toFixed(0)}k</span>
              </div>
            </div>
            <div className="h-1 rounded-full bg-brand-tint overflow-hidden">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${(cat.amount / MAX_AMOUNT) * 100}%`, opacity: 0.6 + i * 0.05 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
