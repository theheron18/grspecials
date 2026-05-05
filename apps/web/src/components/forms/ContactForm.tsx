'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Send, CheckCircle } from 'lucide-react'

export function ContactForm() {
  const send = trpc.contact.send.useMutation()
  const [form, setForm] = useState({ name: '', email: '', message: '', honeypot: '' })
  const [sent, setSent] = useState(false)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await send.mutateAsync(form)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle className="h-10 w-10 text-emerald-500" />
        <h2 className="text-lg font-semibold text-text-primary">Message sent!</h2>
        <p className="text-sm text-text-secondary">We'll get back to you as soon as possible.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        value={form.honeypot}
        onChange={set('honeypot')}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Your Name" required value={form.name} onChange={set('name')} />
        <Input label="Email Address" type="email" required value={form.email} onChange={set('email')} />
      </div>
      <Textarea label="Message" required rows={5} value={form.message} onChange={set('message')} />
      {send.error && (
        <p className="text-sm text-brand-red bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {send.error.message}
        </p>
      )}
      <Button type="submit" loading={send.isPending} icon={<Send className="h-4 w-4" />}>
        Send Message
      </Button>
    </form>
  )
}
