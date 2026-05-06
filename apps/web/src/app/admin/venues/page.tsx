export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@grspecials/db'
import { Plus } from 'lucide-react'
import { AdminVenuesTable } from '@/components/admin/AdminVenuesTable'
import { Prisma } from '@grspecials/db'

interface PageProps {
  searchParams: { q?: string; page?: string; status?: string; categoryId?: string; sort?: string; dir?: string }
}

export default async function AdminVenuesPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page ?? '1')
  const limit = 20
  const dir = (searchParams.dir === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'

  const where: Prisma.VenueWhereInput = {
    ...(searchParams.status && { status: searchParams.status as 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' }),
    ...(searchParams.categoryId && { categoryId: searchParams.categoryId }),
    ...(searchParams.q && {
      OR: [
        { name: { contains: searchParams.q, mode: 'insensitive' } },
        { address: { contains: searchParams.q, mode: 'insensitive' } },
      ],
    }),
  }

  const orderBy: Prisma.VenueOrderByWithRelationInput =
    searchParams.sort === 'name' ? { name: dir }
    : searchParams.sort === 'category' ? { category: { name: dir } }
    : searchParams.sort === 'neighborhood' ? { neighborhood: dir }
    : searchParams.sort === 'status' ? { status: dir }
    : { createdAt: 'desc' }

  const [venues, total, categoryCounts] = await Promise.all([
    prisma.venue.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { name: true, icon: true } },
        _count: { select: { deals: true } },
      },
    }),
    prisma.venue.count({ where }),
    prisma.venueCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        icon: true,
        _count: { select: { venues: true } },
      },
    }),
  ])

  const pageCount = Math.ceil(total / limit)

  function filterHref(updates: Record<string, string | undefined>) {
    const next = { ...Object.fromEntries(Object.entries(searchParams).filter(([, v]) => v != null) as [string, string][]), ...updates }
    Object.keys(next).forEach(k => next[k] === undefined && delete next[k])
    return `/admin/venues?${new URLSearchParams(next as Record<string, string>).toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Venues</h1>
          <p className="text-sm text-text-secondary">{total} total venues</p>
        </div>
        <Link href="/admin/venues/new"
          className="flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-dark transition-colors">
          <Plus className="h-4 w-4" /> Add Venue
        </Link>
      </div>

      {/* Category summary */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {categoryCounts.map((cat) => (
          <Link
            key={cat.id}
            href={filterHref({ categoryId: searchParams.categoryId === cat.id ? undefined : cat.id, page: '1' })}
            className={`rounded-card border px-3 py-2.5 text-center transition-colors ${
              searchParams.categoryId === cat.id
                ? 'border-brand-blue bg-brand-blue/5'
                : 'border-surface-border bg-white hover:border-brand-blue'
            }`}
          >
            <div className="text-lg">{cat.icon ?? '🏢'}</div>
            <div className="text-xs font-medium text-text-primary mt-0.5">{cat.name}</div>
            <div className="text-xs text-text-muted">{cat._count.venues}</div>
          </Link>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        {([['', 'All'], ['ACTIVE', 'Active'], ['PENDING_VERIFICATION', 'Pending'], ['INACTIVE', 'Inactive']] as [string, string][]).map(([v, label]) => (
          <Link key={v} href={filterHref({ status: v || undefined, page: '1' })}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              (searchParams.status ?? '') === v
                ? 'bg-brand-blue border-brand-blue text-white'
                : 'border-surface-border bg-white text-text-secondary hover:border-brand-blue'
            }`}>
            {label}
          </Link>
        ))}
        <form action="/admin/venues" method="get" className="ml-auto flex gap-2">
          {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
          {searchParams.categoryId && <input type="hidden" name="categoryId" value={searchParams.categoryId} />}
          <input name="q" type="search" placeholder="Search venues…" defaultValue={searchParams.q}
            className="rounded-lg border border-surface-border px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
        </form>
      </div>

      <AdminVenuesTable venues={venues as never} searchParams={searchParams} />

      {pageCount > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link href={filterHref({ page: String(page - 1) })}
              className="rounded-lg border border-surface-border px-3 py-1.5 text-sm hover:border-brand-blue transition-colors">
              ← Previous
            </Link>
          )}
          <span className="px-3 py-1.5 text-sm text-text-muted">Page {page} of {pageCount}</span>
          {page < pageCount && (
            <Link href={filterHref({ page: String(page + 1) })}
              className="rounded-lg border border-surface-border px-3 py-1.5 text-sm hover:border-brand-blue transition-colors">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
