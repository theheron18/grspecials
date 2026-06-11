export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { prisma } from '@grspecials/db'
import { formatRelativeDate } from '@/lib/utils'
import { getUpcomingEvents } from '@/lib/eventTags'
import { FileText, Building2, ClipboardList, Bot, AlertCircle, CheckCircle, Clock, CalendarDays } from 'lucide-react'

export default async function AdminDashboard() {
  const staleThreshold = new Date()
  staleThreshold.setDate(staleThreshold.getDate() + 7)

  const [
    activeDeals,
    pendingSubmissions,
    totalVenues,
    scraperSources,
    recentDeals,
    lastScrapeRun,
    staleDeals,
  ] = await Promise.all([
    prisma.deal.count({ where: { status: 'ACTIVE' } }),
    prisma.deal.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.venue.count({ where: { status: 'ACTIVE' } }),
    prisma.scraperSource.count({ where: { active: true } }),
    prisma.deal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { venue: { select: { name: true } }, category: { select: { name: true, icon: true } } },
    }),
    prisma.scraperRun.findFirst({ orderBy: { startedAt: 'desc' } }),
    prisma.deal.findMany({
      where: {
        recheckAt: { lte: staleThreshold },
        status: { notIn: ['EXPIRED', 'ARCHIVED'] },
      },
      orderBy: { recheckAt: 'asc' },
      select: { id: true, title: true, recheckAt: true, venue: { select: { name: true } } },
    }),
  ])

  const upcomingEvents = await getUpcomingEvents(10)

  const stats = [
    { label: 'Active Deals', value: activeDeals, icon: FileText, color: '#1A56DB', href: '/admin/deals' },
    { label: 'Pending Review', value: pendingSubmissions, icon: ClipboardList, color: pendingSubmissions > 0 ? '#F59E0B' : '#059669', href: '/admin/moderation', alert: pendingSubmissions > 0 },
    { label: 'Active Places', value: totalVenues, icon: Building2, color: '#7C3AED', href: '/admin/places' },
    { label: 'Scraper Sources', value: scraperSources, icon: Bot, color: '#6B7280', href: '/admin/scraper' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">GRspecials.com admin overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, href, alert }) => (
          <Link
            key={label}
            href={href}
            className="rounded-card border border-surface-border bg-white p-5 hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: `${color}18` }}
              >
                <Icon className="h-4.5 w-4.5" style={{ color }} />
              </div>
              {alert && (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      {pendingSubmissions > 0 && (
        <div className="rounded-card border border-yellow-200 bg-yellow-50 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
            <p className="text-sm font-medium text-yellow-800">
              {pendingSubmissions} deal{pendingSubmissions > 1 ? 's' : ''} waiting for review
            </p>
          </div>
          <Link
            href="/admin/moderation"
            className="shrink-0 rounded-lg bg-yellow-500 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-yellow-600 transition-colors"
          >
            Review Now
          </Link>
        </div>
      )}

      {/* Stale deals warning */}
      {staleDeals.length > 0 && (
        <div className="rounded-card border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-sm font-semibold text-amber-800">
              {staleDeals.length} deal{staleDeals.length > 1 ? 's' : ''} need{staleDeals.length === 1 ? 's' : ''} a recheck
            </p>
          </div>
          <ul className="divide-y divide-amber-100">
            {staleDeals.map((deal) => (
              <li key={deal.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{deal.title}</p>
                  <p className="text-xs text-text-muted">{deal.venue.name}</p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <span className={`text-xs font-medium ${deal.recheckAt! < new Date() ? 'text-red-600' : 'text-amber-700'}`}>
                    {deal.recheckAt!.toLocaleDateString('en-US', { timeZone: 'America/Detroit', month: 'short', day: 'numeric' })}
                  </span>
                  <Link href={`/admin/deals/${deal.id}`} className="text-xs text-brand-blue hover:underline whitespace-nowrap">
                    Edit →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upcoming holidays & drink days */}
      {upcomingEvents.length > 0 && (
        <div className="rounded-card border border-surface-border bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border bg-surface-bg">
            <CalendarDays className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">Coming Up — Next 10 Days</h2>
            <span className="ml-auto text-xs text-text-muted">Tag your deals before the rush</span>
          </div>
          <div className="divide-y divide-surface-border">
            {upcomingEvents.map((event) => (
              <div key={`${event.tag}-${event.daysAway}`} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl shrink-0">{event.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{event.name}</p>
                  <p className="text-xs text-text-muted">
                    {event.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {' · '}
                    <span className={event.daysAway <= 3 ? 'text-brand-red font-medium' : 'text-text-muted'}>
                      {event.daysAway === 1 ? 'tomorrow' : `${event.daysAway} days away`}
                    </span>
                  </p>
                </div>
                <Link
                  href={`/admin/deals?tag=${event.tag}`}
                  className="shrink-0 text-xs text-brand-blue hover:underline whitespace-nowrap"
                >
                  View tagged deals →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent deals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary">Recent Deals</h2>
          <Link href="/admin/deals" className="text-sm text-brand-blue hover:underline">View all</Link>
        </div>
        <div className="rounded-card border border-surface-border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-bg border-b border-surface-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Deal</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary hidden sm:table-cell">Venue</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary hidden md:table-cell">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {recentDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-surface-bg">
                  <td className="px-4 py-3">
                    <Link href={`/admin/deals/${deal.id}`} className="font-medium text-text-primary hover:text-brand-blue truncate block max-w-xs">
                      {deal.category.icon} {deal.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary hidden sm:table-cell truncate max-w-[180px]">{deal.venue.name}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <StatusPill status={deal.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted text-xs whitespace-nowrap">
                    {formatRelativeDate(deal.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scraper status */}
      <div className="rounded-card border border-surface-border bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-primary">Scraper Status</h2>
          <Link href="/admin/scraper" className="text-sm text-brand-blue hover:underline">Manage</Link>
        </div>
        {lastScrapeRun ? (
          <div className="flex items-center gap-3">
            {lastScrapeRun.status === 'SUCCESS' ? (
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
            ) : lastScrapeRun.status === 'FAILED' ? (
              <AlertCircle className="h-5 w-5 text-brand-red shrink-0" />
            ) : (
              <Clock className="h-5 w-5 text-yellow-500 shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-text-primary">
                Last run: {lastScrapeRun.status}
              </p>
              <p className="text-xs text-text-muted">
                {formatRelativeDate(lastScrapeRun.startedAt)}
                {lastScrapeRun.status !== 'FAILED' && ` · ${scraperSources} active sources`}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-muted">No scraper runs yet. <Link href="/admin/scraper" className="text-brand-blue hover:underline">Add sources →</Link></p>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    ACTIVE: { color: '#059669', label: 'Active' },
    PENDING_REVIEW: { color: '#F59E0B', label: 'Pending' },
    REJECTED: { color: '#E02424', label: 'Rejected' },
    EXPIRED: { color: '#6B7280', label: 'Expired' },
    DRAFT: { color: '#6B7280', label: 'Draft' },
  }
  const info = map[status] ?? { color: '#6B7280', label: status }
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: `${info.color}18`, color: info.color }}
    >
      {info.label}
    </span>
  )
}
