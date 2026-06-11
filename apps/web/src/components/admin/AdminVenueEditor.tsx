'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { trpc } from '@/lib/trpc/client'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Trash2, Copy, ExternalLink, MapPin } from 'lucide-react'
import Link from 'next/link'
import { ImageUpload } from '@/components/ui/ImageUpload'
import Image from 'next/image'
import React from 'react'

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  address: z.string().min(5),
  city: z.string().default('Grand Rapids'),
  state: z.string().default('MI'),
  zip: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  neighborhood: z.string().optional(),
  categoryId: z.string().min(1, 'Select a category'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION']),
  verified: z.boolean(),
  premium: z.boolean(),
  autoApprove: z.boolean(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  adminNotes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Category { id: string; name: string; icon?: string | null }
interface Place {
  id: string; name: string; slug: string; description?: string | null
  address: string; city: string; state: string; zip?: string | null
  phone?: string | null; website?: string | null; facebook?: string | null; instagram?: string | null; email?: string | null
  latitude?: number | null; longitude?: number | null; neighborhood?: string | null
  categoryId: string; status: string; verified: boolean; premium: boolean; autoApprove: boolean
  portalToken: string; logoUrl?: string | null; metaTitle?: string | null; metaDescription?: string | null; adminNotes?: string | null
  _count: { deals: number }
}

interface Props {
  place: Place | null
  categories: Category[]
  isNew: boolean
}

export function AdminPlaceEditor({ place, categories, isNew }: Props) {
  const router = useRouter()
  const createPlace = trpc.places.create.useMutation()
  const updatePlace = trpc.places.update.useMutation()
  const deletePlace = trpc.places.delete.useMutation()
  const regenToken = trpc.places.regeneratePortalToken.useMutation()
  const [logoUrl, setLogoUrl] = React.useState(place?.logoUrl ?? '')
  const [geocoding, setGeocoding] = React.useState<'idle' | 'loading' | 'error'>('idle')

  const { register, handleSubmit, getValues, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: place?.name ?? '',
      description: place?.description ?? '',
      address: place?.address ?? '',
      city: place?.city ?? 'Grand Rapids',
      state: place?.state ?? 'MI',
      zip: place?.zip ?? '',
      phone: place?.phone ?? '',
      website: place?.website ?? '',
      facebook: place?.facebook ?? '',
      instagram: place?.instagram ?? '',
      email: place?.email ?? '',
      latitude: place?.latitude?.toString() ?? '',
      longitude: place?.longitude?.toString() ?? '',
      neighborhood: place?.neighborhood ?? '',
      categoryId: place?.categoryId ?? '',
      status: (place?.status as FormValues['status']) ?? 'ACTIVE',
      verified: place?.verified ?? false,
      premium: place?.premium ?? false,
      autoApprove: place?.autoApprove ?? false,
      metaTitle: place?.metaTitle ?? '',
      metaDescription: place?.metaDescription ?? '',
      adminNotes: place?.adminNotes ?? '',
    },
  })

  async function handleLookupCoordinates() {
    const { address, city, state, zip } = getValues()
    const query = [address, city, state, zip].filter(Boolean).join(', ')
    if (!query) return
    setGeocoding('loading')
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=us&limit=1`
      )
      const data = await res.json()
      const [lng, lat] = data.features?.[0]?.center ?? []
      if (lat == null || lng == null) { setGeocoding('error'); return }
      setValue('latitude', lat.toFixed(6))
      setValue('longitude', lng.toFixed(6))
      setGeocoding('idle')
    } catch {
      setGeocoding('error')
    }
  }

  async function onSubmit(data: FormValues) {
    const payload = {
      ...data,
      latitude: data.latitude ? parseFloat(data.latitude) : undefined,
      longitude: data.longitude ? parseFloat(data.longitude) : undefined,
      website: data.website || undefined,
      facebook: data.facebook || undefined,
      instagram: data.instagram || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
    }
    if (isNew) {
      const created = await createPlace.mutateAsync({ ...payload, logoUrl: logoUrl || undefined })
      router.push(`/admin/places/${created.id}`)
    } else {
      await updatePlace.mutateAsync({ id: place!.id, ...payload, logoUrl: logoUrl || null, adminNotes: data.adminNotes || null })
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!place) return
    if (!confirm(`Delete "${place.name}" and all its deals? This cannot be undone.`)) return
    await deletePlace.mutateAsync({ id: place.id })
    router.push('/admin/places')
  }

  async function handleRegenToken() {
    if (!place) return
    if (!confirm('Regenerate the portal token? The old link will stop working immediately.')) return
    await regenToken.mutateAsync({ id: place.id })
    router.refresh()
  }

  const portalUrl = place
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/place/${place.portalToken}`
    : null

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{isNew ? 'Add New Place' : `Edit: ${place?.name}`}</h1>
          {place && (
            <p className="text-xs text-text-muted mt-0.5">{place._count.deals} deals</p>
          )}
        </div>
        {!isNew && (
          <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={handleDelete} loading={deletePlace.isPending}>
            Delete
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Section title="Basic Info">
          <Input label="Place Name" required error={errors.name?.message} {...register('name')} />
          <Textarea label="Description" rows={3} {...register('description')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              required
              error={errors.categoryId?.message}
              options={[{ value: '', label: 'Select…' }, ...categories.map((c) => ({ value: c.id, label: `${c.icon ?? ''} ${c.name}` }))]}
              {...register('categoryId')}
            />
            <Select
              label="Status"
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
              {...register('status')}
            />
          </div>
        </Section>

        <Section title="Location">
          <Input label="Address" required error={errors.address?.message} {...register('address')} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="City" {...register('city')} />
            <Input label="State" {...register('state')} />
            <Input label="ZIP" {...register('zip')} />
          </div>
          <Input label="Neighborhood" placeholder="e.g. Downtown, Eastown" {...register('neighborhood')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Latitude" type="number" step="any" placeholder="42.9634" {...register('latitude')} />
            <Input label="Longitude" type="number" step="any" placeholder="-85.6681" {...register('longitude')} />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLookupCoordinates}
              disabled={geocoding === 'loading'}
              className="flex items-center gap-1.5 text-xs text-brand-blue hover:underline disabled:opacity-50"
            >
              <MapPin className="h-3.5 w-3.5" />
              {geocoding === 'loading' ? 'Looking up…' : 'Look up coordinates from address'}
            </button>
            {geocoding === 'error' && (
              <span className="text-xs text-brand-red">Address not found — try a full street address.</span>
            )}
          </div>
        </Section>

        <Section title="Contact">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Phone" type="tel" {...register('phone')} />
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <div className="sm:col-span-2">
              <Input label="Website" type="url" placeholder="https://" error={errors.website?.message} {...register('website')} />
            </div>
            <Input label="Facebook URL" type="url" placeholder="https://facebook.com/…" {...register('facebook')} />
            <Input label="Instagram URL" type="url" placeholder="https://instagram.com/…" {...register('instagram')} />
          </div>
        </Section>

        <Section title="Flags">
          <div className="space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" {...register('verified')} className="h-4 w-4 rounded border-surface-border text-brand-blue focus:ring-brand-blue" />
              <span className="text-sm font-medium text-text-primary">✓ Verified place (shows badge)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" {...register('premium')} className="h-4 w-4 rounded border-surface-border text-brand-blue focus:ring-brand-blue" />
              <span className="text-sm font-medium text-text-primary">⭐ Premium place (priority placement)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" {...register('autoApprove')} className="h-4 w-4 rounded border-surface-border text-brand-blue focus:ring-brand-blue" />
              <span className="text-sm font-medium text-text-primary">Auto-approve portal submissions (trusted place)</span>
            </label>
          </div>
        </Section>

        <Section title="Logo">
          {logoUrl && (
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-surface-border">
                <Image src={logoUrl} alt="Place logo" fill className="object-contain p-1" unoptimized />
              </div>
              <button type="button" onClick={() => setLogoUrl('')} className="text-xs text-red-500 hover:underline">Remove</button>
            </div>
          )}
          <ImageUpload folder="places" label={logoUrl ? 'Replace Logo' : 'Upload Logo'} onUploaded={setLogoUrl} />
          {isNew && <p className="text-xs text-text-muted">Logo will be saved when you create the place.</p>}
          {!isNew && <p className="text-xs text-text-muted">Shown on deal cards and the place profile. Square images work best.</p>}
        </Section>

        <Section title="SEO">
          <Input label="Meta Title" {...register('metaTitle')} />
          <Textarea label="Meta Description" rows={2} {...register('metaDescription')} />
        </Section>

        <Section title="Admin Notes">
          <Textarea label="Internal notes (not public)" rows={3} placeholder="Research notes, contact history, sourcing info, etc." {...register('adminNotes')} />
        </Section>

        {(createPlace.error || updatePlace.error) && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-brand-red">
            {createPlace.error?.message ?? updatePlace.error?.message}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" loading={isSubmitting || createPlace.isPending || updatePlace.isPending}>
            {isNew ? 'Create Place' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Portal token section */}
      {place && portalUrl && (
        <div className="rounded-card border border-surface-border bg-white p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Place Portal Link</h2>
          <p className="text-xs text-text-muted mb-3">
            Share this private link with the place owner. They can manage their deals without a password.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-surface-bg border border-surface-border px-3 py-2 text-xs text-text-secondary truncate">
              {portalUrl}
            </code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(portalUrl)}
              className="rounded-lg border border-surface-border p-2 text-text-muted hover:text-text-primary hover:border-brand-blue transition-colors"
              title="Copy link"
            >
              <Copy className="h-4 w-4" />
            </button>
            <a href={portalUrl} target="_blank" rel="noopener noreferrer"
              className="rounded-lg border border-surface-border p-2 text-text-muted hover:text-text-primary hover:border-brand-blue transition-colors"
              title="Open portal">
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <button
            type="button"
            onClick={handleRegenToken}
            className="mt-3 text-xs text-brand-red hover:underline"
            disabled={regenToken.isPending}
          >
            Regenerate token (invalidates current link)
          </button>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-surface-border bg-white p-5 space-y-4">
      <h2 className="text-sm font-semibold text-text-primary border-b border-surface-border pb-2">{title}</h2>
      {children}
    </div>
  )
}
