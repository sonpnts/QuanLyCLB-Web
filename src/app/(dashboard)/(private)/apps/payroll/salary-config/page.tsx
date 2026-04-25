import InstructorClassSalaryView from '@/views/apps/payroll/salary-config/InstructorClassSalaryView'
import RoleGuard from '@/hocs/RoleGuard'

export default function InstructorClassSalaryPage() {
  return (
    <RoleGuard>
      <InstructorClassSalaryView />
    </RoleGuard>
  )
}
