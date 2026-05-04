import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role

  if (!session || !['ADMIN', 'EDITOR'].includes(role ?? '')) {
    redirect('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-surface-bg">
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
