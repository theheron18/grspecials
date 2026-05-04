import { Resend } from 'resend'
import { prisma } from '@grspecials/db'
import { env } from './env'

const resend = new Resend(env.RESEND_API_KEY)

async function getTemplate(slug: string): Promise<{ subject: string; html: string; text: string } | null> {
  const tpl = await prisma.emailTemplate.findUnique({ where: { slug } })
  return tpl
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

export async function sendEmail({
  to,
  templateSlug,
  vars = {},
}: {
  to: string
  templateSlug: string
  vars?: Record<string, string>
}) {
  if (!env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set, skipping email send')
    return
  }

  const tpl = await getTemplate(templateSlug)
  if (!tpl) {
    console.error(`[email] Template not found: ${templateSlug}`)
    return
  }

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject: renderTemplate(tpl.subject, vars),
    html: renderTemplate(tpl.html, vars),
    text: renderTemplate(tpl.text, vars),
  })
}

export async function sendSubmissionConfirmation(to: string, dealTitle: string) {
  await sendEmail({ to, templateSlug: 'submission-confirmation', vars: { dealTitle } })
}

export async function sendDealApproved(to: string, dealTitle: string, dealUrl: string) {
  await sendEmail({ to, templateSlug: 'deal-approved', vars: { dealTitle, dealUrl } })
}

export async function sendDealRejected(to: string, dealTitle: string, reason: string) {
  await sendEmail({ to, templateSlug: 'deal-rejected', vars: { dealTitle, reason } })
}

export async function sendDealExpiring(to: string, dealTitle: string, expiryDate: string, renewUrl: string) {
  await sendEmail({ to, templateSlug: 'deal-expiring', vars: { dealTitle, expiryDate, renewUrl } })
}

export async function sendVenuePortalInvite(to: string, venueName: string, portalUrl: string) {
  await sendEmail({ to, templateSlug: 'venue-portal-invite', vars: { venueName, portalUrl } })
}
