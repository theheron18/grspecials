'use client'

import { useRef, useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { UPLOAD_HINT, UPLOAD_MAX_BYTES, UPLOAD_ALLOWED_TYPES } from '@/lib/upload'

interface Props {
  folder: 'deals' | 'venues'
  onUploaded: (url: string) => void
  label?: string
}

export function ImageUpload({ folder, onUploaded, label = 'Upload Image' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)

    // Client-side validation (mirrors server)
    if (!(UPLOAD_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      setError('Only JPG, PNG, WebP and GIF images are allowed.')
      return
    }
    if (file.size > UPLOAD_MAX_BYTES) {
      setError('File exceeds the 4 MB limit.')
      return
    }

    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('folder', folder)

      const res = await fetch('/api/upload', { method: 'POST', body })
      const json = await res.json() as { publicUrl?: string; error?: string }

      if (!res.ok) {
        setError(json.error ?? 'Upload failed.')
        return
      }
      onUploaded(json.publicUrl!)
    } catch {
      setError('Upload failed. Check your internet connection.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 rounded-lg border border-dashed border-surface-border bg-surface-bg px-4 py-2.5 text-sm text-text-secondary hover:border-brand-blue hover:text-brand-blue transition-colors disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? 'Uploading…' : label}
      </button>
      <p className="text-xs text-text-muted">{UPLOAD_HINT}</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

interface PhotoGridProps {
  photos: { id: string; url: string }[]
  onRemove: (id: string) => void
}

export function PhotoGrid({ photos, onRemove }: PhotoGridProps) {
  if (photos.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {photos.map((p) => (
        <div key={p.id} className="relative h-20 w-20 rounded-lg overflow-hidden border border-surface-border group">
          <Image src={p.url} alt="" fill className="object-cover" unoptimized />
          <button
            type="button"
            onClick={() => onRemove(p.id)}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      ))}
    </div>
  )
}

// Lightweight preview grid for pending (not-yet-saved) uploads
interface PendingPhotoGridProps {
  urls: string[]
  onRemove: (url: string) => void
}

export function PendingPhotoGrid({ urls, onRemove }: PendingPhotoGridProps) {
  if (urls.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((url) => (
        <div key={url} className="relative h-20 w-20 rounded-lg overflow-hidden border border-surface-border group">
          <Image src={url} alt="" fill className="object-cover" unoptimized />
          <button
            type="button"
            onClick={() => onRemove(url)}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      ))}
    </div>
  )
}
