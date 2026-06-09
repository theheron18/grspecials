'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import Link from 'next/link'

const BROWSE_LINKS = [
  { label: '🍺 Bars & Breweries', href: '/deals?category=bar' },
  { label: '🍔 Restaurants', href: '/deals?category=restaurant' },
  { label: '🎟️ Events', href: '/deals?dealType=event-deal' },
  { label: '🏷️ All Deals', href: '/deals' },
]

interface SearchOverlayProps {
  onClose: () => void
}

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = inputRef.current?.value.trim()
    if (q) {
      router.push(`/deals?q=${encodeURIComponent(q)}`)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 h-[52px] bg-brand-blue shrink-0">
        <form onSubmit={handleSubmit} className="flex-1">
          <input
            ref={inputRef}
            type="search"
            placeholder="Happy hours, specials, events..."
            className="w-full h-10 rounded-lg bg-white px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
        </form>
        <button
          onClick={onClose}
          className="text-white text-sm font-medium ml-1 shrink-0"
        >
          Cancel
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
          Browse
        </p>
        <div className="flex flex-col gap-1">
          {BROWSE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex items-center py-3 text-sm font-medium text-text-primary border-b border-surface-border last:border-0"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
