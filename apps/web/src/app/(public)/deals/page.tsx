export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { prisma } from '@grspecials/db'
import { DealGrid } from '@/components/deals/DealGrid'
import { DealFilters } from '@/components/deals/DealFilters'
import { buildMeta } from '@/lib/seo'
import type { Metadata } from 'next'
import type { DealFilters as DealFiltersType } from '@grspecials/types'
import { DealCardSkeleton } from '@/components/ui/Skeleton'
import { MapViewToggle } from '@/components/deals/MapViewToggle'
import {
  isActiveNow,
  startsWithinMinutes,
  getMinutesUntilStart,
  getEasternDayInt,
  type TimeFilter,
} from '@/lib/dealTime'

export const metadata: Metadata = buildMeta({
  title: 'All Deals & Specials in Grand Rapids',
  description:
    'Browse all active deals, happy hours, daily specials, and events across Grand Rapids, MI.',
})

interface PageProps {
  searchParams: {
    category?: string
    dealType?: string
    neighborhood?: string
    day?: string
    sort?: string
    q?: string
    tag?: string
    page?: string
    view?: string
    time?: string
  }
}

const dealInclude = {
  venue: {
    select: {
      id: true, name: true, slug: true, address: true, neighborhood: true,
      latitude: true, longitude: true, verified: true, logoUrl: true,
    },
  },
  category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
  dealType: { select: { id: true, name: true, slug: true, icon: true, color: true } },
  photos: { take: 1, orderBy: { sortOrder: 'asc' as const } },
} as const

function parseTimeFilter(raw: string | undefined): TimeFilter | undefined {
  if (raw === 'now' || raw === '2h' || raw === 'today' || raw === 'all') return raw
  return undefined
}

async function getSmartDefaultTime(): Promise<'now' | 'today'> {
  const etDay = getEasternDayInt()
  const nowDeals = await prisma.deal.findMany({
    where: {
      status: 'ACTIVE',
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      activeDays: { has: etDay },
    },
    select: { activeDays: true, startTime: true, endTime: true },
    take: 50,
  })
  return nowDeals.some(isActiveNow) ? 'now' : 'today'
}

