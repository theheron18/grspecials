export interface DrinkDay {
  name: string
  emoji: string
  tag: string
  tagline: string
  season: string
}

/**
 * National / international drink days keyed by MM-DD.
 * Variable dates (first Friday/Thursday of a month) are hardcoded to 2026
 * and noted with comments — update annually.
 * Days with two events on the same date are combined into one entry.
 */
export const DRINK_DAYS: Record<string, DrinkDay> = {
  // Q1 — Winter Warmers
  '01-11': {
    name: 'National Hot Toddy Day',
    emoji: '🍵',
    tag: 'national-hot-toddy-day',
    tagline: 'The original cold remedy — whiskey, honey, lemon, hot water.',
    season: 'Winter Warmers',
  },
  '01-25': {
    name: 'National Irish Coffee Day',
    emoji: '☕',
    tag: 'national-irish-coffee-day',
    tagline: 'Hot coffee, Irish whiskey, and a float of cream. Classic.',
    season: 'Winter Warmers',
  },
  '02-18': {
    name: 'National Drink Wine Day',
    emoji: '🍷',
    tag: 'national-drink-wine-day',
    tagline: 'Red, white, or rosé — tonight's the night.',
    season: 'Winter Warmers',
  },
  '02-22': {
    name: 'National Margarita Day',
    emoji: '🍹',
    tag: 'national-margarita-day',
    tagline: 'Tequila, triple sec, lime. Salt rim optional but encouraged.',
    season: 'Winter Warmers',
  },
  '02-27': {
    name: 'National Kahlúa Day',
    emoji: '🥃',
    tag: 'national-kahlua-day',
    tagline: 'Coffee liqueur straight, on the rocks, or in a White Russian.',
    season: 'Winter Warmers',
  },
  '03-05': {
    name: 'National Absinthe Day',
    emoji: '🌿',
    tag: 'national-absinthe-day',
    tagline: 'The green fairy. Best served with a sugar cube and a slow drip.',
    season: 'Winter Warmers',
  },
  '03-27': {
    name: 'International Whisk(e)y Day',
    emoji: '🥃',
    tag: 'international-whiskey-day',
    tagline: 'Scotch, bourbon, Irish, Japanese — all welcome today.',
    season: 'Winter Warmers',
  },

  // Q2 — Spring Spirits
  '04-06': {
    name: "New Beer's Eve",
    emoji: '🍺',
    tag: 'new-beers-eve',
    tagline: 'The night before Prohibition ended in 1933. Raise one to history.',
    season: 'Spring Spirits',
  },
  '04-07': {
    name: 'National Beer Day',
    emoji: '🍺',
    tag: 'national-beer-day',
    tagline: 'April 7, 1933 — the day America got its beer back.',
    season: 'Spring Spirits',
  },
  '05-07': {
    name: 'National Cosmopolitan Day',
    emoji: '🍸',
    tag: 'national-cosmopolitan-day',
    tagline: 'Vodka, triple sec, cranberry, lime. Still iconic.',
    season: 'Spring Spirits',
  },
  '05-13': {
    name: 'World Cocktail Day',
    emoji: '🍹',
    tag: 'world-cocktail-day',
    tagline: 'Any cocktail counts today. The more creative, the better.',
    season: 'Spring Spirits',
  },
  '05-16': {
    name: 'National Mimosa Day & World Whisky Day',
    emoji: '🥂',
    tag: 'national-mimosa-day',
    tagline: 'Bubbles for brunch, whisky for after. A good day all around.',
    season: 'Spring Spirits',
  },
  '05-25': {
    name: 'National Wine Day',
    emoji: '🍷',
    tag: 'national-wine-day',
    tagline: 'Different from National Drink Wine Day — this one's a holiday.',
    season: 'Spring Spirits',
  },
  '05-30': {
    name: 'National Mint Julep Day',
    emoji: '🌿',
    tag: 'national-mint-julep-day',
    tagline: 'Bourbon, fresh mint, sugar, crushed ice. The South in a cup.',
    season: 'Spring Spirits',
  },
  '06-13': {
    name: 'World Gin Day & National Rosé Day',
    emoji: '🌹',
    tag: 'world-gin-day',
    tagline: 'Gin & tonics and frosé — June is in full swing.',
    season: 'Spring Spirits',
  },
  '06-14': {
    name: 'National Bourbon Day',
    emoji: '🥃',
    tag: 'national-bourbon-day',
    tagline: 'America\'s native spirit. Neat, on the rocks, or in a smash.',
    season: 'Spring Spirits',
  },
  '06-19': {
    name: 'National Martini Day',
    emoji: '🍸',
    tag: 'national-martini-day',
    tagline: 'Gin or vodka. Shaken or stirred. Olive or twist. Your call.',
    season: 'Spring Spirits',
  },

  // Q3 — Summer Refreshments
  '07-10': {
    name: 'National Piña Colada Day',
    emoji: '🍍',
    tag: 'national-pina-colada-day',
    tagline: 'If you like piña coladas — today is literally your day.',
    season: 'Summer Refreshments',
  },
  '07-11': {
    name: 'National Mojito Day',
    emoji: '🌿',
    tag: 'national-mojito-day',
    tagline: 'Rum, mint, lime, sugar, soda. The most refreshing drink alive.',
    season: 'Summer Refreshments',
  },
  '07-19': {
    name: 'National Daiquiri Day',
    emoji: '🍓',
    tag: 'national-daiquiri-day',
    tagline: 'Frozen or classic — rum and citrus in its finest form.',
    season: 'Summer Refreshments',
  },
  '07-24': {
    name: 'National Tequila Day',
    emoji: '🌵',
    tag: 'national-tequila-day',
    tagline: 'Shots, margs, palomas — tequila has range. Use it.',
    season: 'Summer Refreshments',
  },
  '07-27': {
    name: 'National Scotch Day',
    emoji: '🥃',
    tag: 'national-scotch-day',
    tagline: 'Single malt or blended, peaty or smooth — Scotland\'s finest.',
    season: 'Summer Refreshments',
  },
  '08-07': { // 2026: First Friday of August
    name: 'International Beer Day',
    emoji: '🍻',
    tag: 'international-beer-day',
    tagline: 'Celebrate brewers, bartenders, and beer lovers worldwide.',
    season: 'Summer Refreshments',
  },
  '08-16': {
    name: 'National Rum Day',
    emoji: '🥃',
    tag: 'national-rum-day',
    tagline: 'Dark, light, spiced, or aged — rum is endlessly versatile.',
    season: 'Summer Refreshments',
  },
  '08-25': {
    name: 'National Whiskey Sour Day',
    emoji: '🍋',
    tag: 'national-whiskey-sour-day',
    tagline: 'Bourbon, lemon juice, simple syrup. Add an egg white for a froth.',
    season: 'Summer Refreshments',
  },
  '08-28': {
    name: 'National Red Wine Day',
    emoji: '🍷',
    tag: 'national-red-wine-day',
    tagline: 'Cab, Merlot, Pinot Noir — pour a big glass and settle in.',
    season: 'Summer Refreshments',
  },
  '09-20': {
    name: 'National Rum Punch Day',
    emoji: '🍹',
    tag: 'national-rum-punch-day',
    tagline: 'One of sour, two of sweet, three of strong, four of weak.',
    season: 'Summer Refreshments',
  },
  '09-28': {
    name: 'National Drink Beer Day',
    emoji: '🍺',
    tag: 'national-drink-beer-day',
    tagline: 'As if you needed an excuse. But here it is anyway.',
    season: 'Summer Refreshments',
  },

  // Q4 — Autumn & Holiday Toasts
  '10-04': {
    name: 'National Vodka Day',
    emoji: '🫙',
    tag: 'national-vodka-day',
    tagline: 'The most versatile spirit on the shelf. Mix it any way you like.',
    season: 'Autumn & Holiday Toasts',
  },
  '10-19': {
    name: 'International Gin & Tonic Day',
    emoji: '🍸',
    tag: 'international-gin-and-tonic-day',
    tagline: 'Simple, elegant, endlessly riffable. Garnish generously.',
    season: 'Autumn & Holiday Toasts',
  },
  '10-27': {
    name: 'National American Beer Day',
    emoji: '🇺🇸',
    tag: 'national-american-beer-day',
    tagline: 'Craft, macro, lager, IPA — American brewing has never been better.',
    season: 'Autumn & Holiday Toasts',
  },
  '11-05': { // 2026: First Thursday of November
    name: 'International Stout Day',
    emoji: '🖤',
    tag: 'international-stout-day',
    tagline: 'Dry stout, imperial stout, milk stout — dark and delicious.',
    season: 'Autumn & Holiday Toasts',
  },
  '11-12': {
    name: 'National Happy Hour Day',
    emoji: '🥂',
    tag: 'national-happy-hour-day',
    tagline: 'The most American of institutions. Get there early.',
    season: 'Autumn & Holiday Toasts',
  },
  '12-05': {
    name: 'Repeal Day',
    emoji: '🗽',
    tag: 'repeal-day',
    tagline: 'December 5, 1933 — the day Prohibition ended for good.',
    season: 'Autumn & Holiday Toasts',
  },
  '12-10': {
    name: 'National Lager Day',
    emoji: '🍺',
    tag: 'national-lager-day',
    tagline: 'Clean, crisp, cold. The world\'s most popular style of beer.',
    season: 'Autumn & Holiday Toasts',
  },
  '12-20': {
    name: 'National Sangria Day',
    emoji: '🍷',
    tag: 'national-sangria-day',
    tagline: 'Red wine, brandy, fruit, and time. Best made the night before.',
    season: 'Autumn & Holiday Toasts',
  },
  '12-24': {
    name: 'National Eggnog Day',
    emoji: '🥛',
    tag: 'national-eggnog-day',
    tagline: 'Spiked with bourbon, rum, or brandy. The holidays in a glass.',
    season: 'Autumn & Holiday Toasts',
  },
}

