export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, ChevronRight } from 'lucide-react'
import { prisma } from '@grspecials/db'
import { DealCard } from '@/components/deals/DealCard'
import { DealCardSkeleton } from '@/components/ui/Skeleton'
import { buildMeta } from '@/lib/seo'
import { getTodaysHoliday } from '@/lib/holidays'
import { getTodaysDrinkDay } from '@/lib/drinkDays'
import {
  isActiveNow,
  startsWithinMinutes,
  isActiveLaterToday,
  getMinutesUntilStart,
} from '@/lib/dealTime'
import type { Metadata } from 'next'

export const metadata: Metadata = buildMeta()

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

async function getHolidayDeals() {
  const holiday = await getTodaysHoliday()
  if (!holiday) return null

  const deals = await prisma.deal.findMany({
    where: {
      status: 'ACTIVE',
      tags: { has: holiday.tag },
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
    },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    take: 6,
    include: dealInclude,
  })

  if (deals.length === 0) return null
  return { holiday, deals: deals.map(({ venue, ...rest }) => ({ ...rest, place: venue })) }
}

async function getHomepageData() {
  const [allDeals, categories, config] = await Promise.all([
    prisma.deal.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: 200,
      include: dealInclude,
    }),
    prisma.venueCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { deals: { where: { status: 'ACTIVE' } } } } },
    }),
    prisma.siteConfig.findMany(),
  ])

  const deals = allDeals.map(({ venue, ...rest }) => ({ ...rest, place: venue }))

  const activeNow = deals.filter(isActiveNow).slice(0, 8)
  const startingSoon = deals
    .filter((d) => startsWithinMinutes(d, 120))
    .sort((a, b) => getMinutesUntilStart(a) - getMinutesUntilStart(b))
    .slice(0, 6)
  const featured = deals.filter((d) => d.featured).slice(0, 6)
  const laterToday = deals.filter(isActiveLaterToday).slice(0, 6)

  // Exclude deals already in buckets 1–4 from Recently Added
  const shownIds = new Set(
    [...activeNow, ...startingSoon, ...featured, ...laterToday].map((d) => d.id),
  )
  const recent = deals.filter((d) => !shownIds.has(d.id)).slice(0, 8)

  const configMap = Object.fromEntries(config.map((c) => [c.key, c.value]))
  return { activeNow, startingSoon, featured, laterToday, recent, categories, config: configMap }
}

