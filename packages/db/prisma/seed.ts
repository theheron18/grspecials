import { PrismaClient, UserRole, DealSource, DealStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
const { hash } = bcrypt

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Admin user
  const adminPassword = await hash('admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@grspecials.com' },
    update: {},
    create: {
      email: 'admin@grspecials.com',
      name: 'GR Specials Admin',
      role: UserRole.ADMIN,
      passwordHash: adminPassword,
      emailVerified: new Date(),
    },
  })
  console.log(`✓ Admin user: ${admin.email}`)

  // Venue categories
  const categories = await Promise.all([
    prisma.venueCategory.upsert({
      where: { slug: 'restaurant' },
      update: {},
      create: { name: 'Restaurant', slug: 'restaurant', icon: '🍽️', color: '#F5C518', sortOrder: 1 },
    }),
    prisma.venueCategory.upsert({
      where: { slug: 'bar' },
      update: {},
      create: { name: 'Bar', slug: 'bar', icon: '🍺', color: '#1A56DB', sortOrder: 2 },
    }),
    prisma.venueCategory.upsert({
      where: { slug: 'brewery' },
      update: {},
      create: { name: 'Brewery / Taproom', slug: 'brewery', icon: '🍻', color: '#E02424', sortOrder: 3 },
    }),
    prisma.venueCategory.upsert({
      where: { slug: 'coffee' },
      update: {},
      create: { name: 'Coffee Shop / Café', slug: 'coffee', icon: '☕', color: '#7B3F00', sortOrder: 4 },
    }),
    prisma.venueCategory.upsert({
      where: { slug: 'retail' },
      update: {},
      create: { name: 'Retail Store', slug: 'retail', icon: '🛍️', color: '#059669', sortOrder: 5 },
    }),
    prisma.venueCategory.upsert({
      where: { slug: 'event-venue' },
      update: {},
      create: { name: 'Event Venue', slug: 'event-venue', icon: '🎪', color: '#7C3AED', sortOrder: 6 },
    }),
    prisma.venueCategory.upsert({
      where: { slug: 'other' },
      update: {},
      create: { name: 'Other', slug: 'other', icon: '📍', color: '#6B7280', sortOrder: 7 },
    }),
  ])
  console.log(`✓ ${categories.length} venue categories`)

  // Deal types
  const dealTypes = await Promise.all([
    prisma.dealType.upsert({
      where: { slug: 'happy-hour' },
      update: {},
      create: { name: 'Happy Hour', slug: 'happy-hour', icon: '🍹', color: '#F5C518', sortOrder: 1 },
    }),
    prisma.dealType.upsert({
      where: { slug: 'daily-special' },
      update: {},
      create: { name: 'Daily Special', slug: 'daily-special', icon: '📅', color: '#1A56DB', sortOrder: 2 },
    }),
    prisma.dealType.upsert({
      where: { slug: 'weekend-special' },
      update: {},
      create: { name: 'Weekend Special', slug: 'weekend-special', icon: '🎉', color: '#E02424', sortOrder: 3 },
    }),
    prisma.dealType.upsert({
      where: { slug: 'seasonal' },
      update: {},
      create: { name: 'Seasonal Promotion', slug: 'seasonal', icon: '🌸', color: '#059669', sortOrder: 4 },
    }),
    prisma.dealType.upsert({
      where: { slug: 'event-deal' },
      update: {},
      create: { name: 'Event & Concert Deal', slug: 'event-deal', icon: '🎵', color: '#7C3AED', sortOrder: 5 },
    }),
    prisma.dealType.upsert({
      where: { slug: 'store-sale' },
      update: {},
      create: { name: 'Store Sale', slug: 'store-sale', icon: '🏷️', color: '#E02424', sortOrder: 6 },
    }),
    prisma.dealType.upsert({
      where: { slug: 'limited-time' },
      update: {},
      create: { name: 'Limited-Time Offer', slug: 'limited-time', icon: '⏰', color: '#F59E0B', sortOrder: 7 },
    }),
  ])
  console.log(`✓ ${dealTypes.length} deal types`)

  // Neighborhoods
  const neighborhoods = await Promise.all([
    'Downtown', 'East Hills', 'Eastown', 'Heritage Hill', 'Monroe North',
    'Midtown', 'West Side', 'Creston', 'Belknap Lookout', 'South Hill',
    'Cascade', 'Kentwood', 'Wyoming', 'Grandville', 'Walker',
  ].map((name, i) =>
    prisma.neighborhood.upsert({
      where: { slug: name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        sortOrder: i,
      },
    })
  ))
  console.log(`✓ ${neighborhoods.length} neighborhoods`)

  // Sample venues
  const breweryCat = categories.find((c) => c.slug === 'brewery')!
  const barCat = categories.find((c) => c.slug === 'bar')!
  const restaurantCat = categories.find((c) => c.slug === 'restaurant')!

  const venue1 = await prisma.venue.upsert({
    where: { slug: 'founders-brewing-grand-rapids' },
    update: {},
    create: {
      name: "Founders Brewing Co.",
      slug: 'founders-brewing-grand-rapids',
      description: "Award-winning craft brewery in the heart of Grand Rapids.",
      address: '235 Grandville Ave SW',
      city: 'Grand Rapids',
      state: 'MI',
      zip: '49503',
      phone: '(616) 776-2182',
      website: 'https://foundersbrewing.com',
      latitude: 42.9593,
      longitude: -85.6747,
      neighborhood: 'Downtown',
      verified: true,
      categoryId: breweryCat.id,
    },
  })

  const venue2 = await prisma.venue.upsert({
    where: { slug: 'bartertown-diner' },
    update: {},
    create: {
      name: 'Bartertown Diner',
      slug: 'bartertown-diner',
      description: 'Vegan diner with amazing daily specials.',
      address: '6 Jefferson Ave SE',
      city: 'Grand Rapids',
      state: 'MI',
      zip: '49503',
      latitude: 42.9598,
      longitude: -85.6670,
      neighborhood: 'Downtown',
      verified: true,
      categoryId: restaurantCat.id,
    },
  })

  console.log(`✓ Sample venues created`)

  // Sample deals
  const happyHourType = dealTypes.find((d) => d.slug === 'happy-hour')!
  const dailyType = dealTypes.find((d) => d.slug === 'daily-special')!

  await prisma.deal.upsert({
    where: { slug: 'founders-happy-hour-daily' },
    update: {},
    create: {
      title: 'Founders Happy Hour — $1 Off All Drafts',
      slug: 'founders-happy-hour-daily',
      description: 'Join us Monday–Friday from 3–6pm for $1 off all draft beers at the taproom. Includes all flagship and seasonal selections.',
      venueId: venue1.id,
      categoryId: breweryCat.id,
      dealTypeId: happyHourType.id,
      status: DealStatus.ACTIVE,
      source: DealSource.VENUE_SUBMITTED,
      featured: true,
      activeDays: [1, 2, 3, 4, 5],
      startTime: '15:00',
      endTime: '18:00',
      priceNote: '$1 off all draft pours',
    },
  })

  await prisma.deal.upsert({
    where: { slug: 'bartertown-taco-tuesday' },
    update: {},
    create: {
      title: 'Taco Tuesday — $2 Tacos All Day',
      slug: 'bartertown-taco-tuesday',
      description: 'Every Tuesday at Bartertown: all tacos just $2 each. Vegan, delicious, and affordable.',
      venueId: venue2.id,
      categoryId: restaurantCat.id,
      dealTypeId: dailyType.id,
      status: DealStatus.ACTIVE,
      source: DealSource.VENUE_SUBMITTED,
      activeDays: [2],
      priceNote: '$2 per taco',
    },
  })
  console.log(`✓ Sample deals created`)

  // Site config defaults
  const configs = [
    { key: 'site_title', value: 'GRspecials.com — Grand Rapids Deals & Specials' },
    { key: 'site_description', value: "Grand Rapids' home for restaurant deals, happy hours, bar specials, events, and more." },
    { key: 'hero_headline', value: "Grand Rapids' Best Deals & Specials" },
    { key: 'hero_subline', value: 'Find happy hours, daily specials, events, and sales near you.' },
    { key: 'og_image_url', value: '/images/og-default.jpg' },
    { key: 'gr_center_lat', value: '42.9634' },
    { key: 'gr_center_lng', value: '-85.6681' },
    { key: 'deals_per_page', value: '24' },
    { key: 'featured_slots_homepage', value: '6' },
  ]

  for (const config of configs) {
    await prisma.siteConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    })
  }
  console.log(`✓ ${configs.length} site config entries`)

  // Email templates
  const templates = [
    {
      slug: 'submission-confirmation',
      name: 'Deal Submission Confirmation',
      subject: 'Your deal has been submitted to GRspecials.com',
      html: '<h1>Thanks for your submission!</h1><p>We\'ll review your deal and notify you when it goes live.</p>',
      text: 'Thanks for your submission! We\'ll review your deal and notify you when it goes live.',
    },
    {
      slug: 'deal-approved',
      name: 'Deal Approved',
      subject: 'Your deal is now live on GRspecials.com!',
      html: '<h1>Your deal is live!</h1><p>Congrats — your deal <strong>{{dealTitle}}</strong> is now live on GRspecials.com.</p>',
      text: 'Your deal {{dealTitle}} is now live on GRspecials.com.',
    },
    {
      slug: 'deal-rejected',
      name: 'Deal Rejected',
      subject: 'Update on your GRspecials.com submission',
      html: '<h1>Submission Update</h1><p>Unfortunately we could not approve your deal at this time. Reason: {{reason}}</p>',
      text: 'Unfortunately we could not approve your deal. Reason: {{reason}}',
    },
    {
      slug: 'deal-expiring',
      name: 'Deal Expiring Soon',
      subject: 'Your deal on GRspecials.com expires in 3 days',
      html: '<h1>Your deal is expiring soon</h1><p>Your deal <strong>{{dealTitle}}</strong> expires on {{expiryDate}}. <a href="{{renewUrl}}">Click here to renew it</a>.</p>',
      text: 'Your deal {{dealTitle}} expires on {{expiryDate}}. Renew at {{renewUrl}}',
    },
    {
      slug: 'venue-portal-invite',
      name: 'Venue Portal Invite',
      subject: 'Manage your deals on GRspecials.com',
      html: '<h1>Your venue portal is ready</h1><p>Manage your deals at <a href="{{portalUrl}}">{{portalUrl}}</a></p>',
      text: 'Manage your deals at {{portalUrl}}',
    },
  ]

  for (const t of templates) {
    await prisma.emailTemplate.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    })
  }
  console.log(`✓ ${templates.length} email templates`)

  console.log('\n✅ Seed complete!')
  console.log('   Admin login: admin@grspecials.com / admin123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
