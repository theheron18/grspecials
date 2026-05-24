/**
 * LLM-based deal extractor.
 * Sends raw text to OpenAI GPT-4o-mini and returns structured ParsedDeal[].
 */
import OpenAI from 'openai';
import { z } from 'zod';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ParsedDealSchema = z.object({
    deals: z.array(z.object({
        title: z.string(),
        description: z.string(),
        venueName: z.string().optional(),
        dealTypeSuggestion: z.enum([
            'happy_hour', 'daily_special', 'weekend_special', 'seasonal',
            'event_deal', 'store_sale', 'limited_time', 'other',
        ]).optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        validDays: z.array(z.number().int().min(0).max(6)).optional(),
        endDate: z.string().optional(),
        priceNote: z.string().optional(),
        confidence: z.number().min(0).max(1),
    })),
});
const SYSTEM_PROMPT = `You are a deal extraction assistant for GRspecials.com, a Grand Rapids MI deals aggregator.
Extract all deals, specials, discounts, or events from the provided text.
Return valid JSON matching the schema exactly.
Days: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday.
Times should be in HH:MM format (24-hour).
Dates should be in YYYY-MM-DD format.
Set confidence to 0.9+ for clear deals, 0.5–0.9 for probable deals, below 0.5 for uncertain ones.
Only include deals that are clearly for Grand Rapids or have no location specified.
If no deals found, return {"deals": []}.`;
export async function extractDealsFromText(text, sourceUrl) {
    if (!process.env.OPENAI_API_KEY) {
        console.warn('[llm] OPENAI_API_KEY not set — skipping LLM extraction');
        return [];
    }
    if (!text || text.trim().length < 20)
        return [];
    const truncated = text.slice(0, 4000); // keep tokens reasonable
    try {
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.1,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: `Extract deals from this content (source: ${sourceUrl}):\n\n${truncated}`,
                },
            ],
        });
        const raw = response.choices[0]?.message?.content;
        if (!raw)
            return [];
        const parsed = ParsedDealSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) {
            console.warn('[llm] Schema mismatch:', parsed.error.flatten());
            return [];
        }
        return parsed.data.deals
            .filter((d) => d.confidence >= 0.4)
            .map((d) => ({
            ...d,
            rawText: text,
            sourceUrl,
        }));
    }
    catch (err) {
        console.error('[llm] Extraction failed:', err);
        return [];
    }
}
// Map LLM deal type suggestion → Prisma DealType slug
export function mapDealTypeSlug(suggestion) {
    const map = {
        happy_hour: 'happy-hour',
        daily_special: 'daily-special',
        weekend_special: 'weekend-special',
        seasonal: 'seasonal',
        event_deal: 'event-deal',
        store_sale: 'store-sale',
        limited_time: 'limited-time',
        other: 'happy-hour', // fallback
    };
    return map[suggestion ?? 'other'] ?? 'happy-hour';
}
