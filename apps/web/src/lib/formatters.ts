export function extractPriceLabel(priceNote: string | null | undefined): string {
  if (!priceNote) return ''
  const s = priceNote.trim()
  // "$X off" pattern
  const offMatch = s.match(/\$[\d.]+\s*off/i)
  if (offMatch) return offMatch[0]
  // "from $X" pattern
  const fromMatch = s.match(/from\s+\$[\d.]+/i)
  if (fromMatch) return fromMatch[0]
  // Single price "$X"
  const singleMatch = s.match(/^\$[\d.]+$/)
  if (singleMatch) return singleMatch[0]
  // Multiple prices — find lowest
  const allPrices = [...s.matchAll(/\$(\d+\.?\d*)/g)]
  if (allPrices.length > 1) {
    const lowest = Math.min(...allPrices.map((m) => parseFloat(m[1])))
    return `from $${lowest % 1 === 0 ? lowest : lowest.toFixed(2)}`
  }
  // Short enough to show as-is
  if (s.length <= 12) return s
  // Truncate
  return s.slice(0, 10) + '…'
}
