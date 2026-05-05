import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { type NextRequest } from 'next/server'
import { appRouter } from '@/server/root'
import { prisma } from '@grspecials/db'
import { getToken } from 'next-auth/jwt'

const handler = async (req: NextRequest) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
      const session = token
        ? { user: { id: token.id as string, email: token.email ?? '', name: token.name ?? null, role: token.role as string } }
        : null
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
