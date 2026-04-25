import FinanceSummaryView from '@views/apps/finance/summary'
import RoleGuard from '@/hocs/RoleGuard'

const FinanceSummaryPage = () => (
  <RoleGuard>
    <FinanceSummaryView />
  </RoleGuard>
)

export default FinanceSummaryPage
