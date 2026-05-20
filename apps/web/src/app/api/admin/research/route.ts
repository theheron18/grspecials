import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@grspecials/db'

const RESEARCH_PROMPT = (name: string, address: string, existingTitles: string[]) => `
You are researching current deals, happy hours, and specials for a specific restaurant or bar in Grand Rapids, MI.

Business: ${name}
Address: ${address}

Search for current deals, happy hours, and specials at this specific location. Check their website, Facebook, and Instagram. Focus on deals that are currently running, not past promotions.

For each deal found, return structured data with these fields:
- title: short descriptive title (e.g. "Happy Hour Half-Price Apps")
- description: details of the deal (what's discounted, conditions, etc.)
- days: array of day numbers that this deal is valid (0=Sunday, 1=Monday, ..., 6=Saturday). Use [] if unknown or every day.
- startTime: start time in HH:MM 24-hour format, or null if unknown
- endTime: end time in HH:MM 24-hour format, or null if unknown
- dealType: one of: happy_hour, food_special, drink_special, entertainment, discount, event, other
- dealFrequency: "RECURRING" if this happens regularly on set days/times (e.g. every Tuesday happy hour, weekly special), or "ONE_OFF" if this is a specific dated event or limited-time promotion
- frequencyConfidence: "high", "medium", or "low" — how confident you are in the dealFrequency classification
- sourceUrl: the exact URL where you found this deal (website, Facebook post, etc.). Only include deals where you found a clear source URL.

${existingTitles.length > 0 ? `Existing deals already in our system for this place (skip these exact deals):\n${existingTitles.map((t) => `- ${t}`).join('\n')}` : ''}

Return a JSON object with a "deals" array. Only include deals with a clear source URL. If no deals are found, return {"deals": []}.
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

// Simple normalized title comparison for deduplication
function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function dedupeStatus(
  foundTitle: string,
  existingTitles: string[],
): { status: 'new' | 'possible_duplicate' | 'exists'; matchedTitle?: string } {
  const normalized = normalizeTitle(foundTitle)
  for (const existing of existingTitles) {
    const normalizedExisting = normalizeTitle(existing)
    if (normalized === normalizedExisting) return { status: 'exists', matchedTitle: existing }
    // Check if one contains the other or they share >70% of words
    const wordsA = new Set(normalized.split(' '))
    const wordsB = new Set(normalizedExisting.split(' '))
    const intersection = [...wordsA].filter((w) => wordsB.has(w) && w.length > 2)
    const union = new Set([...wordsA, ...wordsB])
    const similarity = intersection.length / Math.max(wordsA.size, wordsB.size)
    if (similarity >= 0.7) return { status: 'possible_duplicate', matchedTitle: existing }
  }
  return { status: 'new' }
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
        send({ type: 'place_start', placeId, placeName: place.name })

        try {
          const response = await client.beta.messages.create({
            // No stable alias exists in the SDK — update this when a newer Sonnet 4.x is released.
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
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
          })

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

          // Deduplicate against existing deals
          const deduped = deals.map((deal) => {
            const { status, matchedTitle } = dedupeStatus(deal.title, existingTitles)
            return { ...deal, dedupeStatus: status, matchedTitle }
          })

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
