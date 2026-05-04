import Link from 'next/link'
import { prisma } from '@grspecials/db'
import { DealStatus } from '@grspecials/db'
import { formatRelativeDate } from '@/lib/utils'
import { Plus } from 'lucide-react'

interface PageProps {
  searchParams: { status?: string; q?: string; page?: string }
}

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING_REVIEW', label: 'Pending' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'EXPIRED', label: 'Expired' },
]

export default async function AdminDealsPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page ?? '1')
  const limit = 20

  const where = {
    ...(searchParams.status && { status: searchParams.status as DealStatus }),
    ...(searchParams.q && {
      OR: [
        { title: { contains: searchParams.q, mode: 'insensitive' as const } },
        { venue: { name: { contains: searchParams.q, mode: 'insensitive' as const } } },
      ],
    }),
  }

  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        venue: { select: { name: true, id: true } },
        category: { select: { name: true, icon: true } },
        dealType: { select: { name: true } },
      },
    }),
    prisma.deal.count({ where }),
  ])

  const pageCount = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Deals</h1>
          <p className="text-sm text-text-secondary">{total} total deals</p>
        </div>
        <Link
          href="/admin/deals/new"
          className="flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-dark transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Deal
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={`/admin/deals?${new URLSearchParams({ ...(opt.value && { status: opt.value }), ...(searchParams.q && { q: searchParams.q }) }).toString()}`}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              (searchParams.status ?? '') === opt.value
                ? 'bg-brand-blue border-brand-blue text-white'
                : 'border-surface-border bg-white text-text-secondary hover:border-brand-blue'
            }`}
          >
            {opt.label}
          </Link>
        ))}

        <form action="/admin/deals" method="get" className="ml-auto">
          {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
          <input
            name="q"
            type="search"
            placeholder="Search deals…"
            defaultValue={searchParams.q}
            className="rounded-lg border border-surface-border px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
        </form>
      </div>

      {/* Table */}
      <div className="rounded-card border border-surface-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-bg border-b border-surface-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Deal</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary hidden sm:table-cell">Venue</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary hidden md:table-cell">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary">Added</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {deals.map((deal) => (
              <tr key={deal.id} className="hover:bg-surface-bg">
                <td className="px-4 py-3">
                  <div>
                    <Link href={`/admin/deals/${deal.id}`} className="font-medium text-text-primary hover:text-brand-blue block truncate max-w-[200px]">
                      {deal.title}
                    </Link>
                    <span className="text-xs text-text-muted">{deal.category.icon} {deal.category.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary text-xs hidden sm:table-cell truncate max-w-[160px]">{deal.venue.name}</td>
                <td className="px-4 py-3 text-text-secondary text-xs hidden md:table-cell">{deal.dealType.name}</td>
                <td className="px-4 py-3">
                  <AdminStatusBadge status={deal.status} />
                </td>
                <td className="px-4 py-3 text-right text-xs text-text-muted whitespace-nowrap">
                  {formatRelativeDate(deal.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/deals/${deal.id}`} className="text-xs text-brand-blue hover:underline">Edit</Link>
                    <Link href={`/deals/${deal.venue.slug}/${deal.slug}`} className="text-xs text-text-muted hover:text-text-primary" target="_blank">View</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {deals.length === 0 && (
          <div className="py-12 text-center text-text-muted text-sm">No deals found.</div>
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link href={`/admin/deals?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([, v]) => v)), page: String(page - 1) }).toString()}`}
              className="rounded-lg border border-surface-border px-3 py-1.5 text-sm hover:border-brand-blue transition-colors">
              ← Previous
            </Link>
          )}
          <span className="px-3 py-1.5 text-sm text-text-muted">Page {page} of {pageCount}</span>
          {page < pageCount && (
            <Link href={`/admin/deals?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([, v]) => v)), page: String(page + 1) }).toString()}`}
              className="rounded-lg border border-surface-border px-3 py-1.5 text-sm hover:border-brand-blue transition-colors">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function AdminStatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    ACTIVE: { color: '#059669', label: 'Active' },
    PENDING_REVIEW: { color: '#F59E0B', label: 'Pending' },
    REJECTED: { color: '#E02424', label: 'Rejected' },
    EXPIRED: { color: '#6B7280', label: 'Expired' },
    DRAFT: { color: '#6B7280', label: 'Draft' },
    ARCHIVED: { color: '#6B7280', label: 'Archived' },
  }
  const info = map[status] ?? { color: '#6B7280', label: status }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: `${info.color}18`, color: info.color }}>
      {info.label}
    </span>
  )
}
