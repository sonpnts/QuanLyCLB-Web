import RoleGuard from '@/hocs/RoleGuard'
import OneTimeFeeStatusAdminView from '@/views/apps/settings/OneTimeFeeStatusAdminView'

export default function OneTimeFeeStatusesPage() {
  return (
    <RoleGuard>
      <OneTimeFeeStatusAdminView />
    </RoleGuard>
  )
}
