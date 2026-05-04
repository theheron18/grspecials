import { Suspense } from 'react'
import { prisma } from '@grspecials/db'
import { DealGrid } from '@/components/deals/DealGrid'
import { DealFilters } from '@/components/deals/DealFilters'
import { buildMeta } from '@/lib/seo'
import type { Metadata } from 'next'
import type { DealFilters as DealFiltersType } from '@grspecials/types'
import { DealCardSkeleton } from '@/components/ui/Skeleton'
import { MapViewToggle } from '@/components/deals/MapViewToggle'

export const metadata: Metadata = buildMeta({
  title: 'All Deals & Specials in Grand Rapids',
  description: 'Browse all active deals, happy hours, daily specials, and events across Grand Rapids, MI.',
})

export const revalidate = 60

interface PageProps {
  searchParams: {
    category?: string
    dealType?: string
    neighborhood?: string
    day?: string
    sort?: string
    q?: string
    page?: string
    view?: string
  }
}

async function getDeals(filters: DealFiltersType) {
  const { category, dealType, neighborhood, day, q, sort, page = 1, limit = 24 } = filters

  const where = {
    status: 'ACTIVE' as const,
    ...(category && { category: { slug: category } }),
    ...(dealType && { dealType: { slug: dealType } }),
    ...(neighborhood && { neighborhood: { slug: neighborhood } }),
    ...(day !== undefined && { activeDays: { has: day } }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
        { venue: { name: { contains: q, mode: 'insensitive' as const } } },
      ],
    }),
  }

  const orderBy =
    sort === 'ending_soon' ? { endDate: 'asc' as const }
    : sort === 'most_popular' ? { views: 'desc' as const }
    : sort === 'alphabetical' ? { title: 'asc' as const }
    : { createdAt: 'desc' as const }

  const skip = ((page as number) - 1) * limit

  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      orderBy: [{ featured: 'desc' }, orderBy],
      skip,
      take: limit,
      include: {
        venue: { select: { id: true, name: true, slug: true, address: true, neighborhood: true, latitude: true, longitude: true, verified: true, logoUrl: true } },
        category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        dealType: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        photos: { take: 1, orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.deal.count({ where }),
  ])

  return { deals, total, pageCount: Math.ceil(total / limit) }
}

async function getTaxonomy() {
  const [categories, dealTypes, neighborhoods] = await Promise.all([
    prisma.venueCategory.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.dealType.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.neighborhood.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
  ])
  return { categories, dealTypes, neighborhoods }
}

export default async function DealsPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page ?? '1')
  const filters: DealFiltersType = {
    category: searchParams.category,
    dealType: searchParams.dealType,
    neighborhood: searchParams.neighborhood,
    day: searchParams.day !== undefined ? parseInt(searchParams.day) : undefined,
    sort: (searchParams.sort as DealFiltersType['sort']) ?? 'newest',
    q: searchParams.q,
    page,
    limit: 24,
  }

  const [{ deals, total, pageCount }, taxonomy] = await Promise.all([
    getDeals(filters),
    getTaxonomy(),
  ])

  const isMapView = searchParams.view === 'map'

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {searchParams.category
              ? taxonomy.categories.find((c) => c.slug === searchParams.category)?.name ?? 'Deals'
              : searchParams.dealType
              ? taxonomy.dealTypes.find((d) => d.slug === searchParams.dealType)?.name ?? 'Deals'
              : searchParams.q
              ? `Results for "${searchParams.q}"`
              : 'All Deals & Specials'}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {total} deal{total !== 1 ? 's' : ''} in Grand Rapids
          </p>
        </div>
        <MapViewToggle isMapView={isMapView} />
      </div>

      {/* Filters */}
      <Suspense>
        <DealFilters
          categories={taxonomy.categories}
          dealTypes={taxonomy.dealTypes}
          neighborhoods={taxonomy.neighborhoods}
        />
      </Suspense>

      <div className="mt-6">
        {isMapView ? (
          <MapViewSection filters={filters} />
        ) : (
          <>
            <DealGrid deals={deals as never} />

            {/* Pagination */}
            {pageCount > 1 && (
              <Pagination currentPage={page} pageCount={pageCount} searchParams={searchParams} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

async function MapViewSection({ filters }: { filters: DealFiltersType }) {
  const { DealsMapSection } = await import('@/components/deals/DealsMapSection')
  return <DealsMapSection filters={filters} />
}

function Pagination({
  currentPage,
  pageCount,
  searchParams,
}: {
  currentPage: number
  pageCount: number
  searchParams: Record<string, string | undefined>
}) {
  function buildUrl(p: number) {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([k, v]) => { if (v && k !== 'page') params.set(k, v) })
    params.set('page', String(p))
    return `/deals?${params.toString()}`
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <a href={buildUrl(currentPage - 1)} className="rounded-lg border border-surface-border px-4 py-2 text-sm hover:border-brand-blue hover:text-brand-blue transition-colors">
          ← Previous
        </a>
      )}
      <span className="text-sm text-text-secondary px-3">
        Page {currentPage} of {pageCount}
      </span>
      {currentPage < pageCount && (
        <a href={buildUrl(currentPage + 1)} className="rounded-lg border border-surface-border px-4 py-2 text-sm hover:border-brand-blue hover:text-brand-blue transition-colors">
          Next →
        </a>
      )}
    </div>
  )
}
