'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'

interface Holiday {
  id: string
  tag: string
  label: string
  mmdd: string
  emoji: string
  drinkFocus: string
  windowDays: number
  active: boolean
}

interface Props {
  holidays: Holiday[]
}

const EMPTY: Omit<Holiday, 'id'> = {
  tag: '',
  label: '',
  mmdd: '',
  emoji: '',
  drinkFocus: '',
  windowDays: 0,
  active: true,
}

export function HolidaysAdmin({ holidays: initial }: Props) {
  const router = useRouter()
  const [holidays, setHolidays] = useState(initial)
  const [editId, setEditId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Omit<Holiday, 'id'>>(EMPTY)
  const [adding, setAdding] = useState(false)
  const [newDraft, setNewDraft] = useState<Omit<Holiday, 'id'>>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  const createHoliday = trpc.holidays.create.useMutation()
  const updateHoliday = trpc.holidays.update.useMutation()
  const deleteHoliday = trpc.holidays.delete.useMutation()

  function startEdit(h: Holiday) {
    setEditId(h.id)
    setEditDraft({ tag: h.tag, label: h.label, mmdd: h.mmdd, emoji: h.emoji, drinkFocus: h.drinkFocus, windowDays: h.windowDays, active: h.active })
    setError(null)
  }

  function cancelEdit() {
    setEditId(null)
    setError(null)
  }

  async function saveEdit(id: string) {
    setError(null)
    try {
      const updated = await updateHoliday.mutateAsync({ id, ...editDraft })
      setHolidays((prev) => prev.map((h) => (h.id === id ? updated : h)))
      setEditId(null)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.')
    }
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return
    setError(null)
    try {
      await deleteHoliday.mutateAsync({ id })
      setHolidays((prev) => prev.filter((h) => h.id !== id))
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete.')
    }
  }

  async function handleAdd() {
    setError(null)
    try {
      const created = await createHoliday.mutateAsync(newDraft)
      setHolidays((prev) => [...prev, created].sort((a, b) => a.mmdd.localeCompare(b.mmdd)))
      setNewDraft(EMPTY)
      setAdding(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create.')
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-card border border-surface-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-bg">
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">MM-DD</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Emoji</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Label</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Tag</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Window</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Active</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted">Drink Focus</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {holidays.map((h) =>
              editId === h.id ? (
                <tr key={h.id} className="bg-brand-yellow/5">
                  <td className="px-3 py-2"><Input value={editDraft.mmdd} onChange={(e) => setEditDraft((d) => ({ ...d, mmdd: e.target.value }))} placeholder="05-28" className="w-20 text-xs" /></td>
                  <td className="px-3 py-2"><Input value={editDraft.emoji} onChange={(e) => setEditDraft((d) => ({ ...d, emoji: e.target.value }))} placeholder="🍔" className="w-14 text-xs" /></td>
                  <td className="px-3 py-2"><Input value={editDraft.label} onChange={(e) => setEditDraft((d) => ({ ...d, label: e.target.value }))} className="w-40 text-xs" /></td>
                  <td className="px-3 py-2"><Input value={editDraft.tag} onChange={(e) => setEditDraft((d) => ({ ...d, tag: e.target.value }))} className="w-40 text-xs font-mono" /></td>
                  <td className="px-3 py-2"><Input type="number" min={0} value={editDraft.windowDays} onChange={(e) => setEditDraft((d) => ({ ...d, windowDays: Number(e.target.value) }))} className="w-16 text-xs" /></td>
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={editDraft.active} onChange={(e) => setEditDraft((d) => ({ ...d, active: e.target.checked }))} className="h-4 w-4 rounded border-gray-300" />
                  </td>
                  <td className="px-3 py-2"><Input value={editDraft.drinkFocus} onChange={(e) => setEditDraft((d) => ({ ...d, drinkFocus: e.target.value }))} className="w-64 text-xs" /></td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => saveEdit(h.id)} className="rounded p-1.5 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
                      <button onClick={cancelEdit} className="rounded p-1.5 text-text-muted hover:bg-gray-100"><X className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={h.id} className={!h.active ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{h.mmdd}</td>
                  <td className="px-4 py-3 text-lg">{h.emoji}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{h.label}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{h.tag}</td>
                  <td className="px-4 py-3 text-text-secondary">{h.windowDays}d</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${h.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {h.active ? 'Active' : 'Off'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted max-w-xs truncate">{h.drinkFocus}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(h)} className="rounded p-1.5 text-text-muted hover:bg-gray-100 hover:text-text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(h.id, h.label)} className="rounded p-1.5 text-text-muted hover:bg-red-50 hover:text-brand-red"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              )
            )}

            {/* Add new row */}
            {adding && (
              <tr className="bg-blue-50/40">
                <td className="px-3 py-2"><Input value={newDraft.mmdd} onChange={(e) => setNewDraft((d) => ({ ...d, mmdd: e.target.value }))} placeholder="05-28" className="w-20 text-xs" /></td>
                <td className="px-3 py-2"><Input value={newDraft.emoji} onChange={(e) => setNewDraft((d) => ({ ...d, emoji: e.target.value }))} placeholder="🍔" className="w-14 text-xs" /></td>
                <td className="px-3 py-2"><Input value={newDraft.label} onChange={(e) => setNewDraft((d) => ({ ...d, label: e.target.value }))} placeholder="Label" className="w-40 text-xs" /></td>
                <td className="px-3 py-2"><Input value={newDraft.tag} onChange={(e) => setNewDraft((d) => ({ ...d, tag: e.target.value }))} placeholder="my-holiday" className="w-40 text-xs font-mono" /></td>
                <td className="px-3 py-2"><Input type="number" min={0} value={newDraft.windowDays} onChange={(e) => setNewDraft((d) => ({ ...d, windowDays: Number(e.target.value) }))} className="w-16 text-xs" /></td>
                <td className="px-3 py-2">
                  <input type="checkbox" checked={newDraft.active} onChange={(e) => setNewDraft((d) => ({ ...d, active: e.target.checked }))} className="h-4 w-4 rounded border-gray-300" defaultChecked />
                </td>
                <td className="px-3 py-2"><Input value={newDraft.drinkFocus} onChange={(e) => setNewDraft((d) => ({ ...d, drinkFocus: e.target.value }))} placeholder="Drink focus description" className="w-64 text-xs" /></td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <button onClick={handleAdd} className="rounded p-1.5 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
                    <button onClick={() => { setAdding(false); setNewDraft(EMPTY) }} className="rounded p-1.5 text-text-muted hover:bg-gray-100"><X className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!adding && (
        <Button onClick={() => setAdding(true)} variant="secondary" size="sm" className="flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Add Holiday
        </Button>
      )}

      <p className="text-xs text-text-muted">
        <strong>Window</strong> = days before/after the exact date the banner also shows (0 = exact date only).
        Variable holidays (Super Bowl, Memorial Day, etc.) need their MM-DD updated each year.
      </p>
    </div>
  )
}
