import { prisma } from '@grspecials/db'
import Link from 'next/link'
import { Eye, MousePointerClick, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  const [topByViews, topByClicks, totals] = await Promise.all([
    prisma.deal.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { views: 'desc' },
      take: 10,
      select: {
        id: true, title: true, slug: true, views: true, clicks: true,
        venue: { select: { name: true, slug: true } },
        category: { select: { icon: true } },
      },
    }),
    prisma.deal.findMany({
      where: { status: 'ACTIVE', clicks: { gt: 0 } },
      orderBy: { clicks: 'desc' },
      take: 10,
      select: {
        id: true, title: true, slug: true, views: true, clicks: true,
        venue: { select: { name: true, slug: true } },
        category: { select: { icon: true } },
      },
    }),
    prisma.deal.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { views: true, clicks: true },
      _count: { id: true },
    }),
  ])

  const totalViews = totals._sum.views ?? 0
  const totalClicks = totals._sum.clicks ?? 0
  const totalDeals = totals._count.id
  const overallRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '—'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-text-secondary text-sm mt-1">Deal performance across all active listings</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Deals" value={totalDeals.toLocaleString()} color="#1A56DB" icon={TrendingUp} />
        <StatCard label="Total Views" value={totalViews.toLocaleString()} color="#059669" icon={Eye} />
        <StatCard label="Website Clicks" value={totalClicks.toLocaleString()} color="#7C3AED" icon={MousePointerClick} />
        <StatCard
          label="Overall Click Rate"
          value={overallRate === '—' ? '—' : `${overallRate}%`}
          color="#F59E0B"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top by views */}
        <LeaderboardTable
          title="Top Deals by Views"
          icon={<Eye className="h-4 w-4 text-text-muted" />}
          deals={topByViews}
          primaryKey="views"
          secondaryKey="clicks"
          primaryLabel="Views"
          secondaryLabel="Clicks"
        />

        {/* Top by clicks */}
        <LeaderboardTable
          title="Top Deals by Website Clicks"
          icon={<MousePointerClick className="h-4 w-4 text-text-muted" />}
          deals={topByClicks}
          primaryKey="clicks"
          secondaryKey="views"
          primaryLabel="Clicks"
          secondaryLabel="Views"
          emptyMessage="No clicks recorded yet. Clicks are tracked when visitors tap 'Visit website' on a deal page."
        />
      </div>
    </div>
  )
}

function StatCard({
  label, value, color, icon: Icon,
}: {
  label: string
  value: string
  color: string
  icon: React.ElementType
}) {
  return (
    <div className="rounded-card border border-surface-border bg-white p-5">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg mb-3"
        style={{ background: `${color}18` }}
      >
        <Icon className="h-4.5 w-4.5" style={{ color }} />
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-secondary mt-0.5">{label}</p>
    </div>
  )
}

type DealRow = {
  id: string
  title: string
  slug: string
  views: number
  clicks: number
  venue: { name: string; slug: string }
  category: { icon: string | null }
}

function LeaderboardTable({
  title, icon, deals, primaryKey, secondaryKey, primaryLabel, secondaryLabel, emptyMessage,
}: {
  title: string
  icon: React.ReactNode
  deals: DealRow[]
  primaryKey: 'views' | 'clicks'
  secondaryKey: 'views' | 'clicks'
  primaryLabel: string
  secondaryLabel: string
  emptyMessage?: string
}) {
  return (
    <div className="rounded-card border border-surface-border bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border bg-surface-bg">
        {icon}
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      {deals.length === 0 ? (
        <p className="px-4 py-6 text-sm text-text-muted text-center">
          {emptyMessage ?? 'No data yet.'}
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead className="border-b border-surface-border">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary">#</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-text-secondary">Deal</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-text-secondary">{primaryLabel}</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-text-secondary hidden sm:table-cell">{secondaryLabel}</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-text-secondary hidden sm:table-cell">Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {deals.map((deal, i) => {
              const rate = deal.views > 0 ? ((deal.clicks / deal.views) * 100).toFixed(1) + '%' : '—'
              return (
                <tr key={deal.id} className="hover:bg-surface-bg">
                  <td className="px-4 py-2.5 text-xs text-text-muted font-mono">{i + 1}</td>
                  <td className="px-4 py-2.5 max-w-[160px]">
                    <Link
                      href={`/admin/deals/${deal.id}`}
                      className="font-medium text-text-primary hover:text-brand-blue truncate block"
                    >
                      {deal.category.icon} {deal.title}
                    </Link>
                    <p className="text-xs text-text-muted truncate">{deal.venue.name}</p>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-text-primary">
                    {deal[primaryKey].toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-muted hidden sm:table-cell">
                    {deal[secondaryKey].toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right text-text-muted hidden sm:table-cell">{rate}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
