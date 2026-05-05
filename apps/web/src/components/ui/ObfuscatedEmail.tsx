'use client'

interface Props {
  user: string
  domain: string
  className?: string
  children?: React.ReactNode
}

export function ObfuscatedEmail({ user, domain, className, children }: Props) {
  const address = `${user}@${domain}`
  return (
    <a href={`mailto:${address}`} className={className}>
      {children ?? address}
    </a>
  )
}
