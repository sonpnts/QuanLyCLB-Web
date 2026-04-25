import PermissionManagement from '@/views/apps/permissions'
import RoleGuard from '@/hocs/RoleGuard'

const PermissionManagementPage = () => (
  <RoleGuard>
    <PermissionManagement />
  </RoleGuard>
)

export default PermissionManagementPage
