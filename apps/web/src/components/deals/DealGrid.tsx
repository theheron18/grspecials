import { DealCard } from './DealCard'
import { DealCardSkeleton } from '@/components/ui/Skeleton'
import type { DealCard as DealCardType } from '@grspecials/types'

interface DealGridProps {
  deals: DealCardType[]
  loading?: boolean
  skeletonCount?: number
  emptyMessage?: string
}

export function DealGrid({ deals, loading, skeletonCount = 8, emptyMessage }: DealGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <DealCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-text-secondary font-medium">
          {emptyMessage ?? 'No deals found. Try adjusting your filters.'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {deals.map((deal) => (
        <DealCard key={deal.id} deal={deal} />
      ))}
    </div>
  )
}
