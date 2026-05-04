'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { MapPin } from 'lucide-react'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type LoginValues = z.infer<typeof schema>

export default function AdminLoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: LoginValues) {
    setError('')
    const res = await signIn('credentials', { ...data, redirect: false })
    if (res?.ok) {
      router.push('/admin/dashboard')
    } else {
      setError('Invalid email or password')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-bg px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-yellow mb-3">
            <MapPin className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-text-primary">GRspecials Admin</h1>
          <p className="text-sm text-text-muted mt-1">Sign in to manage deals & venues</p>
        </div>

        <div className="rounded-card border border-surface-border bg-white p-6 shadow-card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              error={errors.password?.message}
              {...register('password')}
            />
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-brand-red">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
