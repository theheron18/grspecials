import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'yellow'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-brand-blue text-white hover:bg-brand-blue-dark focus-visible:ring-brand-blue/30',
      secondary: 'bg-white text-text-primary border border-surface-border hover:bg-gray-50 focus-visible:ring-gray-200',
      ghost: 'bg-transparent text-text-secondary hover:bg-gray-100 hover:text-text-primary focus-visible:ring-gray-200',
      danger: 'bg-brand-red text-white hover:bg-brand-red-dark focus-visible:ring-brand-red/30',
      yellow: 'bg-brand-yellow text-text-primary hover:bg-brand-yellow-dark focus-visible:ring-brand-yellow/30',
    }
    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2.5',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
