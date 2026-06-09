export function extractPriceLabel(priceNote: string | null | undefined): string {
  if (!priceNote) return ''
  const s = priceNote.trim()

  // Find all price patterns
  const prices = [...s.matchAll(/\$(\d+\.?\d*)/g)]

  // "$X off" pattern — show as-is if short
  const offMatch = s.match(/\$[\d.]+\s*off/i)
  if (offMatch && offMatch[0].length <= 10) return offMatch[0]

  // Single price only — show it
  if (prices.length === 1) {
    const val = prices[0][0]
    if (val.length <= 8) return val
  }

  // Multiple prices — show lowest with "from"
  if (prices.length > 1) {
    const lowest = Math.min(...prices.map((m) => parseFloat(m[1])))
    const formatted = lowest % 1 === 0 ? `$${lowest}` : `$${lowest.toFixed(2)}`
    return `from ${formatted}`
  }

  // No price found — show first 10 chars
  if (s.length <= 10) return s
  return s.slice(0, 8) + '…'
}
