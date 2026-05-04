import { notFound } from 'next/navigation'
import { prisma } from '@grspecials/db'
import { AdminVenueEditor } from '@/components/admin/AdminVenueEditor'

interface PageProps {
  params: { id: string }
}

export default async function AdminVenueEditPage({ params }: PageProps) {
  const [venue, categories] = await Promise.all([
    prisma.venue.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        photos: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { deals: true } },
      },
    }),
    prisma.venueCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])

  if (!venue) notFound()

  return <AdminVenueEditor venue={venue as never} categories={categories} isNew={false} />
}
