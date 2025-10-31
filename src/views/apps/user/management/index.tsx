// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import UserManagementTable from '../list/UserManagementTable'

const UserManagement = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <UserManagementTable />
      </Grid>
    </Grid>
  )
}

export default UserManagement





