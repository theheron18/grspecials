import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { sendContactEmail } from '@/lib/email'
import { TRPCError } from '@trpc/server'

export const contactRouter = router({
  send: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      email: z.string().email(),
      message: z.string().min(10).max(2000),
      honeypot: z.string().max(0, 'Bot detected'),
    }))
    .mutation(async ({ input }) => {
      if (input.honeypot) throw new TRPCError({ code: 'BAD_REQUEST' })
      await sendContactEmail(input.name, input.email, input.message)
    }),
})
