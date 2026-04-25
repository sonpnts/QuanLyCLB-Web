import AuditLogList from '@views/apps/audit-log/list'
import RoleGuard from '@/hocs/RoleGuard'

const AuditLogListApp = () => (
  <RoleGuard>
    <AuditLogList />
  </RoleGuard>
)

export default AuditLogListApp
