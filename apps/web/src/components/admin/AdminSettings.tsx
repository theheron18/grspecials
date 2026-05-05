'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Plus, Trash2, GripVertical, Save } from 'lucide-react'

interface Category { id: string; name: string; slug: string; icon?: string | null; color?: string | null; active: boolean; sortOrder: number }
interface DealType { id: string; name: string; slug: string; icon?: string | null; color?: string | null; active: boolean; sortOrder: number }
interface Neighborhood { id: string; name: string; slug: string }
interface EmailTemplate { slug: string; name: string; subject: string; html: string }

interface Props {
  config: Record<string, string>
  categories: Category[]
  dealTypes: DealType[]
  neighborhoods: Neighborhood[]
  templates: EmailTemplate[]
}

type SettingsTab = 'site' | 'pages' | 'categories' | 'deal-types' | 'neighborhoods' | 'templates'

export function AdminSettings({ config, categories, dealTypes, neighborhoods, templates }: Props) {
  const [tab, setTab] = useState<SettingsTab>('site')

  const TABS: [SettingsTab, string][] = [
    ['site', 'Site Content'],
    ['pages', 'Pages'],
    ['categories', 'Categories'],
    ['deal-types', 'Deal Types'],
    ['neighborhoods', 'Neighborhoods'],
    ['templates', 'Email Templates'],
  ]

  return (
    <div className="space-y-4">
      {/* Tab nav */}
      <div className="flex border-b border-surface-border overflow-x-auto scrollbar-hide">
        {TABS.map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t ? 'border-brand-blue text-brand-blue' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'site' && <SiteContentTab config={config} />}
      {tab === 'pages' && <PagesTab config={config} />}
      {tab === 'categories' && <TaxonomyTab items={categories} type="category" />}
      {tab === 'deal-types' && <TaxonomyTab items={dealTypes} type="dealType" />}
      {tab === 'neighborhoods' && <NeighborhoodsTab neighborhoods={neighborhoods} />}
      {tab === 'templates' && <EmailTemplatesTab templates={templates} />}
    </div>
  )
}

