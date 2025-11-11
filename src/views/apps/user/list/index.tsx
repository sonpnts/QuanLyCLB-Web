// MUI Imports
import Grid from '@mui/material/Grid2'

// Type Imports
import type { UsersType } from '@/types/apps/userTypes'

// Component Imports
import UserManagementTable from './UserManagementTable'

type Props = {
  userData?: UsersType[]
}

const UserList = ({ userData }: Props) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <UserManagementTable tableData={userData} />
      </Grid>
    </Grid>
  )
}

export default UserList
