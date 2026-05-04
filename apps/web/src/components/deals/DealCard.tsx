import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatActiveDays, formatDealHours, getExpiryLabel, getDistanceLabel } from '@/lib/utils'
import { Badge, FeaturedBadge, SourceBadge } from '@/components/ui/Badge'
import type { DealCard as DealCardType } from '@grspecials/types'

interface DealCardProps {
  deal: DealCardType
  className?: string
  showSource?: boolean
}

export function DealCard({ deal, className, showSource = true }: DealCardProps) {
  const expiry = getExpiryLabel(deal.endDate)
  const heroPhoto = deal.photos[0]
  const dealUrl = `/deals/${deal.venue.slug}/${deal.slug}`

  return (
    <Link
      href={dealUrl}
      className={cn('deal-card block overflow-hidden', deal.featured && 'featured-glow', className)}
      aria-label={`${deal.title} at ${deal.venue.name}`}
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
            className="flex h-full items-center justify-center text-4xl"
            style={{ background: `linear-gradient(135deg, ${deal.category.color ?? '#F5C518'}22, ${deal.category.color ?? '#F5C518'}44)` }}
          >
            {deal.category.icon ?? '🏷️'}
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

        {/* Venue */}
        <p className="text-xs font-medium text-brand-blue truncate mb-2">
          {deal.venue.name}
          {deal.venue.verified && (
            <span className="ml-1 text-brand-blue" title="Verified venue">✓</span>
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
          {deal.venue.neighborhood && (
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{deal.venue.neighborhood}</span>
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
  )
}
