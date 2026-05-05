'use client'

import { useRef, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Upload, X, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface Props {
  folder: 'deals' | 'venues'
  onUploaded: (url: string) => void
  label?: string
}

export function ImageUpload({ folder, onUploaded, label = 'Upload Image' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const getUploadUrl = trpc.admin.getUploadUrl.useMutation()

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const result = await getUploadUrl.mutateAsync({ folder, contentType: file.type, ext })
      if (!result) {
        setError('Image uploads are not configured. Set up Cloudflare R2 in settings.')
        return
      }
      const res = await fetch(result.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      if (!res.ok) throw new Error('Upload failed')
      onUploaded(result.publicUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
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
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
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
    <div className="flex flex-wrap gap-2 mt-3">
      {photos.map((p) => (
        <div key={p.id} className="relative h-20 w-20 rounded-lg overflow-hidden border border-surface-border group">
          <Image src={p.url} alt="" fill className="object-cover" />
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
