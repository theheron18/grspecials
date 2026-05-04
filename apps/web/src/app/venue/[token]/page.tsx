import { notFound } from 'next/navigation'
import { prisma } from '@grspecials/db'
import { VenuePortal } from '@/components/portal/VenuePortal'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Venue Portal — GRspecials.com', robots: { index: false } }

interface PageProps {
  params: { token: string }
}

export default async function VenuePortalPage({ params }: PageProps) {
  const venue = await prisma.venue.findUnique({
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

  if (!venue) notFound()

  const dealTypes = await prisma.dealType.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
  })

  return <VenuePortal venue={venue as never} dealTypes={dealTypes} token={params.token} />
}