function SiteContentTab({ config }: { config: Record<string, string> }) {
  const router = useRouter()
  const setConfig = trpc.admin.setConfig.useMutation()
  const [values, setValues] = useState({ ...config })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const FIELDS: { key: string; label: string; multiline?: boolean }[] = [
    { key: 'site_title', label: 'Site Title (meta)' },
    { key: 'site_description', label: 'Site Description (meta)', multiline: true },
    { key: 'hero_headline', label: 'Homepage Hero Headline' },
    { key: 'hero_subline', label: 'Homepage Hero Sub-headline' },
    { key: 'gr_center_lat', label: 'Map Center Latitude (default)' },
    { key: 'gr_center_lng', label: 'Map Center Longitude (default)' },
    { key: 'deals_per_page', label: 'Deals Per Page' },
    { key: 'featured_slots_homepage', label: 'Featured Deal Slots (homepage)' },
  ]

  async function save() {
    setError(null)
    try {
      for (const [key, value] of Object.entries(values)) {
        if (value !== config[key]) {
          await setConfig.mutateAsync({ key, value })
        }
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save. Are you logged in as admin?')
    }
  }

  return (
    <div className="rounded-card border border-surface-border bg-white p-5 space-y-4">
      {FIELDS.map(({ key, label, multiline }) => (
        <div key={key}>
          <label className="text-sm font-medium text-text-primary block mb-1.5">{label}</label>
          {multiline ? (
            <textarea
              value={values[key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              rows={3}
              className="form-input resize-none"
            />
          ) : (
            <input
              value={values[key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              className="form-input"
            />
          )}
        </div>
      ))}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      <Button onClick={save} loading={setConfig.isPending} icon={<Save className="h-4 w-4" />}>
        {saved ? '✓ Saved!' : 'Save Changes'}
      </Button>
    </div>
  )
}

function TaxonomyTab({ items, type }: { items: (Category | DealType)[]; type: 'category' | 'dealType' }) {
  const router = useRouter()
  const createCat = trpc.admin.createCategory.useMutation()
  const updateCat = trpc.admin.updateCategory.useMutation()
  const createDT = trpc.admin.createDealType.useMutation()
  const updateDT = trpc.admin.updateDealType.useMutation()

  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [newColor, setNewColor] = useState('#F5C518')

  async function handleCreate() {
    if (!newName || !newSlug) return
    if (type === 'category') {
      await createCat.mutateAsync({ name: newName, slug: newSlug, icon: newIcon || undefined, color: newColor })
    } else {
      await createDT.mutateAsync({ name: newName, slug: newSlug, icon: newIcon || undefined, color: newColor })
    }
    setNewName(''); setNewSlug(''); setNewIcon('')
    router.refresh()
  }

  async function toggleActive(id: string, active: boolean) {
    if (type === 'category') await updateCat.mutateAsync({ id, active: !active })
    else await updateDT.mutateAsync({ id, active: !active })
    router.refresh()
  }

  return (
    <div className="rounded-card border border-surface-border bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-bg border-b border-surface-border">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Name</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Slug</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Icon</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Color</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary">Active</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-surface-bg">
              <td className="px-4 py-2.5 font-medium text-text-primary">{item.name}</td>
              <td className="px-4 py-2.5 text-text-muted text-xs font-mono">{item.slug}</td>
              <td className="px-4 py-2.5 text-lg">{item.icon}</td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-full border border-surface-border" style={{ background: item.color ?? '#ccc' }} />
                  <span className="text-xs text-text-muted">{item.color}</span>
                </div>
              </td>
              <td className="px-4 py-2.5 text-center">
                <button onClick={() => toggleActive(item.id, item.active)}
                  className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${
                    item.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                  {item.active ? 'Active' : 'Hidden'}
                </button>
              </td>
            </tr>
          ))}
          {/* Add new row */}
          <tr className="bg-surface-bg">
            <td className="px-4 py-2.5"><input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="form-input text-xs py-1.5" /></td>
            <td className="px-4 py-2.5"><input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="slug-here" className="form-input text-xs py-1.5 font-mono" /></td>
            <td className="px-4 py-2.5"><input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="🏷️" className="form-input text-xs py-1.5 w-16" /></td>
            <td className="px-4 py-2.5"><input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-8 w-16 rounded cursor-pointer border border-surface-border" /></td>
            <td className="px-4 py-2.5 text-center">
              <Button size="sm" onClick={handleCreate} loading={createCat.isPending || createDT.isPending}
                icon={<Plus className="h-3.5 w-3.5" />} disabled={!newName || !newSlug}>
                Add
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function NeighborhoodsTab({ neighborhoods }: { neighborhoods: Neighborhood[] }) {
  const router = useRouter()
  const create = trpc.admin.createNeighborhood.useMutation()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  async function handleAdd() {
    if (!name || !slug) return
    await create.mutateAsync({ name, slug })
    setName(''); setSlug('')
    router.refresh()
  }

  return (
    <div className="rounded-card border border-surface-border bg-white p-5 space-y-4">
      <div className="flex flex-wrap gap-2">
        {neighborhoods.map((n) => (
          <span key={n.id} className="rounded-full border border-surface-border bg-surface-bg px-3 py-1 text-sm">
            {n.name}
          </span>
        ))}
      </div>
      <div className="flex gap-2 pt-2 border-t border-surface-border">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Neighborhood name" className="form-input flex-1" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug" className="form-input w-32 font-mono text-xs" />
        <Button size="sm" onClick={handleAdd} loading={create.isPending} icon={<Plus className="h-3.5 w-3.5" />}>
          Add
        </Button>
      </div>
    </div>
  )
}

function PagesTab({ config }: { config: Record<string, string> }) {
  const router = useRouter()
  const setConfig = trpc.admin.setConfig.useMutation()
  const [values, setValues] = useState({ ...config })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const PAGES: { key: string; label: string; hint: string }[] = [
    { key: 'page_about', label: 'About Page', hint: 'Shown at /about' },
    { key: 'page_privacy', label: 'Privacy Policy', hint: 'Shown at /privacy' },
    { key: 'page_terms', label: 'Terms of Service', hint: 'Shown at /terms' },
  ]

  async function save() {
    setError(null)
    try {
      for (const { key } of PAGES) {
        if (values[key] !== config[key]) {
          await setConfig.mutateAsync({ key, value: values[key] ?? '' })
        }
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.')
    }
  }

  return (
    <div className="rounded-card border border-surface-border bg-white p-5 space-y-6">
      <p className="text-sm text-text-muted">Plain text. Line breaks are preserved. Leave blank to show the built-in default content.</p>
      {PAGES.map(({ key, label, hint }) => (
        <div key={key}>
          <label className="text-sm font-medium text-text-primary block mb-0.5">{label}</label>
          <p className="text-xs text-text-muted mb-1.5">{hint}</p>
          <textarea
            value={values[key] ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
            rows={8}
            className="form-input resize-y text-sm"
          />
        </div>
      ))}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      <Button onClick={save} loading={setConfig.isPending} icon={<Save className="h-4 w-4" />}>
        {saved ? '✓ Saved!' : 'Save Changes'}
      </Button>
    </div>
  )
}

function EmailTemplatesTab({ templates }: { templates: EmailTemplate[] }) {
  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const updateTemplate = trpc.admin.updateTemplate.useMutation()

  async function handleSave() {
    if (!editing) return
    await updateTemplate.mutateAsync({
      slug: editing.slug,
      subject: editing.subject,
      html: editing.html,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-1">
        {templates.map((t) => (
          <button
            key={t.slug}
            onClick={() => setEditing({ ...t })}
            className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
              editing?.slug === t.slug ? 'bg-brand-blue/10 text-brand-blue font-medium' : 'hover:bg-surface-bg text-text-secondary'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {editing && (
        <div className="lg:col-span-2 rounded-card border border-surface-border bg-white p-5 space-y-4">
          <h3 className="font-semibold text-text-primary text-sm">{editing.name}</h3>
          <Input
            label="Subject"
            value={editing.subject}
            onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
          />
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">HTML Body</label>
            <p className="text-xs text-text-muted mb-2">Use {`{{variable}}`} for dynamic content (dealTitle, reason, portalUrl, etc.)</p>
            <textarea
              value={editing.html}
              onChange={(e) => setEditing({ ...editing, html: e.target.value })}
              rows={10}
              className="form-input font-mono text-xs resize-y"
            />
          </div>
          <Button onClick={handleSave} loading={updateTemplate.isPending} icon={<Save className="h-4 w-4" />}>
            {saved ? '✓ Saved!' : 'Save Template'}
          </Button>
        </div>
      )}
    </div>
  )
}
