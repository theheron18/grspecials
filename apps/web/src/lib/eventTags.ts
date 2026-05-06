import { HOLIDAYS } from './holidays'
import { DRINK_DAYS } from './drinkDays'

export interface UpcomingEvent {
  date: Date
  daysAway: number
  name: string
  emoji: string
  tag: string
  type: 'holiday' | 'drink-day'
}

function dateKey(date: Date): string {
  const eastern = date.toLocaleDateString('en-CA', { timeZone: 'America/Detroit' })
  const [, mm, dd] = eastern.split('-')
  return `${mm}-${dd}`
}

/** Returns all holiday/drink-day tags that apply to a given date */
export function getTagsForDate(date: Date): string[] {
  const key = dateKey(date)
  const tags: string[] = []
  if (HOLIDAYS[key]) tags.push(HOLIDAYS[key].tag)
  if (DRINK_DAYS[key]) tags.push(DRINK_DAYS[key].tag)
  return tags
}

/** Returns upcoming holiday and drink day events within the next N days */
export function getUpcomingEvents(days: number): UpcomingEvent[] {
  const events: UpcomingEvent[] = []
  const now = new Date()

  for (let i = 1; i <= days; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
    const key = dateKey(date)

    if (HOLIDAYS[key]) {
      events.push({ date, daysAway: i, type: 'holiday', ...HOLIDAYS[key] })
    }
    if (DRINK_DAYS[key]) {
      events.push({ date, daysAway: i, type: 'drink-day', ...DRINK_DAYS[key] })
    }
  }

  return events
}
