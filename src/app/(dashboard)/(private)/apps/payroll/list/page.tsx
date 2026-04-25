import PayrollList from '@views/apps/payroll/list'
import RoleGuard from '@/hocs/RoleGuard'

const PayrollListApp = () => (
  <RoleGuard>
    <PayrollList />
  </RoleGuard>
)

export default PayrollListApp
