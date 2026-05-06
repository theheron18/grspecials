export const dynamic = 'force-dynamic'

import { prisma } from '@grspecials/db'
import { ScraperManager } from '@/components/admin/ScraperManager'

export default async function AdminScraperPage() {
  const [sources, recentRuns] = await Promise.all([
    prisma.scraperSource.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        venue: { select: { id: true, name: true } },
        runs: { take: 1, orderBy: { startedAt: 'desc' } },
      },
    }),
    prisma.scraperRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 20,
      include: { source: { select: { url: true, type: true } } },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Scraper Management</h1>
        <p className="text-sm text-text-secondary">
          Configure automated deal discovery from Facebook, Instagram, and websites.
        </p>
      </div>
      <ScraperManager sources={sources as never} recentRuns={recentRuns as never} />
    </div>
  )
}
