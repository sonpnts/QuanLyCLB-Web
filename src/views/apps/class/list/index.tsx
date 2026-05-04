// MUI Imports
import Grid from '@mui/material/Grid2'

// Type Imports
import type { ClassType } from '@/types/apps/classTypes'

// Component Imports
import ClassListTable from './ClassListTable'

// Data is loaded client-side; classData prop is optional (for server-side future use)
const ClassList = ({ classData }: { classData?: ClassType[] } = {}) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <ClassListTable tableData={classData} />
      </Grid>
    </Grid>
  )
}

export default ClassList
