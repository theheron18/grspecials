import { prisma } from '@grspecials/db'
import { DealsMap } from '@/components/map/DealsMap'
import type { DealFilters } from '@grspecials/types'
import { isActiveNow, startsWithinMinutes, type TimeFilter } from '@/lib/dealTime'

export async function DealsMapSection({
  filters,
  timeFilter,
  etDay,
}: {
  filters: DealFilters
  timeFilter: TimeFilter
  etDay: number
}) {
  const deals = await prisma.deal.findMany({
    where: {
      status: 'ACTIVE',
      venue: { latitude: { not: null }, longitude: { not: null } },
      ...(filters.category && { category: { slug: filters.category } }),
      ...(filters.dealType && { dealType: { slug: filters.dealType } }),
      ...(timeFilter !== 'all' && { activeDays: { has: etDay } }),
    },
    take: 200,
    select: {
      id: true,
      title: true,
      slug: true,
      featured: true,
      activeDays: true,
      startTime: true,
      endTime: true,
      venue: { select: { name: true, slug: true, latitude: true, longitude: true } },
      category: { select: { slug: true, color: true } },
    },
  })

  let filtered = deals.filter((d) => d.venue.latitude && d.venue.longitude)

  if (timeFilter === 'now') {
    filtered = filtered.filter(isActiveNow)
  } else if (timeFilter === '2h') {
    filtered = filtered.filter((d) => isActiveNow(d) || startsWithinMinutes(d, 120))
  }

  const pins = filtered.map((d) => ({
    id: d.id,
    lat: d.venue.latitude!,
    lng: d.venue.longitude!,
    title: d.title,
    slug: `${d.venue.slug}/${d.slug}`,
    category: d.category.slug,
    categoryColor: d.category.color ?? '#1A56DB',
    placeName: d.venue.name,
    featured: d.featured,
  }))

  return (
    <div className="h-[560px] w-full">
      <DealsMap pins={pins} />
    </div>
  )
}
