import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@grspecials/db'
import { deleteOrphanedFiles } from '@/lib/upload'

export async function GET(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Collect every URL currently referenced in the database
  const [photos, venues] = await Promise.all([
    prisma.dealPhoto.findMany({ select: { url: true } }),
    prisma.venue.findMany({ where: { logoUrl: { not: null } }, select: { logoUrl: true } }),
  ])

  const referenced = new Set<string>([
    ...photos.map((p) => p.url),
    ...venues.map((v) => v.logoUrl!),
  ])

  const deleted = await deleteOrphanedFiles(referenced)

  return NextResponse.json({ deleted, referenced: referenced.size })
}
