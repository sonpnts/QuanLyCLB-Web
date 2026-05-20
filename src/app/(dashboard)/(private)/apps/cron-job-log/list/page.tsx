import RoleGuard from '@/hocs/RoleGuard'
import CronJobLogListView from '@/views/apps/cron-job-log/list/CronJobLogListView'

export default function CronJobLogPage() {
  return (
    <RoleGuard>
      <CronJobLogListView />
    </RoleGuard>
  )
}
