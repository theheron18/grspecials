/**
 * De-duplication: prevent the same deal from being queued twice.
 * Fuzzy match on venue name + title + approximate date window.
 */

import { prisma } from '@grspecials/db'
import type { ParsedDeal } from '@grspecials/types'

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function similarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.8
  // Simple bigram overlap
  const bigrams = (s: string) => Array.from({ length: s.length - 1 }, (_, i) => s.slice(i, i + 2))
  const setA = new Set(bigrams(na))
  const setB = new Set(bigrams(nb))
  const intersection = [...setA].filter((b) => setB.has(b)).length
  const union = new Set([...setA, ...setB]).size
  return union === 0 ? 0 : intersection / union
}

export async function isDuplicate(deal: ParsedDeal): Promise<boolean> {
  const recent = await prisma.deal.findMany({
    where: {
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    select: {
      title: true,
      venue: { select: { name: true } },
    },
    take: 500,
  })

  for (const existing of recent) {
    const titleSim = similarity(deal.title, existing.title)
    const venueSim = deal.placeName
      ? similarity(deal.placeName, existing.venue.name)
      : 0.5

    if (titleSim > 0.7 && venueSim > 0.5) {
      return true
    }
  }

  return false
}
