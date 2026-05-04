import { describe, it, expect, vi } from 'vitest'
import { mapDealTypeSlug } from './llm.js'

describe('mapDealTypeSlug', () => {
  it('maps known suggestions correctly', () => {
    expect(mapDealTypeSlug('happy_hour')).toBe('happy-hour')
    expect(mapDealTypeSlug('daily_special')).toBe('daily-special')
    expect(mapDealTypeSlug('event_deal')).toBe('event-deal')
    expect(mapDealTypeSlug('store_sale')).toBe('store-sale')
    expect(mapDealTypeSlug('seasonal')).toBe('seasonal')
    expect(mapDealTypeSlug('limited_time')).toBe('limited-time')
    expect(mapDealTypeSlug('weekend_special')).toBe('weekend-special')
  })

  it('falls back to happy-hour for unknown input', () => {
    expect(mapDealTypeSlug('other')).toBe('happy-hour')
    expect(mapDealTypeSlug(undefined)).toBe('happy-hour')
    expect(mapDealTypeSlug('random')).toBe('happy-hour')
  })
})
