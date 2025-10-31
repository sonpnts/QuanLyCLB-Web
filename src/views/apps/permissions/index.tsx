// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'

const PermissionManagement = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Quản lý quyền' />
          <div className='p-5'>
            <Typography>Quản lý quyền đang được phát triển...</Typography>
          </div>
        </Card>
      </Grid>
    </Grid>
  )
}

export default PermissionManagement
