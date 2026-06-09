/**
 * Save extracted deals to the database as PENDING_REVIEW + AUTO_SCRAPED.
 * De-duplicates before inserting.
 */

import { prisma, DealStatus, DealSource } from '@grspecials/db'
import type { ParsedDeal } from '@grspecials/types'
import { isDuplicate } from './dedup.js'
import { mapDealTypeSlug } from '../parser/llm.js'

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function enqueueDeal(deal: ParsedDeal, sourceId: string): Promise<boolean> {
  if (await isDuplicate(deal)) {
    console.log(`[enqueue] Skipping duplicate: "${deal.title}"`)
    return false
  }

  // Find or create a stub venue
  let venue = deal.placeName
    ? await prisma.venue.findFirst({
        where: { name: { contains: deal.placeName, mode: 'insensitive' } },
        select: { id: true, categoryId: true },
      })
    : null

  if (!venue && deal.placeName) {
    const defaultCategory = await prisma.venueCategory.findFirst({
      where: { slug: 'other' },
      select: { id: true },
    })
    venue = await prisma.venue.create({
      data: {
        name: deal.placeName,
        slug: `${slugify(deal.placeName)}-${Date.now()}`,
        address: 'Grand Rapids, MI',
        categoryId: defaultCategory!.id,
        status: 'PENDING_VERIFICATION',
      },
      select: { id: true, categoryId: true },
    })
  }

  if (!venue) return false

  const dealTypeSlug = mapDealTypeSlug(deal.dealTypeSuggestion)
  const dealType = await prisma.dealType.findFirst({
    where: { slug: dealTypeSlug },
    select: { id: true },
  })
  if (!dealType) return false

  const slug = `${slugify(deal.title)}-${Date.now()}`

  await prisma.deal.create({
    data: {
      title: deal.title,
      slug,
      description: deal.description,
      venueId: venue.id,
      categoryId: venue.categoryId,
      dealTypeId: dealType.id,
      status: DealStatus.PENDING_REVIEW,
      source: DealSource.AUTO_SCRAPED,
      activeDays: deal.validDays ?? [0, 1, 2, 3, 4, 5, 6],
      startTime: deal.startTime,
      endTime: deal.endTime,
      endDate: deal.endDate ? new Date(deal.endDate) : undefined,
      priceNote: deal.priceNote,
      adminNotes: `Auto-scraped from: ${deal.sourceUrl}`,
    },
  })

  console.log(`[enqueue] Queued: "${deal.title}"`)
  return true
}
