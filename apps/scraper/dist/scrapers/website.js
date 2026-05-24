/**
 * General website scraper using Playwright.
 * Extracts text content, sends to LLM, queues deals.
 */
import { chromium } from 'playwright';
import pRetry from 'p-retry';
import { extractDealsFromText } from '../parser/llm.js';
import { enqueueDeal } from '../queue/enqueue.js';
export async function runWebsiteScraper(url, sourceId) {
    let found = 0;
    let queued = 0;
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (compatible; GRspecialsBot/1.0; +https://grspecials.com/bot)',
        viewport: { width: 1280, height: 800 },
    });
    try {
        const page = await context.newPage();
        await pRetry(async () => {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        }, { retries: 2, minTimeout: 2000 });
        // Extract visible text — strip scripts/styles
        const text = await page.evaluate(() => {
            const els = document.querySelectorAll('script, style, nav, footer, header');
            els.forEach((el) => el.remove());
            return document.body?.innerText ?? '';
        });
        const deals = await extractDealsFromText(text, url);
        found = deals.length;
        for (const deal of deals) {
            const enqueued = await enqueueDeal(deal, sourceId);
            if (enqueued)
                queued++;
        }
    }
    finally {
        await context.close();
        await browser.close();
    }
    return { found, queued };
}
