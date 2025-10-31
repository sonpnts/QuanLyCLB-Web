// MUI Imports
import Grid from '@mui/material/Grid2'

// Type Imports
import type { InstructorType } from '@/services/instructorService'

// Component Imports
import InstructorListTable from './InstructorListTable'

const InstructorList = ({ instructorData }: { instructorData?: InstructorType[] }) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <InstructorListTable tableData={instructorData} />
      </Grid>
    </Grid>
  )
}

export default InstructorList





