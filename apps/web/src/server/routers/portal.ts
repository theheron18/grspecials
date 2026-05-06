import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { DealStatus, DealSource } from '@grspecials/db'
import { slugify } from '@/lib/utils'
import { TRPCError } from '@trpc/server'

export const portalRouter = router({
  getVenue: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const venue = await ctx.prisma.venue.findUnique({
        where: { portalToken: input.token, portalActive: true },
        include: {
          category: true,
          deals: {
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
            include: {
              dealType: true,
              photos: { take: 1 },
            },
          },
        },
      })
      if (!venue) throw new TRPCError({ code: 'NOT_FOUND', message: 'Venue not found or portal inactive' })
      return venue
    }),

  addDeal: publicProcedure
    .input(
      z.object({
        token: z.string(),
        title: z.string().min(5).max(150),
        description: z.string().min(20).max(2000),
        dealTypeId: z.string(),
        activeDays: z.array(z.number().int().min(0).max(6)).min(1),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        priceNote: z.string().optional(),
        photoUrls: z.array(z.string().url()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const venue = await ctx.prisma.venue.findUnique({
        where: { portalToken: input.token, portalActive: true },
        select: { id: true, autoApprove: true, categoryId: true },
      })
      if (!venue) throw new TRPCError({ code: 'UNAUTHORIZED' })

      const slug = `${slugify(input.title)}-${Date.now()}`
      return ctx.prisma.deal.create({
        data: {
          title: input.title,
          slug,
          description: input.description,
          venueId: venue.id,
          categoryId: venue.categoryId,
          dealTypeId: input.dealTypeId,
          status: venue.autoApprove ? DealStatus.ACTIVE : DealStatus.PENDING_REVIEW,
          source: DealSource.VENUE_SUBMITTED,
          activeDays: input.activeDays,
          startTime: input.startTime,
          endTime: input.endTime,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          priceNote: input.priceNote,
          photos: input.photoUrls?.length
            ? { create: input.photoUrls.map((url, i) => ({ url, sortOrder: i })) }
            : undefined,
        },
      })
    }),

  updateDeal: publicProcedure
    .input(
      z.object({
        token: z.string(),
        dealId: z.string(),
        title: z.string().min(5).max(150).optional(),
        description: z.string().min(20).optional(),
        activeDays: z.array(z.number().int()).optional(),
        startTime: z.string().optional().nullable(),
        endTime: z.string().optional().nullable(),
        endDate: z.string().optional().nullable(),
        priceNote: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const venue = await ctx.prisma.venue.findUnique({
        where: { portalToken: input.token, portalActive: true },
        select: { id: true },
      })
      if (!venue) throw new TRPCError({ code: 'UNAUTHORIZED' })

      // Ensure deal belongs to venue
      const deal = await ctx.prisma.deal.findFirst({
        where: { id: input.dealId, venueId: venue.id },
      })
      if (!deal) throw new TRPCError({ code: 'FORBIDDEN' })

      const { token, dealId, endDate, ...data } = input
      return ctx.prisma.deal.update({
        where: { id: dealId },
        data: {
          ...data,
          endDate: endDate ? new Date(endDate) : undefined,
          status: DealStatus.PENDING_REVIEW,
        },
      })
    }),

  dealStats: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const venue = await ctx.prisma.venue.findUnique({
        where: { portalToken: input.token },
        select: { id: true },
      })
      if (!venue) throw new TRPCError({ code: 'UNAUTHORIZED' })

      return ctx.prisma.deal.findMany({
        where: { venueId: venue.id },
        select: { id: true, title: true, status: true, views: true, clicks: true, endDate: true },
      })
    }),
})
