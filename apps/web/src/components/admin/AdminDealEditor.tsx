'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { trpc } from '@/lib/trpc/client'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { DAY_NAMES_FULL } from '@/lib/utils'
import { Trash2, ExternalLink, Copy } from 'lucide-react'
import Link from 'next/link'
import { ImageUpload, PhotoGrid, PendingPhotoGrid } from '@/components/ui/ImageUpload'

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  shortDesc: z.string().optional(),
  venueId: z.string().min(1, 'Select a venue'),
  categoryId: z.string().min(1, 'Select a category'),
  dealTypeId: z.string().min(1, 'Select a deal type'),
  neighborhoodId: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'EXPIRED', 'ARCHIVED']),
  source: z.enum(['ADMIN_POSTED', 'COMMUNITY_SUBMITTED', 'VENUE_SUBMITTED', 'AUTO_SCRAPED']).optional(),
  featured: z.boolean().optional(),
  activeDays: z.array(z.number()).min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  priceNote: z.string().optional(),
  adminNotes: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Category { id: string; name: string; icon?: string | null }
interface DealType { id: string; name: string; icon?: string | null }
interface Neighborhood { id: string; name: string }
interface Venue { id: string; name: string; slug: string }
interface Deal {
  id: string; title: string; description: string; shortDesc?: string | null
  venueId: string; categoryId: string; dealTypeId: string; neighborhoodId?: string | null
  status: string; source: string; featured: boolean
  activeDays: number[]; startTime?: string | null; endTime?: string | null
  startDate?: Date | null; endDate?: Date | null; priceNote?: string | null
  adminNotes?: string | null; metaTitle?: string | null; metaDescription?: string | null
  tags?: string[]
  venue: Venue; photos: { url: string; altText?: string | null }[]
}

interface Props {
  deal: Deal | null
  categories: Category[]
  dealTypes: DealType[]
  neighborhoods: Neighborhood[]
  isNew: boolean
}

