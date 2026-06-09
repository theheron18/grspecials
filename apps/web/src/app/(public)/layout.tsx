import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { BottomNav } from '@/components/layout/BottomNav'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="pb-[70px] md:pb-0">{children}</main>
      <SiteFooter />
      <BottomNav />
    </>
  )
}
