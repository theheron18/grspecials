export const dynamic = 'force-dynamic'

import { prisma } from '@grspecials/db'
import { ResearchPageClient } from '@/components/admin/ResearchPageClient'

export default async function AdminResearchPage() {
  const [dealTypes, categories] = await Promise.all([
    prisma.dealType.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.venueCategory.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
  ])

  return <ResearchPageClient dealTypes={dealTypes} categories={categories} />
}
