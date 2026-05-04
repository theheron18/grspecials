import { z } from 'zod'
import { router, adminProcedure } from '../trpc'
import { DealStatus } from '@grspecials/db'

export const adminRouter = router({
  stats: adminProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      activeDeals,
      pendingSubmissions,
      totalVenues,
      newVenues,
      activeScrapers,
      lastScrape,
    ] = await Promise.all([
      ctx.prisma.deal.count({ where: { status: DealStatus.ACTIVE } }),
      ctx.prisma.deal.count({ where: { status: DealStatus.PENDING_REVIEW } }),
      ctx.prisma.venue.count({ where: { status: 'ACTIVE' } }),
      ctx.prisma.venue.count({ where: { createdAt: { gte: weekAgo } } }),
      ctx.prisma.scraperSource.count({ where: { active: true } }),
      ctx.prisma.scraperRun.findFirst({ orderBy: { startedAt: 'desc' }, select: { startedAt: true, status: true } }),
    ])

    return {
      activeDeals,
      pendingSubmissions,
      totalVenues,
      newVenuesThisWeek: newVenues,
      scraperSourcesActive: activeScrapers,
      scraperLastRunAt: lastScrape?.startedAt ?? null,
      scraperLastStatus: lastScrape?.status ?? null,
    }
  }),

  // Site config
  getConfig: adminProcedure.query(async ({ ctx }) => {
    const configs = await ctx.prisma.siteConfig.findMany()
    return Object.fromEntries(configs.map((c) => [c.key, c.value]))
  }),

  setConfig: adminProcedure
    .input(z.object({ key: z.string(), value: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.siteConfig.upsert({
        where: { key: input.key },
        update: { value: input.value },
        create: { key: input.key, value: input.value },
      })
    }),

  // Email templates
  listTemplates: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.emailTemplate.findMany({ orderBy: { name: 'asc' } })
  }),

  updateTemplate: adminProcedure
    .input(
      z.object({
        slug: z.string(),
        subject: z.string().optional(),
        html: z.string().optional(),
        text: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { slug, ...data } = input
      return ctx.prisma.emailTemplate.update({ where: { slug }, data })
    }),

  // Categories management
  listCategories: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.venueCategory.findMany({ orderBy: { sortOrder: 'asc' } })
  }),

  createCategory: adminProcedure
    .input(z.object({ name: z.string().min(2), slug: z.string(), icon: z.string().optional(), color: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.venueCategory.create({ data: input })
    }),

  updateCategory: adminProcedure
    .input(z.object({ id: z.string(), name: z.string().optional(), icon: z.string().optional(), color: z.string().optional(), active: z.boolean().optional(), sortOrder: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.venueCategory.update({ where: { id }, data })
    }),

  // Deal types management
  listDealTypes: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.dealType.findMany({ orderBy: { sortOrder: 'asc' } })
  }),

  createDealType: adminProcedure
    .input(z.object({ name: z.string().min(2), slug: z.string(), icon: z.string().optional(), color: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.dealType.create({ data: input })
    }),

  updateDealType: adminProcedure
    .input(z.object({ id: z.string(), name: z.string().optional(), icon: z.string().optional(), color: z.string().optional(), active: z.boolean().optional(), sortOrder: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.dealType.update({ where: { id }, data })
    }),

  // Neighborhoods
  listNeighborhoods: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.neighborhood.findMany({ orderBy: { sortOrder: 'asc' } })
  }),

  createNeighborhood: adminProcedure
    .input(z.object({ name: z.string().min(2), slug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.neighborhood.create({ data: input })
    }),

  // Scraper management
  listScraperSources: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.scraperSource.findMany({
      include: {
        venue: { select: { name: true, id: true } },
        runs: { take: 3, orderBy: { startedAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }),

  createScraperSource: adminProcedure
    .input(
      z.object({
        type: z.enum(['FACEBOOK_PAGE', 'INSTAGRAM_ACCOUNT', 'WEBSITE_URL']),
        url: z.string().url(),
        handle: z.string().optional(),
        venueId: z.string().optional(),
        frequency: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.scraperSource.create({ data: input })
    }),

  toggleScraperSource: adminProcedure
    .input(z.object({ id: z.string(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.scraperSource.update({
        where: { id: input.id },
        data: { active: input.active },
      })
    }),

  deleteScraperSource: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.scraperSource.delete({ where: { id: input.id } })
    }),

  scraperRunLogs: adminProcedure
    .input(z.object({ sourceId: z.string().optional(), limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.scraperRun.findMany({
        where: input.sourceId ? { sourceId: input.sourceId } : undefined,
        orderBy: { startedAt: 'desc' },
        take: input.limit,
        include: { source: { select: { url: true, type: true } } },
      })
    }),

  // Upload URL
  getUploadUrl: adminProcedure
    .input(z.object({ folder: z.enum(['deals', 'venues']), contentType: z.string(), ext: z.string() }))
    .mutation(async ({ input }) => {
      const { getUploadUrl } = await import('@/lib/upload')
      return getUploadUrl(input.folder, input.contentType, input.ext)
    }),

  // Audit log
  auditLog: adminProcedure
    .input(z.object({ page: z.number().int().min(1).default(1), limit: z.number().int().default(50) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      })
    }),
})
