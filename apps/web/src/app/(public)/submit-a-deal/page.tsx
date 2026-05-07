export const dynamic = 'force-dynamic'

import { prisma } from '@grspecials/db'
import { SubmitDealForm } from '@/components/forms/SubmitDealForm'
import { buildMeta } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = buildMeta({
  title: 'Submit a Deal — Help Your Community',
  description: 'Know about a great deal, special, or event in Grand Rapids? Submit it to GRspecials.com and help your community.',
})

export default async function SubmitDealPage() {
  const [categories, dealTypes] = await Promise.all([
    prisma.venueCategory.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.dealType.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
  ])

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🏷️</div>
        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Submit a Deal</h1>
        <p className="mt-2 text-text-secondary">
          Help the Grand Rapids community discover great specials. We review all submissions before publishing.
        </p>
      </div>

      <div className="rounded-card border border-surface-border bg-white p-6 sm:p-8">
        <SubmitDealForm
          categories={categories.map((c) => ({ value: c.slug, label: `${c.icon ?? ''} ${c.name}` }))}
          dealTypes={dealTypes.map((d) => ({ value: d.slug, label: `${d.icon ?? ''} ${d.name}` }))}
        />
      </div>

      <p className="mt-4 text-center text-xs text-text-muted">
        Place owner submitting your own deals?{' '}
        <a href="mailto:hello@grspecials.com" className="text-brand-blue hover:underline">
          Contact us
        </a>{' '}
        for a place portal link.
      </p>
    </div>
  )
}
