// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import AttendanceListTable from './AttendanceListTable'

const AttendanceList = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <AttendanceListTable />
      </Grid>
    </Grid>
  )
}

export default AttendanceList
