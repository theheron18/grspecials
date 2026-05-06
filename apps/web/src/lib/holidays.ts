export interface Holiday {
  name: string
  emoji: string
  tag: string
  /** Days before/after the exact date to also show the banner (for multi-day events) */
  windowDays?: number
}

/** Fixed US holidays keyed by MM-DD */
export const HOLIDAYS: Record<string, Holiday> = {
  '01-01': { name: "New Year's Day", emoji: '🎉', tag: 'new-years-day' },
  '01-31': { name: 'Super Bowl Sunday', emoji: '🏈', tag: 'super-bowl', windowDays: 1 },
  '02-14': { name: "Valentine's Day", emoji: '❤️', tag: 'valentines-day', windowDays: 1 },
  '03-17': { name: "St. Patrick's Day", emoji: '🍀', tag: 'st-patricks-day', windowDays: 1 },
  '05-05': { name: 'Cinco de Mayo', emoji: '🎉', tag: 'cinco-de-mayo' },
  '07-04': { name: 'Fourth of July', emoji: '🎆', tag: 'fourth-of-july', windowDays: 1 },
  '10-31': { name: 'Halloween', emoji: '🎃', tag: 'halloween', windowDays: 1 },
  '11-11': { name: "Veterans Day", emoji: '🇺🇸', tag: 'veterans-day' },
  '12-24': { name: 'Christmas Eve', emoji: '🎄', tag: 'christmas' },
  '12-25': { name: 'Christmas', emoji: '🎄', tag: 'christmas' },
  '12-31': { name: "New Year's Eve", emoji: '🥂', tag: 'new-years-eve' },
}

/** All known holiday tags — useful for displaying suggestions in admin */
export const ALL_HOLIDAY_TAGS: { label: string; tag: string }[] = [
  { label: "New Year's Day", tag: 'new-years-day' },
  { label: 'Super Bowl', tag: 'super-bowl' },
  { label: "Valentine's Day", tag: 'valentines-day' },
  { label: "St. Patrick's Day", tag: 'st-patricks-day' },
  { label: 'Cinco de Mayo', tag: 'cinco-de-mayo' },
  { label: 'Fourth of July', tag: 'fourth-of-july' },
  { label: 'Halloween', tag: 'halloween' },
  { label: 'Veterans Day', tag: 'veterans-day' },
  { label: 'Thanksgiving', tag: 'thanksgiving' },
  { label: 'Christmas', tag: 'christmas' },
  { label: "New Year's Eve", tag: 'new-years-eve' },
  { label: 'Grand Rapids Events', tag: 'gr-events' },
  { label: 'Weekend Only', tag: 'weekend' },
]

export function getTodaysHoliday(): Holiday | null {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const key = `${mm}-${dd}`

  if (HOLIDAYS[key]) return HOLIDAYS[key]

  // Check if today falls within the windowDays of any holiday
  for (const [dateKey, holiday] of Object.entries(HOLIDAYS)) {
    if (!holiday.windowDays) continue
    const [hMm, hDd] = dateKey.split('-').map(Number)
    const holidayDate = new Date(now.getFullYear(), hMm - 1, hDd)
    const diffMs = now.getTime() - holidayDate.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    if (diffDays >= -holiday.windowDays && diffDays <= holiday.windowDays) {
      return holiday
    }
  }

  return null
}
