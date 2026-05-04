import { MetadataRoute } from 'next'
import { prisma } from '@grspecials/db'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://grspecials.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [deals, venues, categories, dealTypes] = await Promise.all([
    prisma.deal.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true, updatedAt: true, venue: { select: { slug: true } } },
    }),
    prisma.venue.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
    }),
    prisma.venueCategory.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.dealType.findMany({
      where: { active: true },
      select: { slug: true, updatedAt: true },
    }),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/deals`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/submit-a-deal`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  const dealPages: MetadataRoute.Sitemap = deals.map((d) => ({
    url: `${BASE_URL}/deals/${d.venue.slug}/${d.slug}`,
    lastModified: d.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const venuePages: MetadataRoute.Sitemap = venues.map((v) => ({
    url: `${BASE_URL}/venues/${v.slug}`,
    lastModified: v.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/deals?category=${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  const dealTypePages: MetadataRoute.Sitemap = dealTypes.map((d) => ({
    url: `${BASE_URL}/deals?dealType=${d.slug}`,
    lastModified: d.updatedAt,
    changeFrequency: 'daily',
    priority: 0.6,
  }))

  return [...staticPages, ...dealPages, ...venuePages, ...categoryPages, ...dealTypePages]
}
