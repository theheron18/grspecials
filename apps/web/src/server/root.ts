import { router } from './trpc'
import { dealsRouter } from './routers/deals'
import { placesRouter } from './routers/places'
import { submissionsRouter } from './routers/submissions'
import { portalRouter } from './routers/portal'
import { adminRouter } from './routers/admin'
import { contactRouter } from './routers/contact'

export const appRouter = router({
  deals: dealsRouter,
  places: placesRouter,
  submissions: submissionsRouter,
  portal: portalRouter,
  admin: adminRouter,
  contact: contactRouter,
})

export type AppRouter = typeof appRouter
