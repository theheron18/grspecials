import { z } from 'zod'
import { router, publicProcedure, adminProcedure } from '../trpc'
import { VenueStatus, Prisma } from '@grspecials/db'
import { slugify } from '@/lib/utils'
import { TRPCError } from '@trpc/server'

export const venuesRouter = router({
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        q: z.string().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(24),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.VenueWhereInput = {
        status: VenueStatus.ACTIVE,
        ...(input.category && { category: { slug: input.category } }),
        ...(input.q && { name: { contains: input.q, mode: 'insensitive' } }),
      }

      const [venues, total] = await Promise.all([
        ctx.prisma.venue.findMany({
          where,
          orderBy: [{ premium: 'desc' }, { name: 'asc' }],
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          select: {
            id: true, name: true, slug: true, address: true, city: true, state: true,
            neighborhood: true, latitude: true, longitude: true, verified: true, premium: true, logoUrl: true,
            category: { select: { name: true, slug: true, icon: true } },
            _count: { select: { deals: { where: { status: 'ACTIVE' } } } },
          },
        }),
        ctx.prisma.venue.count({ where }),
      ])

      return {
        venues: venues.map((v) => ({ ...v, activeDealsCount: v._count.deals })),
        total,
      }
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const venue = await ctx.prisma.venue.findUnique({
        where: { slug: input.slug, status: VenueStatus.ACTIVE },
        include: {
          category: true,
          photos: { orderBy: { sortOrder: 'asc' } },
          deals: {
            where: { status: 'ACTIVE' },
            orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
            include: {
              category: true,
              dealType: true,
              photos: { take: 1, orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      })
      if (!venue) throw new TRPCError({ code: 'NOT_FOUND' })
      return venue
    }),

  // Admin
  adminList: adminProcedure
    .input(
      z.object({
        status: z.nativeEnum(VenueStatus).optional(),
        q: z.string().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.VenueWhereInput = {
        ...(input.status && { status: input.status }),
        ...(input.q && {
          OR: [
            { name: { contains: input.q, mode: 'insensitive' } },
            { address: { contains: input.q, mode: 'insensitive' } },
          ],
        }),
      }

      const [venues, total] = await Promise.all([
        ctx.prisma.venue.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            category: true,
            _count: { select: { deals: true } },
          },
        }),
        ctx.prisma.venue.count({ where }),
      ])

      return { venues, total, pageCount: Math.ceil(total / input.limit) }
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        address: z.string().min(5),
        city: z.string().default('Grand Rapids'),
        state: z.string().default('MI'),
        zip: z.string().optional(),
        phone: z.string().optional(),
        website: z.string().url().optional(),
        email: z.string().email().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        neighborhood: z.string().optional(),
        categoryId: z.string(),
        verified: z.boolean().optional().default(false),
        premium: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const slug = slugify(input.name)
      return ctx.prisma.venue.create({
        data: { ...input, slug: `${slug}-${Date.now()}` },
      })
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional().nullable(),
        address: z.string().optional(),
        phone: z.string().optional().nullable(),
        website: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        latitude: z.number().optional().nullable(),
        longitude: z.number().optional().nullable(),
        neighborhood: z.string().optional().nullable(),
        categoryId: z.string().optional(),
        verified: z.boolean().optional(),
        premium: z.boolean().optional(),
        premiumUntil: z.date().optional().nullable(),
        status: z.nativeEnum(VenueStatus).optional(),
        autoApprove: z.boolean().optional(),
        logoUrl: z.string().url().optional().nullable(),
        metaTitle: z.string().optional().nullable(),
        metaDescription: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.venue.update({ where: { id }, data })
    }),

  regeneratePortalToken: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { randomUUID } = await import('crypto')
      return ctx.prisma.venue.update({
        where: { id: input.id },
        data: { portalToken: randomUUID() },
        select: { portalToken: true },
      })
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.venue.delete({ where: { id: input.id } })
    }),
})
