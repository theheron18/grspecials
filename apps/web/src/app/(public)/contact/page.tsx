import { buildMeta } from '@/lib/seo'
import { ContactForm } from '@/components/forms/ContactForm'
import type { Metadata } from 'next'

export const metadata: Metadata = buildMeta({
  title: 'Contact Us',
  description: 'Get in touch with the GRspecials.com team.',
})

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">✉️</div>
        <h1 className="text-2xl font-bold text-text-primary">Contact Us</h1>
        <p className="mt-2 text-text-secondary text-sm">
          Questions, suggestions, or want to list your venue? We'd love to hear from you.
        </p>
      </div>
      <div className="rounded-card border border-surface-border bg-white p-6 sm:p-8">
        <ContactForm />
      </div>
    </div>
  )
}
