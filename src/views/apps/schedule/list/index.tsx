// MUI Imports
import Grid from '@mui/material/Grid2'

// Type Imports
import type { ScheduleType } from '@/services/scheduleService'

// Component Imports
import ScheduleListTable from './ScheduleListTable'

const ScheduleList = ({ scheduleData }: { scheduleData?: ScheduleType[] }) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <ScheduleListTable tableData={scheduleData} />
      </Grid>
    </Grid>
  )
}

export default ScheduleList





