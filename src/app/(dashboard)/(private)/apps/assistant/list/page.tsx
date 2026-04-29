import AssistantList from '@views/apps/assistant/list'
import RoleGuard from '@/hocs/RoleGuard'

const AssistantListPage = () => (
  <RoleGuard>
    <AssistantList />
  </RoleGuard>
)

export default AssistantListPage
