import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@grspecials/db'
import { sendDealExpiring } from '@/lib/email'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  // Auto-expire deals past endDate
  const expired = await prisma.deal.updateMany({
    where: {
      status: 'ACTIVE',
      endDate: { lt: now },
    },
    data: { status: 'EXPIRED' },
  })

  // Send expiry warning emails (3 days out, only once)
  const expiring = await prisma.deal.findMany({
    where: {
      status: 'ACTIVE',
      endDate: { gte: now, lte: threeDaysFromNow },
      expiryNotificationSent: false,
      venue: { email: { not: null } },
    },
    include: { venue: { select: { email: true, portalToken: true } } },
  })

  for (const deal of expiring) {
    if (!deal.venue.email || !deal.endDate) continue
    const renewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/venue/${deal.venue.portalToken}`
    await sendDealExpiring(
      deal.venue.email,
      deal.title,
      deal.endDate.toLocaleDateString(),
      renewUrl,
    )
    await prisma.deal.update({
      where: { id: deal.id },
      data: { expiryNotificationSent: true },
    })
  }

  return NextResponse.json({
    expired: expired.count,
    notificationsSent: expiring.length,
  })
}
