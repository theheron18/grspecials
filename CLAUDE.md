# GRspecials.com — Claude Instructions

## Project
Grand Rapids, MI deals/specials directory. Next.js 14 App Router monorepo (Turborepo).
- **Live site:** https://grspecials.com
- **Repo:** https://github.com/theheron18/grspecials
- **Hosting:** Vercel + Supabase (PostgreSQL)

## Commands
```bash
# Dev (from repo root)
npm run dev

# Build
npm run build

# Type check
npm run type-check

# Change admin password
node scripts/change-password.mjs

# Database (from packages/db)
npx prisma studio
npx prisma migrate dev
```

## Monorepo structure
```
apps/web/       # Next.js 14 app
apps/scraper/   # Deal-scraping microservice (not deployed yet)
packages/db/    # Prisma schema + client (@grspecials/db)
packages/types/ # Shared TS types (@grspecials/types)
```

## Critical rules — never break these

**1. No server-only imports in client components**
`upload.ts` imports `@aws-sdk/client-s3` (Node.js only). Importing it from any `'use client'` component breaks the entire site (shows blank page). Client components must import from `upload-config.ts` for upload constants, never from `upload.ts`.

**2. tRPC auth: use `getToken`, not `getServerSession`**
`getServerSession()` returns null inside the tRPC fetch handler. Always use `getToken({ req, secret: process.env.NEXTAUTH_SECRET })`. See `apps/web/src/app/api/trpc/[trpc]/route.ts`.

**3. Mapbox marker hover: never transform the outer element**
Mapbox sets `transform: translate()` on the marker outer element for positioning. Applying `transform: scale()` there makes markers fly off-screen. Use an inner child `div` for hover effects. See `apps/web/src/components/map/DealsMap.tsx`.

**4. Mapbox CSS: JS import in component only**
`import 'mapbox-gl/dist/mapbox-gl.css'` lives at the top of `DealsMap.tsx`. Do not move it to `globals.css` — it breaks site-wide styles.

**5. Deal/venue links use slugs, not IDs**
URL pattern: `/deals/[venueSlug]/[dealSlug]`. Never use `deal.id` or `venue.id` in links.

**6. Next.js Image for external URLs**
Allowed domains are in `apps/web/next.config.mjs` remotePatterns. Venue logo thumbnails in `DealCard.tsx` use `unoptimized` to bypass this check (safe for small fallback images).

**7. Prisma schema changes require regenerating the client in the main repo**
When running in a worktree, `@grspecials/db` resolves via symlink to the main repo's `packages/db`, so TypeScript always reads the Prisma client from the main repo's `node_modules/.prisma/client`. After any schema change:
1. Update the schema in both the worktree and the main repo's `packages/db/prisma/schema.prisma`
2. Copy the main repo's `packages/db/.env` into the worktree's `packages/db/.env`, then run `npx prisma db push` from the worktree's `packages/db`
3. Run `npx prisma generate` from the main repo's `packages/db` to update the shared Prisma client types
Type errors like "Property X does not exist on type" for Prisma models are almost always this — the client hasn't been regenerated in the main repo yet.

**8. Place descriptions render as paragraphs — use blank lines to separate**
The public place page (`apps/web/src/app/(public)/places/[slug]/page.tsx`) splits descriptions on `\n\n` and renders each chunk as a `<p>`. In the admin textarea, separate paragraphs with a blank line. Single line breaks within a paragraph are fine.

**9. All dates use Eastern Time (America/Detroit) — Vercel server runs UTC**
Grand Rapids is Eastern Time. The Vercel server's `new Date()` is UTC, so naive comparisons break after 8 PM ET.
- Get today's Eastern date: `new Date().toLocaleDateString('en-CA', { timeZone: 'America/Detroit' })` → returns `YYYY-MM-DD`
- Store `endDate` from admin date pickers as `new Date(dateStr + 'T23:59:59')` (no timezone suffix = browser local = Eastern). This makes deals expire at 11:59 PM Eastern, not UTC midnight.
- Display stored dates back in ET: `date.toLocaleDateString('en-CA', { timeZone: 'America/Detroit' })`
- The `notExpired()` helper in `deals.ts` provides real-time expiry filtering in all public queries. The daily cron at `api/cron/expire-deals/` sets status=EXPIRED for DB cleanup — both layers are needed.

