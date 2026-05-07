import { prisma } from '@grspecials/db'
import { DealsMap } from '@/components/map/DealsMap'
import type { DealFilters } from '@grspecials/types'

export async function DealsMapSection({ filters }: { filters: DealFilters }) {
  const deals = await prisma.deal.findMany({
    where: {
      status: 'ACTIVE',
      venue: { latitude: { not: null }, longitude: { not: null } },
      ...(filters.category && { category: { slug: filters.category } }),
      ...(filters.dealType && { dealType: { slug: filters.dealType } }),
    },
    take: 200,
    select: {
      id: true,
      title: true,
      slug: true,
      featured: true,
      venue: { select: { name: true, slug: true, latitude: true, longitude: true } },
      category: { select: { slug: true, color: true } },
    },
  })

  const pins = deals
    .filter((d) => d.venue.latitude && d.venue.longitude)
    .map((d) => ({
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
