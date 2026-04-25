import UserList from '@views/apps/user/list'
import RoleGuard from '@/hocs/RoleGuard'

const UserListApp = () => (
  <RoleGuard>
    <UserList />
  </RoleGuard>
)

export default UserListApp
