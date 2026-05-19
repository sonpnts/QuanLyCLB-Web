import RoleGuard from '@/hocs/RoleGuard'
import OneTimeFeesView from '@/views/apps/settings/OneTimeFeesView'

export default function OneTimeFeesSettingsPage() {
  return (
    <RoleGuard>
      <OneTimeFeesView />
    </RoleGuard>
  )
}

