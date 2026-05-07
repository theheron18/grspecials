'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import { formatRelativeDate, formatActiveDays, formatDealHours } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'

interface Deal {
  id: string; title: string; description: string; source: string
  activeDays: number[]; startTime?: string | null; endTime?: string | null
  endDate?: Date | null; priceNote?: string | null
  submitterName?: string | null; submitterEmail?: string | null
  createdAt: Date
  place: { id: string; name: string; address: string }
  category: { name: string; icon?: string | null }
  dealType: { name: string; icon?: string | null }
  photos: { url: string }[]
}

interface ModerationQueueProps {
  deals: Deal[]
}

export function ModerationQueue({ deals: initialDeals }: ModerationQueueProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const approve = trpc.submissions.approve.useMutation()
  const reject = trpc.submissions.reject.useMutation()
  const bulkApprove = trpc.submissions.bulkApprove.useMutation()
  const bulkReject = trpc.submissions.bulkReject.useMutation()

  async function handleApprove(id: string) {
    await approve.mutateAsync({ id })
    router.refresh()
  }

  async function handleReject() {
    if (!rejectModal || !rejectReason.trim()) return
    await reject.mutateAsync({ id: rejectModal.id, reason: rejectReason })
    setRejectModal(null)
    setRejectReason('')
    router.refresh()
  }

  async function handleBulkApprove() {
    if (selectedIds.size === 0) return
    await bulkApprove.mutateAsync({ ids: [...selectedIds] })
    setSelectedIds(new Set())
    router.refresh()
  }

  async function handleBulkReject() {
    if (selectedIds.size === 0 || !rejectReason.trim()) return
    await bulkReject.mutateAsync({ ids: [...selectedIds], reason: rejectReason })
    setSelectedIds(new Set())
    setRejectModal(null)
    setRejectReason('')
    router.refresh()
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (initialDeals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-surface-border bg-white py-16 text-center gap-3">
        <CheckCircle className="h-10 w-10 text-green-400" />
        <p className="font-semibold text-text-primary">All caught up!</p>
        <p className="text-sm text-text-secondary">No deals waiting for review.</p>
      </div>
    )
  }

  return (
    <>
      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-20 flex items-center gap-3 rounded-lg border border-brand-blue bg-brand-blue/5 px-4 py-3">
          <span className="text-sm font-medium text-brand-blue">{selectedIds.size} selected</span>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => { setRejectModal({ id: 'bulk', title: `${selectedIds.size} deals` }); setRejectReason('') }}
              icon={<XCircle className="h-3.5 w-3.5" />}
            >
              Reject All
            </Button>
            <Button
              size="sm"
              onClick={handleBulkApprove}
              loading={bulkApprove.isPending}
              icon={<CheckCircle className="h-3.5 w-3.5" />}
            >
              Approve All
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {initialDeals.map((deal) => (
          <div
            key={deal.id}
            className={`rounded-card border bg-white overflow-hidden transition-colors ${
              selectedIds.has(deal.id) ? 'border-brand-blue ring-1 ring-brand-blue/20' : 'border-surface-border'
            }`}
          >
            {/* Header row */}
            <div className="flex items-start gap-3 p-4">
              <input
                type="checkbox"
                checked={selectedIds.has(deal.id)}
                onChange={() => toggleSelect(deal.id)}
                className="mt-0.5 h-4 w-4 rounded border-surface-border text-brand-blue focus:ring-brand-blue"
              />

              {deal.photos[0] && (
                <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-surface-border shrink-0">
                  <Image src={deal.photos[0].url} alt={deal.title} fill className="object-cover" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-semibold text-text-primary text-sm">{deal.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {deal.category.icon} {deal.category.name} ·{' '}
                      {deal.dealType.icon} {deal.dealType.name} ·{' '}
                      <span className="font-medium">{deal.place.name}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted shrink-0">
                    <Clock className="h-3 w-3" />
                    {formatRelativeDate(deal.createdAt)}
                  </div>
                </div>

                <div className="mt-1.5 flex items-center gap-3 text-xs text-text-secondary flex-wrap">
                  <span>{formatActiveDays(deal.activeDays)}</span>
                  {(deal.startTime || deal.endTime) && <span>{formatDealHours(deal.startTime, deal.endTime)}</span>}
                  {deal.priceNote && <span className="text-brand-yellow-dark font-medium">{deal.priceNote}</span>}
                  {deal.submitterName && <span>by {deal.submitterName}</span>}
                  {deal.submitterEmail && (
                    <a href={`mailto:${deal.submitterEmail}`} className="text-brand-blue hover:underline">
                      {deal.submitterEmail}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Expandable description */}
            <div className="border-t border-surface-border">
              <button
                onClick={() => setExpanded(expanded === deal.id ? null : deal.id)}
                className="flex w-full items-center justify-between px-4 py-2 text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                <span>Deal description</span>
                {expanded === deal.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {expanded === deal.id && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">{deal.description}</p>
                  <p className="mt-2 text-xs text-text-muted">📍 {deal.place.address}</p>
                </div>
              )}
            </div>

            {/* Action row */}
            <div className="flex items-center justify-end gap-2 border-t border-surface-border bg-surface-bg px-4 py-2.5">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => { setRejectModal({ id: deal.id, title: deal.title }); setRejectReason('') }}
                icon={<XCircle className="h-3.5 w-3.5 text-brand-red" />}
                className="text-brand-red border-brand-red/30 hover:bg-red-50"
              >
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => handleApprove(deal.id)}
                loading={approve.isPending}
                icon={<CheckCircle className="h-3.5 w-3.5" />}
              >
                Approve
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Reject modal */}
      <Modal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title={`Reject: ${rejectModal?.title}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Provide a reason — this will be emailed to the submitter if they provided an email address.
          </p>
          <Textarea
            label="Rejection Reason"
            rows={4}
            required
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. This deal has already expired / doesn't meet our content guidelines…"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!rejectReason.trim()}
              loading={reject.isPending || bulkReject.isPending}
              onClick={rejectModal?.id === 'bulk' ? handleBulkReject : handleReject}
            >
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
