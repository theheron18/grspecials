import { z } from 'zod'
import { router, adminProcedure } from '../trpc'

const holidayInput = z.object({
  tag: z.string().min(1),
  label: z.string().min(1),
  mmdd: z.string().regex(/^\d{2}-\d{2}$/, 'Must be MM-DD format'),
  emoji: z.string().default(''),
  drinkFocus: z.string().default(''),
  windowDays: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
})

export const holidaysRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.holiday.findMany({ orderBy: { mmdd: 'asc' } })
  }),

  create: adminProcedure.input(holidayInput).mutation(async ({ ctx, input }) => {
    return ctx.prisma.holiday.create({ data: input })
  }),

  update: adminProcedure
    .input(holidayInput.partial().extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.prisma.holiday.update({ where: { id }, data })
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.holiday.delete({ where: { id: input.id } })
    }),
})
