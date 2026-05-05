import Link from 'next/link'
import { buildMeta } from '@/lib/seo'
import { LayoutDashboard, Mail } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = buildMeta({
  title: 'Venue Portal — Manage Your Deals',
  description: 'Venue owners: access your GRspecials portal to manage your deals and specials.',
  robots: { index: false, follow: false },
})

export default function VenuePortalLandingPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-6">
      <div className="flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10">
          <LayoutDashboard className="h-7 w-7 text-brand-blue" />
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-text-primary">Venue Portal</h1>
        <p className="mt-2 text-text-secondary">
          Manage your deals and specials on GRspecials.com.
        </p>
      </div>

      <div className="rounded-card border border-surface-border bg-white p-6 text-left space-y-4">
        <p className="text-sm text-text-secondary">
          Your venue portal link is unique to your business and was sent to your email when your venue was set up. It looks like:
        </p>
        <code className="block rounded-lg bg-surface-bg border border-surface-border px-3 py-2 text-xs text-text-secondary">
          grspecials.com/venue/<span className="text-brand-blue">your-private-token</span>
        </code>
        <p className="text-sm text-text-secondary">
          Paste your full link into the browser address bar to access your portal.
        </p>
      </div>

      <div className="rounded-card border border-surface-border bg-white p-5 text-left">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-4 w-4 text-text-muted" />
          <span className="text-sm font-medium text-text-primary">Don't have a portal link?</span>
        </div>
        <p className="text-sm text-text-secondary mb-3">
          If your venue is listed on GRspecials.com and you haven't received your link, reach out and we'll send it to you.
        </p>
        <Link
          href="/submit-a-deal"
          className="inline-flex items-center gap-1.5 text-sm text-brand-blue hover:underline"
        >
          Submit a deal to get started →
        </Link>
      </div>
    </div>
  )
}
