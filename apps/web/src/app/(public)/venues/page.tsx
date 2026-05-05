import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@grspecials/db'
import { buildMeta } from '@/lib/seo'
import { MapPin } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMeta({
  title: 'Venues — Grand Rapids Restaurants, Bars & More',
  description: 'Browse all venues on GRspecials.com — Grand Rapids restaurants, bars, breweries, and shops with active deals and specials.',
  alternates: { canonical: '/venues' },
})

export default async function VenuesPage() {
  const venues = await prisma.venue.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ premium: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      city: true,
      neighborhood: true,
      verified: true,
      premium: true,
      logoUrl: true,
      category: { select: { name: true, icon: true, slug: true } },
      _count: { select: { deals: { where: { status: 'ACTIVE' } } } },
    },
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Venues</h1>
        <p className="text-sm text-text-secondary mt-1">
          {venues.length} venues with active deals in Grand Rapids
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((venue) => (
          <Link
            key={venue.id}
            href={`/venues/${venue.slug}`}
            className="flex items-start gap-3 rounded-card border border-surface-border bg-white p-4 hover:border-brand-blue hover:shadow-card-hover transition-all"
          >
            <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-surface-border bg-surface-bg">
              {venue.logoUrl ? (
                <Image src={venue.logoUrl} alt={venue.name} fill className="object-contain p-1" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-xl">
                  {venue.category.icon ?? '🏪'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-text-primary text-sm truncate">{venue.name}</span>
                {venue.verified && (
                  <span className="text-brand-blue text-xs" title="Verified">✓</span>
                )}
                {venue.premium && (
                  <span className="text-xs" title="Premium">⭐</span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">{venue.category.icon} {venue.category.name}</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-text-muted">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{venue.neighborhood ?? venue.city}</span>
              </div>
              <p className="text-xs font-medium text-brand-blue mt-1">
                {venue._count.deals} active deal{venue._count.deals !== 1 ? 's' : ''}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {venues.length === 0 && (
        <div className="rounded-card border border-surface-border bg-white py-16 text-center text-text-muted text-sm">
          No venues yet. Check back soon!
        </div>
      )}
    </div>
  )
}
