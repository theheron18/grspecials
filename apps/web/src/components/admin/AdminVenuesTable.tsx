'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { Copy, ExternalLink } from 'lucide-react'

interface Place {
  id: string
  name: string
  slug: string
  status: string
  neighborhood: string | null
  verified: boolean
  premium: boolean
  portalToken: string
  category: { name: string; icon: string | null }
  _count: { deals: number }
}

interface Props {
  places: Place[]
  searchParams: Record<string, string | undefined>
}

export function AdminPlacesTable({ places, searchParams }: Props) {
  const router = useRouter()
  const update = trpc.places.update.useMutation({ onSuccess: () => router.refresh() })

  const sort = searchParams.sort
  const dir = searchParams.dir ?? 'asc'

  function sortHref(col: string) {
    const newDir = sort === col && dir === 'asc' ? 'desc' : 'asc'
    const params = new URLSearchParams(
      Object.entries(searchParams).filter((e): e is [string, string] => e[1] != null)
    )
    params.set('sort', col)
    params.set('dir', newDir)
    return `/admin/places?${params.toString()}`
  }

  function SortHeader({ col, label }: { col: string; label: string }) {
    const active = sort === col
    return (
      <Link href={sortHref(col)} className={`hover:text-brand-blue ${active ? 'text-brand-blue' : ''}`}>
        {label}{active ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
      </Link>
    )
  }

  function toggleStatus(place: Place) {
    update.mutate({ id: place.id, status: place.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })
  }

  function toggleFeatured(place: Place) {
    update.mutate({ id: place.id, premium: !place.premium })
  }

  function toggleVerified(place: Place) {
    update.mutate({ id: place.id, verified: !place.verified })
  }

  return (
    <div className="rounded-card border border-surface-border bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-bg border-b border-surface-border">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">
              <SortHeader col="name" label="Place" />
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary hidden sm:table-cell">
              <SortHeader col="category" label="Category" />
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary hidden md:table-cell">
              <SortHeader col="neighborhood" label="Neighborhood" />
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">
              <SortHeader col="status" label="Status" />
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary">Deals</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary hidden lg:table-cell">Featured</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary hidden lg:table-cell">Verified</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {places.map((place) => {
            const isPending = update.isPending && (update.variables as { id: string })?.id === place.id
            const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/place/${place.portalToken}`
            return (
              <tr key={place.id} className={`hover:bg-surface-bg transition-opacity ${isPending ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <Link href={`/admin/places/${place.id}`} className="font-medium text-text-primary hover:text-brand-blue block truncate max-w-[180px]">
                    {place.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-text-secondary text-xs hidden sm:table-cell">
                  {place.category.icon} {place.category.name}
                </td>
                <td className="px-4 py-3 text-text-secondary text-xs hidden md:table-cell">
                  {place.neighborhood ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleStatus(place)}
                    disabled={isPending || place.status === 'PENDING_VERIFICATION'}
                    title={place.status === 'PENDING_VERIFICATION' ? 'Edit place to change status' : undefined}
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-70 disabled:cursor-default ${
                      place.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : place.status === 'PENDING_VERIFICATION'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {place.status === 'ACTIVE' ? 'Active' : place.status === 'PENDING_VERIFICATION' ? 'Pending' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-center text-xs text-text-secondary">
                  {place._count.deals}
                </td>
                <td className="px-4 py-3 text-center hidden lg:table-cell">
                  <button
                    type="button"
                    onClick={() => toggleFeatured(place)}
                    disabled={isPending}
                    title={place.premium ? 'Featured — click to remove' : 'Not featured — click to feature'}
                    className={`text-base leading-none transition-opacity hover:opacity-70 disabled:opacity-50 ${place.premium ? 'opacity-100' : 'opacity-20'}`}
                  >
                    ⭐
                  </button>
                </td>
                <td className="px-4 py-3 text-center hidden lg:table-cell">
                  <button
                    type="button"
                    onClick={() => toggleVerified(place)}
                    disabled={isPending}
                    title={place.verified ? 'Verified — click to remove' : 'Not verified — click to verify'}
                    className={`text-sm font-bold transition-colors hover:opacity-70 disabled:opacity-50 ${place.verified ? 'text-brand-blue' : 'text-gray-300'}`}
                  >
                    ✓
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(portalUrl)}
                      className="text-text-muted hover:text-brand-blue transition-colors"
                      title="Copy portal link"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <Link href={`/admin/places/${place.id}`} className="text-xs text-brand-blue hover:underline">
                      Edit
                    </Link>
                    <a href={`/places/${place.slug}`} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {places.length === 0 && (
        <div className="py-12 text-center text-text-muted text-sm">No places found.</div>
      )}
    </div>
  )
}
