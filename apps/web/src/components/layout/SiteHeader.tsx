'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Search, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Browse Deals', href: '/deals' },
  { label: 'Restaurants', href: '/deals?category=restaurant' },
  { label: 'Bars & Breweries', href: '/deals?category=bar' },
  { label: 'Events', href: '/deals?dealType=event-deal' },
  { label: 'Submit a Deal', href: '/submit-a-deal' },
]

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-yellow">
              <MapPin className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-text-primary text-lg leading-tight">
              GR<span className="text-brand-blue">specials</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-gray-100 hover:text-text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/deals"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-sm text-text-secondary hover:border-brand-blue hover:text-brand-blue transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              Search deals
            </Link>
            <Link
              href="/submit-a-deal"
              className="rounded-lg bg-brand-yellow px-3.5 py-1.5 text-sm font-semibold text-text-primary hover:bg-brand-yellow-dark transition-colors"
            >
              + Add Deal
            </Link>
            <button
              className="md:hidden rounded-lg p-2 text-text-secondary hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-surface-border py-3 pb-4 animate-fade-in">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-gray-50 hover:text-text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
