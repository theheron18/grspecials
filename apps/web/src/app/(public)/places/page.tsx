import { prisma } from '@grspecials/db'
import { buildMeta } from '@/lib/seo'
import { PlacesListClient } from '@/components/places/PlacesListClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMeta({
  title: 'Places — Grand Rapids Restaurants, Bars & More',
  description: 'Browse all places on GRspecials.com — Grand Rapids restaurants, bars, breweries, and shops with active deals and specials.',
  alternates: { canonical: '/places' },
})

export default async function PlacesPage() {
  const places = await prisma.venue.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ premium: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      neighborhood: true,
      logoUrl: true,
      category: { select: { name: true, icon: true } },
      _count: { select: { deals: { where: { status: 'ACTIVE' } } } },
    },
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Places</h1>
        <p className="text-sm text-text-secondary mt-1">
          {places.length} places in Grand Rapids
        </p>
      </div>

      {places.length > 0 ? (
        <PlacesListClient places={places} />
      ) : (
        <div className="rounded-card border border-surface-border bg-white py-16 text-center text-text-muted text-sm">
          No places yet. Check back soon!
        </div>
      )}
    </div>
  )
}
