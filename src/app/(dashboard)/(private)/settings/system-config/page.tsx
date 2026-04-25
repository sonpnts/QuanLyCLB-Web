import SystemConfigView from '@/views/apps/settings/SystemConfigView'
import RoleGuard from '@/hocs/RoleGuard'

export default function SystemConfigPage() {
  return (
    <RoleGuard>
      <SystemConfigView />
    </RoleGuard>
  )
}
