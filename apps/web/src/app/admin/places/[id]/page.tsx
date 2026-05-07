import { notFound } from 'next/navigation'
import { prisma } from '@grspecials/db'
import { AdminPlaceEditor } from '@/components/admin/AdminVenueEditor'

interface PageProps {
  params: { id: string }
}

export default async function AdminPlaceEditPage({ params }: PageProps) {
  const [place, categories] = await Promise.all([
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

  if (!place) notFound()

  return <AdminPlaceEditor place={place as never} categories={categories} isNew={false} />
}
