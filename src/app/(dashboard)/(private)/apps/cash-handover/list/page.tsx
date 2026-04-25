import CashHandoverList from '@views/apps/cash-handover/list'
import RoleGuard from '@/hocs/RoleGuard'

const CashHandoverListPage = () => (
  <RoleGuard>
    <CashHandoverList />
  </RoleGuard>
)

export default CashHandoverListPage
