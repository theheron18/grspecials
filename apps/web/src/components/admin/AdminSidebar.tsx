'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, FileText, Building2, ClipboardList,
  Bot, Bell, Settings, LogOut, MapPin, ChevronLeft, BarChart2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const NAV = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Deals', href: '/admin/deals', icon: FileText },
  { label: 'Venues', href: '/admin/venues', icon: Building2 },
  { label: 'Moderation', href: '/admin/moderation', icon: ClipboardList },
  { label: 'Scraper', href: '/admin/scraper', icon: Bot },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart2 },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      'flex flex-col border-r border-surface-border bg-white transition-all duration-200',
      collapsed ? 'w-16' : 'w-56'
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-surface-border px-4 shrink-0">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-yellow">
              <MapPin className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm text-text-primary">
              GR<span className="text-brand-blue">specials</span>
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-text-muted hover:bg-gray-100 hover:text-text-primary"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'admin-nav-item',
                active && 'active',
                collapsed && 'justify-center px-2',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-surface-border p-2">
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          title={collapsed ? 'Sign out' : undefined}
          className={cn('admin-nav-item w-full text-brand-red hover:bg-red-50 hover:text-brand-red', collapsed && 'justify-center px-2')}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
