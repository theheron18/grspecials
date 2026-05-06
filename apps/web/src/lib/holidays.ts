export interface Holiday {
  name: string
  emoji: string
  tag: string
  drinkFocus: string
  /** Days before/after the exact date to also show the banner */
  windowDays?: number
}

/**
 * Fixed holidays keyed by MM-DD.
 * Variable holidays (Super Bowl, Mardi Gras, Derby, Memorial Day, Labor Day,
 * Oktoberfest, Drinksgiving, Thanksgiving) are hardcoded to their 2026 dates
 * and should be updated each year.
 */
export const HOLIDAYS: Record<string, Holiday> = {
  // Fixed dates
  '01-01': {
    name: "New Year's Day",
    emoji: '🥂',
    tag: 'new-years-day',
    drinkFocus: 'Bloody Marys and Mimosas — the classic "Hair of the Dog" brunch.',
  },
  '03-17': {
    name: "St. Patrick's Day",
    emoji: '🍀',
    tag: 'st-patricks-day',
    drinkFocus: 'Stout, Irish Whiskey, and anything dyed green.',
    windowDays: 1,
  },
  '05-05': {
    name: 'Cinco de Mayo',
    emoji: '🎉',
    tag: 'cinco-de-mayo',
    drinkFocus: 'Margaritas, Tequila, and Mexican Lagers.',
  },
  '07-04': {
    name: 'Independence Day',
    emoji: '🎆',
    tag: 'fourth-of-july',
    drinkFocus: 'Red, White & Blue frozen cocktails and craft beer.',
    windowDays: 1,
  },
  '10-31': {
    name: 'Halloween',
    emoji: '🎃',
    tag: 'halloween',
    drinkFocus: 'Punch bowls and dark spirits — Rum and Bourbon.',
    windowDays: 1,
  },
  '12-24': {
    name: 'Christmas Eve',
    emoji: '🎄',
    tag: 'christmas',
    drinkFocus: 'Eggnog, Hot Toddies, and Spiced Mulled Wine.',
  },
  '12-25': {
    name: 'Christmas',
    emoji: '🎄',
    tag: 'christmas',
    drinkFocus: 'Eggnog, Hot Toddies, and Spiced Mulled Wine.',
  },
  '12-31': {
    name: "New Year's Eve",
    emoji: '🥂',
    tag: 'new-years-eve',
    drinkFocus: 'Champagne and Sparkling Wine.',
  },

  // Variable dates — update these each year
  '02-01': { // 2026: Super Bowl Sunday
    name: 'Super Bowl Sunday',
    emoji: '🏈',
    tag: 'super-bowl',
    drinkFocus: 'Domestic beer buckets and draft specials.',
  },
  '02-17': { // 2026: Mardi Gras (Fat Tuesday)
    name: 'Mardi Gras',
    emoji: '🎭',
    tag: 'mardi-gras',
    drinkFocus: 'Hurricanes, Sazeracs, and Abita beer.',
    windowDays: 1,
  },
  '05-02': { // 2026: Kentucky Derby (first Saturday in May)
    name: 'Kentucky Derby',
    emoji: '🏇',
    tag: 'kentucky-derby',
    drinkFocus: 'Mint Juleps, often served in copper or silver cups.',
  },
  '05-25': { // 2026: Memorial Day
    name: 'Memorial Day',
    emoji: '🇺🇸',
    tag: 'memorial-day',
    drinkFocus: 'Canned beers, spiked seltzers, and patio drinks.',
    windowDays: 2,
  },
  '09-07': { // 2026: Labor Day (first Monday in September)
    name: 'Labor Day',
    emoji: '☀️',
    tag: 'labor-day',
    drinkFocus: 'End-of-summer seasonal ales and patio drinks.',
    windowDays: 2,
  },
  '09-19': { // 2026: Oktoberfest start (third Saturday in September)
    name: 'Oktoberfest',
    emoji: '🍺',
    tag: 'oktoberfest',
    drinkFocus: 'German Lagers, Märzens, and Festbiers.',
    windowDays: 14,
  },
  '11-25': { // 2026: "Drinksgiving" (Wednesday before Thanksgiving)
    name: 'Drinksgiving',
    emoji: '🍻',
    tag: 'drinksgiving',
    drinkFocus: 'Well drinks and draft specials — the biggest bar night of the year.',
  },
  '11-26': { // 2026: Thanksgiving (fourth Thursday in November)
    name: 'Thanksgiving',
    emoji: '🦃',
    tag: 'thanksgiving',
    drinkFocus: 'Wine pairings (Pinot Noir/Riesling) and hard ciders.',
  },
}

/** All known holiday tags — used for admin quick-add suggestions */
export const ALL_HOLIDAY_TAGS: { label: string; tag: string }[] = [
  { label: "New Year's Day", tag: 'new-years-day' },
  { label: 'Super Bowl', tag: 'super-bowl' },
  { label: 'Mardi Gras', tag: 'mardi-gras' },
  { label: "St. Patrick's Day", tag: 'st-patricks-day' },
  { label: 'Kentucky Derby', tag: 'kentucky-derby' },
  { label: 'Cinco de Mayo', tag: 'cinco-de-mayo' },
  { label: 'Memorial Day', tag: 'memorial-day' },
  { label: 'Fourth of July', tag: 'fourth-of-july' },
  { label: 'Labor Day', tag: 'labor-day' },
  { label: 'Oktoberfest', tag: 'oktoberfest' },
  { label: 'Halloween', tag: 'halloween' },
  { label: 'Drinksgiving', tag: 'drinksgiving' },
  { label: 'Thanksgiving', tag: 'thanksgiving' },
  { label: 'Christmas', tag: 'christmas' },
  { label: "New Year's Eve", tag: 'new-years-eve' },
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
