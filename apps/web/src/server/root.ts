import { router } from './trpc'
import { dealsRouter } from './routers/deals'
import { venuesRouter } from './routers/venues'
import { submissionsRouter } from './routers/submissions'
import { portalRouter } from './routers/portal'
import { adminRouter } from './routers/admin'

export const appRouter = router({
  deals: dealsRouter,
  venues: venuesRouter,
  submissions: submissionsRouter,
  portal: portalRouter,
  admin: adminRouter,
})

export type AppRouter = typeof appRouter
