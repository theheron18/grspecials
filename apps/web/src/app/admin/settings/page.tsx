export const dynamic = 'force-dynamic'

import { prisma } from '@grspecials/db'
import { AdminSettings } from '@/components/admin/AdminSettings'

export default async function AdminSettingsPage() {
  const [configs, categories, dealTypes, neighborhoods, templates] = await Promise.all([
    prisma.siteConfig.findMany(),
    prisma.venueCategory.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.dealType.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.neighborhood.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.emailTemplate.findMany({ orderBy: { name: 'asc' } }),
  ])

  const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Site Settings</h1>
        <p className="text-sm text-text-secondary">Configure categories, deal types, content, and SEO defaults.</p>
      </div>
      <AdminSettings
        config={configMap}
        categories={categories}
        dealTypes={dealTypes}
        neighborhoods={neighborhoods}
        templates={templates}
      />
    </div>
  )
}
