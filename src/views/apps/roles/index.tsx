// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import RoleManagementTable from './RoleManagementTable'

const RoleManagement = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <RoleManagementTable />
      </Grid>
    </Grid>
  )
}

export default RoleManagement
