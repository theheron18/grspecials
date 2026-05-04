# GRspecials.com

Grand Rapids, Michigan's deals, specials & events aggregator.

**Tagline:** Grand Rapids' Home for Deals, Specials & Events

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router, TypeScript) | SSR/SSG for SEO, ISR for freshness, full-stack in one repo |
| API | tRPC v11 | End-to-end type safety; no REST boilerplate |
| Database | PostgreSQL via Prisma ORM | Relational, battle-tested, easy migrations |
| Auth | NextAuth.js (credentials + JWT) | Simple admin-only auth; extensible to OAuth |
| Cache | Redis (optional) | Session store, rate-limiting, deal feed caching |
| Search | Algolia (configured) | Typo-tolerant, instant search |
| Maps | Mapbox GL JS | Cost-effective, highly customizable |
| File storage | Cloudflare R2 | S3-compatible, cheap egress |
| Email | Resend | Developer-friendly transactional email |
| Push | Firebase Cloud Messaging | Cross-platform push |
| Analytics | Plausible | Privacy-first, lightweight |
| Scraper | Playwright + OpenAI GPT-4o-mini | Headed browser for JS sites; LLM for unstructured text |
| Monorepo | Turborepo | Incremental builds, shared packages |
| Hosting | Vercel (web) + Railway (scraper) | Edge-optimized Next.js; independent scraper runtime |
| CI/CD | GitHub Actions | Lint → Test → Build → Deploy pipeline |

---

## Monorepo Structure

```
grspecials/
├── apps/
│   ├── web/                   # Next.js 14 application (main site + admin)
│   └── scraper/               # Standalone Node.js scraper microservice
├── packages/
│   ├── db/                    # Prisma schema, migrations, seed script
│   ├── types/                 # Shared TypeScript types
│   └── config/                # Shared ESLint, Tailwind, tsconfig
├── .github/
│   └── workflows/             # CI (ci.yml) + Deploy (deploy.yml)
├── docker-compose.yml         # Local Postgres + Redis + MinIO
├── turbo.json
└── .env.example
```

---

## Quick Start

### Prerequisites
- **Node.js 20+** and **npm 10+**
- **Docker Desktop** (for local Postgres + Redis)

### 1. Clone & Install

```bash
git clone https://github.com/yourorg/grspecials.git
cd grspecials
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
# Edit .env with your values (minimum: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
```

The only required variables to get running locally:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/grspecials
DIRECT_URL=postgresql://postgres:password@localhost:5432/grspecials
NEXTAUTH_SECRET=any-random-string-32-chars
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start Local Services

```bash
docker-compose up -d
# Starts Postgres (5432), Redis (6379), MinIO (9000/9001)
```

### 4. Database Setup

```bash
npm run db:push        # Apply schema to local DB (no migration files)
npm run db:seed        # Seed with admin user + sample data
```

**Default admin credentials:**
- Email: `admin@grspecials.com`
- Password: `admin123!`

> Change these immediately in production.

### 5. Run the App

```bash
npm run dev            # Starts all apps in parallel (Turborepo)
```

- **Web app:** http://localhost:3000
- **Admin dashboard:** http://localhost:3000/admin/dashboard
- **Scraper service:** http://localhost:3001

---

## Key URLs

| URL | Description |
|---|---|
| `/` | Homepage |
| `/deals` | All deals with filters |
| `/deals?category=brewery` | Category filter |
| `/deals?dealType=happy-hour` | Deal type filter |
| `/deals?view=map` | Map view |
| `/deals/[venueSlug]/[dealSlug]` | Deal detail page |
| `/submit-a-deal` | Public submission form |
| `/venue/[token]` | Restaurant portal (token-based) |
| `/admin/dashboard` | Admin overview |
| `/admin/deals` | Deal management |
| `/admin/venues` | Venue management |
| `/admin/moderation` | Submission review queue |
| `/admin/scraper` | Scraper configuration & logs |
| `/admin/settings` | Site config, categories, templates |
| `/admin/notifications` | Push & email notifications |
| `/admin/login` | Admin login |
| `/sitemap.xml` | Auto-generated sitemap |
| `/robots.txt` | Robots policy |

---

## Database Schema

Key models (see `packages/db/prisma/schema.prisma` for full schema):

- **User** — admin/editor accounts with NextAuth sessions
- **Venue** — business listings with category, location, portal token
- **VenueCategory** — admin-configurable (Restaurant, Bar, Brewery, etc.)
- **Deal** — the core entity: title, description, schedule, status, source
- **DealType** — admin-configurable (Happy Hour, Daily Special, etc.)
- **Neighborhood** — GR metro zones for filtering
- **ScraperSource** — Facebook/Instagram/website URLs to scrape
- **ScraperRun** — scraper run logs
- **Notification** — push/email notification history
- **SiteConfig** — key/value store for site-wide settings
- **EmailTemplate** — editable email templates with `{{variable}}` syntax

