export const dynamic = 'force-dynamic'

import { prisma } from '@grspecials/db'
import { AdminPlaceEditor } from '@/components/admin/AdminVenueEditor'

export default async function AdminPlaceNewPage() {
  const categories = await prisma.venueCategory.findMany({ orderBy: { sortOrder: 'asc' } })
  return <AdminPlaceEditor place={null} categories={categories} isNew={true} />
}
