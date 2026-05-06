import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const h = hours % 12 || 12
  return minutes === 0 ? `${h} ${period}` : `${h}:${String(minutes).padStart(2, '0')} ${period}`
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function formatActiveDays(days: number[]): string {
  if (days.length === 7) return 'Every day'
  if (JSON.stringify(days) === JSON.stringify([1, 2, 3, 4, 5])) return 'Mon–Fri'
  if (JSON.stringify(days) === JSON.stringify([0, 6])) return 'Weekends'
  return days.map((d) => DAY_NAMES[d]).join(', ')
}

export function formatDealHours(startTime?: string | null, endTime?: string | null): string {
  if (!startTime && !endTime) return 'All day'
  if (startTime && endTime) return `${formatTime(startTime)}–${formatTime(endTime)}`
  if (startTime) return `From ${formatTime(startTime)}`
  if (endTime) return `Until ${formatTime(endTime)}`
  return ''
}

// Dates are stored as UTC midnight (e.g. "2026-05-05T00:00:00Z").
// Compare UTC date-only strings so neither timezone offset nor time-of-day
// causes a false expiry.
function toUTCDateStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function getExpiryLabel(endDate: Date | null | undefined): {
  label: string
  urgent: boolean
} | null {
  if (!endDate) return null
  const endStr = toUTCDateStr(endDate)
  const todayStr = toUTCDateStr(new Date())
  const tomorrowStr = toUTCDateStr(new Date(Date.now() + 86_400_000))
  if (endStr < todayStr) return { label: 'Expired', urgent: true }
  if (endStr === todayStr) return { label: 'Expires today', urgent: true }
  if (endStr === tomorrowStr) return { label: 'Expires tomorrow', urgent: true }
  const days = Math.round((new Date(endStr).getTime() - new Date(todayStr).getTime()) / 86_400_000)
  if (days <= 7) return { label: `Expires in ${days} days`, urgent: true }
  return { label: `Expires ${format(endDate, 'MMM d')}`, urgent: false }
}

export function formatRelativeDate(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true })
}

export function getDistanceLabel(meters: number): string {
  const miles = meters / 1609.34
  if (miles < 0.1) return 'Here'
  if (miles < 1) return `${(miles * 10).toFixed(0) === '0' ? '<0.1' : (miles).toFixed(1)} mi`
  return `${miles.toFixed(1)} mi`
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}

export function sourceLabel(source: string): string {
  const map: Record<string, string> = {
    ADMIN_POSTED: 'Staff Pick',
    COMMUNITY_SUBMITTED: 'Community',
    VENUE_SUBMITTED: 'Venue',
    AUTO_SCRAPED: 'Auto-found',
  }
  return map[source] ?? source
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}
