import Link from 'next/link'
import { buildMeta } from '@/lib/seo'
import { Star, MapPin, TrendingUp, Mail } from 'lucide-react'
import { ObfuscatedEmail } from '@/components/ui/ObfuscatedEmail'
import type { Metadata } from 'next'

export const metadata: Metadata = buildMeta({
  title: 'Featured Listings — Advertise on GRspecials.com',
  description: 'Get your Grand Rapids business featured on GRspecials.com. Reach locals actively looking for deals, happy hours, and specials.',
})

const PERKS = [
  {
    icon: Star,
    title: 'Priority placement',
    desc: 'Featured deals appear at the top of the homepage and browse page, above all standard listings.',
  },
  {
    icon: MapPin,
    title: 'Map highlight',
    desc: 'Your venue pin is highlighted on the interactive map so locals can find you instantly.',
  },
  {
    icon: TrendingUp,
    title: 'More visibility',
    desc: 'Featured deals are promoted in our weekly highlights and across category pages.',
  },
]

export default function AdvertisePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 space-y-10">
      <div className="text-center">
        <div className="text-4xl mb-3">⭐</div>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Get Featured on GRspecials.com</h1>
        <p className="mt-3 text-text-secondary">
          Put your deals in front of Grand Rapids locals who are actively looking for somewhere to eat, drink, and shop.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PERKS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-card border border-surface-border bg-white p-5 space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-blue/10">
              <Icon className="h-5 w-5 text-brand-blue" />
            </div>
            <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
            <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-card border border-surface-border bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-brand-blue" />
          <h2 className="text-base font-semibold text-text-primary">Get in touch</h2>
        </div>
        <p className="text-sm text-text-secondary">
          Featured listings are available for Grand Rapids businesses. Send us a message and we'll get back to you with details and pricing.
        </p>
        <ObfuscatedEmail
          user="theheron18"
          domain="yahoo.com"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-blue-dark transition-colors"
        >
          <Mail className="h-4 w-4" />
          Get in touch
        </ObfuscatedEmail>
        <p className="text-xs text-text-muted pt-1">
          Not ready to feature a listing?{' '}
          <Link href="/submit-a-deal" className="text-brand-blue hover:underline">
            Submit a deal for free →
          </Link>
        </p>
      </div>
    </div>
  )
}
