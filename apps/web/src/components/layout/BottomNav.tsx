'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, Map, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileSearchButton } from './MobileSearchButton'

const NAV_LINKS = [
  { label: 'Browse Deals', href: '/deals' },
  { label: 'Restaurants', href: '/deals?category=restaurant' },
  { label: 'Bars & Breweries', href: '/deals?category=bar' },
  { label: 'Events', href: '/deals?dealType=event-deal' },
  { label: 'Submit a Deal', href: '/submit-a-deal' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const isHome = pathname === '/'
  const isMap = pathname === '/deals' // refined below
  const isSearchPath = false // search is overlay, not a route

  return (
    <>
      {/* Drawer overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="relative bg-white rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-surface-border">
              <span className="font-semibold text-text-primary">Menu</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-1.5 text-text-secondary hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-3 pb-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-text-secondary hover:bg-gray-50 hover:text-text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#F8F8F8] border-t border-surface-border flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Home */}
        <Link
          href="/"
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px] h-[62px]',
            isHome ? 'text-brand-blue' : 'text-text-muted',
          )}
          aria-label="Home"
        >
          <Home className="h-[22px] w-[22px]" />
          <span className="text-[10px]">Home</span>
        </Link>

        {/* Search */}
        <MobileSearchButton
          variant="tab"
          label="Search"
          className="h-[62px]"
        />

        {/* Center logo */}
        <Link
          href="/"
          className="flex flex-1 flex-col items-center justify-center min-h-[44px] h-[62px]"
          aria-label="GRspecials home"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-blue p-0.5">
            <Image
              src="/logos/logo-mark-light.svg"
              alt="GRspecials"
              width={28}
              height={28}
              unoptimized
            />
          </div>
        </Link>

        {/* Map */}
        <Link
          href="/deals?view=map"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px] h-[62px] text-text-muted"
          aria-label="Map"
        >
          <Map className="h-[22px] w-[22px]" />
          <span className="text-[10px]">Map</span>
        </Link>

        {/* More */}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px] h-[62px] text-text-muted"
          aria-label="More"
        >
          <Menu className="h-[22px] w-[22px]" />
          <span className="text-[10px]">More</span>
        </button>
      </nav>
    </>
  )
}
