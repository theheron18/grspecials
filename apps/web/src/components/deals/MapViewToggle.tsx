'use client'

import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { List, Map } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MapViewToggle({ isMapView }: { isMapView: boolean }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  function buildUrl(view: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (view === 'list') params.delete('view')
    else params.set('view', view)
    return `${pathname}?${params.toString()}`
  }

  return (
    <div className="flex rounded-lg border border-surface-border overflow-hidden shrink-0">
      <Link
        href={buildUrl('list')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors',
          !isMapView ? 'bg-brand-blue text-white' : 'bg-white text-text-secondary hover:bg-gray-50',
        )}
      >
        <List className="h-4 w-4" /> List
      </Link>
      <Link
        href={buildUrl('map')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm border-l border-surface-border transition-colors',
          isMapView ? 'bg-brand-blue text-white' : 'bg-white text-text-secondary hover:bg-gray-50',
        )}
      >
        <Map className="h-4 w-4" /> Map
      </Link>
    </div>
  )
}
