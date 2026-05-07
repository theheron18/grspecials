import { notFound } from 'next/navigation'
import { prisma } from '@grspecials/db'
import { PlacePortal } from '@/components/portal/VenuePortal'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Place Portal — GRspecials.com', robots: { index: false } }

interface PageProps {
  params: { token: string }
}

export default async function PlacePortalPage({ params }: PageProps) {
  const place = await prisma.venue.findUnique({
    where: { portalToken: params.token, portalActive: true },
    include: {
      category: true,
      deals: {
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: {
          dealType: true,
          photos: { take: 1 },
        },
      },
    },
  })

  if (!place) notFound()

  const dealTypes = await prisma.dealType.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  })

  return <PlacePortal place={place as never} dealTypes={dealTypes} token={params.token} />
}
