import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@grspecials/db'
import { buildMeta, dealJsonLd, breadcrumbJsonLd } from '@/lib/seo'
import { Badge, SourceBadge, FeaturedBadge } from '@/components/ui/Badge'
import { formatActiveDays, formatDealHours, getExpiryLabel } from '@/lib/utils'
import { MapPin, Clock, Calendar, Phone, ChevronRight } from 'lucide-react'
import { ShareSection } from './ShareSection'
import { ClickTracker } from './ClickTracker'
import type { Metadata } from 'next'

interface PageProps {
  params: { placeSlug: string; dealSlug: string }
}

async function getDeal(placeSlug: string, dealSlug: string) {
  return prisma.deal.findFirst({
    where: { slug: dealSlug, status: 'ACTIVE', venue: { slug: placeSlug } },
    include: {
      venue: true,
      category: true,
      dealType: true,
      neighborhood: true,
      photos: { orderBy: { sortOrder: 'asc' } },
    },
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const deal = await getDeal(params.placeSlug, params.dealSlug)
  if (!deal) return {}

  return buildMeta({
    title: `${deal.title} — ${deal.venue.name}`,
    description: deal.metaDescription ?? deal.shortDesc ?? deal.description.slice(0, 160),
    openGraph: {
      type: 'website',
      title: deal.metaTitle ?? deal.title,
      description: deal.metaDescription ?? deal.description.slice(0, 160),
      images: deal.ogImageUrl
        ? [deal.ogImageUrl]
        : deal.photos[0]
        ? [deal.photos[0].url]
        : undefined,
    },
  })
}

export default async function DealDetailPage({ params }: PageProps) {
  const deal = await getDeal(params.placeSlug, params.dealSlug)
  if (!deal) notFound()

  await prisma.deal.update({ where: { id: deal.id }, data: { views: { increment: 1 } } })

  const expiry = getExpiryLabel(deal.endDate)
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://grspecials.com'
  const dealUrl = `${BASE_URL}/deals/${params.placeSlug}/${params.dealSlug}`

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dealJsonLd({ ...deal, place: deal.venue } as never)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Home', url: '/' },
              { name: 'Deals', url: '/deals' },
              { name: deal.category.name, url: `/deals?category=${deal.category.slug}` },
              { name: deal.title, url: `/deals/${params.placeSlug}/${params.dealSlug}` },
            ]),
          ),
        }}
      />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-text-muted flex-wrap" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-brand-blue">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/deals" className="hover:text-brand-blue">Deals</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/deals?category=${deal.category.slug}`} className="hover:text-brand-blue">
            {deal.category.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-text-secondary truncate max-w-[200px]">{deal.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photos */}
            {deal.photos.length > 0 && (
              <div className="overflow-hidden rounded-card">
                <div className="relative h-64 sm:h-80 bg-gray-100">
                  <Image
                    src={deal.photos[0].url}
                    alt={deal.photos[0].altText ?? deal.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  {deal.featured && (
                    <div className="absolute top-3 left-3"><FeaturedBadge /></div>
                  )}
                </div>
                {deal.photos.length > 1 && (
                  <div className="flex gap-2 p-2 bg-white border-t border-surface-border overflow-x-auto scrollbar-hide">
                    {deal.photos.slice(1).map((photo: { url: string; altText: string | null }, i) => (
                      <div key={i} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
                        <Image src={photo.url} alt={photo.altText ?? ''} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Deal title & badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge color={deal.category.color ?? undefined}>
                  {deal.category.icon} {deal.category.name}
                </Badge>
                <Badge color={deal.dealType.color ?? undefined}>
                  {deal.dealType.icon} {deal.dealType.name}
                </Badge>
                <SourceBadge source={deal.source} />
              </div>
              <h1 className="text-2xl font-bold text-text-primary sm:text-3xl text-balance">
                {deal.title}
              </h1>
              {expiry && (
                <p className={`mt-2 text-sm font-medium ${expiry.urgent ? 'text-brand-red' : 'text-text-secondary'}`}>
                  ⏰ {expiry.label}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none text-text-primary">
              <p className="whitespace-pre-wrap leading-relaxed">{deal.description}</p>
            </div>

            {/* Deal details */}
            <div className="rounded-card border border-surface-border bg-white p-5 space-y-3">
              <h2 className="font-semibold text-text-primary">Deal Details</h2>
              {deal.priceNote && (
                <div className="flex items-start gap-2.5">
                  <span className="text-brand-yellow text-lg leading-none">🏷️</span>
                  <div>
                    <p className="text-xs text-text-muted">Pricing</p>
                    <p className="text-sm font-medium text-text-primary">{deal.priceNote}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-text-muted">Valid Days</p>
                  <p className="text-sm text-text-primary">{formatActiveDays(deal.activeDays)}</p>
                </div>
              </div>
              {(deal.startTime || deal.endTime) && (
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-text-muted mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-text-muted">Hours</p>
                    <p className="text-sm text-text-primary">{formatDealHours(deal.startTime, deal.endTime)}</p>
                  </div>
                </div>
              )}
              {deal.endDate && (
                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none mt-0.5">📅</span>
                  <div>
                    <p className="text-xs text-text-muted">Expires</p>
                    <p className="text-sm text-text-primary">{deal.endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Share */}
            <ShareSection dealUrl={dealUrl} dealTitle={deal.title} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Venue card */}
            <div className="rounded-card border border-surface-border bg-white p-5">
              <div className="flex items-start gap-3 mb-4">
                {deal.venue.logoUrl ? (
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-surface-border shrink-0">
                    <Image src={deal.venue.logoUrl} alt={deal.venue.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-yellow/10 text-xl shrink-0">
                    {deal.category.icon ?? '🏪'}
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-text-primary text-sm">{deal.venue.name}</h2>
                  {deal.venue.verified && (
                    <span className="text-xs text-brand-blue">✓ Verified Place</span>
                  )}
                  <p className="text-xs text-text-muted mt-0.5">{deal.category.name}</p>
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-start gap-2 text-text-secondary">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{deal.venue.address}, {deal.venue.city}, {deal.venue.state}</span>
                </div>
                {deal.venue.phone && (
                  <a href={`tel:${deal.venue.phone}`} className="flex items-center gap-2 text-brand-blue hover:underline">
                    <Phone className="h-4 w-4" />
                    {deal.venue.phone}
                  </a>
                )}
                {deal.venue.website && (
                  <ClickTracker dealId={deal.id} website={deal.venue.website} />
                )}
              </div>

              {deal.venue.latitude && deal.venue.longitude && (
                <div className="mt-4 rounded-lg overflow-hidden h-32 bg-gray-100 flex items-center justify-center text-text-muted text-xs">
                  <a
                    href={`https://maps.google.com/?q=${deal.venue.latitude},${deal.venue.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 text-brand-blue hover:underline"
                  >
                    <MapPin className="h-5 w-5" />
                    Open in Google Maps
                  </a>
                </div>
              )}
            </div>

            {/* Submit deal CTA */}
            <div className="rounded-card border border-surface-border bg-surface-bg p-4 text-center">
              <p className="text-xs text-text-secondary mb-2">Know a deal this place is missing?</p>
              <Link
                href="/submit-a-deal"
                className="text-xs font-medium text-brand-blue hover:underline"
              >
                Submit it →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

