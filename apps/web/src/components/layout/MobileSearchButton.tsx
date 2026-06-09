'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchOverlay } from '@/components/ui/SearchOverlay'

interface MobileSearchButtonProps {
  /** 'icon' = small square icon button (header)
   *  'tab' = bottom nav tab with label
   *  'desktop' = nav-link styled button */
  variant?: 'icon' | 'tab' | 'desktop'
  className?: string
  /** Tab-variant label */
  label?: string
  /** Whether this tab is active (tab variant only) */
  isActive?: boolean
}

export function MobileSearchButton({
  variant = 'icon',
  className,
  label = 'Search',
  isActive,
}: MobileSearchButtonProps) {
  const [open, setOpen] = useState(false)

  if (variant === 'tab') {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px]',
            isActive ? 'text-brand-blue' : 'text-text-muted',
            className,
          )}
          aria-label="Search"
        >
          <Search className="h-[22px] w-[22px]" />
          <span className="text-[10px]">{label}</span>
        </button>
        {open && <SearchOverlay onClose={() => setOpen(false)} />}
      </>
    )
  }

  if (variant === 'desktop') {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={cn(
            'hidden sm:flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-sm text-text-secondary hover:border-brand-blue hover:text-brand-blue transition-colors',
            className,
          )}
          aria-label="Search deals"
        >
          <Search className="h-3.5 w-3.5" />
          Search deals
        </button>
        {open && <SearchOverlay onClose={() => setOpen(false)} />}
      </>
    )
  }

  // default: icon
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-text-secondary',
          className,
        )}
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>
      {open && <SearchOverlay onClose={() => setOpen(false)} />}
    </>
  )
}
