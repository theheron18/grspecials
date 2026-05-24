/**
 * GRspecials Scraper — standalone microservice
 * Run on cron (daily by default) or via HTTP trigger from the admin dashboard.
 */
import { prisma } from '@grspecials/db';
import { runWebsiteScraper } from './scrapers/website.js';
import { runFacebookScraper } from './scrapers/facebook.js';
import { runInstagramScraper } from './scrapers/instagram.js';
import { ScraperRunStatus } from '@grspecials/db';
const CONCURRENCY = 3;
async function runDueSources() {
    const now = new Date();
    // Find all active sources that are due for a run
    const sources = await prisma.scraperSource.findMany({
        where: {
            active: true,
            OR: [
                { nextRunAt: null },
                { nextRunAt: { lte: now } },
            ],
        },
        orderBy: { nextRunAt: 'asc' },
        take: 50,
    });
    console.log(`[scraper] Found ${sources.length} source(s) due for scraping`);
    // Process sources in controlled concurrency
    const { default: pLimit } = await import('p-limit');
    const limit = pLimit(CONCURRENCY);
    const results = await Promise.allSettled(sources.map((source) => limit(async () => {
        const run = await prisma.scraperRun.create({
            data: {
                sourceId: source.id,
                status: ScraperRunStatus.RUNNING,
            },
        });
        try {
            let itemsFound = 0;
            let itemsQueued = 0;
            console.log(`[scraper] Starting ${source.type}: ${source.url}`);
            if (source.type === 'WEBSITE_URL') {
                const result = await runWebsiteScraper(source.url, source.id);
                itemsFound = result.found;
                itemsQueued = result.queued;
            }
            else if (source.type === 'FACEBOOK_PAGE') {
                const result = await runFacebookScraper(source.url, source.handle ?? undefined, source.id);
                itemsFound = result.found;
                itemsQueued = result.queued;
            }
            else if (source.type === 'INSTAGRAM_ACCOUNT') {
                const result = await runInstagramScraper(source.url, source.handle ?? undefined, source.id);
                itemsFound = result.found;
                itemsQueued = result.queued;
            }
            const nextRunAt = calculateNextRun(source.frequency);
            await Promise.all([
                prisma.scraperRun.update({
                    where: { id: run.id },
                    data: {
                        status: ScraperRunStatus.SUCCESS,
                        finishedAt: new Date(),
                        itemsFound,
                        itemsQueued,
                    },
                }),
                prisma.scraperSource.update({
                    where: { id: source.id },
                    data: { lastRunAt: now, nextRunAt },
                }),
            ]);
            console.log(`[scraper] ✓ ${source.url} — ${itemsFound} found, ${itemsQueued} queued`);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error(`[scraper] ✗ ${source.url}:`, errorMessage);
            const nextRunAt = calculateNextRun(source.frequency);
            await Promise.all([
                prisma.scraperRun.update({
                    where: { id: run.id },
                    data: {
                        status: ScraperRunStatus.FAILED,
                        finishedAt: new Date(),
                        errorMessage,
                    },
                }),
                prisma.scraperSource.update({
                    where: { id: source.id },
                    data: { lastRunAt: now, nextRunAt },
                }),
            ]);
        }
    })));
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    console.log(`[scraper] Run complete — ${succeeded} succeeded, ${failed} failed`);
}
function calculateNextRun(frequency) {
    const now = new Date();
    switch (frequency) {
        case 'hourly':
            return new Date(now.getTime() + 60 * 60 * 1000);
        case 'weekly':
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        case 'daily':
        default:
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
}
// HTTP server for trigger-based execution (Railway / Render cron)
async function startServer() {
    const { createServer } = await import('http');
    const PORT = parseInt(process.env.PORT ?? '3001');
    const API_KEY = process.env.SCRAPER_API_KEY ?? '';
    const server = createServer(async (req, res) => {
        // Health check
        if (req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, ts: new Date().toISOString() }));
            return;
        }
        // Trigger a scraper run
        if (req.url === '/run' && req.method === 'POST') {
            const authHeader = req.headers['x-api-key'];
            if (API_KEY && authHeader !== API_KEY) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Unauthorized' }));
                return;
            }
            res.writeHead(202, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Scraper run initiated' }));
            // Fire-and-forget
            runDueSources().catch((e) => console.error('[scraper] Run failed:', e));
            return;
        }
        res.writeHead(404);
        res.end();
    });
    server.listen(PORT, () => {
        console.log(`[scraper] HTTP server listening on port ${PORT}`);
    });
}
// Entry point
const isOnce = process.argv.includes('--once');
if (isOnce) {
    console.log('[scraper] Running once...');
    runDueSources()
        .then(() => prisma.$disconnect())
        .then(() => process.exit(0))
        .catch((err) => { console.error(err); process.exit(1); });
}
else {
    startServer()
        .then(() => {
        // Run immediately on startup, then rely on scheduled HTTP triggers
        return runDueSources();
    })
        .catch(console.error);
}
