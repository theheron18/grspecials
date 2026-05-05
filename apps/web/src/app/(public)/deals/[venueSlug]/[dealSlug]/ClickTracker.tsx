'use client'

import { trpc } from '@/lib/trpc/client'
import { Globe, ExternalLink } from 'lucide-react'

interface Props {
  dealId: string
  website: string
}

export function ClickTracker({ dealId, website }: Props) {
  const trackClick = trpc.deals.trackClick.useMutation()

  return (
    <a
      href={website}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackClick.mutate({ dealId })}
      className="flex items-center gap-2 text-brand-blue hover:underline"
    >
      <Globe className="h-4 w-4" />
      Visit website <ExternalLink className="h-3 w-3" />
    </a>
  )
}
