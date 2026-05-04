export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import Link from 'next/link'
import { Search, MapPin, ChevronRight } from 'lucide-react'
import { prisma } from '@grspecials/db'
import { DealCard } from '@/components/deals/DealCard'
import { DealCardSkeleton } from '@/components/ui/Skeleton'
import { buildMeta } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = buildMeta()
export const revalidate = 300 // ISR: revalidate every 5 minutes

async function getHomepageData() {
  const [featured, recent, categories, config] = await Promise.all([
    prisma.deal.findMany({
      where: { status: 'ACTIVE', featured: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        venue: { select: { id: true, name: true, slug: true, address: true, neighborhood: true, latitude: true, longitude: true, verified: true, logoUrl: true } },
        category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        dealType: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        photos: { take: 1, orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.deal.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        venue: { select: { id: true, name: true, slug: true, address: true, neighborhood: true, latitude: true, longitude: true, verified: true, logoUrl: true } },
        category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        dealType: { select: { id: true, name: true, slug: true, icon: true, color: true } },
        photos: { take: 1, orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.venueCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { deals: { where: { status: 'ACTIVE' } } } } },
    }),
    prisma.siteConfig.findMany(),
  ])

  const configMap = Object.fromEntries(config.map((c) => [c.key, c.value]))
  return { featured, recent, categories, config: configMap }
}

export default async function HomePage() {
  const { featured, recent, categories, config } = await getHomepageData()

  const headline = config['hero_headline'] ?? "Grand Rapids' Best Deals & Specials"
  const subline = config['hero_subline'] ?? 'Find happy hours, daily specials, events, and sales near you.'

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-blue to-brand-blue-dark text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-brand-yellow" />
            <span className="text-sm font-medium text-blue-200">Grand Rapids, MI</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-balance mb-4">
            {headline}
          </h1>
          <p className="text-lg text-blue-100 mb-8 text-balance">{subline}</p>

          {/* Search bar */}
          <div className="flex gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <form action="/deals" method="get">
                <input
                  name="q"
                  type="search"
                  placeholder="Search deals, venues, or specials…"
                  className="w-full rounded-xl border-0 pl-10 pr-4 py-3.5 text-text-primary shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow text-sm"
                />
              </form>
            </div>
            <Link
              href="/deals"
              className="rounded-xl bg-brand-yellow px-5 py-3.5 text-sm font-semibold text-text-primary hover:bg-brand-yellow-dark transition-colors shadow-lg whitespace-nowrap"
            >
              Browse All
            </Link>
          </div>

          {/* Quick stats */}
          <p className="mt-4 text-xs text-blue-300">
            {recent.length > 0 && `${featured.length} featured · ${recent.length}+ active deals`}
          </p>
        </div>
      </section>

      {/* Category quick-links */}
      <section className="bg-white border-b border-surface-border">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
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
                {cat.icon} {cat.name}
                {cat._count.deals > 0 && (
                  <span className="ml-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-text-muted">
                    {cat._count.deals}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
        {/* Featured deals */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="section-title">⭐ Featured Deals</h2>
                <p className="text-sm text-text-secondary mt-0.5">Hand-picked specials worth knowing about</p>
              </div>
              <Link href="/deals?featured=true" className="text-sm font-medium text-brand-blue hover:underline flex items-center gap-1">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <Suspense fallback={<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array(3).fill(0).map((_, i) => <DealCardSkeleton key={i} />)}</div>}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((deal) => (
                  <DealCard key={deal.id} deal={deal as never} />
                ))}
              </div>
            </Suspense>
          </section>
        )}

        {/* Category sections */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title">🗺️ Browse by Category</h2>
              <p className="text-sm text-text-secondary mt-0.5">Find exactly what you're looking for</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {categories.map((cat) => (
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

        {/* Recently added */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title">🆕 Recently Added</h2>
              <p className="text-sm text-text-secondary mt-0.5">Fresh deals added in the last few days</p>
            </div>
            <Link href="/deals?sort=newest" className="text-sm font-medium text-brand-blue hover:underline flex items-center gap-1">
              See more <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recent.map((deal) => (
              <DealCard key={deal.id} deal={deal as never} />
            ))}
          </div>
        </section>

        {/* CTA — Submit a deal */}
        <section className="rounded-card bg-gradient-to-r from-brand-yellow/10 to-brand-blue/10 border border-brand-yellow/20 p-8 text-center">
          <h2 className="text-xl font-bold text-text-primary mb-2">Know a deal we're missing?</h2>
          <p className="text-text-secondary mb-5">
            Help the Grand Rapids community find great specials. Submit any deal — it only takes 2 minutes.
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