---

## Scraper Service

The scraper is a separate Node.js process (`apps/scraper`) that:

1. Queries `ScraperSource` rows that are due for a run
2. Dispatches to the appropriate scraper (website / Facebook / Instagram)
3. Uses Playwright to render JavaScript-heavy pages
4. Sends extracted text to **GPT-4o-mini** for structured deal extraction
5. De-duplicates against existing deals (fuzzy title + venue matching)
6. Inserts new deals as `PENDING_REVIEW` / `AUTO_SCRAPED`
7. Logs every run to `ScraperRun` with status, items found, and errors

**Trigger options:**
- HTTP `POST /run` with `x-api-key` header (for Vercel cron or external scheduler)
- CLI: `npm run run:once` (single pass, then exit)
- Automatic: runs on startup and uses `nextRunAt` per-source scheduling

---

## Admin Workflow

1. **Add a venue** at `/admin/venues/new`
2. **Generate portal link** — copy from the venue edit page and send to the owner
3. **Add deals directly** at `/admin/deals/new`, or wait for:
   - Community submissions → appear in `/admin/moderation`
   - Venue portal submissions → appear in moderation (unless venue has `autoApprove`)
   - Scraper-sourced deals → appear in moderation as `AUTO_SCRAPED`
4. **Review & approve** in the moderation queue
5. **Feature deals** by toggling Featured on any deal edit page
6. **Configure categories/types** without code deploys in `/admin/settings`

---

## Deployment

### Vercel (Web App)

1. Import the repo into Vercel
2. Set root directory to `apps/web`
3. Add all environment variables from `.env.example`
4. Add Vercel secret: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` to GitHub
5. Push to `main` — CI/CD runs automatically

Vercel cron (`vercel.json`) auto-expires deals daily at 2 AM UTC.

### Railway (Scraper)

1. Create a Railway project
2. Add a service pointing to `apps/scraper`
3. Set environment variables (copy from `.env`)
4. Add `RAILWAY_TOKEN` to GitHub secrets
5. Pushes to `main` trigger automatic redeploy

### Database (Supabase / Railway Postgres)

```bash
# Run migrations in production
npm run db:migrate:deploy   # applies Prisma migrations
npm run db:seed              # first-time seed only
```

---

## Environment Variables Reference

See `.env.example` for all variables with inline documentation.

**Required to run:**
- `DATABASE_URL` + `DIRECT_URL`
- `NEXTAUTH_SECRET` + `NEXTAUTH_URL`

**Recommended for full functionality:**
- `NEXT_PUBLIC_MAPBOX_TOKEN` — map views
- `RESEND_API_KEY` — email notifications
- `OPENAI_API_KEY` — scraper LLM parsing
- `R2_*` — image uploads
- `ALGOLIA_*` — search

**Optional:**
- `REDIS_URL` — caching (app degrades gracefully without it)
- `NEXT_PUBLIC_FIREBASE_CONFIG` + `FIREBASE_SERVICE_ACCOUNT` — push notifications
- `META_ACCESS_TOKEN` — Facebook Graph API (scraper falls back to Playwright)
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` — analytics

---

## Architecture Decisions

**Why not WordPress?**
WP is slow by default, hard to scale deal feeds efficiently, and tightly couples content to presentation. Next.js + Postgres gives us ISR (fresh content every 60s without full rebuilds), type-safe APIs, and sub-second page loads at scale.

**Why tRPC over REST?**
Every admin action, portal mutation, and public query is type-safe end-to-end. No schema drift between frontend and backend. React Query integration is built-in.

**Why Prisma over raw SQL?**
Schema-as-code, auto-generated TypeScript types, and safe migrations. The Prisma client's `include` syntax makes joined queries readable. We use `Prisma.DealSelect` for projection to avoid over-fetching.

**Why a separate scraper service?**
Playwright is resource-heavy (Chromium instances). Keeping it isolated prevents it from affecting web server performance. It can be scaled, paused, or redeployed independently.

**Why Mapbox over Google Maps?**
Lower cost at scale ($0 up to 25k loads/month), better style customization, and no per-request billing for static maps. Mapbox GL JS also supports clustering natively.

**ISR revalidation strategy:**
- Homepage: 5 minutes (`revalidate = 300`)
- Deals listing: 60 seconds
- Deal detail: on-demand via `router.refresh()` after admin edits
- Sitemap: triggered on every build

**Scaling to 50k MAU:**
- DB: Supabase Pro handles ~500 connections with PgBouncer pooling
- Caching: Redis caches the deal feed; ISR means Next.js serves stale-while-revalidate
- CDN: Vercel Edge Network caches static and ISR pages globally
- Scraper: scales horizontally — deploy multiple Railway instances if needed

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit changes following conventional commits
4. Open a PR against `develop`
5. CI must pass before merge

---

## License

MIT — see LICENSE file.
