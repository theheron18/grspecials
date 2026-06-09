'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, Plus } from 'lucide-react'
import { MobileSearchButton } from './MobileSearchButton'

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
        {/* Mobile header — below md */}
        <div className="flex md:hidden h-[52px] items-center justify-between">
          {/* Logo mark */}
          <Link href="/" aria-label="GRspecials home" className="flex shrink-0 w-8 h-8">
            <Image
              src="/logos/logo-mark-dark.svg"
              alt="GRspecials"
              width={32}
              height={32}
              unoptimized
            />
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            <Link
              href="/submit-a-deal"
              className="flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-bold"
              style={{ backgroundColor: '#F5C518', color: '#0D2145' }}
            >
              <Plus className="h-3.5 w-3.5" />
              Submit
            </Link>

            <MobileSearchButton variant="icon" />

            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-text-secondary"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Desktop header — md and above */}
        <div className="hidden md:flex h-16 items-center justify-between gap-4">
          {/* Logo horizontal */}
          <Link href="/" className="shrink-0" aria-label="GRspecials home">
            <Image
              src="/logos/logo-horizontal-dark.svg"
              alt="GRspecials"
              height={36}
              width={0}
              style={{ width: 'auto', height: '36px' }}
              unoptimized
            />
          </Link>

          {/* Desktop nav */}
          <nav className="flex items-center gap-1">
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
            <MobileSearchButton variant="desktop" />
            <Link
              href="/submit-a-deal"
              className="rounded-lg bg-brand-yellow px-3.5 py-1.5 text-sm font-semibold text-text-primary hover:bg-brand-yellow-dark transition-colors"
            >
              + Add Deal
            </Link>
          </div>
        </div>

        {/* Mobile menu drawer */}
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
