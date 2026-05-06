export const dynamic = 'force-dynamic'

import { prisma } from '@grspecials/db'
import { AdminDealEditor } from '@/components/admin/AdminDealEditor'

export default async function AdminDealNewPage() {
  const [categories, dealTypes, neighborhoods] = await Promise.all([
    prisma.venueCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.dealType.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.neighborhood.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])

  return (
    <AdminDealEditor
      deal={null}
      categories={categories}
      dealTypes={dealTypes}
      neighborhoods={neighborhoods}
      isNew={true}
    />
  )
}
