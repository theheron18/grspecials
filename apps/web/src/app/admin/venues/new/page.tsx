import { prisma } from '@grspecials/db'
import { AdminVenueEditor } from '@/components/admin/AdminVenueEditor'

export default async function AdminVenueNewPage() {
  const categories = await prisma.venueCategory.findMany({ orderBy: { sortOrder: 'asc' } })
  return <AdminVenueEditor venue={null} categories={categories} isNew={true} />
}
