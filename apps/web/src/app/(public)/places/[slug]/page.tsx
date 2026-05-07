import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@grspecials/db'
import { buildMeta, placeJsonLd, breadcrumbJsonLd } from '@/lib/seo'
import { DealCard } from '@/components/deals/DealCard'
import { MapPin, Phone, Globe, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { slug: string }
}

const dealCardSelect = {
  id: true, title: true, slug: true, shortDesc: true, status: true, source: true,
  featured: true, startTime: true, endTime: true, activeDays: true, endDate: true,
  priceNote: true, views: true, createdAt: true, tags: true,
  venue: {
    select: {
      id: true, name: true, slug: true, address: true, neighborhood: true,
      latitude: true, longitude: true, verified: true, logoUrl: true,
    },
  },
  category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
  dealType: { select: { id: true, name: true, slug: true, icon: true, color: true } },
  photos: { select: { url: true, altText: true }, orderBy: { sortOrder: 'asc' as const }, take: 1 },
}

async function getPlace(slug: string) {
  return prisma.venue.findFirst({
    where: { slug, status: 'ACTIVE' },
    include: {
      category: { select: { name: true, slug: true, icon: true } },
      deals: {
        where: { status: 'ACTIVE' },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        select: dealCardSelect,
      },
    },
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const place = await getPlace(params.slug)
  if (!place) return {}

  const dealCount = place.deals.length
  const description = place.metaDescription
    ?? place.description?.slice(0, 160)
    ?? `${dealCount} active deal${dealCount !== 1 ? 's' : ''} at ${place.name} in Grand Rapids, MI.`

  return buildMeta({
    title: `${place.name} — Deals & Specials`,
    description,
    alternates: { canonical: `/places/${place.slug}` },
    openGraph: {
      type: 'website',
      title: place.metaTitle ?? place.name,
      description,
      ...(place.logoUrl && { images: [{ url: place.logoUrl, width: 400, height: 400, alt: place.name }] }),
    },
  })
}

export default async function PlacePage({ params }: PageProps) {
  const place = await getPlace(params.slug)
  if (!place) notFound()

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.address} ${place.city} ${place.state}`)}`

  // Map Prisma's venue relation to place for DealCard type compatibility
  const deals = place.deals.map(({ venue, ...rest }) => ({ ...rest, place: venue }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(placeJsonLd({
            ...place,
            city: place.city,
            state: place.state,
            neighborhood: place.neighborhood,
            latitude: place.latitude,
            longitude: place.longitude,
            verified: place.verified,
            premium: place.premium,
            logoUrl: place.logoUrl,
            activeDealsCount: place.deals.length,
            category: place.category,
            phone: place.phone ?? undefined,
            website: place.website ?? undefined,
            description: place.description ?? undefined,
            zip: place.zip ?? undefined,
          })),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'Deals', url: '/deals' },
            { name: place.name, url: `/places/${place.slug}` },
          ])),
        }}
      />

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-text-muted">
          <Link href="/" className="hover:text-brand-blue">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/deals" className="hover:text-brand-blue">Deals</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-text-secondary">{place.name}</span>
        </nav>

        {/* Place header */}
        <div className="rounded-card border border-surface-border bg-white p-6 flex flex-col sm:flex-row gap-5">
          {place.logoUrl && (
            <div className="shrink-0">
              <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-surface-border bg-surface-bg">
                <Image src={place.logoUrl} alt={place.name} fill className="object-contain p-1.5" unoptimized />
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-text-primary">{place.name}</h1>
              {place.verified && (
                <span className="inline-flex items-center rounded-full bg-brand-blue/10 px-2 py-0.5 text-xs font-medium text-brand-blue">
                  ✓ Verified
                </span>
              )}
              {place.premium && (
                <span className="inline-flex items-center rounded-full bg-brand-yellow/15 px-2 py-0.5 text-xs font-medium text-brand-yellow-dark">
                  ⭐ Premium
                </span>
              )}
            </div>
            <p className="text-sm text-text-muted mb-3">
              {place.category.icon} {place.category.name}
            </p>
            {place.description && (
              <div className="text-sm text-text-secondary mb-3 space-y-2">
                {place.description.split(/\n\n+/).map((para, i) => (
                  <p key={i}>{para.trim()}</p>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-secondary">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-brand-blue">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {place.address}, {place.city}, {place.state}
              </a>
              {place.phone && (
                <a href={`tel:${place.phone}`} className="flex items-center gap-1.5 hover:text-brand-blue">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {place.phone}
                </a>
              )}
              {place.website && (
                <a href={place.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-brand-blue">
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  {place.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Deals */}
        <section>
          <h2 className="text-base font-semibold text-text-primary mb-4">
            Active Deals
            <span className="ml-2 text-sm font-normal text-text-muted">({place.deals.length})</span>
          </h2>
          {deals.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} showSource={false} />
              ))}
            </div>
          ) : (
            <div className="rounded-card border border-surface-border bg-white py-12 text-center text-text-muted text-sm">
              No active deals right now. Check back soon!
            </div>
          )}
        </section>

        {/* Back link */}
        <Link href="/deals" className="inline-flex items-center gap-1.5 text-sm text-brand-blue hover:underline">
          ← Browse all deals
        </Link>
      </div>
    </>
  )
}
