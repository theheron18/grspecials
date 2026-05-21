import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@grspecials/db'

const RESEARCH_PROMPT = (name: string, address: string, existingTitles: string[]) => `
Business: ${name}
Address: ${address}

Find current deals, happy hours, and specials. Return at most 3.

Each deal must include:
- title: short title
- description: explicit pricing/discount details
- days: [0-6] (0=Sun), [] if unknown
- startTime/endTime: HH:MM 24h or null
- dealType: happy_hour|food_special|drink_special|entertainment|discount|event|other
- dealFrequency: RECURRING or ONE_OFF
- frequencyConfidence: high|medium|low
- sourceUrl: exact page URL where the deal is explicitly stated

Rules:
- Only include deals with explicit pricing or discount amounts on the source page
- Return [] rather than estimating or summarising vague descriptions
- Exclude open mic, trivia, live music unless tied to a stated food/drink price or percentage
- sourceUrl must be the page that explicitly mentions the deal, not a homepage

Source priority (use the highest available):
1. The business's own official website
2. The business's own Facebook or Instagram page where the deal is explicitly posted
3. The business's own Google Business Profile
4. Third-party sites (Yelp, TripAdvisor, HappyHopper, BeerOClockGR, Groupon, etc.) only as a last resort

Third-party source rules:
- Never use a third-party aggregator as the sourceUrl — always link to the business's own website or official social media page
- If a deal is only found on a third-party site, only include it if the listing was visibly updated within the last 6 months
- If the only available source is a third-party aggregator with no recent update date visible, do not include the deal
- If a deal is found on the business's Facebook or Instagram, use their official social media URL as the sourceUrl

${existingTitles.length > 0 ? `Skip (already in system):\n${existingTitles.map((t) => `- ${t}`).join('\n')}` : ''}

Return {"deals": []} if nothing found.
`.trim()

interface ResearchDeal {
  title: string
  description: string
  days: number[]
  startTime: string | null
  endTime: string | null
  dealType: string
  dealFrequency: 'RECURRING' | 'ONE_OFF'
  frequencyConfidence: 'high' | 'medium' | 'low'
  sourceUrl: string
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response('ANTHROPIC_API_KEY not configured', { status: 500 })
  }

  const body = await req.json()
  const placeIds: string[] = body.placeIds ?? []
  if (!placeIds.length) {
    return new Response('No placeIds provided', { status: 400 })
  }

  const client = new Anthropic({ apiKey })

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      function send(data: unknown) {
        controller.enqueue(enc.encode(JSON.stringify(data) + '\n'))
      }

      for (let i = 0; i < placeIds.length; i++) {
        const placeId = placeIds[i]

        // Fetch place with active deals
        const place = await prisma.venue.findUnique({
          where: { id: placeId },
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            deals: {
              where: { status: 'ACTIVE' },
              select: { id: true, title: true },
            },
          },
        })

        if (!place) {
          send({ type: 'place_error', placeId, error: 'Place not found' })
          continue
        }

        const existingTitles = place.deals.map((d) => d.title)
        const hasActiveDeals = place.deals.length > 0
        send({ type: 'place_start', placeId, placeName: place.name })

        try {
          const timeoutMs = 60_000
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Search timed out after 60 seconds')), timeoutMs),
          )
          const response = await Promise.race([
            client.beta.messages.create({
            // Haiku is ~3x cheaper than Sonnet for this task.
            // Check docs if web_search tool support changes.
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 500,
            tools: [{ type: 'web_search_20250305' as const, name: 'web_search' }],
            betas: ['web-search-2025-03-05'],
            messages: [
              {
                role: 'user',
                content: RESEARCH_PROMPT(
                  place.name,
                  `${place.address}, ${place.city}, ${place.state}`,
                  existingTitles,
                ),
              },
            ],
          }),
            timeout,
          ])

          // Extract text from the final response
          let resultText = ''
          for (const block of response.content) {
            if (block.type === 'text') {
              resultText += block.text
            }
          }

          // Parse JSON from the response text
          let deals: ResearchDeal[] = []
          try {
            const jsonMatch = resultText.match(/\{[\s\S]*"deals"[\s\S]*\}/)
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0])
              deals = Array.isArray(parsed.deals) ? parsed.deals : []
            }
          } catch {
            // Malformed JSON — treat as no deals found
          }

          const stripHtml = (text: string) => text.replace(/<[^>]*>/g, '').trim()

          const deduped = deals.map((deal) => ({
            ...deal,
            title: stripHtml(deal.title),
            description: stripHtml(deal.description),
            dedupeStatus: hasActiveDeals ? ('possible_duplicate' as const) : ('new' as const),
            matchedTitle: undefined,
          }))

          // Update lastResearchedAt
          await prisma.venue.update({
            where: { id: placeId },
            data: { lastResearchedAt: new Date() },
          })

          send({ type: 'place_result', placeId, placeName: place.name, deals: deduped })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          send({ type: 'place_error', placeId, placeName: place.name, error: message })
        }

        // 1-second delay between calls to avoid rate limits
        if (i < placeIds.length - 1) {
          await delay(1000)
        }
      }

      send({ type: 'done' })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