export default async function HomePage() {
  const [
    { activeNow, startingSoon, featured, laterToday, recent, categories, config },
    holidayData,
  ] = await Promise.all([getHomepageData(), getHolidayDeals()])
  const drinkDay = getTodaysDrinkDay()

  const headline = config['hero_headline'] ?? "Grand Rapids' Best Deals & Specials"
  const subline = config['hero_subline'] ?? 'Find happy hours, daily specials, events, and sales near you.'

  const holidayBannerTitle = holidayData
    ? config[`banner_holiday_${holidayData.holiday.tag}_title`] ||
      `${holidayData.holiday.emoji} ${holidayData.holiday.name} Specials`
    : ''
  const holidayBannerSubtitle = holidayData
    ? config[`banner_holiday_${holidayData.holiday.tag}_subtitle`] ||
      holidayData.holiday.drinkFocus
    : ''
  const drinkDayTagline = drinkDay
    ? config[`banner_drinkday_${drinkDay.tag}_tagline`] || drinkDay.tagline
    : ''

  const noTimedDeals =
    activeNow.length === 0 && startingSoon.length === 0 && laterToday.length === 0

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-blue to-brand-blue-dark text-white">
        <div className="mx-auto max-w-4xl px-4 pt-3 pb-3 sm:px-6 md:py-20 text-center">
          {/* Logo: shown on both mobile and desktop */}
          <div className="flex items-center justify-center mb-6">
            <Image
              src="/logos/logo-horizontal-light.svg"
              alt="GRspecials"
              width={340}
              height={80}
              className="mx-auto"
              unoptimized
            />
          </div>

          {/* h1 kept in DOM for SEO, hidden visually on desktop */}
          <h1 className="md:sr-only text-3xl font-extrabold tracking-tight sm:text-5xl text-balance mb-4">
            {headline}
          </h1>
          <p className="text-base md:text-lg text-blue-100 mb-8 text-balance">{subline}</p>

          {/* Search bar */}
          <div className="flex gap-2 max-w-xl mx-auto mt-3 md:mt-0">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <form action="/deals" method="get">
                <input
                  name="q"
                  type="search"
                  placeholder="Search deals, venues, or specials…"
                  className="w-full rounded-xl border-0 pl-10 pr-4 h-11 sm:py-3.5 text-text-primary shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow text-sm"
                />
              </form>
            </div>
            <Link
              href="/deals"
              className="rounded-xl bg-brand-yellow px-5 h-11 sm:py-3.5 text-sm font-semibold text-text-primary hover:bg-brand-yellow-dark transition-colors shadow-lg whitespace-nowrap flex items-center"
            >
              <span className="md:hidden">Search</span>
              <span className="hidden md:inline">Browse All</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Category quick-links */}
      <section className="bg-white border-b border-surface-border">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          {/* Mobile: time-based filter pills */}
          <div className="flex md:hidden gap-2 overflow-x-auto scrollbar-hide pb-1">
            <Link
              href="/deals"
              className="touch-pill rounded-full border border-brand-blue bg-brand-blue text-white whitespace-nowrap text-sm font-medium shrink-0"
            >
              All
            </Link>
            <Link
              href="/deals?time=now"
              className="touch-pill rounded-full border border-surface-border bg-white text-text-secondary whitespace-nowrap text-sm font-medium shrink-0 gap-1.5"
            >
              <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
              Right now
              {activeNow.length > 0 && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white shrink-0">
                  {activeNow.length}
                </span>
              )}
            </Link>
            <Link
              href="/deals?time=today"
              className="touch-pill rounded-full border border-surface-border bg-white text-text-secondary whitespace-nowrap text-sm font-medium shrink-0"
            >
              Today
            </Link>
            <Link
              href="/deals"
              className="touch-pill rounded-full border border-surface-border bg-white text-text-secondary whitespace-nowrap text-sm font-medium shrink-0"
            >
              This week
            </Link>
          </div>

          {/* Desktop: category pills */}
          <div className="hidden md:flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <Link
              href="/deals"
              className="flex items-center gap-1.5 rounded-full border border-surface-border bg-white px-3.5 py-2 text-sm font-medium text-text-secondary hover:border-brand-blue hover:text-brand-blue whitespace-nowrap transition-colors shrink-0"
            >
              🏷️ All Deals
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/deals?category=${cat.slug}`}
                className="flex items-center gap-1.5 rounded-full border border-surface-border bg-white px-3.5 py-2 text-sm font-medium text-text-secondary hover:border-brand-blue hover:text-brand-blue whitespace-nowrap transition-colors shrink-0"
              >
                {cat.icon} <span>{cat.name}</span>
                {cat._count.deals > 0 && (
                  <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-text-muted">
                    {cat._count.deals}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-10 sm:px-6 lg:px-8 space-y-6 sm:space-y-12">
        {/* Holiday banner */}
        {holidayData && (
          <section className="rounded-card border-2 border-brand-yellow/40 bg-gradient-to-r from-brand-yellow/10 to-orange-50 overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-lg font-bold text-text-primary">{holidayBannerTitle}</h2>
                <p className="text-sm text-text-secondary mt-0.5">{holidayBannerSubtitle}</p>
                <p className="text-xs text-text-muted mt-1">
                  {holidayData.deals.length} deal{holidayData.deals.length !== 1 ? 's' : ''}{' '}
                  available today
                </p>
              </div>
              <Link
                href={`/deals?tag=${holidayData.holiday.tag}`}
                className="text-sm font-medium text-brand-blue hover:underline flex items-center gap-1 shrink-0"
              >
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="px-5 pb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {holidayData.deals.map((deal) => (
                <DealCard key={deal.id} deal={deal as never /* place already mapped */} />
              ))}
            </div>
          </section>
        )}

        {/* National drink day callout */}
        {drinkDay && (
          <div className="flex items-center gap-3 rounded-card border border-surface-border bg-white px-5 py-3.5">
            <span className="text-2xl shrink-0">{drinkDay.emoji}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">
                Today is{' '}
                <Link
                  href={`/deals?tag=${drinkDay.tag}`}
                  className="text-brand-blue hover:underline"
                >
                  {drinkDay.name}
                </Link>
              </p>
              <p className="text-xs text-text-secondary mt-0.5 truncate">{drinkDayTagline}</p>
            </div>
          </div>
        )}

        {/* Time-based buckets or empty state — only show empty state when there are also no featured/recent deals */}
        {noTimedDeals && featured.length === 0 && recent.length === 0 ? (
          <div className="rounded-card border border-surface-border bg-white px-6 py-10 text-center">
            <p className="text-base font-medium text-text-primary mb-1">
              No deals active right now
            </p>
            <p className="text-sm text-text-secondary">
              Check back tomorrow or{' '}
              <Link href="/deals" className="text-brand-blue hover:underline">
                browse all deals below
              </Link>
              .
            </p>
          </div>
        ) : !noTimedDeals ? (
          <>
            {/* Bucket 1: Happening Now */}
            {activeNow.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="section-title">🟢 Happening Now</h2>
                    <p className="text-sm text-text-secondary mt-0.5">
                      Deals active at this moment
                    </p>
                  </div>
                  <Link
                    href="/deals?time=now"
                    className="text-sm font-medium text-brand-blue hover:underline flex items-center gap-1"
                  >
                    See all <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {activeNow.map((deal) => (
                    <DealCard key={deal.id} deal={deal as never /* place already mapped */} isActive />
                  ))}
                </div>
              </section>
            )}

            {/* Bucket 2: Starting Soon */}
            {startingSoon.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="section-title">⏰ Starting Soon</h2>
                    <p className="text-sm text-text-secondary mt-0.5">
                      Deals starting in the next 2 hours
                    </p>
                  </div>
                  <Link
                    href="/deals?time=2h"
                    className="text-sm font-medium text-brand-blue hover:underline flex items-center gap-1"
                  >
                    See all <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {startingSoon.map((deal) => (
                    <DealCard key={deal.id} deal={deal as never /* place already mapped */} />
                  ))}
                </div>
              </section>
            )}

            {/* Bucket 4: Later Today */}
            {laterToday.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="section-title">📅 Later Today</h2>
                    <p className="text-sm text-text-secondary mt-0.5">Coming up later today</p>
                  </div>
                  <Link
                    href="/deals?time=today"
                    className="text-sm font-medium text-brand-blue hover:underline flex items-center gap-1"
                  >
                    See all <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {laterToday.map((deal) => (
                    <DealCard key={deal.id} deal={deal as never /* place already mapped */} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : null}

        {/* Bucket 3: Featured */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title">⭐ Featured Deals</h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  Hand-picked specials worth knowing about
                </p>
              </div>
              <Link
                href="/deals?featured=true"
                className="text-sm font-medium text-brand-blue hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <Suspense
              fallback={
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <DealCardSkeleton key={i} />
                    ))}
                </div>
              }
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((deal) => (
                  <DealCard key={deal.id} deal={deal as never /* place already mapped */} />
                ))}
              </div>
            </Suspense>
          </section>
        )}

        {/* Bucket 5: Recently Added — excludes deals already in buckets 1–4 */}
        {recent.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title">🆕 Recently Added</h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  Fresh deals added in the last few days
                </p>
              </div>
              <Link
                href="/deals?sort=newest"
                className="text-sm font-medium text-brand-blue hover:underline flex items-center gap-1"
              >
                See more <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recent.map((deal) => (
                <DealCard key={deal.id} deal={deal as never /* place already mapped */} />
              ))}
            </div>
          </section>
        )}

        {/* Bucket 6: Browse by Category */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title">🗺️ Browse by Category</h2>
              <p className="text-sm text-text-secondary mt-0.5">
                Find exactly what you&apos;re looking for
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {categories.filter((cat) => cat._count.deals > 0).map((cat) => (
              <Link
                key={cat.slug}
                href={`/deals?category=${cat.slug}`}
                className="group flex flex-col items-center gap-2 rounded-card border border-surface-border bg-white p-4 text-center hover:border-brand-blue hover:shadow-card transition-all"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ background: `${cat.color ?? '#F5C518'}18` }}
                >
                  {cat.icon ?? '🏷️'}
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary group-hover:text-brand-blue transition-colors leading-tight">
                    {cat.name}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{cat._count.deals} deals</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA — Submit a deal */}
        <section className="rounded-card bg-gradient-to-r from-brand-yellow/10 to-brand-blue/10 border border-brand-yellow/20 p-8 text-center">
          <h2 className="text-xl font-bold text-text-primary mb-2">Know a deal we&apos;re missing?</h2>
          <p className="text-text-secondary mb-5">
            Help the Grand Rapids community find great specials. Submit any deal — it only takes 2
            minutes.
          </p>
          <Link
            href="/submit-a-deal"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-yellow px-6 py-3 font-semibold text-text-primary hover:bg-brand-yellow-dark transition-colors"
          >
            Submit a Deal →
          </Link>
        </section>
      </div>
    </>
  )
}
