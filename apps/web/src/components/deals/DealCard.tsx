import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatActiveDays, formatDealHours, getExpiryLabel, getDistanceLabel, DAY_NAMES } from '@/lib/utils'
import { Badge, FeaturedBadge, SourceBadge } from '@/components/ui/Badge'
import { extractPriceLabel } from '@/lib/formatters'
import type { DealCard as DealCardType } from '@grspecials/types'

interface DealCardProps {
  deal: DealCardType
  className?: string
  showSource?: boolean
  isActive?: boolean
}

const AVATAR_COLORS = [
  'bg-brand-blue',
  'bg-brand-red',
  'bg-[#854F0B]',
  'bg-[#0F6E56]',
  'bg-[#534AB7]',
  'bg-[#993556]',
]

function getAvatarColor(name: string): string {
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function formatMobileDays(days: number[]): string {
  if (days.length === 7) return 'Daily'
  if (JSON.stringify(days) === JSON.stringify([1, 2, 3, 4, 5])) return 'Mon–Fri'
  if (JSON.stringify(days) === JSON.stringify([0, 6])) return 'Weekends'
  return days.map((d) => DAY_NAMES[d]).join(', ')
}

function formatMobileTime(startTime?: string | null, endTime?: string | null, activeDays?: number[]): string {
  const time = formatDealHours(startTime, endTime)
  const days = activeDays && activeDays.length < 7 ? formatMobileDays(activeDays) : activeDays?.length === 7 ? 'Daily' : ''
  if (time && days) return `${time} · ${days}`
  if (time) return time
  return days
}

export function DealCard({ deal, className, showSource = true, isActive }: DealCardProps) {
  const expiry = getExpiryLabel(deal.endDate)
  const heroPhoto = deal.photos[0]
  const dealUrl = `/deals/${deal.place.slug}/${deal.slug}`
  const priceLabel = extractPriceLabel(deal.priceNote)

  return (
    <>
      {/* Mobile card — horizontal compact layout */}
      <Link
        href={dealUrl}
        className={cn('flex md:hidden items-center gap-3 bg-white border-b border-surface-border px-4 py-2.5', className)}
        aria-label={`${deal.title} at ${deal.place.name}`}
      >
        {/* Thumbnail */}
        <div className="relative h-[58px] w-[58px] shrink-0 rounded-lg overflow-hidden">
          {heroPhoto ? (
            <Image
              src={heroPhoto.url}
              alt={heroPhoto.altText ?? deal.title}
              fill
              className="object-cover"
              sizes="58px"
            />
          ) : deal.place.logoUrl ? (
            <div className="flex h-full w-full items-center justify-center bg-white">
              <Image
                src={deal.place.logoUrl}
                alt={deal.place.name}
                width={46}
                height={46}
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className={cn('flex h-full w-full items-center justify-center', getAvatarColor(deal.place.name))}>
              <span className="text-sm font-bold text-white">{getInitials(deal.place.name)}</span>
            </div>
          )}
        </div>

        {/* Center info */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-text-primary truncate leading-tight">{deal.title}</p>
          <p className="text-[11px] font-medium text-brand-blue truncate">{deal.place.name}</p>
          {(deal.startTime || deal.endTime || (deal.activeDays && deal.activeDays.length > 0)) && (
            <p className="text-[11px] text-text-muted truncate">
              {formatMobileTime(deal.startTime, deal.endTime, deal.activeDays)}
            </p>
          )}
        </div>

        {/* Right column */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          {isActive && (
            <div className="h-[7px] w-[7px] rounded-full bg-green-500" />
          )}
          {priceLabel && (
            <div className="bg-brand-blue text-brand-yellow rounded-lg px-2 py-1 text-[11px] font-bold max-w-[80px] text-center leading-tight">
              {priceLabel}
            </div>
          )}
        </div>
      </Link>

      {/* Desktop card — original layout */}
      <Link
        href={dealUrl}
        className={cn('deal-card hidden md:block overflow-hidden', deal.featured && 'featured-glow', className)}
        aria-label={`${deal.title} at ${deal.place.name}`}
      >
        {/* Image / placeholder */}
        <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {heroPhoto ? (
            <Image
              src={heroPhoto.url}
              alt={heroPhoto.altText ?? deal.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div
              className="flex h-full items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${deal.category.color ?? '#F5C518'}22, ${deal.category.color ?? '#F5C518'}44)` }}
            >
              {deal.place.logoUrl ? (
                <Image
                  src={deal.place.logoUrl}
                  alt={deal.place.name}
                  width={80}
                  height={80}
                  className="object-contain rounded-xl"
                  unoptimized
                />
              ) : (
                <span className="text-4xl">{deal.category.icon ?? '🏷️'}</span>
              )}
            </div>
          )}
          {deal.featured && (
            <div className="absolute top-2 left-2">
              <FeaturedBadge />
            </div>
          )}
          {expiry?.urgent && (
            <div className="absolute top-2 right-2 rounded-full bg-brand-red px-2 py-0.5 text-xs font-semibold text-white">
              {expiry.label}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <Badge color={deal.category.color ?? undefined}>
              {deal.category.icon} {deal.category.name}
            </Badge>
            <Badge color={deal.dealType.color ?? undefined}>
              {deal.dealType.icon} {deal.dealType.name}
            </Badge>
            {showSource && <SourceBadge source={deal.source} />}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-text-primary text-sm leading-tight line-clamp-2 mb-1">
            {deal.title}
          </h3>

          {/* Place */}
          <p className="text-xs font-medium text-brand-blue truncate mb-2">
            {deal.place.name}
            {deal.place.verified && (
              <span className="ml-1 text-brand-blue" title="Verified place">✓</span>
            )}
          </p>

          {/* Deal info */}
          <div className="space-y-1">
            {(deal.startTime || deal.endTime) && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Clock className="h-3 w-3 shrink-0" />
                <span>{formatDealHours(deal.startTime, deal.endTime)}</span>
              </div>
            )}
            {deal.activeDays.length < 7 && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>{formatActiveDays(deal.activeDays)}</span>
              </div>
            )}
            {deal.place.neighborhood && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <MapPin className="h-3 w-3 shrink-0" />
                <span>{deal.place.neighborhood}</span>
                {deal.distance !== undefined && (
                  <span className="text-text-muted">· {getDistanceLabel(deal.distance)}</span>
                )}
              </div>
            )}
          </div>

          {/* Price note */}
          {deal.priceNote && (
            <p className="mt-2.5 rounded-md bg-brand-yellow/10 px-2 py-1 text-xs font-medium text-brand-yellow-dark border border-brand-yellow/20">
              {deal.priceNote}
            </p>
          )}
        </div>
      </Link>
    </>
  )
}