## Key file locations
| What | Where |
|------|-------|
| tRPC routers | `apps/web/src/server/routers/` |
| tRPC fetch handler | `apps/web/src/app/api/trpc/[trpc]/route.ts` |
| Auth config | `apps/web/src/app/api/auth/[...nextauth]/route.ts` |
| Admin middleware | `apps/web/src/middleware.ts` |
| Image upload proxy | `apps/web/src/app/api/upload/route.ts` |
| Upload server lib | `apps/web/src/lib/upload.ts` (server only) |
| Upload client constants | `apps/web/src/lib/upload-config.ts` (client safe) |
| Env validation | `apps/web/src/lib/env.ts` |
| Shared types | `packages/types/src/index.ts` |
| Prisma schema | `packages/db/prisma/schema.prisma` |
| Cron jobs | `vercel.json` + `apps/web/src/app/api/cron/` |
| Holiday calendar | `apps/web/src/lib/holidays.ts` |
| Drink day calendar | `apps/web/src/lib/drinkDays.ts` |
| Event tag auto-detection | `apps/web/src/lib/eventTags.ts` |
| Admin settings UI | `apps/web/src/components/admin/AdminSettings.tsx` |

## Active integrations
| Service | Env vars |
|---------|----------|
| Supabase (Postgres) | `DATABASE_URL`, `DIRECT_URL` |
| NextAuth | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` |
| Mapbox | `NEXT_PUBLIC_MAPBOX_TOKEN` |
| Cloudflare R2 | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` |
| Resend (email) | `RESEND_API_KEY` |

## User context
Non-technical site owner. Tests via the live Vercel deployment. When something appears broken, first suggest hard-refresh (`Ctrl+Shift+R`) or incognito window before assuming a code problem — browser cache has caused false alarms twice.

## Session behavior

Read CLAUDE.md for project context. The critical rules in CLAUDE.md are non-negotiable — do not ask me to confirm them. Before editing any file, check if it is mentioned in the CLAUDE.md critical rules section and apply those rules without exception.

### Session rules
- Read only files directly relevant to the current task
- Do not summarize files back to me after reading them
- Do not explain what you're about to do — just do it
- Only add comments when the code does something non-obvious or works around a known bug — not to describe what code does
- After completing a task, stop and wait for my next instruction
- If you need to read a file, state the filename only, not its contents
- Prefer small focused edits over rewriting entire files
- If something is unclear, ask one specific question rather than making assumptions
- Do not push to git or deploy after each change — make all changes for this task first, I will push manually when ready
- Solve problems with the simplest approach that works — do not introduce new libraries or packages unless I ask
- Only modify files directly related to the current task — do not refactor or reformat code you encounter along the way
- When fixing a bug, change the minimum amount of code needed
- If you encounter an unexpected error mid-task, stop and describe it in one sentence before attempting a fix
- When fixing a bug that has occurred before, add a simple test to prevent regression — do not write tests for straightforward code
- Before starting a task, confirm git status is clean — if there are uncommitted changes, stop and tell me
- If you work around a non-obvious bug or discover a constraint not in CLAUDE.md, note it at the end of the task so I can decide whether to add it to CLAUDE.md

### Safety rules
- Never run database migrations automatically — show me the migration SQL first and wait for my approval
- If a task requires a new environment variable, stop and tell me the name and where to add it before proceeding
- For any changes to admin functionality or database queries, describe the change and its side effects and wait for my confirmation before making it

### Before marking any task complete
- Run `npm run type-check` and fix all errors before stopping
- Run `npm run build` locally and confirm it succeeds — note: local builds fail on missing `NEXTAUTH_SECRET`/`NEXTAUTH_URL` env vars in worktree environments; this is expected and does not reflect a code error
- If either fails, fix the errors before presenting the task as done
- Never push code that fails a type check or build
