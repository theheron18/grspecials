'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeDate } from '@/lib/utils'
import { Bell, Mail, Send } from 'lucide-react'

interface Notification {
  id: string; title: string; body: string; channel: string; status: string
  scheduledAt?: Date | null; sentAt?: Date | null; recipientCount: number; openCount: number
  createdAt: Date
}
interface Category { id: string; name: string; icon?: string | null }
interface Neighborhood { id: string; name: string }

interface Props {
  notifications: Notification[]
  categories: Category[]
  neighborhoods: Neighborhood[]
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#6B7280',
  SCHEDULED: '#F59E0B',
  SENT: '#059669',
  FAILED: '#E02424',
}

export function NotificationsPanel({ notifications, categories, neighborhoods }: Props) {
  const [form, setForm] = useState({ title: '', body: '', channel: 'PUSH', scheduledAt: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  // Note: real implementation would call a tRPC mutation to create/send the notification
  async function handleSend() {
    setSending(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSending(false)
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Compose */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-card border border-surface-border bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Compose Notification</h2>

          <Select
            label="Channel"
            options={[
              { value: 'PUSH', label: '🔔 Push Notification' },
              { value: 'EMAIL', label: '✉️ Email Digest' },
              { value: 'BOTH', label: '📣 Both' },
            ]}
            value={form.channel}
            onChange={(e) => setForm({ ...form, channel: e.target.value })}
          />

          <Input
            label="Title"
            required
            placeholder="🍺 Happy Hour Alert!"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <Textarea
            label="Body"
            required
            rows={4}
            placeholder="3 new happy hour deals just added near you…"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />

          <Input
            label="Schedule (optional)"
            type="datetime-local"
            hint="Leave blank to send immediately"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
          />

          <div className="border-t border-surface-border pt-4 space-y-2">
            <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Target Audience</p>
            <p className="text-xs text-text-secondary">
              Optionally filter by category or neighborhood preferences. Leave blank to send to all subscribers.
            </p>
          </div>

          {sent && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
              ✓ Notification queued for delivery!
            </div>
          )}

          <Button
            className="w-full"
            icon={<Send className="h-4 w-4" />}
            disabled={!form.title || !form.body}
            loading={sending}
            onClick={handleSend}
          >
            {form.scheduledAt ? 'Schedule' : 'Send Now'}
          </Button>
        </div>
      </div>

      {/* History */}
      <div className="lg:col-span-3">
        <div className="rounded-card border border-surface-border bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border">
            <h2 className="text-sm font-semibold text-text-primary">Notification History</h2>
          </div>

          {notifications.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-sm">No notifications sent yet.</div>
          ) : (
            <div className="divide-y divide-surface-border">
              {notifications.map((n) => (
                <div key={n.id} className="px-5 py-4 hover:bg-surface-bg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">
                        {n.channel === 'EMAIL' ? (
                          <Mail className="h-4 w-4 text-text-muted" />
                        ) : (
                          <Bell className="h-4 w-4 text-text-muted" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{n.title}</p>
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{n.body}</p>
                        {n.status === 'SENT' && (
                          <p className="text-xs text-text-muted mt-1">
                            {n.recipientCount} recipients · {n.openCount} opens
                            {n.openCount > 0 && n.recipientCount > 0 &&
                              ` (${Math.round((n.openCount / n.recipientCount) * 100)}%)`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right space-y-1">
                      <Badge color={STATUS_COLORS[n.status]} size="sm">{n.status}</Badge>
                      <p className="text-xs text-text-muted">
                        {n.sentAt ? formatRelativeDate(n.sentAt) : formatRelativeDate(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
