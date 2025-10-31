// MUI Imports
import Grid from '@mui/material/Grid2'

// Type Imports
import type { BranchType } from '@/services/branchService'

// Component Imports
import BranchListTable from './BranchListTable'

const BranchList = ({ branchData }: { branchData?: BranchType[] }) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <BranchListTable tableData={branchData} />
      </Grid>
    </Grid>
  )
}

export default BranchList





