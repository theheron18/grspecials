import { z } from 'zod'
import { router, publicProcedure, adminProcedure } from '../trpc'
import { DealStatus, DealSource, Prisma } from '@grspecials/db'
import { slugify } from '@/lib/utils'
import { TRPCError } from '@trpc/server'

const dealCardSelect = {
  id: true,
  title: true,
  slug: true,
  shortDesc: true,
  status: true,
  source: true,
  featured: true,
  startTime: true,
  endTime: true,
  activeDays: true,
  endDate: true,
  priceNote: true,
  views: true,
  createdAt: true,
  venue: {
    select: {
      id: true, name: true, slug: true, address: true, neighborhood: true,
      latitude: true, longitude: true, verified: true, logoUrl: true,
    },
  },
  category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
  dealType: { select: { id: true, name: true, slug: true, icon: true, color: true } },
  photos: { select: { url: true, altText: true }, orderBy: { sortOrder: 'asc' as const }, take: 1 },
} satisfies Prisma.DealSelect

export const dealsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        dealType: z.string().optional(),
        neighborhood: z.string().optional(),
        day: z.number().int().min(0).max(6).optional(),
        featured: z.boolean().optional(),
        q: z.string().optional(),
        sort: z.enum(['newest', 'ending_soon', 'most_popular', 'alphabetical']).optional().default('newest'),
        page: z.number().int().min(1).optional().default(1),
        limit: z.number().int().min(1).max(48).optional().default(24),
        venueId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, sort, q, ...filters } = input
      const skip = (page - 1) * limit

      const where: Prisma.DealWhereInput = {
        status: DealStatus.ACTIVE,
        ...(filters.category && { category: { slug: filters.category } }),
        ...(filters.dealType && { dealType: { slug: filters.dealType } }),
        ...(filters.neighborhood && { neighborhood: { slug: filters.neighborhood } }),
        ...(filters.day !== undefined && { activeDays: { has: filters.day } }),
        ...(filters.featured !== undefined && { featured: filters.featured }),
        ...(filters.venueId && { venueId: filters.venueId }),
        ...(q && {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { venue: { name: { contains: q, mode: 'insensitive' } } },
          ],
        }),
      }

      const orderBy: Prisma.DealOrderByWithRelationInput =
        sort === 'newest' ? { createdAt: 'desc' }
        : sort === 'ending_soon' ? { endDate: 'asc' }
        : sort === 'most_popular' ? { views: 'desc' }
        : { title: 'asc' }

      const [deals, total] = await Promise.all([
        ctx.prisma.deal.findMany({
          where,
          orderBy: [{ featured: 'desc' }, orderBy],
          skip,
          take: limit,
          select: dealCardSelect,
        }),
        ctx.prisma.deal.count({ where }),
      ])

      return {
        deals,
        total,
        page,
        pageCount: Math.ceil(total / limit),
      }
    }),

  bySlug: publicProcedure
    .input(z.object({ venueSlug: z.string(), dealSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const deal = await ctx.prisma.deal.findFirst({
        where: {
          slug: input.dealSlug,
          status: DealStatus.ACTIVE,
          venue: { slug: input.venueSlug },
        },
        include: {
          venue: true,
          category: true,
          dealType: true,
          neighborhood: true,
          photos: { orderBy: { sortOrder: 'asc' } },
        },
      })

      if (!deal) throw new TRPCError({ code: 'NOT_FOUND' })

      // Increment views in background
      void ctx.prisma.deal.update({
        where: { id: deal.id },
        data: { views: { increment: 1 } },
      })

      return deal
    }),

  featured: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(12).default(6) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.deal.findMany({
        where: { status: DealStatus.ACTIVE, featured: true },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        select: dealCardSelect,
      })
    }),

  recent: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(12).default(8) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.deal.findMany({
        where: { status: DealStatus.ACTIVE },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        select: dealCardSelect,
      })
    }),

  mapPins: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        dealType: z.string().optional(),
        swLat: z.number().optional(),
        swLng: z.number().optional(),
        neLat: z.number().optional(),
        neLng: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.DealWhereInput = {
        status: DealStatus.ACTIVE,
        venue: {
          latitude: { not: null },
          longitude: { not: null },
          ...(input.swLat !== undefined && {
            latitude: { gte: input.swLat, lte: input.neLat },
            longitude: { gte: input.swLng, lte: input.neLng },
          }),
        },
        ...(input.category && { category: { slug: input.category } }),
        ...(input.dealType && { dealType: { slug: input.dealType } }),
      }

      const deals = await ctx.prisma.deal.findMany({
        where,
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

      return deals
        .filter((d) => d.venue.latitude && d.venue.longitude)
        .map((d) => ({
          id: d.id,
          lat: d.venue.latitude!,
          lng: d.venue.longitude!,
          title: d.title,
          slug: `${d.venue.slug}/${d.slug}`,
          category: d.category.slug,
          categoryColor: d.category.color ?? '#1A56DB',
          venueName: d.venue.name,
          featured: d.featured,
        }))
    }),

  // Admin CRUD
  adminList: adminProcedure
    .input(
      z.object({
        status: z.nativeEnum(DealStatus).optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
        q: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, status, q } = input
      const where: Prisma.DealWhereInput = {
        ...(status && { status }),
        ...(q && {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { venue: { name: { contains: q, mode: 'insensitive' } } },
          ],
        }),
      }

      const [deals, total] = await Promise.all([
        ctx.prisma.deal.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            ...dealCardSelect,
            status: true,
            adminNotes: true,
            submitterEmail: true,
            submitterName: true,
            updatedAt: true,
          },
        }),
        ctx.prisma.deal.count({ where }),
      ])

      return { deals, total, pageCount: Math.ceil(total / limit) }
    }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(3),
        description: z.string().min(10),
        shortDesc: z.string().optional(),
        venueId: z.string(),
        categoryId: z.string(),
        dealTypeId: z.string(),
        neighborhoodId: z.string().optional(),
        source: z.nativeEnum(DealSource).optional().default(DealSource.ADMIN_POSTED),
        featured: z.boolean().optional().default(false),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        activeDays: z.array(z.number().int().min(0).max(6)).optional().default([0, 1, 2, 3, 4, 5, 6]),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        priceNote: z.string().optional(),
        originalPrice: z.number().optional(),
        discountedPrice: z.number().optional(),
        discountPercent: z.number().optional(),
        photoUrls: z.array(z.string().url()).optional(),
        status: z.nativeEnum(DealStatus).optional().default(DealStatus.ACTIVE),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { photoUrls, ...data } = input
      const slug = slugify(data.title)

      const deal = await ctx.prisma.deal.create({
        data: {
          ...data,
          slug: `${slug}-${Date.now()}`,
          photos: photoUrls?.length
            ? { create: photoUrls.map((url, i) => ({ url, sortOrder: i })) }
            : undefined,
        },
      })
      return deal
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(3).optional(),
        description: z.string().min(10).optional(),
        shortDesc: z.string().optional(),
        status: z.nativeEnum(DealStatus).optional(),
        featured: z.boolean().optional(),
        startDate: z.date().optional().nullable(),
        endDate: z.date().optional().nullable(),
        activeDays: z.array(z.number()).optional(),
        startTime: z.string().optional().nullable(),
        endTime: z.string().optional().nullable(),
        priceNote: z.string().optional().nullable(),
        adminNotes: z.string().optional().nullable(),
        metaTitle: z.string().optional().nullable(),
        metaDescription: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.deal.update({ where: { id }, data })
    }),

  updateStatus: adminProcedure
    .input(z.object({ id: z.string(), status: z.nativeEnum(DealStatus), adminNotes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.deal.update({
        where: { id: input.id },
        data: { status: input.status, adminNotes: input.adminNotes },
      })
    }),

  addPhoto: adminProcedure
    .input(z.object({ dealId: z.string(), url: z.string().url(), altText: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.prisma.dealPhoto.count({ where: { dealId: input.dealId } })
      return ctx.prisma.dealPhoto.create({
        data: { dealId: input.dealId, url: input.url, altText: input.altText, sortOrder: count },
      })
    }),

  removePhoto: adminProcedure
    .input(z.object({ photoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.dealPhoto.delete({ where: { id: input.photoId } })
    }),

  duplicate: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const original = await ctx.prisma.deal.findUniqueOrThrow({
        where: { id: input.id },
        include: { photos: { orderBy: { sortOrder: 'asc' } } },
      })
      const {
        id, slug, createdAt, updatedAt, views, clicks,
        photos, submitterName, submitterEmail, adminNotes,
        ogImageUrl, expiryNotificationSent,
        ...data
      } = original
      return ctx.prisma.deal.create({
        data: {
          ...data,
          title: `Copy of ${original.title}`,
          slug: `${slugify(original.title)}-copy-${Date.now()}`,
          status: DealStatus.DRAFT,
          featured: false,
          views: 0,
          clicks: 0,
          expiryNotificationSent: false,
          photos: photos.length
            ? { create: photos.map(({ url, altText, sortOrder }) => ({ url, altText, sortOrder })) }
            : undefined,
        },
      })
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.deal.delete({ where: { id: input.id } })
    }),
})
