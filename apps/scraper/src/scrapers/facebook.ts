/**
 * Facebook page scraper.
 * Attempts Meta Graph API first, falls back to Playwright scraping.
 */

import { chromium } from 'playwright'
import pRetry from 'p-retry'
import { extractDealsFromText } from '../parser/llm.js'
import { enqueueDeal } from '../queue/enqueue.js'

async function scrapeViaGraphApi(
  pageId: string,
): Promise<string | null> {
  const token = process.env.META_ACCESS_TOKEN
  if (!token) return null

  try {
    const { default: axios } = await import('axios')
    const resp = await axios.get(
      `https://graph.facebook.com/v19.0/${pageId}/posts`,
      {
        params: {
          access_token: token,
          fields: 'message,story,created_time',
          limit: 20,
        },
        timeout: 10_000,
      },
    )

    const posts: { message?: string; story?: string }[] = resp.data?.data ?? []
    return posts
      .map((p) => p.message ?? p.story ?? '')
      .filter(Boolean)
      .join('\n\n')
  } catch {
    return null
  }
}

async function scrapeViaPlaywright(url: string): Promise<string> {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1280, height: 900 },
  })

  let text = ''
  try {
    const page = await context.newPage()
    await pRetry(
      () => page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 }),
      { retries: 2, minTimeout: 2000 },
    )

    // Wait briefly for content to render
    await page.waitForTimeout(3000)

    text = await page.evaluate(() => {
      const postEls = document.querySelectorAll('[data-ad-preview="message"], [data-testid="post_message"]')
      if (postEls.length > 0) {
        return Array.from(postEls).map((el) => (el as HTMLElement).innerText).join('\n\n')
      }
      // Fallback: grab all visible text
      const scripts = document.querySelectorAll('script, style')
      scripts.forEach((el) => el.remove())
      return document.body?.innerText ?? ''
    })
  } finally {
    await context.close()
    await browser.close()
  }

  return text
}

export async function runFacebookScraper(
  url: string,
  handle?: string,
  sourceId?: string,
): Promise<{ found: number; queued: number }> {
  let text: string | null = null
  let found = 0
  let queued = 0

  // Try Graph API first
  if (handle) {
    text = await scrapeViaGraphApi(handle)
  }

  // Fall back to Playwright
  if (!text) {
    text = await scrapeViaPlaywright(url)
  }

  if (!text?.trim()) return { found: 0, queued: 0 }

  const deals = await extractDealsFromText(text, url)
  found = deals.length

  for (const deal of deals) {
    const enqueued = await enqueueDeal(deal, sourceId ?? '')
    if (enqueued) queued++
  }

  return { found, queued }
}
