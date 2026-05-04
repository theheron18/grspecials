import { notFound } from 'next/navigation'
import { prisma } from '@grspecials/db'
import { AdminDealEditor } from '@/components/admin/AdminDealEditor'

interface PageProps {
  params: { id: string }
}

export default async function AdminDealEditPage({ params }: PageProps) {
  const [deal, categories, dealTypes, neighborhoods] = await Promise.all([
    prisma.deal.findUnique({
      where: { id: params.id },
      include: {
        venue: { select: { id: true, name: true, slug: true } },
        category: true,
        dealType: true,
        neighborhood: true,
        photos: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.venueCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.dealType.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.neighborhood.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])

  if (!deal) notFound()

  return (
    <AdminDealEditor
      deal={deal as never}
      categories={categories}
      dealTypes={dealTypes}
      neighborhoods={neighborhoods}
      isNew={false}
    />
  )
}
