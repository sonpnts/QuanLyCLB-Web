import RoleGuard from '@/hocs/RoleGuard'
import DiscountedReceiptsView from '@views/apps/finance/payments/discounts'

const DiscountedReceiptsPage = () => (
  <RoleGuard>
    <DiscountedReceiptsView />
  </RoleGuard>
)

export default DiscountedReceiptsPage
