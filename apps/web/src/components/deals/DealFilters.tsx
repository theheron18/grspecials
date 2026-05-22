'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DAY_NAMES_FULL } from '@/lib/utils'
import type { TimeFilter } from '@/lib/dealTime'

interface Category { slug: string; name: string; icon?: string | null }
interface DealType { slug: string; name: string; icon?: string | null }
interface Neighborhood { slug: string; name: string }

interface DealFiltersProps {
  categories: Category[]
  dealTypes: DealType[]
  neighborhoods: Neighborhood[]
  effectiveTime: TimeFilter
}

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'now', label: '🟢 Right Now' },
  { value: '2h', label: '⏰ Next 2 Hours' },
  { value: 'today', label: '📅 Today' },
  { value: 'all', label: '🏷️ All Deals' },
]

export function DealFilters({
  categories,
  dealTypes,
  neighborhoods,
  effectiveTime,
}: DealFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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
    // Use URL param if explicit, else fall back to server-computed effective time
    time: (searchParams.get('time') as TimeFilter | null) ?? effectiveTime,
  }

  const activeCount = [current.category, current.dealType, current.neighborhood].filter(
    Boolean,
  ).length

  // Hide day filter when a time filter is active — it's implied to be today
  const showDayFilter = current.time === 'all'

  return (
    <div className="space-y-4">
      {/* Time filter pills */}
      <div className="flex gap-2 flex-wrap">
        {TIME_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => updateTime(value)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
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

      {/* Sort + clear */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-text-secondary">Sort:</label>
          <select
            value={current.sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="rounded-lg border border-surface-border bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          >
            <option value="newest">Newest</option>
            <option value="ending_soon">Ending Soon</option>
            <option value="most_popular">Most Popular</option>
            <option value="alphabetical">A–Z</option>
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

      {/* Filter pills row */}
      <div className="flex gap-3 flex-wrap">
        {/* Category */}
        <FilterGroup
          label="Category"
          options={categories.map((c) => ({ value: c.slug, label: `${c.icon ?? ''} ${c.name}` }))}
          value={current.category}
          onChange={(v) => updateParam('category', v)}
        />
        {/* Deal type */}
        <FilterGroup
          label="Deal Type"
          options={dealTypes.map((d) => ({ value: d.slug, label: `${d.icon ?? ''} ${d.name}` }))}
          value={current.dealType}
          onChange={(v) => updateParam('dealType', v)}
        />
        {/* Neighborhood */}
        <FilterGroup
          label="Neighborhood"
          options={neighborhoods.map((n) => ({ value: n.slug, label: n.name }))}
          value={current.neighborhood}
          onChange={(v) => updateParam('neighborhood', v)}
        />
        {/* Day — only shown when time filter is 'all' */}
        {showDayFilter && (
          <FilterGroup
            label="Day"
            options={DAY_NAMES_FULL.map((d, i) => ({ value: String(i), label: d }))}
            value={current.day}
            onChange={(v) => updateParam('day', v)}
          />
        )}
      </div>
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
