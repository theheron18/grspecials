// One-time seed: migrate hardcoded holidays into the Holiday table.
// Safe to re-run — uses upsert on tag.
import { PrismaClient } from '../node_modules/.prisma/client/index.js'

const prisma = new PrismaClient()

const HOLIDAYS = [
  { mmdd: '01-01', tag: 'new-years-day',       label: "New Year's Day",    emoji: '🥂', drinkFocus: 'Bloody Marys and Mimosas — the classic "Hair of the Dog" brunch.', windowDays: 0 },
  { mmdd: '03-17', tag: 'st-patricks-day',      label: "St. Patrick's Day", emoji: '🍀', drinkFocus: 'Stout, Irish Whiskey, and anything dyed green.',                  windowDays: 1 },
  { mmdd: '05-05', tag: 'cinco-de-mayo',         label: 'Cinco de Mayo',     emoji: '🎉', drinkFocus: 'Margaritas, Tequila, and Mexican Lagers.',                        windowDays: 0 },
  { mmdd: '05-28', tag: 'national-hamburger-day',label: 'National Hamburger Day', emoji: '🍔', drinkFocus: 'Craft beer and burger specials.',                            windowDays: 1 },
  { mmdd: '07-04', tag: 'fourth-of-july',        label: 'Independence Day',  emoji: '🎆', drinkFocus: 'Red, White & Blue frozen cocktails and craft beer.',              windowDays: 1 },
  { mmdd: '10-31', tag: 'halloween',             label: 'Halloween',         emoji: '🎃', drinkFocus: 'Punch bowls and dark spirits — Rum and Bourbon.',                 windowDays: 1 },
  { mmdd: '12-24', tag: 'christmas-eve',         label: 'Christmas Eve',     emoji: '🎄', drinkFocus: 'Eggnog, Hot Toddies, and Spiced Mulled Wine.',                    windowDays: 0 },
  { mmdd: '12-25', tag: 'christmas',             label: 'Christmas',         emoji: '🎄', drinkFocus: 'Eggnog, Hot Toddies, and Spiced Mulled Wine.',                    windowDays: 0 },
  { mmdd: '12-31', tag: 'new-years-eve',         label: "New Year's Eve",    emoji: '🥂', drinkFocus: 'Champagne and Sparkling Wine.',                                   windowDays: 0 },
  // Variable — 2026 dates
  { mmdd: '02-01', tag: 'super-bowl',            label: 'Super Bowl Sunday',  emoji: '🏈', drinkFocus: 'Domestic beer buckets and draft specials.',                     windowDays: 0 },
  { mmdd: '02-17', tag: 'mardi-gras',            label: 'Mardi Gras',         emoji: '🎭', drinkFocus: 'Hurricanes, Sazeracs, and Abita beer.',                         windowDays: 1 },
  { mmdd: '05-02', tag: 'kentucky-derby',        label: 'Kentucky Derby',     emoji: '🏇', drinkFocus: 'Mint Juleps, often served in copper or silver cups.',            windowDays: 0 },
  { mmdd: '05-25', tag: 'memorial-day',          label: 'Memorial Day',       emoji: '🇺🇸', drinkFocus: 'Canned beers, spiked seltzers, and patio drinks.',              windowDays: 2 },
  { mmdd: '09-07', tag: 'labor-day',             label: 'Labor Day',          emoji: '☀️', drinkFocus: 'End-of-summer seasonal ales and patio drinks.',                 windowDays: 2 },
  { mmdd: '09-19', tag: 'oktoberfest',           label: 'Oktoberfest',        emoji: '🍺', drinkFocus: 'German Lagers, Märzens, and Festbiers.',                        windowDays: 14 },
  { mmdd: '11-25', tag: 'drinksgiving',          label: 'Drinksgiving',       emoji: '🍻', drinkFocus: 'Well drinks and draft specials — the biggest bar night of the year.', windowDays: 0 },
  { mmdd: '11-26', tag: 'thanksgiving',          label: 'Thanksgiving',       emoji: '🦃', drinkFocus: 'Wine pairings (Pinot Noir/Riesling) and hard ciders.',           windowDays: 0 },
]

async function main() {
  for (const h of HOLIDAYS) {
    await prisma.holiday.upsert({
      where: { tag: h.tag },
      update: { label: h.label, mmdd: h.mmdd, emoji: h.emoji, drinkFocus: h.drinkFocus, windowDays: h.windowDays },
      create: { tag: h.tag, label: h.label, mmdd: h.mmdd, emoji: h.emoji, drinkFocus: h.drinkFocus, windowDays: h.windowDays, active: true },
    })
    console.log(`✓ ${h.tag}`)
  }
  console.log(`\nSeeded ${HOLIDAYS.length} holidays.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
