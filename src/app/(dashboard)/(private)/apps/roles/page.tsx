import RoleManagement from '@/views/apps/roles'
import RoleGuard from '@/hocs/RoleGuard'

const RoleManagementPage = () => (
  <RoleGuard>
    <RoleManagement />
  </RoleGuard>
)

export default RoleManagementPage