async function getDeals(filters: DealFiltersType, timeFilter: TimeFilter) {
  const { category, dealType, neighborhood, day, tag, q, sort, page = 1, limit = 24 } = filters

  const now = new Date()
  const etDay = getEasternDayInt()

  // For time-based filters, restrict to today's ET day and ignore the ?day param
  const dayConstraint = timeFilter !== 'all' ? etDay : day

  const baseWhere = {
    status: 'ACTIVE' as const,
    OR: [{ endDate: null }, { endDate: { gte: now } }],
    ...(category && { category: { slug: category } }),
    ...(dealType && { dealType: { slug: dealType } }),
    ...(neighborhood && { neighborhood: { slug: neighborhood } }),
    ...(dayConstraint !== undefined && { activeDays: { has: dayConstraint } }),
    ...(tag && { tags: { has: tag } }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
        { venue: { name: { contains: q, mode: 'insensitive' as const } } },
      ],
    }),
  }

  if (timeFilter === 'now' || timeFilter === '2h') {
    // Fetch all today's matching deals, then post-filter and sort by time
    const allToday = await prisma.deal.findMany({
      where: baseWhere,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' as const }],
      take: 500,
      include: dealInclude,
    })

    const mapped = allToday.map(({ venue, ...rest }) => ({ ...rest, place: venue }))
    const filtered =
      timeFilter === 'now'
        ? mapped.filter(isActiveNow)
        : mapped.filter((d) => isActiveNow(d) || startsWithinMinutes(d, 120))

    // Active now first, then soonest start
    filtered.sort((a, b) => {
      const aActive = isActiveNow(a)
      const bActive = isActiveNow(b)
      if (aActive && !bActive) return -1
      if (!aActive && bActive) return 1
      return getMinutesUntilStart(a) - getMinutesUntilStart(b)
    })

    const total = filtered.length
    const skip = ((page as number) - 1) * (limit as number)
    return {
      deals: filtered.slice(skip, skip + (limit as number)),
      total,
      pageCount: Math.ceil(total / (limit as number)),
    }
  }

  // 'today' and 'all': standard DB-level pagination
  const orderBy =
    sort === 'ending_soon'
      ? { endDate: 'asc' as const }
      : sort === 'most_popular'
      ? { views: 'desc' as const }
      : sort === 'alphabetical'
      ? { title: 'asc' as const }
      : { createdAt: 'desc' as const }

  const skip = ((page as number) - 1) * (limit as number)

  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where: baseWhere,
      orderBy: [{ featured: 'desc' }, orderBy],
      skip,
      take: limit,
      include: dealInclude,
    }),
    prisma.deal.count({ where: baseWhere }),
  ])

  return {
    deals: deals.map(({ venue, ...rest }) => ({ ...rest, place: venue })),
    total,
    pageCount: Math.ceil(total / (limit as number)),
  }
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
    tag: searchParams.tag,
    q: searchParams.q,
    page,
    limit: 24,
  }

  // Determine effective time filter — smart default when ?time is absent
  const rawTime = parseTimeFilter(searchParams.time)
  const effectiveTime: TimeFilter = rawTime ?? (await getSmartDefaultTime())

  const [{ deals, total, pageCount }, taxonomy] = await Promise.all([
    getDeals(filters, effectiveTime),
    getTaxonomy(),
  ])

  const isMapView = searchParams.view === 'map'
  const etDay = getEasternDayInt()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {searchParams.tag
              ? `${searchParams.tag
                  .replace(/-/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase())} Specials`
              : searchParams.category
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

      {/* Filters — time filter bar is at the top inside DealFilters */}
      <Suspense>
        <DealFilters
          categories={taxonomy.categories}
          dealTypes={taxonomy.dealTypes}
          neighborhoods={taxonomy.neighborhoods}
          effectiveTime={effectiveTime}
        />
      </Suspense>

      <div className="mt-6">
        {isMapView ? (
          <MapViewSection filters={filters} timeFilter={effectiveTime} etDay={etDay} />
        ) : (
          <>
            {deals.length === 0 ? (
              <div className="rounded-card border border-surface-border bg-white px-6 py-12 text-center">
                <p className="text-base font-medium text-text-primary mb-1">No deals found</p>
                <p className="text-sm text-text-secondary">
                  Try a different time filter or{' '}
                  <a href="/deals?time=all" className="text-brand-blue hover:underline">
                    browse all deals
                  </a>
                  .
                </p>
              </div>
            ) : (
              <DealGrid deals={deals as never} />
            )}

            {pageCount > 1 && (
              <Pagination
                currentPage={page}
                pageCount={pageCount}
                searchParams={searchParams}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

async function MapViewSection({
  filters,
  timeFilter,
  etDay,
}: {
  filters: DealFiltersType
  timeFilter: TimeFilter
  etDay: number
}) {
  const { DealsMapSection } = await import('@/components/deals/DealsMapSection')
  return <DealsMapSection filters={filters} timeFilter={timeFilter} etDay={etDay} />
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
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== 'page') params.set(k, v)
    })
    params.set('page', String(p))
    return `/deals?${params.toString()}`
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <a
          href={buildUrl(currentPage - 1)}
          className="rounded-lg border border-surface-border px-4 py-2 text-sm hover:border-brand-blue hover:text-brand-blue transition-colors"
        >
          ← Previous
        </a>
      )}
      <span className="text-sm text-text-secondary px-3">
        Page {currentPage} of {pageCount}
      </span>
      {currentPage < pageCount && (
        <a
          href={buildUrl(currentPage + 1)}
          className="rounded-lg border border-surface-border px-4 py-2 text-sm hover:border-brand-blue hover:text-brand-blue transition-colors"
        >
          Next →
        </a>
      )}
    </div>
  )
}
