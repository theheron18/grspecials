import { buildMeta } from '@/lib/seo'
import { prisma } from '@grspecials/db'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMeta({
  title: 'Terms of Service',
  description: 'Terms of service for GRspecials.com.',
})

const DEFAULT_CONTENT = `Last updated: 2026

By using GRspecials.com you agree to these terms.

Use of the Site
GRspecials.com provides a directory of deals and specials in the Grand Rapids area. You may use the site for personal, non-commercial purposes. You may not scrape, reproduce, or redistribute site content without permission.

Submitted Content
When you submit a deal, you grant us the right to publish and moderate it. We reserve the right to reject or remove any submission at our discretion. Do not submit false, misleading, or spam content.

Accuracy of Deals
We make every effort to keep deal information accurate, but we cannot guarantee that all deals are current. Always confirm details directly with the venue before visiting.

Limitation of Liability
GRspecials.com is provided "as is" without warranty of any kind. We are not liable for any damages arising from your use of the site or reliance on deal information.

Changes to These Terms
We may update these terms at any time. Continued use of the site after changes constitutes acceptance of the new terms.

Contact
Questions? Reach us at grspecials.com/contact.`

export default async function TermsPage() {
  const config = await prisma.siteConfig.findUnique({ where: { key: 'page_terms' } })
  const content = config?.value || DEFAULT_CONTENT

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Terms of Service</h1>
      <div className="rounded-card border border-surface-border bg-white p-6 sm:p-8">
        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}
