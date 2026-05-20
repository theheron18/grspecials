'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Search, RefreshCw, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DealType { id: string; name: string; slug: string; icon?: string | null }
interface Category { id: string; name: string; slug: string }

interface Place {
  id: string
  name: string
  address: string
  categoryId: string
  lastResearchedAt: Date | null
  activeDealsCount: number
}

interface ResearchDeal {
  _clientId: string
  title: string
  description: string
  days: number[]
  startTime: string | null
  endTime: string | null
  dealType: string
  dealFrequency: 'RECURRING' | 'ONE_OFF'
  frequencyConfidence: 'high' | 'medium' | 'low'
  sourceUrl: string
  dedupeStatus: 'new' | 'possible_duplicate' | 'exists'
  matchedTitle?: string
  dismissed: boolean
  added: boolean
  addedTitle?: string
  expanded: boolean
  recheckAt: string // YYYY-MM-DD
}

interface PlaceResult {
  placeId: string
  placeName: string
  status: 'searching' | 'done' | 'error'
  error?: string
  deals: ResearchDeal[]
}

type FilterTab = 'all' | 'no_deals' | 'stale' | 'never'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function defaultRecheckAt(): string {
  const d = new Date()
  d.setDate(d.getDate() + 90)
  return d.toISOString().slice(0, 10)
}

