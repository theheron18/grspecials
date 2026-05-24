'use client'

import { Share2 } from 'lucide-react'

export function ShareSection({ dealUrl, dealTitle }: { dealUrl: string; dealTitle: string }) {
  const encodedUrl = encodeURIComponent(dealUrl)
  const encodedTitle = encodeURIComponent(dealTitle)

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="flex items-center gap-1.5 text-sm text-text-secondary">
        <Share2 className="h-4 w-4" /> Share:
      </span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-brand-blue hover:text-brand-blue transition-colors"
      >
        𝕏 Twitter
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-brand-blue hover:text-brand-blue transition-colors"
      >
        Facebook
      </a>
      <a
        href={`https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-brand-blue hover:text-brand-blue transition-colors"
      >
        Reddit
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-brand-blue hover:text-brand-blue transition-colors"
      >
        WhatsApp
      </a>
      <a
        href={`sms:?body=${encodedTitle}%20${encodedUrl}`}
        className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-brand-blue hover:text-brand-blue transition-colors"
      >
        Text
      </a>
      <button
        onClick={() => navigator.clipboard.writeText(dealUrl)}
        className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-brand-blue hover:text-brand-blue transition-colors"
      >
        Copy link
      </button>
    </div>
  )
}
