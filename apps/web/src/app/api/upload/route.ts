import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUploadUrl } from '@/lib/upload'
import { z } from 'zod'

const schema = z.object({
  folder: z.enum(['deals', 'venues']),
  contentType: z.string(),
  ext: z.string().regex(/^[a-z0-9]+$/i),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const result = await getUploadUrl(parsed.data.folder, parsed.data.contentType, parsed.data.ext)
  if (!result) return NextResponse.json({ error: 'Storage not configured' }, { status: 503 })

  return NextResponse.json(result)
}
