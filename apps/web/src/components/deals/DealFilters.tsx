'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DAY_NAMES_FULL } from '@/lib/utils'
import { BottomSheet } from '@/components/ui/BottomSheet'
import type { TimeFilter } from '@/lib/dealTime'

interface Category { slug: string; name: string; icon?: string | null }
interface DealType { slug: string; name: string; icon?: string | null }
interface Neighborhood { slug: string; name: string }

interface DealFiltersProps {
  categories: Category[]
  dealTypes: DealType[]
  neighborhoods: Neighborhood[]
  effectiveTime: TimeFilter
  total?: number
}

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'now', label: '🟢 Right Now' },
  { value: '2h', label: '⏰ Next 2 Hours' },
  { value: 'today', label: '📅 Today' },
  { value: 'all', label: '🏷️ All Deals' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'ending_soon', label: 'Ending Soon' },
  { value: 'most_popular', label: 'Most Popular' },
  { value: 'alphabetical', label: 'A–Z' },
]

export function DealFilters({
  categories,
  dealTypes,
  neighborhoods,
  effectiveTime,
  total,
}: DealFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)

  // Local state for bottom sheet selections (applied on tap)
  const [sheetCategory, setSheetCategory] = useState('')
  const [sheetDealType, setSheetDealType] = useState('')
  const [sheetNeighborhood, setSheetNeighborhood] = useState('')

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
        params.delete('page')
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const updateTime = useCallback(
    (t: TimeFilter) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('time', t)
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const current = {
    category: searchParams.get('category') ?? '',
    dealType: searchParams.get('dealType') ?? '',
    neighborhood: searchParams.get('neighborhood') ?? '',
    day: searchParams.get('day') ?? '',
    sort: searchParams.get('sort') ?? 'newest',
    time: (searchParams.get('time') as TimeFilter | null) ?? effectiveTime,
  }

  const activeCount = [current.category, current.dealType, current.neighborhood].filter(Boolean).length
  const showDayFilter = current.time === 'all'

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === current.sort)?.label ?? 'Newest'

  function cycleSortOption() {
    const idx = SORT_OPTIONS.findIndex((o) => o.value === current.sort)
    const next = SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length]
    updateParam('sort', next.value)
  }

  function openFilterSheet() {
    setSheetCategory(current.category)
    setSheetDealType(current.dealType)
    setSheetNeighborhood(current.neighborhood)
    setFilterOpen(true)
  }

  function applySheetFilters() {
    const params = new URLSearchParams(searchParams.toString())
    if (sheetCategory) params.set('category', sheetCategory); else params.delete('category')
    if (sheetDealType) params.set('dealType', sheetDealType); else params.delete('dealType')
    if (sheetNeighborhood) params.set('neighborhood', sheetNeighborhood); else params.delete('neighborhood')
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
    setFilterOpen(false)
  }

  return (
    <div className="space-y-4">
      {/* Time filter pills — same on mobile and desktop */}
      <div className="flex gap-2 flex-wrap">
        {TIME_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => updateTime(value)}
            className={cn(
              'touch-pill rounded-full border text-sm font-medium transition-colors whitespace-nowrap',
              'focus:outline-none focus:ring-2 focus:ring-brand-blue/20',
              current.time === value
                ? 'border-brand-blue bg-brand-blue text-white'
                : 'border-surface-border bg-white text-text-secondary hover:border-brand-blue hover:text-brand-blue',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Mobile filter controls */}
      <div className="flex md:hidden items-center gap-2">
        <button
          onClick={openFilterSheet}
          className="flex items-center gap-1.5 h-10 px-3 rounded-lg bg-brand-blue text-white text-sm"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
        <button
          onClick={cycleSortOption}
          className="flex items-center gap-1 h-10 px-3 rounded-lg bg-white border border-surface-border text-sm text-text-secondary"
        >
          {currentSortLabel}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {total !== undefined && (
          <span className="ml-auto text-xs text-text-muted">{total} deals</span>
        )}
      </div>

      {/* Desktop sort + clear */}
      <div className="hidden md:flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-text-secondary">Sort:</label>
          <select
            value={current.sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="rounded-lg border border-surface-border bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        {activeCount > 0 && (
          <button
            onClick={() => {
              const params = new URLSearchParams()
              if (current.sort !== 'newest') params.set('sort', current.sort)
              params.set('time', current.time)
              router.push(`${pathname}?${params.toString()}`, { scroll: false })
            }}
            className="flex items-center gap-1 text-xs text-brand-red hover:underline"
          >
            <X className="h-3 w-3" /> Clear {activeCount} filter{activeCount > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Desktop filter pills row */}
      <div className="hidden md:flex gap-3 flex-wrap">
        <FilterGroup
          label="Category"
          options={categories.map((c) => ({ value: c.slug, label: `${c.icon ?? ''} ${c.name}` }))}
          value={current.category}
          onChange={(v) => updateParam('category', v)}
        />
        <FilterGroup
          label="Deal Type"
          options={dealTypes.map((d) => ({ value: d.slug, label: `${d.icon ?? ''} ${d.name}` }))}
          value={current.dealType}
          onChange={(v) => updateParam('dealType', v)}
        />
        <FilterGroup
          label="Neighborhood"
          options={neighborhoods.map((n) => ({ value: n.slug, label: n.name }))}
          value={current.neighborhood}
          onChange={(v) => updateParam('neighborhood', v)}
        />
        {showDayFilter && (
          <FilterGroup
            label="Day"
            options={DAY_NAMES_FULL.map((d, i) => ({ value: String(i), label: d }))}
            value={current.day}
            onChange={(v) => updateParam('day', v)}
          />
        )}
      </div>

      {/* Mobile filter bottom sheet */}
      <BottomSheet isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter Deals">
        <div className="space-y-6 pb-4">
          <PillGroup
            label="Category"
            options={[{ value: '', label: 'All' }, ...categories.map((c) => ({ value: c.slug, label: `${c.icon ?? ''} ${c.name}` }))]}
            value={sheetCategory}
            onChange={setSheetCategory}
          />
          <PillGroup
            label="Deal Type"
            options={[{ value: '', label: 'All' }, ...dealTypes.map((d) => ({ value: d.slug, label: `${d.icon ?? ''} ${d.name}` }))]}
            value={sheetDealType}
            onChange={setSheetDealType}
          />
          <PillGroup
            label="Neighborhood"
            options={[{ value: '', label: 'All' }, ...neighborhoods.map((n) => ({ value: n.slug, label: n.name }))]}
            value={sheetNeighborhood}
            onChange={setSheetNeighborhood}
          />
        </div>
        <button
          onClick={applySheetFilters}
          className="w-full rounded-xl bg-brand-red text-white h-12 font-semibold text-sm mt-2"
        >
          {total !== undefined ? `Show ${total} deals` : 'Apply Filters'}
        </button>
      </BottomSheet>
    </div>
  )
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm cursor-pointer transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-brand-blue/20',
        value
          ? 'border-brand-blue bg-brand-blue text-white'
          : 'border-surface-border bg-white text-text-secondary hover:border-gray-300',
      )}
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

function PillGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value === value ? '' : opt.value)}
            className={cn(
              'touch-pill rounded-full border text-sm font-medium transition-colors',
              opt.value === value
                ? 'border-brand-blue bg-brand-blue text-white'
                : 'border-surface-border bg-white text-text-secondary',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
