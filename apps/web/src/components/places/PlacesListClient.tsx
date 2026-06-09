'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const AVATAR_COLORS = [
  'bg-brand-blue',
  'bg-brand-red',
  'bg-[#854F0B]',
  'bg-[#0F6E56]',
  'bg-[#534AB7]',
  'bg-[#993556]',
]

function avatarColor(name: string) {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

type Place = {
  id: string
  name: string
  slug: string
  neighborhood: string | null
  logoUrl: string | null
  category: { name: string; icon: string | null }
  _count: { deals: number }
}

export function PlacesListClient({ places }: { places: Place[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showNoDeals, setShowNoDeals] = useState(false)

  const hasDeals = places.filter((p) => p._count.deals > 0)
  const noDeals = places.filter((p) => p._count.deals === 0)

  const visiblePlaces = showNoDeals ? places : hasDeals

  const filtered = searchTerm
    ? visiblePlaces.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : visiblePlaces

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search places..."
          className="w-full h-11 rounded-lg border border-surface-border bg-white px-4 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-lg leading-none"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {searchTerm && (
        <p className="text-sm text-text-muted mb-3">
          {filtered.length} place{filtered.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Places list */}
      <div className="divide-y divide-surface-border rounded-card border border-surface-border bg-white overflow-hidden">
        {filtered.map((place) => (
          <Link
            key={place.id}
            href={`/places/${place.slug}`}
            className="flex items-center gap-3 py-3 px-4 hover:bg-surface-bg transition-colors min-h-[48px]"
          >
            {/* Logo / avatar */}
            <div className="shrink-0 h-12 w-12 rounded-lg overflow-hidden">
              {place.logoUrl ? (
                <div className="relative h-12 w-12 border border-surface-border rounded-lg overflow-hidden bg-surface-bg">
                  <Image src={place.logoUrl} alt={place.name} fill className="object-contain p-1" unoptimized />
                </div>
              ) : (
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${avatarColor(place.name)}`}>
                  <span className="text-white font-bold text-lg">{place.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-text-primary truncate">{place.name}</p>
              <p className="text-[12px] text-text-muted truncate">
                {place.category.name}
                {place.neighborhood ? ` · ${place.neighborhood}` : ''}
              </p>
            </div>

            {/* Deal count pill */}
            <div className="shrink-0">
              {place._count.deals > 0 ? (
                <span className="inline-flex items-center rounded-full bg-brand-blue text-white px-2 py-0.5 text-[11px] font-medium">
                  {place._count.deals} deal{place._count.deals !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-surface-border text-text-muted px-2 py-0.5 text-[11px] font-medium">
                  No deals
                </span>
              )}
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-text-muted text-sm">
            No places match your search.
          </div>
        )}
      </div>

      {/* Toggle no-deals places */}
      {noDeals.length > 0 && !searchTerm && (
        <div className="mt-3 text-center">
          <button
            onClick={() => setShowNoDeals((v) => !v)}
            className="text-sm text-text-muted hover:text-text-secondary underline-offset-2 hover:underline"
          >
            {showNoDeals
              ? 'Hide places with no active deals'
              : `Show ${noDeals.length} more place${noDeals.length !== 1 ? 's' : ''} with no active deals`}
          </button>
        </div>
      )}
    </div>
  )
}
