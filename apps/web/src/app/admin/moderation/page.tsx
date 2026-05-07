export const dynamic = 'force-dynamic'

import { prisma } from '@grspecials/db'
import { ModerationQueue } from '@/components/admin/ModerationQueue'

export default async function AdminModerationPage() {
  const deals = await prisma.deal.findMany({
    where: { status: 'PENDING_REVIEW' },
    orderBy: { createdAt: 'asc' },
    include: {
      venue: { select: { id: true, name: true, address: true } },
      category: { select: { name: true, icon: true } },
      dealType: { select: { name: true, icon: true } },
      photos: { take: 1 },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Moderation Queue</h1>
        <p className="text-sm text-text-secondary">
          {deals.length} deal{deals.length !== 1 ? 's' : ''} pending review
        </p>
      </div>
      <ModerationQueue deals={deals.map(({ venue, ...rest }) => ({ ...rest, place: venue }))} />
    </div>
  )
}
