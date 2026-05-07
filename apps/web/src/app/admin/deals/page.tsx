export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@grspecials/db'
import { DealStatus } from '@grspecials/db'
import { Plus } from 'lucide-react'
import { AdminDealsTable } from '@/components/admin/AdminDealsTable'

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
        venue: { select: { name: true, id: true, slug: true } },
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
      <AdminDealsTable deals={deals.map(({ venue, ...rest }) => ({ ...rest, place: venue }))} />

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

