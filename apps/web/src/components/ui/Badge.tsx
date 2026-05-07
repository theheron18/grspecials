import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  color?: string
  variant?: 'solid' | 'soft'
  className?: string
  size?: 'sm' | 'md'
}

export function Badge({ children, color, variant = 'soft', size = 'md', className }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs font-medium'

  if (color) {
    const style =
      variant === 'solid'
        ? { backgroundColor: color, color: '#fff' }
        : { backgroundColor: `${color}20`, color: color, border: `1px solid ${color}30` }
    return (
      <span
        className={cn('inline-flex items-center gap-1 rounded-full', sizeClass, className)}
        style={style}
      >
        {children}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-gray-100 text-text-secondary',
        sizeClass,
        className,
      )}
    >
      {children}
    </span>
  )
}

export function SourceBadge({ source }: { source: string }) {
  const map: Record<string, { label: string; color: string }> = {
    ADMIN_POSTED: { label: 'Staff Pick', color: '#1A56DB' },
    COMMUNITY_SUBMITTED: { label: 'Community', color: '#059669' },
    VENUE_SUBMITTED: { label: 'Place', color: '#7C3AED' },
    AUTO_SCRAPED: { label: 'Auto-found', color: '#6B7280' },
  }
  const info = map[source] ?? { label: source, color: '#6B7280' }
  return (
    <Badge color={info.color} size="sm">
      {info.label}
    </Badge>
  )
}

export function FeaturedBadge() {
  return (
    <Badge color="#F5C518" variant="solid" size="sm" className="font-semibold">
      ⭐ Featured
    </Badge>
  )
}
