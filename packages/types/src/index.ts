// Re-export Prisma-derived types + add UI-specific shapes

export type {
  User,
  Venue,
  VenueCategory,
  Deal,
  DealType,
  DealPhoto,
  VenuePhoto,
  Neighborhood,
  ScraperSource,
  ScraperRun,
  Notification,
  SiteConfig,
  EmailTemplate,
  UserRole,
  DealStatus,
  DealSource,
  VenueStatus,
  ScraperSourceType,
  ScraperRunStatus,
  NotificationStatus,
  NotificationChannel,
} from '@grspecials/db'

// ─── Deal card (public-facing, joined) ───────────────────────────────────────

export interface DealCard {
  id: string
  title: string
  slug: string
  shortDesc?: string | null
  status: string
  source: string
  featured: boolean
  startTime?: string | null
  endTime?: string | null
  activeDays: number[]
  endDate?: Date | null
  priceNote?: string | null
  views: number
  createdAt: Date
  venue: {
    id: string
    name: string
    slug: string
    address: string
    neighborhood?: string | null
    latitude?: number | null
    longitude?: number | null
    verified: boolean
    logoUrl?: string | null
  }
  category: {
    id: string
    name: string
    slug: string
    icon?: string | null
    color?: string | null
  }
  dealType: {
    id: string
    name: string
    slug: string
    icon?: string | null
    color?: string | null
  }
  photos: { url: string; altText?: string | null }[]
  distance?: number
}

// ─── Deal detail (full page) ──────────────────────────────────────────────────

export interface DealDetail extends DealCard {
  description: string
  neighborhood?: {
    id: string
    name: string
    slug: string
  } | null
  startDate?: Date | null
  originalPrice?: number | null
  discountedPrice?: number | null
  discountPercent?: number | null
  adminNotes?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  ogImageUrl?: string | null
  venue: DealCard['venue'] & {
    phone?: string | null
    website?: string | null
    email?: string | null
    description?: string | null
    logoUrl?: string | null
    coverUrl?: string | null
  }
}

// ─── Venue card ───────────────────────────────────────────────────────────────

export interface VenueCard {
  id: string
  name: string
  slug: string
  address: string
  city: string
  state: string
  neighborhood?: string | null
  latitude?: number | null
  longitude?: number | null
  verified: boolean
  premium: boolean
  logoUrl?: string | null
  category: {
    name: string
    slug: string
    icon?: string | null
  }
  activeDealsCount: number
}

// ─── Filter/search params ─────────────────────────────────────────────────────

export interface DealFilters {
  category?: string
  dealType?: string
  neighborhood?: string
  day?: number
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
  radius?: number
  lat?: number
  lng?: number
  featured?: boolean
  q?: string
  page?: number
  limit?: number
  sort?: 'newest' | 'ending_soon' | 'most_popular' | 'alphabetical'
}

// ─── Submission form ──────────────────────────────────────────────────────────

export interface DealSubmissionInput {
  venueName: string
  venueAddress: string
  categorySlug: string
  dealTitle: string
  dealDescription: string
  dealTypeSlug: string
  validDays: number[]
  startTime?: string
  endTime?: string
  startDate?: string
  endDate?: string
  submitterName?: string
  submitterEmail?: string
  photoUrls?: string[]
  honeypot?: string
}

// ─── Admin stats ──────────────────────────────────────────────────────────────

export interface AdminStats {
  activeDeals: number
  pendingSubmissions: number
  totalVenues: number
  newVenuesThisWeek: number
  scraperSourcesActive: number
  scraperLastRunAt?: Date | null
  scraperSuccessRate?: number
}

// ─── Map pin ──────────────────────────────────────────────────────────────────

export interface MapPin {
  id: string
  lat: number
  lng: number
  title: string
  slug: string
  category: string
  categoryColor: string
  venueName: string
  featured: boolean
}

// ─── Restaurant portal ────────────────────────────────────────────────────────

export interface PortalVenue {
  id: string
  name: string
  slug: string
  address: string
  phone?: string | null
  website?: string | null
  email?: string | null
  logoUrl?: string | null
  verified: boolean
  premium: boolean
  autoApprove: boolean
  category: { name: string; icon?: string | null }
  deals: PortalDeal[]
}

export interface PortalDeal {
  id: string
  title: string
  slug: string
  status: string
  source: string
  featured: boolean
  startTime?: string | null
  endTime?: string | null
  endDate?: Date | null
  views: number
  clicks: number
  photos: { url: string }[]
  dealType: { name: string; icon?: string | null }
}

// ─── Scraper ──────────────────────────────────────────────────────────────────

export interface ParsedDeal {
  title: string
  description: string
  venueName?: string
  dealTypeSuggestion?: string
  startTime?: string
  endTime?: string
  validDays?: number[]
  endDate?: string
  priceNote?: string
  confidence: number
  rawText: string
  sourceUrl: string
}
