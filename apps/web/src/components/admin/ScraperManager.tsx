'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeDate } from '@/lib/utils'
import { Plus, Trash2, Pause, Play, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'

interface ScraperSource {
  id: string; type: string; url: string; handle?: string | null
  active: boolean; frequency: string; lastRunAt?: Date | null; nextRunAt?: Date | null
  venue?: { id: string; name: string } | null
  runs: { status: string; startedAt: Date; itemsFound: number; itemsQueued: number }[]
}

interface ScraperRun {
  id: string; status: string; startedAt: Date; finishedAt?: Date | null
  itemsFound: number; itemsQueued: number; errorMessage?: string | null
  source: { url: string; type: string }
}

const addSchema = z.object({
  type: z.enum(['FACEBOOK_PAGE', 'INSTAGRAM_ACCOUNT', 'WEBSITE_URL']),
  url: z.string().url('Enter a valid URL'),
  handle: z.string().optional(),
  frequency: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
})

type AddFormValues = z.infer<typeof addSchema>

const TYPE_LABELS: Record<string, string> = {
  FACEBOOK_PAGE: '📘 Facebook Page',
  INSTAGRAM_ACCOUNT: '📸 Instagram',
  WEBSITE_URL: '🌐 Website URL',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  SUCCESS: <CheckCircle className="h-4 w-4 text-green-500" />,
  FAILED: <XCircle className="h-4 w-4 text-brand-red" />,
  RUNNING: <RefreshCw className="h-4 w-4 text-brand-blue animate-spin" />,
  PARTIAL: <Clock className="h-4 w-4 text-yellow-500" />,
}

export function ScraperManager({ sources, recentRuns }: { sources: ScraperSource[]; recentRuns: ScraperRun[] }) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)

  const createSource = trpc.admin.createScraperSource.useMutation()
  const toggleSource = trpc.admin.toggleScraperSource.useMutation()
  const deleteSource = trpc.admin.deleteScraperSource.useMutation()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AddFormValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { type: 'WEBSITE_URL', frequency: 'daily' },
  })

  async function onAdd(data: AddFormValues) {
    await createSource.mutateAsync(data)
    reset()
    setShowAdd(false)
    router.refresh()
  }

  async function handleToggle(id: string, active: boolean) {
    await toggleSource.mutateAsync({ id, active: !active })
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this scraper source and all its run history?')) return
    await deleteSource.mutateAsync({ id })
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Sources table */}
      <div className="rounded-card border border-surface-border bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-sm font-semibold text-text-primary">
            Scraper Sources ({sources.length})
          </h2>
          <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAdd(!showAdd)}>
            Add Source
          </Button>
        </div>

        {/* Add source form */}
        {showAdd && (
          <form onSubmit={handleSubmit(onAdd)} className="p-5 border-b border-surface-border bg-surface-bg space-y-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Add New Source</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Select
                label="Type"
                options={[
                  { value: 'WEBSITE_URL', label: '🌐 Website URL' },
                  { value: 'FACEBOOK_PAGE', label: '📘 Facebook Page' },
                  { value: 'INSTAGRAM_ACCOUNT', label: '📸 Instagram' },
                ]}
                error={errors.type?.message}
                {...register('type')}
              />
              <div className="sm:col-span-2">
                <Input label="URL" type="url" placeholder="https://…" required error={errors.url?.message} {...register('url')} />
              </div>
              <Input label="Handle (optional)" placeholder="@handle or page name" {...register('handle')} />
              <Select
                label="Frequency"
                options={[
                  { value: 'hourly', label: 'Hourly' },
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                ]}
                {...register('frequency')}
              />
              <div className="flex items-end gap-2">
                <Button type="submit" loading={isSubmitting || createSource.isPending} className="flex-1">Add</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </div>
          </form>
        )}

        {sources.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">
            No scraper sources yet. Add a Facebook page, Instagram account, or website URL to get started.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-bg border-b border-surface-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary hidden sm:table-cell">Frequency</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary hidden md:table-cell">Last Run</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary hidden lg:table-cell">Venue</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {sources.map((source) => {
                const lastRun = source.runs[0]
                return (
                  <tr key={source.id} className={`hover:bg-surface-bg ${!source.active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-text-secondary mb-0.5">{TYPE_LABELS[source.type]}</p>
                        <a href={source.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-brand-blue hover:underline truncate block max-w-[200px]">
                          {source.url}
                        </a>
                        {source.handle && <p className="text-xs text-text-muted">{source.handle}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary hidden sm:table-cell capitalize">{source.frequency}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {lastRun ? (
                        <div className="flex items-center gap-1.5">
                          {STATUS_ICONS[lastRun.status]}
                          <div>
                            <p className="text-xs text-text-primary">{lastRun.status}</p>
                            <p className="text-xs text-text-muted">{formatRelativeDate(lastRun.startedAt)}</p>
                            {lastRun.itemsFound > 0 && (
                              <p className="text-xs text-text-muted">{lastRun.itemsFound} found · {lastRun.itemsQueued} queued</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">Never run</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary hidden lg:table-cell">
                      {source.venue?.name ?? <span className="text-text-muted">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(source.id, source.active)}
                          className="text-text-muted hover:text-text-primary transition-colors"
                          title={source.active ? 'Pause' : 'Resume'}
                        >
                          {source.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(source.id)}
                          className="text-text-muted hover:text-brand-red transition-colors"
                          title="Delete source"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent run logs */}
      <div className="rounded-card border border-surface-border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border">
          <h2 className="text-sm font-semibold text-text-primary">Recent Run Logs</h2>
        </div>
        {recentRuns.length === 0 ? (
          <div className="py-8 text-center text-text-muted text-sm">No runs yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-bg border-b border-surface-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary hidden sm:table-cell">Found</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary hidden sm:table-cell">Queued</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {recentRuns.map((run) => (
                <tr key={run.id} className="hover:bg-surface-bg">
                  <td className="px-4 py-2.5">
                    <p className="text-xs text-text-secondary">{TYPE_LABELS[run.source.type]}</p>
                    <a href={run.source.url} target="_blank" className="text-xs text-brand-blue hover:underline truncate block max-w-[200px]">
                      {run.source.url}
                    </a>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {STATUS_ICONS[run.status]}
                      <span className="text-xs">{run.status}</span>
                    </div>
                    {run.errorMessage && (
                      <p className="text-xs text-brand-red mt-0.5 truncate max-w-[200px]" title={run.errorMessage}>
                        {run.errorMessage}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-text-secondary hidden sm:table-cell">{run.itemsFound}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-text-secondary hidden sm:table-cell">{run.itemsQueued}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-text-muted whitespace-nowrap">{formatRelativeDate(run.startedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
