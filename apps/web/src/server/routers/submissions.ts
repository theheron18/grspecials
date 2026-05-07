import { z } from 'zod'
import { router, publicProcedure, adminProcedure } from '../trpc'
import { DealStatus, DealSource } from '@grspecials/db'
import { slugify } from '@/lib/utils'
import { sendSubmissionConfirmation, sendDealApproved, sendDealRejected } from '@/lib/email'
import { TRPCError } from '@trpc/server'

const submissionInput = z.object({
  placeName: z.string().min(2).max(100),
  placeAddress: z.string().min(5).max(200),
  categorySlug: z.string(),
  dealTitle: z.string().min(5).max(150),
  dealDescription: z.string().min(20).max(2000),
  dealTypeSlug: z.string(),
  validDays: z.array(z.number().int().min(0).max(6)).min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  submitterName: z.string().optional(),
  submitterEmail: z.string().email().optional(),
  photoUrls: z.array(z.string().url()).optional(),
  honeypot: z.string().max(0, 'Bot detected'),
})

export const submissionsRouter = router({
  submit: publicProcedure
    .input(submissionInput)
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.venueCategory.findUnique({ where: { slug: input.categorySlug } })
      const dealType = await ctx.prisma.dealType.findUnique({ where: { slug: input.dealTypeSlug } })

      if (!category) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid category' })
      if (!dealType) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid deal type' })

      // Find or stub venue
      let venue = await ctx.prisma.venue.findFirst({
        where: { name: { equals: input.placeName, mode: 'insensitive' } },
      })

      if (!venue) {
        let latitude: number | undefined
        let longitude: number | undefined

        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        if (mapboxToken) {
          try {
            const geoRes = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input.placeAddress)}.json?access_token=${mapboxToken}&country=US&proximity=-85.6681,42.9634&limit=1`,
            )
            const geoJson = await geoRes.json() as { features?: { center: [number, number] }[] }
            const coords = geoJson.features?.[0]?.center
            if (coords) {
              longitude = coords[0]
              latitude = coords[1]
            }
          } catch {
            // Geocoding failed — place will appear on list but not map until admin adds coords
          }
        }

        venue = await ctx.prisma.venue.create({
          data: {
            name: input.placeName,
            slug: `${slugify(input.placeName)}-${Date.now()}`,
            address: input.placeAddress,
            categoryId: category.id,
            status: 'PENDING_VERIFICATION',
            latitude,
            longitude,
          },
        })
      }

      const slug = `${slugify(input.dealTitle)}-${Date.now()}`
      const deal = await ctx.prisma.deal.create({
        data: {
          title: input.dealTitle,
          slug,
          description: input.dealDescription,
          venueId: venue.id,
          categoryId: category.id,
          dealTypeId: dealType.id,
          status: DealStatus.PENDING_REVIEW,
          source: DealSource.COMMUNITY_SUBMITTED,
          activeDays: input.validDays,
          startTime: input.startTime,
          endTime: input.endTime,
          startDate: input.startDate ? new Date(input.startDate) : undefined,
          endDate: input.endDate ? new Date(input.endDate) : undefined,
          submitterName: input.submitterName,
          submitterEmail: input.submitterEmail,
          photos: input.photoUrls?.length
            ? { create: input.photoUrls.map((url, i) => ({ url, sortOrder: i })) }
            : undefined,
        },
      })

      if (input.submitterEmail) {
        await sendSubmissionConfirmation(input.submitterEmail, input.dealTitle)
      }

      return { success: true, dealId: deal.id }
    }),

  // Admin moderation
  pendingList: adminProcedure
    .input(z.object({ page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const where = { status: DealStatus.PENDING_REVIEW }
      const [deals, total] = await Promise.all([
        ctx.prisma.deal.findMany({
          where,
          orderBy: { createdAt: 'asc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            venue: true,
            category: true,
            dealType: true,
            photos: { take: 1 },
          },
        }),
        ctx.prisma.deal.count({ where }),
      ])
      return { deals, total, pageCount: Math.ceil(total / input.limit) }
    }),

  approve: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deal = await ctx.prisma.deal.update({
        where: { id: input.id },
        data: { status: DealStatus.ACTIVE },
        select: {
          title: true, submitterEmail: true, slug: true,
          venue: { select: { id: true, slug: true, address: true, latitude: true, longitude: true } },
        },
      })

      // Geocode the venue if it still has no coordinates
      if (!deal.venue.latitude && deal.venue.address) {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        if (token) {
          try {
            const geoRes = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(deal.venue.address)}.json?access_token=${token}&country=US&proximity=-85.6681,42.9634&limit=1`,
            )
            const geoJson = await geoRes.json() as { features?: { center: [number, number] }[] }
            const coords = geoJson.features?.[0]?.center
            if (coords) {
              await ctx.prisma.venue.update({
                where: { id: deal.venue.id },
                data: { longitude: coords[0], latitude: coords[1] },
              })
            }
          } catch {
            // Non-fatal — deal still gets approved, just won't appear on map
          }
        }
      }

      if (deal.submitterEmail) {
        await sendDealApproved(
          deal.submitterEmail,
          deal.title,
          `${process.env.NEXT_PUBLIC_APP_URL}/deals/${deal.venue.slug}/${deal.slug}`,
        )
      }

      return { success: true }
    }),

  reject: adminProcedure
    .input(z.object({ id: z.string(), reason: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      const deal = await ctx.prisma.deal.update({
        where: { id: input.id },
        data: { status: DealStatus.REJECTED, adminNotes: input.reason },
        select: { title: true, submitterEmail: true },
      })

      if (deal.submitterEmail) {
        await sendDealRejected(deal.submitterEmail, deal.title, input.reason)
      }

      return { success: true }
    }),

  bulkApprove: adminProcedure
    .input(z.object({ ids: z.array(z.string()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.deal.updateMany({
        where: { id: { in: input.ids } },
        data: { status: DealStatus.ACTIVE },
      })
      return { updated: input.ids.length }
    }),

  bulkReject: adminProcedure
    .input(z.object({ ids: z.array(z.string()).min(1), reason: z.string().min(5) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.deal.updateMany({
        where: { id: { in: input.ids } },
        data: { status: DealStatus.REJECTED, adminNotes: input.reason },
      })
      return { updated: input.ids.length }
    }),
})
