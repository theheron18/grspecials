'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { trpc } from '@/lib/trpc/client'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { DAY_NAMES_FULL } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'

const schema = z.object({
  venueName: z.string().min(2, 'Required').max(100),
  venueAddress: z.string().min(5, 'Required').max(200),
  categorySlug: z.string().min(1, 'Select a category'),
  dealTitle: z.string().min(5, 'Required — at least 5 characters').max(150),
  dealDescription: z.string().min(20, 'Please describe the deal in at least 20 characters').max(2000),
  dealTypeSlug: z.string().min(1, 'Select a deal type'),
  validDays: z.array(z.number()).min(1, 'Select at least one day'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  endDate: z.string().optional(),
  submitterName: z.string().optional(),
  submitterEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
  honeypot: z.string().max(0),
})

type FormValues = z.infer<typeof schema>

interface SubmitDealFormProps {
  categories: { value: string; label: string }[]
  dealTypes: { value: string; label: string }[]
}

export function SubmitDealForm({ categories, dealTypes }: SubmitDealFormProps) {
  const [success, setSuccess] = useState(false)
  const submit = trpc.submissions.submit.useMutation()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      validDays: [1, 2, 3, 4, 5],
      honeypot: '',
    },
  })

  const validDays = watch('validDays')

  function toggleDay(day: number) {
    const current = validDays ?? []
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
    setValue('validDays', next, { shouldValidate: true })
  }

  async function onSubmit(data: FormValues) {
    try {
      await submit.mutateAsync({
        ...data,
        submitterEmail: data.submitterEmail || undefined,
        validDays: data.validDays,
      })
      setSuccess(true)
    } catch {
      // error shown via mutation state
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <h2 className="text-lg font-semibold text-text-primary">Deal Submitted!</h2>
        <p className="text-text-secondary text-sm">
          Thanks! Our team will review your deal and publish it shortly.
          {watch('submitterEmail') && " We'll email you when it goes live."}
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-2 text-sm text-brand-blue hover:underline"
        >
          Submit another deal
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Honeypot — hidden from real users */}
      <input {...register('honeypot')} type="text" name="website_confirm" tabIndex={-1} className="sr-only" aria-hidden="true" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="Venue / Business Name"
            placeholder="e.g. Founders Brewing Co."
            error={errors.venueName?.message}
            required
            {...register('venueName')}
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Venue Address"
            placeholder="e.g. 235 Grandville Ave SW, Grand Rapids, MI"
            error={errors.venueAddress?.message}
            required
            {...register('venueAddress')}
          />
        </div>
        <Select
          label="Business Category"
          options={[{ value: '', label: 'Select…' }, ...categories]}
          error={errors.categorySlug?.message}
          required
          {...register('categorySlug')}
        />
        <Select
          label="Deal Type"
          options={[{ value: '', label: 'Select…' }, ...dealTypes]}
          error={errors.dealTypeSlug?.message}
          required
          {...register('dealTypeSlug')}
        />
      </div>

      <Input
        label="Deal Title"
        placeholder="e.g. $1 Off All Drafts Happy Hour"
        error={errors.dealTitle?.message}
        required
        {...register('dealTitle')}
      />

      <Textarea
        label="Deal Description"
        placeholder="Describe the deal in detail — what's included, any exclusions, how to redeem it…"
        rows={4}
        error={errors.dealDescription?.message}
        required
        {...register('dealDescription')}
      />

      {/* Valid days */}
      <div>
        <label className="text-sm font-medium text-text-primary block mb-2">
          Valid Days <span className="text-brand-red">*</span>
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {DAY_NAMES_FULL.map((day, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                validDays?.includes(i)
                  ? 'bg-brand-blue border-brand-blue text-white'
                  : 'bg-white border-surface-border text-text-secondary hover:border-brand-blue'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
        {errors.validDays && (
          <p className="mt-1 text-xs text-brand-red">{errors.validDays.message}</p>
        )}
      </div>

      {/* Hours */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start Time (optional)"
          type="time"
          {...register('startTime')}
        />
        <Input
          label="End Time (optional)"
          type="time"
          {...register('endTime')}
        />
      </div>

      <Input
        label="Expiry Date (optional)"
        type="date"
        hint="Leave blank if the deal is ongoing"
        {...register('endDate')}
      />

      <div className="border-t border-surface-border pt-5 space-y-4">
        <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Your Info (optional)</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Your Name"
            placeholder="Jane Smith"
            {...register('submitterName')}
          />
          <Input
            label="Your Email"
            type="email"
            placeholder="jane@example.com"
            hint="We'll notify you when your deal is live"
            error={errors.submitterEmail?.message}
            {...register('submitterEmail')}
          />
        </div>
      </div>

      {submit.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-brand-red">
          {submit.error.message}
        </div>
      )}

      <Button
        type="submit"
        variant="yellow"
        size="lg"
        loading={isSubmitting || submit.isPending}
        className="w-full"
      >
        Submit Deal for Review
      </Button>

      <p className="text-center text-xs text-text-muted">
        All submissions are reviewed before publishing. We typically review within 24 hours.
      </p>
    </form>
  )
}