function relativeTime(date: Date | null): string {
  if (!date) return 'Never'
  const diffMs = Date.now() - new Date(date).getTime()
  const days = Math.floor(diffMs / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

function wasResearchedRecently(date: Date | null): boolean {
  if (!date) return false
  const diffDays = (Date.now() - new Date(date).getTime()) / 86400000
  return diffDays < 7
}

function isStale(date: Date | null): boolean {
  if (!date) return false
  const diffDays = (Date.now() - new Date(date).getTime()) / 86400000
  return diffDays >= 30
}

function researchDot(date: Date | null): { color: string; tooltip: string } {
  if (!date) return { color: 'bg-red-400', tooltip: 'Never researched' }
  const diffDays = (Date.now() - new Date(date).getTime()) / 86400000
  const label = `Researched ${relativeTime(date)}`
  if (diffDays <= 7) return { color: 'bg-emerald-400', tooltip: label }
  if (diffDays <= 30) return { color: 'bg-amber-400', tooltip: label }
  return { color: 'bg-red-400', tooltip: label }
}

let clientIdCounter = 0
function nextId() { return `deal-${++clientIdCounter}` }

// ─── Main component ───────────────────────────────────────────────────────────

export function ResearchPageClient({
  dealTypes,
  categories: _categories,
}: {
  dealTypes: DealType[]
  categories: Category[]
}) {
  const { data: placesData, isLoading: placesLoading } = trpc.places.researchList.useQuery()
  const places: Place[] = placesData ?? []

  const [filterTab, setFilterTab] = useState<FilterTab>('never')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [overrideSkip, setOverrideSkip] = useState<Set<string>>(new Set())
  const [results, setResults] = useState<Record<string, PlaceResult>>({})
  const [isResearching, setIsResearching] = useState(false)
  const [order, setOrder] = useState<string[]>([])

  const createDeal = trpc.deals.create.useMutation()
  const updatePlace = trpc.places.update.useMutation()
  const utils = trpc.useUtils()

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    switch (filterTab) {
      case 'no_deals': return places.filter((p) => p.activeDealsCount === 0)
      case 'stale': return places.filter((p) => isStale(p.lastResearchedAt))
      case 'never': return places.filter((p) => !p.lastResearchedAt)
      default: return places
    }
  }, [places, filterTab])

  const filterCounts = useMemo(() => ({
    all: places.length,
    no_deals: places.filter((p) => p.activeDealsCount === 0).length,
    stale: places.filter((p) => isStale(p.lastResearchedAt)).length,
    never: places.filter((p) => !p.lastResearchedAt).length,
  }), [places])

  // ── Selection helpers ──────────────────────────────────────────────────────

  function togglePlace(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    const eligible = filtered.filter((p) => {
      const recentWithDeals = wasResearchedRecently(p.lastResearchedAt) && p.activeDealsCount > 0
      return !recentWithDeals || overrideSkip.has(p.id)
    })
    setSelected(new Set(eligible.map((p) => p.id)))
  }

  function deselectAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      filtered.forEach((p) => next.delete(p.id))
      return next
    })
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id))

  // ── Research ───────────────────────────────────────────────────────────────

  async function startResearch() {
    const placeIds = [...selected]
    if (!placeIds.length) return

    setIsResearching(true)
    setOrder(placeIds)

    // Set all to searching
    setResults((prev) => {
      const next = { ...prev }
      for (const id of placeIds) {
        const place = places.find((p) => p.id === id)
        next[id] = {
          placeId: id,
          placeName: place?.name ?? id,
          status: 'searching',
          deals: [],
        }
      }
      return next
    })

    try {
      const res = await fetch('/api/admin/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeIds }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const event = JSON.parse(line)
            handleStreamEvent(event)
          } catch {
            // skip malformed line
          }
        }
      }
    } catch (err) {
      console.error('Research stream error:', err)
    } finally {
      setIsResearching(false)
      utils.places.researchList.invalidate()
    }
  }

  const handleStreamEvent = useCallback((event: {
    type: string
    placeId?: string
    placeName?: string
    deals?: Array<{
      title: string; description: string; days: number[]; startTime: string | null
      endTime: string | null; dealType: string; dealFrequency: 'RECURRING' | 'ONE_OFF'
      frequencyConfidence: 'high' | 'medium' | 'low'; sourceUrl: string
      dedupeStatus: 'new' | 'possible_duplicate' | 'exists'; matchedTitle?: string
    }>
    error?: string
  }) => {
    if (event.type === 'place_result' && event.placeId) {
      const deals: ResearchDeal[] = (event.deals ?? []).map((d) => ({
        ...d,
        _clientId: nextId(),
        dismissed: false,
        added: false,
        expanded: d.dedupeStatus !== 'exists',
        recheckAt: defaultRecheckAt(),
      }))
      setResults((prev) => ({
        ...prev,
        [event.placeId!]: {
          placeId: event.placeId!,
          placeName: event.placeName ?? event.placeId!,
          status: 'done',
          deals,
        },
      }))
    } else if (event.type === 'place_error' && event.placeId) {
      setResults((prev) => ({
        ...prev,
        [event.placeId!]: {
          placeId: event.placeId!,
          placeName: event.placeName ?? event.placeId!,
          status: 'error',
          error: event.error,
          deals: [],
        },
      }))
    }
  }, [])

  function updateDeal(placeId: string, clientId: string, patch: Partial<ResearchDeal>) {
    setResults((prev) => {
      const place = prev[placeId]
      if (!place) return prev
      return {
        ...prev,
        [placeId]: {
          ...place,
          deals: place.deals.map((d) => d._clientId === clientId ? { ...d, ...patch } : d),
        },
      }
    })
  }

  async function addDealToReview(placeId: string, deal: ResearchDeal) {
    const place = places.find((p) => p.id === placeId)
    if (!place) return

    const dealTypeRecord = dealTypes.find(
      (dt) => dt.slug === deal.dealType || dt.name.toLowerCase() === deal.dealType.toLowerCase()
    ) ?? dealTypes[0]
    if (!dealTypeRecord) return

    await createDeal.mutateAsync({
      title: deal.title,
      description: deal.description,
      venueId: placeId,
      categoryId: place.categoryId,
      dealTypeId: dealTypeRecord.id,
      activeDays: deal.days,
      startTime: deal.startTime ?? undefined,
      endTime: deal.endTime ?? undefined,
      status: 'PENDING_REVIEW',
      sourceUrl: deal.sourceUrl,
      sourceType: 'AI_RESEARCHED',
      dealFrequency: deal.dealFrequency,
      recheckAt: new Date(deal.recheckAt + 'T23:59:59'),
      aiResearched: true,
    })

    updateDeal(placeId, deal._clientId, { added: true, addedTitle: deal.title })
  }

  function retryPlace(placeId: string) {
    setResults((prev) => ({
      ...prev,
      [placeId]: { ...prev[placeId], status: 'searching', error: undefined },
    }))
    fetch('/api/admin/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeIds: [placeId] }),
    }).then(async (res) => {
      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          try { handleStreamEvent(JSON.parse(line)) } catch { /* skip */ }
        }
      }
      utils.places.researchList.invalidate()
    })
  }

  const selectedCount = selected.size

  // ── Render ─────────────────────────────────────────────────────────────────

  const hasResults = order.length > 0

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left panel ── */}
      <div className="flex w-80 flex-col border-r border-surface-border bg-white shrink-0">
        <div className="border-b border-surface-border p-4">
          <h1 className="text-base font-semibold text-text-primary">Research Deals</h1>
          <p className="mt-0.5 text-xs text-text-muted">Find deals at Grand Rapids venues using AI web search</p>
        </div>

        {/* Filter tabs */}
        <div className="border-b border-surface-border px-2 pt-2">
          <div className="flex gap-0.5">
            {([
              ['all', 'All'],
              ['no_deals', 'No deals'],
              ['stale', 'Stale'],
              ['never', 'Never'],
            ] as [FilterTab, string][]).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  filterTab === tab
                    ? 'bg-brand-blue text-white'
                    : 'text-text-muted hover:text-text-primary hover:bg-gray-100'
                }`}
              >
                {label}
                {!placesLoading && (
                  <span className={`ml-1 ${filterTab === tab ? 'opacity-75' : 'opacity-60'}`}>
                    ({filterCounts[tab as FilterTab]})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Select all / Deselect all */}
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-2">
          <span className="text-xs text-text-muted">{filtered.length} places</span>
          <button
            onClick={allFilteredSelected ? deselectAll : selectAll}
            className="text-xs text-brand-blue hover:underline"
          >
            {allFilteredSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        {/* Place list */}
        <div className="flex-1 overflow-y-auto">
          {placesLoading ? (
            <div className="py-8 text-center text-xs text-text-muted">Loading places…</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-muted">No places match this filter</div>
          ) : (
            <ul className="divide-y divide-surface-border">
              {filtered.map((place) => {
                const recentAndHasDeals = wasResearchedRecently(place.lastResearchedAt) && place.activeDealsCount > 0
                const includeAnyway = overrideSkip.has(place.id)
                const isChecked = selected.has(place.id)
                const dot = researchDot(place.lastResearchedAt)

                return (
                  <li key={place.id} className="hover:bg-surface-bg">
                    <label className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePlace(place.id)}
                        className="h-3.5 w-3.5 shrink-0 rounded border-surface-border text-brand-blue focus:ring-brand-blue"
                      />
                      {/* Status dot with native tooltip */}
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${dot.color}`}
                        title={dot.tooltip}
                      />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-text-primary">
                        {place.name}
                      </span>
                      <span className="shrink-0 text-xs text-text-muted">
                        {place.activeDealsCount > 0 ? `${place.activeDealsCount} deals` : ''}
                      </span>
                    </label>
                    {recentAndHasDeals && (
                      <label className="mx-3 mb-1 flex cursor-pointer items-center gap-1.5 rounded bg-amber-50 px-2 py-1">
                        <input
                          type="checkbox"
                          checked={includeAnyway}
                          onChange={(e) => {
                            setOverrideSkip((prev) => {
                              const next = new Set(prev)
                              e.target.checked ? next.add(place.id) : next.delete(place.id)
                              return next
                            })
                          }}
                          className="h-3 w-3 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs text-amber-700">Researched recently — include anyway?</span>
                      </label>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Research button */}
        <div className="border-t border-surface-border p-4">
          <button
            onClick={startResearch}
            disabled={selectedCount === 0 || isResearching}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResearching ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Researching…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                {selectedCount === 0 ? 'Research selected' : `Research ${selectedCount} place${selectedCount === 1 ? '' : 's'}`}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 overflow-y-auto bg-surface-bg p-6">
        {!hasResults ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Search className="mx-auto mb-3 h-10 w-10 text-text-muted opacity-40" />
              <p className="text-sm text-text-muted">Select places on the left and click Research to find deals</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {order.map((placeId) => {
              const result = results[placeId]
              if (!result) return null
              return (
                <PlaceResultSection
                  key={placeId}
                  result={result}
                  dealTypes={dealTypes}
                  onUpdateDeal={(clientId, patch) => updateDeal(placeId, clientId, patch)}
                  onAddToReview={(deal) => addDealToReview(placeId, deal)}
                  onRetry={() => retryPlace(placeId)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Place result section ─────────────────────────────────────────────────────

function PlaceResultSection({
  result,
  dealTypes,
  onUpdateDeal,
  onAddToReview,
  onRetry,
}: {
  result: PlaceResult
  dealTypes: DealType[]
  onUpdateDeal: (clientId: string, patch: Partial<ResearchDeal>) => void
  onAddToReview: (deal: ResearchDeal) => Promise<void>
  onRetry: () => void
}) {
  const activeDeals = result.deals.filter((d) => !d.dismissed && !d.added)
  const dealsFound = result.deals.length

  return (
    <div className="overflow-hidden rounded-card border border-surface-border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-border px-5 py-3.5">
        <h2 className="font-semibold text-text-primary">{result.placeName}</h2>
        <StatusPill result={result} dealsFound={dealsFound} />
      </div>

      {/* Error */}
      {result.status === 'error' && (
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-sm text-red-600">{result.error}</p>
          <button
            onClick={onRetry}
            className="ml-4 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Searching */}
      {result.status === 'searching' && (
        <div className="flex items-center gap-2 px-5 py-4 text-sm text-text-muted">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Searching for deals…
        </div>
      )}

      {/* Done — no deals */}
      {result.status === 'done' && dealsFound === 0 && (
        <div className="px-5 py-8 text-center text-sm text-text-muted">No deals found</div>
      )}

      {/* Deal cards */}
      {result.deals.length > 0 && (
        <div className="divide-y divide-surface-border">
          {result.deals.map((deal) => (
            <DealCard
              key={deal._clientId}
              deal={deal}
              dealTypes={dealTypes}
              onChange={(patch) => onUpdateDeal(deal._clientId, patch)}
              onAddToReview={() => onAddToReview(deal)}
            />
          ))}
        </div>
      )}

      {/* Summary after research */}
      {result.status === 'done' && dealsFound > 0 && (
        <div className="border-t border-surface-border bg-surface-bg px-5 py-2.5 text-xs text-text-muted">
          {activeDeals.length} remaining · {result.deals.filter((d) => d.added).length} added to review · {result.deals.filter((d) => d.dismissed).length} dismissed
        </div>
      )}
    </div>
  )
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ result, dealsFound }: { result: PlaceResult; dealsFound: number }) {
  if (result.status === 'searching') {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
        <RefreshCw className="h-3 w-3 animate-spin" /> Searching
      </span>
    )
  }
  if (result.status === 'error') {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
        <XCircle className="h-3 w-3" /> Error
      </span>
    )
  }
  if (dealsFound === 0) {
    return (
      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-text-muted">
        No deals found
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <CheckCircle className="h-3 w-3" /> Found {dealsFound} deal{dealsFound === 1 ? '' : 's'}
    </span>
  )
}

// ─── Deal card ────────────────────────────────────────────────────────────────

function DealCard({
  deal,
  dealTypes,
  onChange,
  onAddToReview,
}: {
  deal: ResearchDeal
  dealTypes: DealType[]
  onChange: (patch: Partial<ResearchDeal>) => void
  onAddToReview: () => Promise<void>
}) {
  const [saving, setSaving] = useState(false)

  if (deal.dismissed) return null

  if (deal.added) {
    return (
      <div className="flex items-center gap-2 px-5 py-3 text-sm text-emerald-700">
        <CheckCircle className="h-4 w-4 shrink-0" />
        <span>Added to review: <strong>{deal.addedTitle}</strong></span>
      </div>
    )
  }

  const isExists = deal.dedupeStatus === 'exists'

  if (isExists && !deal.expanded) {
    return (
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-text-muted">
            Already in system
          </span>
          <span className="truncate max-w-xs">{deal.title}</span>
        </div>
        <button
          onClick={() => onChange({ expanded: true })}
          className="ml-4 shrink-0 text-xs text-text-muted hover:text-text-primary"
        >
          Show anyway
        </button>
      </div>
    )
  }

  async function handleAdd() {
    setSaving(true)
    try {
      await onAddToReview()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`px-5 py-4 ${deal.dedupeStatus === 'possible_duplicate' ? 'bg-amber-50/40' : ''}`}>
      {/* Dedup banner */}
      {deal.dedupeStatus === 'possible_duplicate' && deal.matchedTitle && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Similar deal already exists: <strong>{deal.matchedTitle}</strong></span>
        </div>
      )}
      {deal.dedupeStatus === 'exists' && deal.matchedTitle && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-text-muted">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Near-identical match: <strong>{deal.matchedTitle}</strong></span>
        </div>
      )}

      <div className="space-y-3">
        {/* Title */}
        <input
          type="text"
          value={deal.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm font-medium text-text-primary focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          placeholder="Deal title"
        />

        {/* Description */}
        <textarea
          value={deal.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={2}
          className="w-full resize-none rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-text-primary focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          placeholder="Description"
        />

        {/* Days */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">Valid days</label>
          <div className="flex flex-wrap gap-1.5">
            {DAY_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const next = deal.days.includes(i)
                    ? deal.days.filter((d) => d !== i)
                    : [...deal.days, i].sort((a, b) => a - b)
                  onChange({ days: next })
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  deal.days.includes(i)
                    ? 'bg-brand-blue text-white'
                    : 'border border-surface-border bg-white text-text-secondary hover:border-brand-blue'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Time + Deal type row */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Start time</label>
            <input
              type="time"
              value={deal.startTime ?? ''}
              onChange={(e) => onChange({ startTime: e.target.value || null })}
              className="w-full rounded-md border border-surface-border px-2 py-1.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">End time</label>
            <input
              type="time"
              value={deal.endTime ?? ''}
              onChange={(e) => onChange({ endTime: e.target.value || null })}
              className="w-full rounded-md border border-surface-border px-2 py-1.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">Deal type</label>
            <select
              value={deal.dealType}
              onChange={(e) => onChange({ dealType: e.target.value })}
              className="w-full rounded-md border border-surface-border px-2 py-1.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
            >
              {dealTypes.map((dt) => (
                <option key={dt.id} value={dt.slug}>{dt.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Frequency toggle */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">Deal frequency</label>
          <div className="flex items-center gap-3">
            <div className="flex rounded-md border border-surface-border overflow-hidden">
              <button
                type="button"
                onClick={() => onChange({ dealFrequency: 'RECURRING' })}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  deal.dealFrequency === 'RECURRING'
                    ? 'bg-brand-blue text-white'
                    : 'bg-white text-text-secondary hover:bg-gray-50'
                }`}
              >
                Recurring Deal
              </button>
              <button
                type="button"
                onClick={() => onChange({ dealFrequency: 'ONE_OFF' })}
                className={`border-l border-surface-border px-3 py-1.5 text-xs font-medium transition-colors ${
                  deal.dealFrequency === 'ONE_OFF'
                    ? 'bg-brand-blue text-white'
                    : 'bg-white text-text-secondary hover:bg-gray-50'
                }`}
              >
                One-Off Event
              </button>
            </div>
            <span className={`text-xs ${
              deal.frequencyConfidence === 'high' ? 'text-emerald-600' :
              deal.frequencyConfidence === 'medium' ? 'text-amber-600' : 'text-text-muted'
            }`}>
              AI thinks this is {deal.dealFrequency === 'RECURRING' ? 'recurring' : 'a one-off event'}
              {' '}({deal.frequencyConfidence} confidence)
            </span>
          </div>
        </div>

        {/* Source URL */}
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Source URL</label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={deal.sourceUrl}
              onChange={(e) => onChange({ sourceUrl: e.target.value })}
              className="flex-1 rounded-md border border-surface-border px-3 py-1.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
              placeholder="https://…"
            />
            {deal.sourceUrl && (
              <a
                href={deal.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-md border border-surface-border p-1.5 text-text-muted hover:text-brand-blue"
                title="Verify source"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* Recheck date */}
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">Recheck date</label>
          <input
            type="date"
            value={deal.recheckAt}
            onChange={(e) => onChange({ recheckAt: e.target.value })}
            className="rounded-md border border-surface-border px-3 py-1.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
        </div>

        {/* Actions */}
        <div className="pt-1">
          <p className="mb-2 text-xs text-text-muted">Verify deal details at source URL before approving</p>
          <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onChange({ dismissed: true })}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-gray-100 hover:text-text-primary"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className={`rounded-md px-3 py-2 text-xs font-medium text-white transition-colors disabled:opacity-50 ${
              deal.dedupeStatus === 'possible_duplicate' || deal.dedupeStatus === 'exists'
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {saving ? 'Adding…' : deal.dedupeStatus === 'new' ? 'Add to review' : 'Add anyway'}
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}
