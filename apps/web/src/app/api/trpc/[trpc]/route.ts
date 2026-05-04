import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { type NextRequest } from 'next/server'
import { appRouter } from '@/server/root'
import { prisma } from '@grspecials/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = async (req: NextRequest) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      const session = await getServerSession(authOptions)
      return { prisma, session }
    },
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(`[tRPC] Error on ${path ?? '<no-path>'}:`, error)
          }
        : undefined,
  })
}

export { handler as GET, handler as POST }