export function AdminDealEditor({ deal, categories, dealTypes, neighborhoods, isNew }: Props) {
  const router = useRouter()
  const createDeal = trpc.deals.create.useMutation()
  const updateDeal = trpc.deals.update.useMutation()
  const deleteDeal = trpc.deals.delete.useMutation()
  const duplicateDeal = trpc.deals.duplicate.useMutation()
  const addPhoto = trpc.deals.addPhoto.useMutation()
  const removePhoto = trpc.deals.removePhoto.useMutation()
  const [photos, setPhotos] = React.useState(deal?.photos ?? [])
  const [pendingPhotoUrls, setPendingPhotoUrls] = React.useState<string[]>([])
  const [tagsInput, setTagsInput] = React.useState((deal?.tags ?? []).join(', '))

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: deal?.title ?? '',
      description: deal?.description ?? '',
      shortDesc: deal?.shortDesc ?? '',
      venueId: deal?.venueId ?? '',
      categoryId: deal?.categoryId ?? '',
      dealTypeId: deal?.dealTypeId ?? '',
      neighborhoodId: deal?.neighborhoodId ?? '',
      status: (deal?.status as FormValues['status']) ?? 'ACTIVE',
      source: (deal?.source as FormValues['source']) ?? 'ADMIN_POSTED',
      featured: deal?.featured ?? false,
      activeDays: deal?.activeDays ?? [0, 1, 2, 3, 4, 5, 6],
      startTime: deal?.startTime ?? '',
      endTime: deal?.endTime ?? '',
      startDate: deal?.startDate ? deal.startDate.toISOString().slice(0, 10) : '',
      endDate: deal?.endDate ? deal.endDate.toISOString().slice(0, 10) : '',
      priceNote: deal?.priceNote ?? '',
      adminNotes: deal?.adminNotes ?? '',
      metaTitle: deal?.metaTitle ?? '',
      metaDescription: deal?.metaDescription ?? '',
    },
  })

  const activeDays = watch('activeDays')
  const featured = watch('featured')

  function toggleDay(day: number) {
    const curr = activeDays ?? []
    setValue('activeDays', curr.includes(day) ? curr.filter((d) => d !== day) : [...curr, day], { shouldValidate: true })
  }

  function parseTags(raw: string): string[] {
    return raw.split(',').map((t) => t.trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean)
  }

  async function onSubmit(data: FormValues) {
    const tags = parseTags(tagsInput)
    if (isNew) {
      const created = await createDeal.mutateAsync({
        ...data,
        tags,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        photoUrls: pendingPhotoUrls.length ? pendingPhotoUrls : undefined,
      })
      router.push(`/admin/deals/${created.id}`)
    } else {
      await updateDeal.mutateAsync({
        id: deal!.id,
        ...data,
        tags,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        priceNote: data.priceNote || null,
        adminNotes: data.adminNotes || null,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
      })
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!deal) return
    if (!confirm('Delete this deal permanently?')) return
    await deleteDeal.mutateAsync({ id: deal.id })
    router.push('/admin/deals')
  }

  async function handleDuplicate() {
    if (!deal) return
    const copy = await duplicateDeal.mutateAsync({ id: deal.id })
    router.push(`/admin/deals/${copy.id}`)
  }

  const [venues, setVenues] = React.useState<Venue[]>(deal?.venue ? [deal.venue] : [])
  const [venueSearch, setVenueSearch] = React.useState(deal?.venue?.name ?? '')

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{isNew ? 'Add New Deal' : 'Edit Deal'}</h1>
          {deal && (
            <Link href={`/deals/${deal.venue.slug}/${deal.slug}`} target="_blank" className="text-xs text-brand-blue hover:underline flex items-center gap-1 mt-0.5">
              View live <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
        {!isNew && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<Copy className="h-3.5 w-3.5" />} onClick={handleDuplicate}
              loading={duplicateDeal.isPending}>
              Duplicate
            </Button>
            <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={handleDelete}
              loading={deleteDeal.isPending}>
              Delete
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Core */}
        <Section title="Deal Info">
          <Input label="Title" required error={errors.title?.message} {...register('title')} />
          <Textarea label="Description" rows={5} required error={errors.description?.message} {...register('description')} />
          <Input label="Short Description (optional)" placeholder="One-line summary for cards" {...register('shortDesc')} />
        </Section>

        {/* Venue + Classification */}
        <Section title="Classification">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-text-primary block mb-1.5">
                Venue <span className="text-brand-red">*</span>
              </label>
              <VenueSearch defaultValue={deal?.venue?.name ?? ''} onSelect={(v) => setValue('venueId', v.id)} />
              {errors.venueId && <p className="mt-1 text-xs text-brand-red">{errors.venueId.message}</p>}
            </div>
            <Select
              label="Category"
              required
              options={[{ value: '', label: 'Select…' }, ...categories.map((c) => ({ value: c.id, label: `${c.icon ?? ''} ${c.name}` }))]}
              error={errors.categoryId?.message}
              {...register('categoryId')}
            />
            <Select
              label="Deal Type"
              required
              options={[{ value: '', label: 'Select…' }, ...dealTypes.map((d) => ({ value: d.id, label: `${d.icon ?? ''} ${d.name}` }))]}
              error={errors.dealTypeId?.message}
              {...register('dealTypeId')}
            />
            <Select
              label="Neighborhood"
              options={[{ value: '', label: 'None' }, ...neighborhoods.map((n) => ({ value: n.id, label: n.name }))]}
              {...register('neighborhoodId')}
            />
          </div>
        </Section>

        {/* Schedule */}
        <Section title="Schedule & Hours">
          <div>
            <label className="text-sm font-medium text-text-primary block mb-2">Valid Days</label>
            <div className="flex gap-1.5 flex-wrap">
              {DAY_NAMES_FULL.map((day, i) => (
                <button key={i} type="button" onClick={() => toggleDay(i)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    activeDays?.includes(i)
                      ? 'bg-brand-blue border-brand-blue text-white'
                      : 'bg-white border-surface-border text-text-secondary hover:border-brand-blue'
                  }`}>
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Time" type="time" {...register('startTime')} />
            <Input label="End Time" type="time" {...register('endTime')} />
            <Input label="Start Date" type="date" {...register('startDate')} />
            <Input label="End Date" type="date" {...register('endDate')} />
          </div>
          <Input label="Price Note" placeholder="e.g. $1 off all drafts" {...register('priceNote')} />
        </Section>

        {/* Status & Flags */}
        <Section title="Status & Display">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              options={[
                { value: 'DRAFT', label: 'Draft' },
                { value: 'PENDING_REVIEW', label: 'Pending Review' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'REJECTED', label: 'Rejected' },
                { value: 'EXPIRED', label: 'Expired' },
                { value: 'ARCHIVED', label: 'Archived' },
              ]}
              {...register('status')}
            />
            <Select
              label="Source"
              options={[
                { value: 'ADMIN_POSTED', label: 'Admin Posted' },
                { value: 'COMMUNITY_SUBMITTED', label: 'Community' },
                { value: 'VENUE_SUBMITTED', label: 'Venue' },
                { value: 'AUTO_SCRAPED', label: 'Auto-scraped' },
              ]}
              {...register('source')}
            />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" {...register('featured')} className="h-4 w-4 rounded border-surface-border text-brand-blue focus:ring-brand-blue" />
            <span className="text-sm font-medium text-text-primary">⭐ Featured deal (priority placement)</span>
          </label>
        </Section>

        {/* SEO */}
        <Section title="SEO (optional)">
          <Input label="Meta Title" placeholder="Defaults to deal title" {...register('metaTitle')} />
          <Textarea label="Meta Description" rows={2} placeholder="Defaults to deal description" {...register('metaDescription')} />
        </Section>

        {/* Photos */}
        <Section title="Photos">
          {isNew ? (
            <>
              <PendingPhotoGrid
                urls={pendingPhotoUrls}
                onRemove={(url) => setPendingPhotoUrls((p) => p.filter((u) => u !== url))}
              />
              <ImageUpload
                folder="deals"
                label="Add Photo"
                onUploaded={(url) => setPendingPhotoUrls((p) => [...p, url])}
              />
              <p className="text-xs text-text-muted">Photos will be saved when you create the deal. First photo is used as the card image.</p>
            </>
          ) : (
            <>
              <PhotoGrid
                photos={photos}
                onRemove={async (id) => {
                  await removePhoto.mutateAsync({ photoId: id })
                  setPhotos((p) => p.filter((x) => x.id !== id))
                }}
              />
              <ImageUpload
                folder="deals"
                label="Add Photo"
                onUploaded={async (url) => {
                  const photo = await addPhoto.mutateAsync({ dealId: deal!.id, url })
                  setPhotos((p) => [...p, photo])
                }}
              />
              <p className="text-xs text-text-muted">First photo is used as the deal card image.</p>
            </>
          )}
        </Section>

        {/* Tags */}
        <Section title="Tags & Holiday Labels">
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">Tags</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. cinco-de-mayo, happy-hour, weekend"
              className="form-input"
            />
            <p className="text-xs text-text-muted mt-1.5">Comma-separated. Use holiday tags to surface deals in the holiday banner.</p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-secondary mb-1.5">Quick-add holiday tags:</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "New Year's Day", tag: 'new-years-day' },
                { label: "Valentine's Day", tag: 'valentines-day' },
                { label: "St. Patrick's Day", tag: 'st-patricks-day' },
                { label: 'Cinco de Mayo', tag: 'cinco-de-mayo' },
                { label: 'Fourth of July', tag: 'fourth-of-july' },
                { label: 'Halloween', tag: 'halloween' },
                { label: 'Thanksgiving', tag: 'thanksgiving' },
                { label: 'Christmas', tag: 'christmas' },
                { label: "New Year's Eve", tag: 'new-years-eve' },
              ].map(({ label, tag }) => {
                const active = tagsInput.split(',').map((t) => t.trim()).includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const current = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
                      if (active) {
                        setTagsInput(current.filter((t) => t !== tag).join(', '))
                      } else {
                        setTagsInput([...current, tag].join(', '))
                      }
                    }}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-brand-blue border-brand-blue text-white'
                        : 'bg-white border-surface-border text-text-secondary hover:border-brand-blue'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </Section>

        {/* Admin notes */}
        <Section title="Admin Notes">
          <Textarea label="Internal notes (not public)" rows={2} placeholder="Moderation notes, reason for rejection, etc." {...register('adminNotes')} />
        </Section>

        {(createDeal.error || updateDeal.error) && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-brand-red">
            {createDeal.error?.message ?? updateDeal.error?.message}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" loading={isSubmitting || createDeal.isPending || updateDeal.isPending}>
            {isNew ? 'Create Deal' : 'Save Changes'}
          </Button>
        </div>
      </form>
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

// Inline venue search — debounced fetch from tRPC
import React, { useEffect, useRef, useState as useStateR } from 'react'

function VenueSearch({ defaultValue, onSelect }: { defaultValue: string; onSelect: (v: { id: string; name: string }) => void }) {
  const [query, setQuery] = useStateR(defaultValue)
  const [results, setResults] = useStateR<{ id: string; name: string }[]>([])
  const [open, setOpen] = useStateR(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const utils = trpc.useUtils()

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const data = await utils.venues.list.fetch({ q: query, limit: 8 })
      setResults(data.venues.map((v) => ({ id: v.id, name: v.name })))
      setOpen(true)
    }, 300)
  }, [query, utils])

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search venues…"
        className="form-input"
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-surface-border bg-white shadow-card-hover">
          {results.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => { onSelect(v); setQuery(v.name); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-surface-bg border-b border-surface-border last:border-0"
            >
              {v.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
