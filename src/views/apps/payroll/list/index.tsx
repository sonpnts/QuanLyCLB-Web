// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import PayrollListTable from './PayrollListTable'

const PayrollList = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <PayrollListTable />
      </Grid>
    </Grid>
  )
}

export default PayrollList
