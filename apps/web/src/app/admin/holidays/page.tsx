export const dynamic = 'force-dynamic'

import { prisma } from '@grspecials/db'
import { HolidaysAdmin } from '@/components/admin/HolidaysAdmin'

export default async function AdminHolidaysPage() {
  const holidays = await prisma.holiday.findMany({ orderBy: { mmdd: 'asc' } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Holidays</h1>
        <p className="text-sm text-text-secondary">
          Manage holiday dates and tags. These drive the homepage banner and deal tag auto-detection.
          Update variable holidays (Super Bowl, Memorial Day, etc.) each year.
        </p>
      </div>
      <HolidaysAdmin holidays={holidays} />
    </div>
  )
}
