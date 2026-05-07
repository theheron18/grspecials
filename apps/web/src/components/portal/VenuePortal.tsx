'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { DAY_NAMES_FULL, formatActiveDays, formatDealHours } from '@/lib/utils'
import { Plus, Eye, MousePointerClick, Edit2, CheckCircle } from 'lucide-react'
import Image from 'next/image'

interface DealType { id: string; name: string; slug: string; icon?: string | null }
interface Deal {
  id: string; title: string; description?: string | null; status: string; source: string
  startTime?: string | null; endTime?: string | null
  endDate?: Date | null; activeDays: number[]; views: number; clicks: number
  priceNote?: string | null
  dealType: DealType
  photos: { url: string }[]
}
interface Place {
  id: string; name: string; address: string; phone?: string | null
  website?: string | null; email?: string | null; logoUrl?: string | null
  verified: boolean; premium: boolean; autoApprove: boolean
  category: { name: string; icon?: string | null }
  deals: Deal[]
}

interface PlacePortalProps {
  place: Place
  dealTypes: DealType[]
  token: string
}

const dealSchema = z.object({
  title: z.string().min(5, 'Required').max(150),
  description: z.string().min(20, 'Describe the deal in at least 20 characters').max(2000),
  dealTypeId: z.string().min(1, 'Select a deal type'),
  validDays: z.array(z.number()).min(1, 'Select at least one day'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  endDate: z.string().optional(),
  priceNote: z.string().optional(),
})

type DealFormValues = z.infer<typeof dealSchema>

type PortalView = 'deals' | 'add-deal' | 'edit-deal' | 'stats'

export function PlacePortal({ place, dealTypes, token }: PlacePortalProps) {
  const venue = place
  const [view, setView] = useState<PortalView>('deals')
  const [addSuccess, setAddSuccess] = useState(false)
  const [editSuccess, setEditSuccess] = useState(false)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)

  const addDeal = trpc.portal.addDeal.useMutation()
  const updateDeal = trpc.portal.updateDeal.useMutation()
  const utils = trpc.useUtils()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: { validDays: [1, 2, 3, 4, 5] },
  })

  const editForm = useForm<DealFormValues>({ resolver: zodResolver(dealSchema) })
  const editValidDays = editForm.watch('validDays')

  const validDays = watch('validDays')

  function toggleDay(day: number) {
    const current = validDays ?? []
    setValue('validDays', current.includes(day) ? current.filter((d) => d !== day) : [...current, day], { shouldValidate: true })
  }

  function toggleEditDay(day: number) {
    const current = editValidDays ?? []
    editForm.setValue('validDays', current.includes(day) ? current.filter((d) => d !== day) : [...current, day], { shouldValidate: true })
  }

  function handleEditDeal(deal: Deal) {
    setEditingDeal(deal)
    editForm.reset({
      title: deal.title,
      description: deal.description ?? '',
      dealTypeId: deal.dealType.id,
      validDays: deal.activeDays,
      startTime: deal.startTime ?? '',
      endTime: deal.endTime ?? '',
      endDate: deal.endDate ? new Date(deal.endDate).toLocaleDateString('en-CA', { timeZone: 'America/Detroit' }) : '',
      priceNote: deal.priceNote ?? '',
    })
    setView('edit-deal')
  }

  async function onSubmitDeal(data: DealFormValues) {
    await addDeal.mutateAsync({ token, ...data, activeDays: data.validDays })
    setAddSuccess(true)
    reset()
    void utils.portal.getPlace.invalidate()
    setTimeout(() => { setAddSuccess(false); setView('deals') }, 2000)
  }

  async function onSubmitEdit(data: DealFormValues) {
    if (!editingDeal) return
    await updateDeal.mutateAsync({
      token,
      dealId: editingDeal.id,
      title: data.title,
      description: data.description,
      activeDays: data.validDays,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      endDate: data.endDate || null,
      priceNote: data.priceNote || null,
    })
    setEditSuccess(true)
    void utils.portal.getPlace.invalidate()
    setTimeout(() => { setEditSuccess(false); setEditingDeal(null); setView('deals') }, 2000)
  }

  const activeDeals = venue.deals.filter((d) => d.status === 'ACTIVE')
  const pendingDeals = venue.deals.filter((d) => d.status === 'PENDING_REVIEW')

  return (
    <div className="min-h-screen bg-surface-bg">
      {/* Portal header */}
      <header className="bg-white border-b border-surface-border">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {venue.logoUrl && (
              <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-surface-border shrink-0">
                <Image src={venue.logoUrl} alt={venue.name} fill className="object-cover" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-text-primary">{venue.name}</h1>
                {venue.verified && <span className="text-xs text-brand-blue font-medium">✓ Verified</span>}
                {venue.premium && <span className="text-xs text-brand-yellow-dark font-medium">⭐ Premium</span>}
              </div>
              <p className="text-xs text-text-muted">{venue.category.icon} {venue.category.name}</p>
            </div>
          </div>
          <div className="text-xs text-text-muted text-right hidden sm:block">
            <p>Place Portal</p>
            <a href="/" className="text-brand-blue hover:underline">GRspecials.com</a>
          </div>
        </div>
      </header>

      {/* Nav tabs */}
      <div className="bg-white border-b border-surface-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 flex gap-0">
          {([['deals', '📋 My Deals'], ['add-deal', '+ Add Deal'], ['stats', '📊 Stats']] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                (view === v || (view === 'edit-deal' && v === 'deals'))
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Deals list */}
        {view === 'deals' && (
          <div className="space-y-6">
            {pendingDeals.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">
                  Pending Review ({pendingDeals.length})
                </h2>
                <div className="space-y-3">
                  {pendingDeals.map((deal) => (
                    <DealRow key={deal.id} deal={deal} onEdit={handleEditDeal} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                  Active Deals ({activeDeals.length})
                </h2>
                <Button size="sm" variant="yellow" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setView('add-deal')}>
                  Add Deal
                </Button>
              </div>
              {activeDeals.length === 0 ? (
                <div className="rounded-card border border-dashed border-surface-border p-8 text-center">
                  <p className="text-text-muted text-sm mb-3">No active deals yet.</p>
                  <Button size="sm" variant="yellow" onClick={() => setView('add-deal')}>
                    Add Your First Deal
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeDeals.map((deal) => (
                    <DealRow key={deal.id} deal={deal} onEdit={handleEditDeal} />
                  ))}
                </div>
              )}
            </div>

            {!venue.autoApprove && (
              <p className="text-xs text-text-muted rounded-lg bg-surface-bg border border-surface-border p-3">
                💡 New deals go through a quick review before going live. Usually within a few hours.
              </p>
            )}
          </div>
        )}

        {/* Add deal form */}
        {view === 'add-deal' && (
          <div className="max-w-xl">
            <h2 className="text-lg font-bold text-text-primary mb-6">Add a New Deal</h2>
            {addSuccess ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="font-semibold text-text-primary">Deal Submitted!</p>
                <p className="text-sm text-text-secondary">
                  {venue.autoApprove ? 'Your deal is now live.' : 'We\'ll review it and publish shortly.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmitDeal)} className="space-y-5">
                <Input label="Deal Title" required error={errors.title?.message} {...register('title')} />
                <Textarea label="Description" rows={4} required error={errors.description?.message} {...register('description')} />
                <Select
                  label="Deal Type"
                  options={[{ value: '', label: 'Select…' }, ...dealTypes.map((d) => ({ value: d.id, label: `${d.icon ?? ''} ${d.name}` }))]}
                  required
                  error={errors.dealTypeId?.message}
                  {...register('dealTypeId')}
                />

                {/* Days */}
                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">Valid Days <span className="text-brand-red">*</span></label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAY_NAMES_FULL.map((day, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleDay(i)}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                          validDays?.includes(i) ? 'bg-brand-blue border-brand-blue text-white' : 'bg-white border-surface-border text-text-secondary hover:border-brand-blue'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  {errors.validDays && <p className="mt-1 text-xs text-brand-red">{errors.validDays.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input label="Start Time" type="time" {...register('startTime')} />
                  <Input label="End Time" type="time" {...register('endTime')} />
                </div>
                <Input label="Expiry Date (optional)" type="date" {...register('endDate')} />
                <Input label="Price Note (optional)" placeholder="e.g. $1 off all drafts" {...register('priceNote')} />

                {addDeal.error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-brand-red">
                    {addDeal.error.message}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setView('deals')}>Cancel</Button>
                  <Button type="submit" variant="yellow" loading={isSubmitting || addDeal.isPending} className="flex-1">
                    Submit Deal
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Edit deal form */}
        {view === 'edit-deal' && editingDeal && (
          <div className="max-w-xl">
            <h2 className="text-lg font-bold text-text-primary mb-6">Edit Deal</h2>
            {editSuccess ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="font-semibold text-text-primary">Changes Submitted!</p>
                <p className="text-sm text-text-secondary">
                  {venue.autoApprove ? 'Your deal has been updated.' : "We'll review your changes shortly."}
                </p>
              </div>
            ) : (
              <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-5">
                <Input label="Deal Title" required error={editForm.formState.errors.title?.message} {...editForm.register('title')} />
                <Textarea label="Description" rows={4} required error={editForm.formState.errors.description?.message} {...editForm.register('description')} />
                <Select
                  label="Deal Type"
                  options={[{ value: '', label: 'Select…' }, ...dealTypes.map((d) => ({ value: d.id, label: `${d.icon ?? ''} ${d.name}` }))]}
                  required
                  error={editForm.formState.errors.dealTypeId?.message}
                  {...editForm.register('dealTypeId')}
                />
                <div>
                  <label className="text-sm font-medium text-text-primary block mb-2">Valid Days <span className="text-brand-red">*</span></label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAY_NAMES_FULL.map((day, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleEditDay(i)}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                          editValidDays?.includes(i) ? 'bg-brand-blue border-brand-blue text-white' : 'bg-white border-surface-border text-text-secondary hover:border-brand-blue'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  {editForm.formState.errors.validDays && <p className="mt-1 text-xs text-brand-red">{editForm.formState.errors.validDays.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Start Time" type="time" {...editForm.register('startTime')} />
                  <Input label="End Time" type="time" {...editForm.register('endTime')} />
                </div>
                <Input label="Expiry Date (optional)" type="date" {...editForm.register('endDate')} />
                <Input label="Price Note (optional)" placeholder="e.g. $1 off all drafts" {...editForm.register('priceNote')} />
                {updateDeal.error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-brand-red">
                    {updateDeal.error.message}
                  </div>
                )}
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setView('deals')}>Cancel</Button>
                  <Button type="submit" variant="yellow" loading={editForm.formState.isSubmitting || updateDeal.isPending} className="flex-1">
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Stats */}
        {view === 'stats' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-text-primary">Deal Performance</h2>
            {venue.deals.length === 0 ? (
              <p className="text-text-secondary text-sm">No deals yet — add one to start tracking stats.</p>
            ) : (() => {
              const totalViews = venue.deals.reduce((s, d) => s + d.views, 0)
              const totalClicks = venue.deals.reduce((s, d) => s + d.clicks, 0)
              const overallRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '—'
              return (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-card border border-surface-border bg-white p-4 text-center">
                      <p className="text-2xl font-bold text-text-primary">{totalViews.toLocaleString()}</p>
                      <p className="text-xs text-text-muted mt-0.5">Total Views</p>
                    </div>
                    <div className="rounded-card border border-surface-border bg-white p-4 text-center">
                      <p className="text-2xl font-bold text-text-primary">{totalClicks.toLocaleString()}</p>
                      <p className="text-xs text-text-muted mt-0.5">Website Clicks</p>
                    </div>
                    <div className="rounded-card border border-surface-border bg-white p-4 text-center">
                      <p className="text-2xl font-bold text-brand-blue">{overallRate}{overallRate !== '—' ? '%' : ''}</p>
                      <p className="text-xs text-text-muted mt-0.5">Click Rate</p>
                    </div>
                  </div>

                  <div className="rounded-card border border-surface-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-bg border-b border-surface-border">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Deal</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary">Status</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary">Views</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary">Clicks</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {venue.deals.map((deal) => {
                          const rate = deal.views > 0 ? ((deal.clicks / deal.views) * 100).toFixed(1) + '%' : '—'
                          return (
                            <tr key={deal.id} className="hover:bg-surface-bg">
                              <td className="px-4 py-3 font-medium text-text-primary max-w-xs truncate">{deal.title}</td>
                              <td className="px-4 py-3 text-right">
                                <Badge color={deal.status === 'ACTIVE' ? '#059669' : '#6B7280'} size="sm">{deal.status}</Badge>
                              </td>
                              <td className="px-4 py-3 text-right text-text-secondary">{deal.views.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-text-secondary">{deal.clicks.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-text-muted">{rate}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="border-t-2 border-surface-border bg-surface-bg">
                        <tr>
                          <td className="px-4 py-3 text-xs font-semibold text-text-secondary" colSpan={2}>Total</td>
                          <td className="px-4 py-3 text-right text-xs font-semibold text-text-primary">{totalViews.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-xs font-semibold text-text-primary">{totalClicks.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-xs font-semibold text-brand-blue">{overallRate}{overallRate !== '—' ? '%' : ''}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

function DealRow({ deal, onEdit }: { deal: Deal; onEdit?: (deal: Deal) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-surface-border bg-white p-4">
      {deal.photos[0] && (
        <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-surface-border shrink-0">
          <Image src={deal.photos[0].url} alt={deal.title} fill className="object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary text-sm truncate">{deal.title}</p>
        <p className="text-xs text-text-secondary mt-0.5">
          {deal.dealType.icon} {deal.dealType.name}
          {' · '}
          {formatActiveDays(deal.activeDays)}
          {(deal.startTime || deal.endTime) && ` · ${formatDealHours(deal.startTime, deal.endTime)}`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge
          color={deal.status === 'ACTIVE' ? '#059669' : deal.status === 'PENDING_REVIEW' ? '#F59E0B' : '#6B7280'}
          size="sm"
        >
          {deal.status === 'PENDING_REVIEW' ? 'Pending' : deal.status}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Eye className="h-3 w-3" /> {deal.views}
        </div>
        {deal.clicks > 0 && (
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <MousePointerClick className="h-3 w-3" /> {deal.clicks}
          </div>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(deal)}
            className="rounded p-1 text-text-muted hover:text-brand-blue hover:bg-surface-bg transition-colors"
            title="Edit deal"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
