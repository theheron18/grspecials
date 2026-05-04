import type { Metadata } from 'next'
import type { DealDetail, VenueCard } from '@grspecials/types'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://grspecials.com'
const SITE_NAME = 'GRspecials.com'

export function buildMeta(overrides: Partial<Metadata> = {}): Metadata {
  const defaults: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
      default: "GRspecials.com — Grand Rapids Deals & Specials",
      template: `%s | ${SITE_NAME}`,
    },
    description:
      "Grand Rapids' home for restaurant deals, happy hours, bar specials, brewery events, retail sales, and more. Updated daily.",
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_US',
      images: [{ url: '/images/og-default.jpg', width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@GRspecials',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    alternates: { canonical: BASE_URL },
  }

  return { ...defaults, ...overrides }
}

export function dealJsonLd(deal: DealDetail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: deal.title,
    description: deal.description,
    url: `${BASE_URL}/deals/${deal.venue.slug}/${deal.slug}`,
    priceCurrency: 'USD',
    price: deal.discountedPrice?.toString(),
    availability: 'https://schema.org/InStock',
    validFrom: deal.startDate?.toISOString(),
    priceValidUntil: deal.endDate?.toISOString(),
    seller: {
      '@type': 'LocalBusiness',
      name: deal.venue.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: deal.venue.address,
        addressLocality: 'Grand Rapids',
        addressRegion: 'MI',
        addressCountry: 'US',
      },
      telephone: deal.venue.phone,
      url: deal.venue.website,
    },
  }
}

export function venueJsonLd(venue: VenueCard & { phone?: string; website?: string; description?: string; zip?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: venue.name,
    description: venue.description,
    url: venue.website,
    telephone: venue.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: venue.address,
      addressLocality: venue.city,
      addressRegion: venue.state,
      postalCode: venue.zip,
      addressCountry: 'US',
    },
    geo: venue.latitude && venue.longitude
      ? { '@type': 'GeoCoordinates', latitude: venue.latitude, longitude: venue.longitude }
      : undefined,
    image: venue.logoUrl,
  }
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  }
}
