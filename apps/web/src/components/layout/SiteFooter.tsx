import Link from 'next/link'
import { MapPin } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-surface-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-yellow">
                <MapPin className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-text-primary text-lg">
                GR<span className="text-brand-blue">specials</span>
              </span>
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed">
              Grand Rapids' home for deals, specials & events. Updated daily.
            </p>
          </div>

          {/* Browse */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">Browse</h3>
            <ul className="space-y-2">
              {[
                ['All Deals', '/deals'],
                ['Places', '/places'],
                ['Happy Hours', '/deals?dealType=happy-hour'],
                ['Daily Specials', '/deals?dealType=daily-special'],
                ['Events', '/deals?dealType=event-deal'],
                ['Restaurants', '/deals?category=restaurant'],
                ['Bars & Breweries', '/deals?category=bar'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-text-secondary hover:text-brand-blue transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Business */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">For Businesses</h3>
            <ul className="space-y-2">
              {[
                ['Submit a Deal', '/submit-a-deal'],
                ['Place Portal', '/place'],
                ['Featured Listings', '/advertise'],
                ['Contact Us', '/contact'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-text-secondary hover:text-brand-blue transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Site */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">GRspecials</h3>
            <ul className="space-y-2">
              {[
                ['About', '/about'],
                ['Privacy Policy', '/privacy'],
                ['Terms of Service', '/terms'],
                ['Admin', '/admin/dashboard'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-text-secondary hover:text-brand-blue transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-surface-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} GRspecials.com — Grand Rapids, Michigan
          </p>
          <p className="text-xs text-text-muted">
            Know a deal we missed?{' '}
            <Link href="/submit-a-deal" className="text-brand-blue hover:underline">
              Submit it →
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
