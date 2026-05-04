import Link from 'next/link'
import { prisma } from '@grspecials/db'
import { formatRelativeDate } from '@/lib/utils'
import { Plus, ExternalLink } from 'lucide-react'

interface PageProps {
  searchParams: { q?: string; page?: string; status?: string }
}

export default async function AdminVenuesPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page ?? '1')
  const limit = 20

  const where = {
    ...(searchParams.status && { status: searchParams.status as 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' }),
    ...(searchParams.q && {
      OR: [
        { name: { contains: searchParams.q, mode: 'insensitive' as const } },
        { address: { contains: searchParams.q, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [venues, total] = await Promise.all([
    prisma.venue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { name: true, icon: true } },
        _count: { select: { deals: true } },
      },
    }),
    prisma.venue.count({ where }),
  ])

  const pageCount = Math.ceil(total / limit)

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

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        {[['', 'All'], ['ACTIVE', 'Active'], ['PENDING_VERIFICATION', 'Pending'], ['INACTIVE', 'Inactive']].map(([v, label]) => (
          <Link key={v} href={`/admin/venues?${new URLSearchParams({ ...(v && { status: v }), ...(searchParams.q && { q: searchParams.q }) }).toString()}`}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              (searchParams.status ?? '') === v
                ? 'bg-brand-blue border-brand-blue text-white'
                : 'border-surface-border bg-white text-text-secondary hover:border-brand-blue'
            }`}>
            {label}
          </Link>
        ))}
        <form action="/admin/venues" method="get" className="ml-auto">
          {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
          <input name="q" type="search" placeholder="Search venues…" defaultValue={searchParams.q}
            className="rounded-lg border border-surface-border px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20" />
        </form>
      </div>

      {/* Table */}
      <div className="rounded-card border border-surface-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-bg border-b border-surface-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Venue</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary hidden sm:table-cell">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary hidden md:table-cell">Address</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary">Deals</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary hidden lg:table-cell">Flags</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {venues.map((venue) => (
              <tr key={venue.id} className="hover:bg-surface-bg">
                <td className="px-4 py-3">
                  <Link href={`/admin/venues/${venue.id}`} className="font-medium text-text-primary hover:text-brand-blue block truncate max-w-[180px]">
                    {venue.name}
                  </Link>
                  <span className="text-xs text-text-muted">{venue.status}</span>
                </td>
                <td className="px-4 py-3 text-text-secondary text-xs hidden sm:table-cell">
                  {venue.category.icon} {venue.category.name}
                </td>
                <td className="px-4 py-3 text-text-secondary text-xs hidden md:table-cell truncate max-w-[160px]">
                  {venue.address}
                </td>
                <td className="px-4 py-3 text-center text-xs text-text-secondary">
                  {venue._count.deals}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex gap-1">
                    {venue.verified && <span className="text-xs text-brand-blue font-medium">✓ Verified</span>}
                    {venue.premium && <span className="text-xs text-brand-yellow-dark font-medium">⭐ Premium</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/venues/${venue.id}`} className="text-xs text-brand-blue hover:underline">Edit</Link>
                    <a href={`/venues/${venue.slug}`} target="_blank" className="text-xs text-text-muted hover:text-text-primary">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <a href={`/venue/${venue.portalToken}`} target="_blank"
                      className="text-xs text-text-muted hover:text-brand-blue" title="Open portal">
                      Portal
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {venues.length === 0 && (
          <div className="py-12 text-center text-text-muted text-sm">No venues found.</div>
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link href={`/admin/venues?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([, v]) => v)), page: String(page - 1) }).toString()}`}
              className="rounded-lg border border-surface-border px-3 py-1.5 text-sm hover:border-brand-blue transition-colors">
              ← Previous
            </Link>
          )}
          <span className="px-3 py-1.5 text-sm text-text-muted">Page {page} of {pageCount}</span>
          {page < pageCount && (
            <Link href={`/admin/venues?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([, v]) => v)), page: String(page + 1) }).toString()}`}
              className="rounded-lg border border-surface-border px-3 py-1.5 text-sm hover:border-brand-blue transition-colors">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
