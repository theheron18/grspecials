import { initTRPC, TRPCError } from '@trpc/server'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@grspecials/db'
import superjson from 'superjson'
import { ZodError } from 'zod'

export async function createTRPCContext(opts: CreateNextContextOptions) {
  const session = await getServerSession(opts.req, opts.res, authOptions)
  return { prisma, session }
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, session: ctx.session } })
})

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = (ctx.session.user as { role: string }).role
  if (!['ADMIN', 'EDITOR'].includes(role)) {
    throw new TRPCError({ code: 'FORBIDDEN' })
  }
  return next({ ctx })
})
