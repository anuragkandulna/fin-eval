const INR = new Intl.NumberFormat('en-IN', {
  style:    'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const INR_COMPACT = new Intl.NumberFormat('en-IN', {
  style:                 'currency',
  currency:              'INR',
  notation:              'compact',
  maximumFractionDigits: 1,
})

/** Full format: ₹1,14,000 */
export function formatINR(amount: number): string {
  return INR.format(amount)
}

/** Compact format: ₹1.1L or ₹34k */
export function formatINRCompact(amount: number): string {
  return INR_COMPACT.format(amount)
}

/** Percentage with one decimal: 18.4% */
export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}
