// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import AttendanceTicketsTable from './AttendanceTicketsTable'

const AttendanceTickets = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <AttendanceTicketsTable />
      </Grid>
    </Grid>
  )
}

export default AttendanceTickets
