import { prisma } from '@grspecials/db'

export interface Holiday {
  name: string
  emoji: string
  tag: string
  drinkFocus: string
  /** Days before/after the exact date to also show the banner */
  windowDays?: number
}

/**
 * Static map kept for AdminSettings.tsx (client component — can't do async DB calls).
 * Runtime behavior (homepage banner, tag auto-detection) reads from the Holiday DB table.
 * Variable holiday dates (Super Bowl, Mardi Gras, etc.) should be updated each year
 * via the admin /admin/holidays page instead of editing this file.
 */
export const HOLIDAYS: Record<string, Holiday> = {
  '01-01': { name: "New Year's Day",       emoji: '🥂', tag: 'new-years-day',         drinkFocus: 'Bloody Marys and Mimosas — the classic "Hair of the Dog" brunch.' },
  '03-17': { name: "St. Patrick's Day",    emoji: '🍀', tag: 'st-patricks-day',        drinkFocus: 'Stout, Irish Whiskey, and anything dyed green.',               windowDays: 1 },
  '05-05': { name: 'Cinco de Mayo',        emoji: '🎉', tag: 'cinco-de-mayo',           drinkFocus: 'Margaritas, Tequila, and Mexican Lagers.' },
  '05-28': { name: 'National Hamburger Day', emoji: '🍔', tag: 'national-hamburger-day', drinkFocus: 'Craft beer and burger specials.',                             windowDays: 1 },
  '07-04': { name: 'Independence Day',     emoji: '🎆', tag: 'fourth-of-july',          drinkFocus: 'Red, White & Blue frozen cocktails and craft beer.',           windowDays: 1 },
  '10-31': { name: 'Halloween',            emoji: '🎃', tag: 'halloween',               drinkFocus: 'Punch bowls and dark spirits — Rum and Bourbon.',             windowDays: 1 },
  '12-24': { name: 'Christmas Eve',        emoji: '🎄', tag: 'christmas-eve',           drinkFocus: 'Eggnog, Hot Toddies, and Spiced Mulled Wine.' },
  '12-25': { name: 'Christmas',            emoji: '🎄', tag: 'christmas',               drinkFocus: 'Eggnog, Hot Toddies, and Spiced Mulled Wine.' },
  '12-31': { name: "New Year's Eve",       emoji: '🥂', tag: 'new-years-eve',           drinkFocus: 'Champagne and Sparkling Wine.' },
  // Variable dates — update via /admin/holidays each year
  '02-01': { name: 'Super Bowl Sunday',   emoji: '🏈', tag: 'super-bowl',        drinkFocus: 'Domestic beer buckets and draft specials.' },
  '02-17': { name: 'Mardi Gras',          emoji: '🎭', tag: 'mardi-gras',         drinkFocus: 'Hurricanes, Sazeracs, and Abita beer.',               windowDays: 1 },
  '05-02': { name: 'Kentucky Derby',      emoji: '🏇', tag: 'kentucky-derby',     drinkFocus: 'Mint Juleps, often served in copper or silver cups.' },
  '05-25': { name: 'Memorial Day',        emoji: '🇺🇸', tag: 'memorial-day',      drinkFocus: 'Canned beers, spiked seltzers, and patio drinks.',    windowDays: 2 },
  '09-07': { name: 'Labor Day',           emoji: '☀️', tag: 'labor-day',          drinkFocus: 'End-of-summer seasonal ales and patio drinks.',       windowDays: 2 },
  '09-19': { name: 'Oktoberfest',         emoji: '🍺', tag: 'oktoberfest',        drinkFocus: 'German Lagers, Märzens, and Festbiers.',              windowDays: 14 },
  '11-25': { name: 'Drinksgiving',        emoji: '🍻', tag: 'drinksgiving',       drinkFocus: 'Well drinks and draft specials — the biggest bar night of the year.' },
  '11-26': { name: 'Thanksgiving',        emoji: '🦃', tag: 'thanksgiving',       drinkFocus: 'Wine pairings (Pinot Noir/Riesling) and hard ciders.' },
}

/** All known holiday tags — used for AdminSettings banner config panel */
export const ALL_HOLIDAY_TAGS: { label: string; tag: string }[] = [
  { label: "New Year's Day",      tag: 'new-years-day' },
  { label: 'Super Bowl',          tag: 'super-bowl' },
  { label: 'Mardi Gras',          tag: 'mardi-gras' },
  { label: "St. Patrick's Day",   tag: 'st-patricks-day' },
  { label: 'Kentucky Derby',      tag: 'kentucky-derby' },
  { label: 'Cinco de Mayo',       tag: 'cinco-de-mayo' },
  { label: 'National Hamburger Day', tag: 'national-hamburger-day' },
  { label: 'Memorial Day',        tag: 'memorial-day' },
  { label: 'Fourth of July',      tag: 'fourth-of-july' },
  { label: 'Labor Day',           tag: 'labor-day' },
  { label: 'Oktoberfest',         tag: 'oktoberfest' },
  { label: 'Halloween',           tag: 'halloween' },
  { label: 'Drinksgiving',        tag: 'drinksgiving' },
  { label: 'Thanksgiving',        tag: 'thanksgiving' },
  { label: 'Christmas Eve',       tag: 'christmas-eve' },
  { label: 'Christmas',           tag: 'christmas' },
  { label: "New Year's Eve",      tag: 'new-years-eve' },
]

/** Fetches all active holidays from DB. Server-side only. */
export async function loadActiveHolidays() {
  return prisma.holiday.findMany({ where: { active: true } })
}

/** Returns today's matching holiday from DB (exact MM-DD or within windowDays). */
export async function getTodaysHoliday(): Promise<Holiday | null> {
  const holidays = await loadActiveHolidays()

  const now = new Date()
  const eastern = now.toLocaleDateString('en-CA', { timeZone: 'America/Detroit' })
  const [yearStr, mm, dd] = eastern.split('-')
  const key = `${mm}-${dd}`
  const todayEastern = new Date(`${eastern}T00:00:00`)

  const exact = holidays.find((h) => h.mmdd === key)
  if (exact) return { name: exact.label, emoji: exact.emoji, tag: exact.tag, drinkFocus: exact.drinkFocus, windowDays: exact.windowDays }

  for (const h of holidays) {
    if (!h.windowDays) continue
    const [hMm, hDd] = h.mmdd.split('-').map(Number)
    const holidayDate = new Date(Number(yearStr), hMm - 1, hDd)
    const diffDays = (todayEastern.getTime() - holidayDate.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays >= -h.windowDays && diffDays <= h.windowDays) {
      return { name: h.label, emoji: h.emoji, tag: h.tag, drinkFocus: h.drinkFocus, windowDays: h.windowDays }
    }
  }

  return null
}
