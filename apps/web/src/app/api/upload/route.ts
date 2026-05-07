import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { directUpload, UPLOAD_MAX_BYTES, UPLOAD_ALLOWED_TYPES } from '@/lib/upload'

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const folder = formData.get('folder') as string

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!['deals', 'places'].includes(folder)) return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
  if (!(UPLOAD_ALLOWED_TYPES as readonly string[]).includes(file.type))
    return NextResponse.json({ error: 'Only JPG, PNG, WebP and GIF images are allowed' }, { status: 400 })
  if (file.size > UPLOAD_MAX_BYTES)
    return NextResponse.json({ error: 'File exceeds the 4 MB limit' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? 'jpg'
  const publicUrl = await directUpload(folder as 'deals' | 'places', buffer, file.type, ext)

  if (!publicUrl) return NextResponse.json({ error: 'Image storage is not configured' }, { status: 503 })
  return NextResponse.json({ publicUrl })
}
