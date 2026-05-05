import { buildMeta } from '@/lib/seo'
import { prisma } from '@grspecials/db'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMeta({
  title: 'About GRspecials.com',
  description: 'Learn about GRspecials.com — Grand Rapids\' home for deals, happy hours, and specials.',
})

const DEFAULT_CONTENT = `GRspecials.com is Grand Rapids' go-to directory for deals, happy hours, daily specials, and events across the city.

We work with local restaurants, bars, breweries, and shops to make sure you always know where to find a great deal — whether you're a longtime resident or just visiting.

Our mission is simple: help Grand Rapids locals discover and support the businesses that make this city great.

Have a deal we should know about? Submit it through our community submission form and we'll review it promptly.`

export default async function AboutPage() {
  const config = await prisma.siteConfig.findUnique({ where: { key: 'page_about' } })
  const content = config?.value || DEFAULT_CONTENT

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-text-primary mb-6">About GRspecials.com</h1>
      <div className="rounded-card border border-surface-border bg-white p-6 sm:p-8">
        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}
