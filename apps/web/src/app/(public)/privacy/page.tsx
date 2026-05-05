import { buildMeta } from '@/lib/seo'
import { prisma } from '@grspecials/db'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = buildMeta({
  title: 'Privacy Policy',
  description: 'Privacy policy for GRspecials.com.',
})

const DEFAULT_CONTENT = `Last updated: 2026

GRspecials.com ("we", "us", or "our") operates the website grspecials.com.

Information We Collect
We collect information you provide directly to us, such as when you submit a deal or contact us. This may include your name, email address, and any other information you choose to provide.

We also collect certain information automatically when you visit our site, including log data such as your IP address, browser type, and pages visited.

How We Use Your Information
We use the information we collect to operate and improve the site, respond to your messages, and send you updates if you've opted in.

We do not sell your personal information to third parties.

Cookies
We use cookies to understand how visitors use the site. You can disable cookies in your browser settings.

Contact
If you have questions about this policy, contact us at grspecials.com/contact.`

export default async function PrivacyPage() {
  const config = await prisma.siteConfig.findUnique({ where: { key: 'page_privacy' } })
  const content = config?.value || DEFAULT_CONTENT

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Privacy Policy</h1>
      <div className="rounded-card border border-surface-border bg-white p-6 sm:p-8">
        <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}
