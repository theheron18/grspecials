export const dynamic = 'force-dynamic'

import { prisma } from '@grspecials/db'
import { NotificationsPanel } from '@/components/admin/NotificationsPanel'

export default async function AdminNotificationsPage() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const [categories, neighborhoods] = await Promise.all([
    prisma.venueCategory.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.neighborhood.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Notifications</h1>
        <p className="text-sm text-text-secondary">Send push notifications and emails to subscribed users.</p>
      </div>
      <NotificationsPanel notifications={notifications as never} categories={categories} neighborhoods={neighborhoods} />
    </div>
  )
}
