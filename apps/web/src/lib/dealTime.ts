// All time logic uses Eastern Time (America/Detroit) per CLAUDE.md rule 9.
// Never use new Date() directly for day/time comparisons — always derive ET explicitly.

export interface DealTimeable {
  activeDays: number[]
  startTime?: string | null
  endTime?: string | null
}

export type TimeFilter = 'now' | '2h' | 'today' | 'all'

function getEasternNow(): { dayInt: number; minutesSinceMidnight: number } {
  const now = new Date()
  // Derive day-of-week in ET by constructing a local Date from the ET locale string
  const dayInt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Detroit' })).getDay()
  // en-GB locale with hour/minute gives 24-hour HH:MM format
  const etTime = now.toLocaleTimeString('en-GB', {
    timeZone: 'America/Detroit',
    hour: '2-digit',
    minute: '2-digit',
  })
  const [h, m] = etTime.split(':').map(Number)
  return { dayInt, minutesSinceMidnight: h * 60 + m }
}

export function getEasternDayInt(): number {
  return getEasternNow().dayInt
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function isActiveNow(deal: DealTimeable): boolean {
  const { dayInt, minutesSinceMidnight } = getEasternNow()
  if (!deal.activeDays.includes(dayInt)) return false
  if (!deal.startTime && !deal.endTime) return true
  const start = deal.startTime ? toMinutes(deal.startTime) : 0
  const end = deal.endTime ? toMinutes(deal.endTime) : 1439 // 23:59
  return minutesSinceMidnight >= start && minutesSinceMidnight <= end
}

export function getMinutesUntilStart(deal: DealTimeable): number {
  const { minutesSinceMidnight } = getEasternNow()
  if (!deal.startTime) return 0
  return toMinutes(deal.startTime) - minutesSinceMidnight
}

export function startsWithinMinutes(deal: DealTimeable, minutes: number): boolean {
  if (isActiveNow(deal)) return false
  const { dayInt } = getEasternNow()
  if (!deal.activeDays.includes(dayInt)) return false
  const minsUntil = getMinutesUntilStart(deal)
  return minsUntil > 0 && minsUntil <= minutes
}

export function isActiveLaterToday(deal: DealTimeable): boolean {
  if (isActiveNow(deal)) return false
  const { dayInt } = getEasternNow()
  if (!deal.activeDays.includes(dayInt)) return false
  const minsUntil = getMinutesUntilStart(deal)
  return minsUntil > 120
}
