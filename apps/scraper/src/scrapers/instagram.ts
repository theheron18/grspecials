/**
 * Instagram scraper — extracts post captions from public profiles.
 * Uses Playwright since the official API requires advanced permissions.
 */

import { chromium } from 'playwright'
import pRetry from 'p-retry'
import { extractDealsFromText } from '../parser/llm.js'
import { enqueueDeal } from '../queue/enqueue.js'

export async function runInstagramScraper(
  url: string,
  handle?: string,
  sourceId?: string,
): Promise<{ found: number; queued: number }> {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    viewport: { width: 375, height: 812 },
  })

  let text = ''
  try {
    const page = await context.newPage()

    const profileUrl = handle
      ? `https://www.instagram.com/${handle.replace('@', '')}/`
      : url

    await pRetry(
      () => page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 }),
      { retries: 2, minTimeout: 3000 },
    )

    await page.waitForTimeout(4000)

    // Extract post captions visible on profile grid
    text = await page.evaluate(() => {
      // Instagram renders content into JSON script tags
      const scripts = Array.from(document.querySelectorAll('script[type="application/json"]'))
      const texts: string[] = []

      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent ?? '')
          const str = JSON.stringify(data)
          // Extract caption-like strings (crude but effective for public profiles)
          const matches = str.match(/"text":"([^"]{20,500})"/g) ?? []
          matches.forEach((m) => {
            const caption = m.replace(/^"text":"/, '').replace(/"$/, '')
            if (!caption.includes('\\u') && caption.length > 30) {
              texts.push(caption)
            }
          })
        } catch {
          // not JSON, skip
        }
      }

      if (texts.length > 0) return texts.join('\n\n')

      // Fallback: visible text
      const els = document.querySelectorAll('script, style, header, footer')
      els.forEach((el) => el.remove())
      return document.body?.innerText ?? ''
    })
  } finally {
    await context.close()
    await browser.close()
  }

  if (!text.trim()) return { found: 0, queued: 0 }

  const deals = await extractDealsFromText(text, url)
  const found = deals.length
  let queued = 0

  for (const deal of deals) {
    const enqueued = await enqueueDeal(deal, sourceId ?? '')
    if (enqueued) queued++
  }

  return { found, queued }
}
