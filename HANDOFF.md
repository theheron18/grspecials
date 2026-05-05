# GRspecials.com — Handoff Document

**Date:** May 2026  
**Status:** Functional MVP deployed to production  
**Live site:** https://grspecials.com  
**Repo:** https://github.com/theheron18/grspecials  
**Hosting:** Vercel (web app) + Supabase (PostgreSQL database)

---

## What's Built and Working

### Public Site
| Page | URL | Notes |
|------|-----|-------|
| Homepage | `/` | Featured deals, recent deals, category quick-links, hero search |
| Browse Deals | `/deals` | Filter by category, deal type, neighborhood, day; list + map view toggle |
| Deal Detail | `/deals/[venueSlug]/[dealSlug]` | Full deal info, share buttons, venue details |
| Submit a Deal | `/submit-a-deal` | Community submission form, goes into moderation queue |
| Venue Portal | `/venue/[token]` | Token-gated page for venue owners to view their deals |

### Admin Area (`/admin/*` — login required)
| Page | Purpose |
|------|---------|
| Dashboard | Overview stats |
| Deals | List, edit, create deals; upload photos; view live link |
| Venues | List, edit, create venues; upload logo |
| Moderation | Review and approve/reject community-submitted deals |
| Scraper | Manage automated deal scrapers |
| Settings | Edit site config (headline, subline, etc.) |
| Notifications | View notification history |

### API & Backend
- **tRPC** — all data mutations (deals, venues, submissions, admin actions)
- **Image uploads** — `/api/upload` proxies files to Cloudflare R2 (4MB limit, JPG/PNG/WebP/GIF)
- **Cron jobs** — expire old deals (`/api/cron/expire-deals`), clean up orphaned R2 images every Sunday 3am UTC (`/api/cron/cleanup-r2`)
- **Geocoding** — Venue addresses are auto-geocoded via Mapbox when a community deal is submitted or approved, so they appear on the map

### Active Integrations
| Service | Purpose | Env Vars |
|---------|---------|----------|
| Supabase | PostgreSQL database | `DATABASE_URL`, `DIRECT_URL` |
| Vercel | Hosting + cron jobs | — |
| NextAuth | Admin login (email + password) | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` |
| Mapbox | Interactive map + geocoding | `NEXT_PUBLIC_MAPBOX_TOKEN` |
| Cloudflare R2 | Image storage | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` |
| Resend | Email notifications | `RESEND_API_KEY` |

### Not Yet Configured (wired, not active)
- **OpenAI** — used in scraper for LLM-based deal parsing (`OPENAI_API_KEY`)
- **Algolia** — search indexing hooks exist but not activated
- **Firebase** — push notification scaffolding exists but not activated
- **Redis** — rate-limiting support built in but not required

---

## Known Issues / Bugs to Fix

1. **Homepage has conflicting exports** — `export const dynamic = 'force-dynamic'` and `export const revalidate = 300` are both present in `apps/web/src/app/(public)/page.tsx`. These conflict (`force-dynamic` disables ISR). Remove `revalidate = 300` to fix.

2. **R2 credentials need re-entry** — The R2 access key and secret were rotated. Re-add the new values to Vercel environment variables (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) and redeploy.

3. **No error boundaries** — If a page throws during server-side rendering (e.g., database timeout), Next.js shows a bare error page. Adding `error.tsx` files next to pages would give users a friendly fallback.

4. **Map shows only venues with coordinates** — Venues added manually via admin (not via community submission) won't appear on the map unless coordinates are entered. There's no "Look up coordinates" button in the venue editor yet.

5. **Deal slugs are auto-generated but not editable** — If a deal title changes, the slug stays the same. The old URL still works but can diverge from the title.

---

## Suggested Next Features

### High Value / Low Effort
- **"Lookup coordinates" button in venue editor** — one-click Mapbox geocode from the venue's address, fills latitude/longitude fields automatically
- **Duplicate deal button** — clone an existing deal as a starting point for a new one
- **Deal expiry notifications** — email the admin when a featured deal is about to expire
- **Bulk status change** — select multiple deals in the admin list and activate/deactivate at once

### Medium Effort
- **Neighborhood pages** — `/neighborhoods/[slug]` listing all deals in that area, with a focused map
- **Venue detail pages** — `/venues/[slug]` showing all deals for a venue, logo, address, hours
- **"Save" / favorites** — local-storage based (no login required) so users can bookmark deals
- **Deal analytics** — track views per deal and show a sparkline in the admin deals list
- **SEO sitemap** — auto-generated `/sitemap.xml` listing all active deal URLs

### Larger Features
- **Email digest** — weekly email to subscribers with the best current deals
- **Venue claim flow** — venue owners can claim their venue and get a portal token via email
- **Scraper activation** — connect OpenAI key and activate the scraper microservice to auto-ingest deals from venue websites

---

## Technical Rules (important to keep)

1. **Never import `upload.ts` from a client component** — it pulls in `@aws-sdk/client-s3` and breaks the browser bundle. Import from `upload-config.ts` for constants, and keep upload logic server-side only.

2. **tRPC auth uses `getToken`, not `getServerSession`** — `getServerSession` returns null inside the tRPC fetch handler. See `apps/web/src/app/api/trpc/[trpc]/route.ts`.

3. **Mapbox marker hover effects must use an inner element** — Mapbox overwrites `transform` on the marker's outer element for positioning. Apply scale/animations only to a child `div`.

4. **Import mapbox CSS in the component, not in globals.css** — `import 'mapbox-gl/dist/mapbox-gl.css'` lives at the top of `DealsMap.tsx`. Moving it to `globals.css` breaks site styling.

5. **Deal links use slugs, not IDs** — URL pattern is `/deals/[venueSlug]/[dealSlug]`.

---

## Changing the Admin Password

Run this from the project root:
```bash
node scripts/change-password.mjs
```
Enter the admin email and new password when prompted.

---

## Repo Structure

```
GRspecials.com/
  apps/
    web/          # Next.js 14 app (this is the main app)
    scraper/      # Standalone deal-scraping microservice (Playwright + LLM)
  packages/
    db/           # Prisma schema + client (@grspecials/db)
    types/        # Shared TypeScript types (@grspecials/types)
  scripts/        # Utility scripts (change-password.mjs, etc.)
  vercel.json     # Cron job definitions
```
