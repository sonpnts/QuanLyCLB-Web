'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'

// Hooks
import { useAuth } from '@/contexts/authContext'

const Connections = () => {
  const { auth } = useAuth()
  const [open, setOpen] = useState(false)

  const googleEmail = auth?.user?.email || ''

  return (
    <>
      <Card>
        <Grid container>
          <Grid size={{ xs: 12 }}>
            <CardHeader
              title='Tài khoản liên kết'
              subheader='Tài khoản đăng nhập đang được liên kết với hệ thống'
            />
            <CardContent className='flex flex-col gap-4'>
              <div className='flex items-center justify-between gap-4 p-4 border rounded'>
                <div className='flex flex-grow items-center gap-4'>
                  <img height={40} width={40} src='/images/logos/google.png' alt='Google' />
                  <div className='flex-grow'>
                    <div className='flex items-center gap-2'>
                      <Typography className='font-medium' color='text.primary'>
                        Google
                      </Typography>
                      <Chip size='small' color='success' label='Đã liên kết' />
                    </div>
                    <Typography variant='body2' color='text.secondary'>
                      {googleEmail || 'Tài khoản Google của bạn'}
                    </Typography>
                  </div>
                </div>
                <Button variant='outlined' color='primary' onClick={() => setOpen(true)}>
                  Đổi tài khoản Google
                </Button>
              </div>

              <Alert severity='info' icon={<i className='ri-information-line' />}>
                Hệ thống chỉ hỗ trợ đăng nhập bằng tài khoản Google đã được Admin cấp.
                Để thay đổi địa chỉ Google liên kết, vui lòng liên hệ Admin.
              </Alert>
            </CardContent>
          </Grid>
        </Grid>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Yêu cầu đổi tài khoản Google</DialogTitle>
        <DialogContent>
          <DialogContentText component='div'>
            <Typography paragraph>
              Vì lý do bảo mật, tài khoản Google liên kết với hệ thống không thể tự thay đổi.
            </Typography>
            <Typography paragraph>
              Vui lòng <strong>liên hệ Admin</strong> để được hỗ trợ thay đổi địa chỉ Google liên kết với
              tài khoản của bạn.
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Tài khoản hiện đang liên kết: <strong>{googleEmail || '(chưa xác định)'}</strong>
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} variant='contained'>
            Đã hiểu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Connections
