'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { formatRelativeDate } from '@/lib/utils'
import { DealStatus } from '@grspecials/db'

interface Deal {
  id: string
  title: string
  slug: string
  status: string
  createdAt: Date
  recheckAt?: Date | null
  place: { name: string; slug: string }
  category: { name: string; icon: string | null }
  dealType: { name: string }
}

function isRecheckDue(recheckAt: Date | null | undefined): boolean {
  if (!recheckAt) return false
  return new Date(recheckAt).getTime() <= Date.now() + 7 * 24 * 60 * 60 * 1000
}

export function AdminDealsTable({ deals }: { deals: Deal[] }) {
  const router = useRouter()
  const bulkUpdate = trpc.deals.bulkUpdateStatus.useMutation()
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  function toggleAll() {
    setSelected(selected.size === deals.length ? new Set() : new Set(deals.map((d) => d.id)))
  }

  function toggleOne(id: string) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  async function handleBulk(status: DealStatus) {
    await bulkUpdate.mutateAsync({ ids: [...selected], status })
    setSelected(new Set())
    router.refresh()
  }

  const allChecked = deals.length > 0 && selected.size === deals.length
  const someChecked = selected.size > 0 && selected.size < deals.length

  return (
    <div className="rounded-card border border-surface-border bg-white overflow-hidden">
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-brand-blue/5 border-b border-brand-blue/20">
          <span className="text-sm font-medium text-text-primary">{selected.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <BulkButton
              label="Activate"
              color="green"
              loading={bulkUpdate.isPending}
              onClick={() => handleBulk(DealStatus.ACTIVE)}
            />
            <BulkButton
              label="Deactivate"
              color="gray"
              loading={bulkUpdate.isPending}
              onClick={() => handleBulk(DealStatus.DRAFT)}
            />
            <BulkButton
              label="Archive"
              color="gray"
              loading={bulkUpdate.isPending}
              onClick={() => handleBulk(DealStatus.ARCHIVED)}
            />
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <table className="w-full text-sm">
        <thead className="bg-surface-bg border-b border-surface-border">
          <tr>
            <th className="pl-4 pr-2 py-3 w-8">
              <input
                type="checkbox"
                checked={allChecked}
                ref={(el) => { if (el) el.indeterminate = someChecked }}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-surface-border text-brand-blue focus:ring-brand-blue cursor-pointer"
              />
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Deal</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary hidden sm:table-cell">Place</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary hidden md:table-cell">Type</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Status</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary">Added</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {deals.map((deal) => (
            <tr key={deal.id} className={`hover:bg-surface-bg ${selected.has(deal.id) ? 'bg-brand-blue/5' : ''}`}>
              <td className="pl-4 pr-2 py-3 w-8">
                <input
                  type="checkbox"
                  checked={selected.has(deal.id)}
                  onChange={() => toggleOne(deal.id)}
                  className="h-4 w-4 rounded border-surface-border text-brand-blue focus:ring-brand-blue cursor-pointer"
                />
              </td>
              <td className="px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/deals/${deal.id}`} className="font-medium text-text-primary hover:text-brand-blue block truncate max-w-[200px]">
                      {deal.title}
                    </Link>
                    {deal.recheckAt && isRecheckDue(deal.recheckAt) && (
                      <span className="inline-flex shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700" title={`Recheck by ${new Date(deal.recheckAt).toLocaleDateString()}`}>
                        Needs recheck
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-muted">{deal.category.icon} {deal.category.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-text-secondary text-xs hidden sm:table-cell truncate max-w-[160px]">{deal.place.name}</td>
              <td className="px-4 py-3 text-text-secondary text-xs hidden md:table-cell">{deal.dealType.name}</td>
              <td className="px-4 py-3">
                <StatusBadge status={deal.status} />
              </td>
              <td className="px-4 py-3 text-right text-xs text-text-muted whitespace-nowrap">
                {formatRelativeDate(deal.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/admin/deals/${deal.id}`} className="text-xs text-brand-blue hover:underline">Edit</Link>
                  <Link href={`/deals/${deal.place.slug}/${deal.slug}`} className="text-xs text-text-muted hover:text-text-primary" target="_blank">View</Link>
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
  )
}

function BulkButton({ label, color, loading, onClick }: {
  label: string
  color: 'green' | 'gray'
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors disabled:opacity-50 ${
        color === 'green'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
          : 'bg-white border-surface-border text-text-secondary hover:border-brand-blue'
      }`}
    >
      {label}
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    ACTIVE:         { color: '#059669', label: 'Active' },
    PENDING_REVIEW: { color: '#F59E0B', label: 'Pending' },
    REJECTED:       { color: '#E02424', label: 'Rejected' },
    EXPIRED:        { color: '#6B7280', label: 'Expired' },
    DRAFT:          { color: '#6B7280', label: 'Draft' },
    ARCHIVED:       { color: '#6B7280', label: 'Archived' },
  }
  const info = map[status] ?? { color: '#6B7280', label: status }
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: `${info.color}18`, color: info.color }}
    >
      {info.label}
    </span>
  )
}
