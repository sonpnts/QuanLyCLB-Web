import RoleGuard from '@/hocs/RoleGuard'
import ZnsLogListView from '@/views/apps/zns-log/list'

const ZnsLogListPage = () => (
  <RoleGuard>
    <ZnsLogListView />
  </RoleGuard>
)

export default ZnsLogListPage