export function getTodaysDrinkDay(): DrinkDay | null {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return DRINK_DAYS[`${mm}-${dd}`] ?? null
}

/** All drink day tags grouped by season — for admin quick-add */
export const DRINK_DAY_TAGS_BY_SEASON: Record<string, { label: string; tag: string }[]> = {
  'Winter Warmers': [
    { label: 'Hot Toddy Day', tag: 'national-hot-toddy-day' },
    { label: 'Irish Coffee Day', tag: 'national-irish-coffee-day' },
    { label: 'Drink Wine Day', tag: 'national-drink-wine-day' },
    { label: 'Margarita Day', tag: 'national-margarita-day' },
    { label: 'Kahlúa Day', tag: 'national-kahlua-day' },
    { label: 'Absinthe Day', tag: 'national-absinthe-day' },
    { label: 'Whiskey Day', tag: 'international-whiskey-day' },
  ],
  'Spring Spirits': [
    { label: "New Beer's Eve", tag: 'new-beers-eve' },
    { label: 'Beer Day', tag: 'national-beer-day' },
    { label: 'Cosmopolitan Day', tag: 'national-cosmopolitan-day' },
    { label: 'World Cocktail Day', tag: 'world-cocktail-day' },
    { label: 'Mimosa Day', tag: 'national-mimosa-day' },
    { label: 'Wine Day', tag: 'national-wine-day' },
    { label: 'Mint Julep Day', tag: 'national-mint-julep-day' },
    { label: 'Gin Day', tag: 'world-gin-day' },
    { label: 'Bourbon Day', tag: 'national-bourbon-day' },
    { label: 'Martini Day', tag: 'national-martini-day' },
  ],
  'Summer Refreshments': [
    { label: 'Piña Colada Day', tag: 'national-pina-colada-day' },
    { label: 'Mojito Day', tag: 'national-mojito-day' },
    { label: 'Daiquiri Day', tag: 'national-daiquiri-day' },
    { label: 'Tequila Day', tag: 'national-tequila-day' },
    { label: 'Scotch Day', tag: 'national-scotch-day' },
    { label: 'International Beer Day', tag: 'international-beer-day' },
    { label: 'Rum Day', tag: 'national-rum-day' },
    { label: 'Whiskey Sour Day', tag: 'national-whiskey-sour-day' },
    { label: 'Red Wine Day', tag: 'national-red-wine-day' },
    { label: 'Rum Punch Day', tag: 'national-rum-punch-day' },
    { label: 'Drink Beer Day', tag: 'national-drink-beer-day' },
  ],
  'Autumn & Holiday Toasts': [
    { label: 'Vodka Day', tag: 'national-vodka-day' },
    { label: 'Gin & Tonic Day', tag: 'international-gin-and-tonic-day' },
    { label: 'American Beer Day', tag: 'national-american-beer-day' },
    { label: 'Stout Day', tag: 'international-stout-day' },
    { label: 'Happy Hour Day', tag: 'national-happy-hour-day' },
    { label: 'Repeal Day', tag: 'repeal-day' },
    { label: 'Lager Day', tag: 'national-lager-day' },
    { label: 'Sangria Day', tag: 'national-sangria-day' },
    { label: 'Eggnog Day', tag: 'national-eggnog-day' },
  ],
}
