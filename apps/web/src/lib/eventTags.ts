import { prisma } from '@grspecials/db'
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
export async function getTagsForDate(date: Date): Promise<string[]> {
  const key = dateKey(date)
  const tags: string[] = []
  const holiday = await prisma.holiday.findFirst({ where: { mmdd: key, active: true } })
  if (holiday) tags.push(holiday.tag)
  if (DRINK_DAYS[key]) tags.push(DRINK_DAYS[key].tag)
  return tags
}

/** Returns upcoming holiday and drink day events within the next N days */
export async function getUpcomingEvents(days: number): Promise<UpcomingEvent[]> {
  const holidays = await prisma.holiday.findMany({ where: { active: true } })
  const events: UpcomingEvent[] = []
  const now = new Date()

  for (let i = 1; i <= days; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
    const key = dateKey(date)

    const holiday = holidays.find((h) => h.mmdd === key)
    if (holiday) {
      events.push({ date, daysAway: i, type: 'holiday', name: holiday.label, emoji: holiday.emoji, tag: holiday.tag })
    }
    if (DRINK_DAYS[key]) {
      events.push({ date, daysAway: i, type: 'drink-day', ...DRINK_DAYS[key] })
    }
  }

  return events
}
