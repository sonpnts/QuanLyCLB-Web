'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Hook & Service Imports
import { useAuth } from '@/contexts/authContext'
import userService from '@/services/userService'

type FormData = {
  fullName: string
  email: string
  phoneNumber: string
  beltLevelName: string
}

const SYSTEM_LOGO = '/images/logos/logo.svg'

const AccountDetails = () => {
  const { auth } = useAuth()

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    beltLevelName:''
  })

  const [imgSrc, setImgSrc] = useState<string>(SYSTEM_LOGO)
  const [loading, setLoading] = useState<boolean>(false)

  // Load chi tiết user từ API khi mở trang
  useEffect(() => {
    if (!auth?.user?.id) return

    let cancelled = false

    const loadUser = async () => {
      try {
        setLoading(true)
        const result = await userService.getUserById(auth.user.id)

        if (cancelled) return

        if (result.success && result.data) {
          const u = result.data

          setFormData({
            fullName: u.fullName || '',
            email: u.email || '',
            phoneNumber: u.phoneNumber || '',
            beltLevelName: auth.user.beltLevelName || ''
          })

          if (u.avatarUrl && u.avatarUrl.trim() !== '') {
            setImgSrc(u.avatarUrl)
          } else {
            setImgSrc(SYSTEM_LOGO)
          }
        } else {
          // Fallback: dùng dữ liệu trong auth context
          setFormData({
            fullName: auth.user.fullName || '',
            email: auth.user.email || '',
            phoneNumber: auth.user.phoneNumber || '',
            beltLevelName: auth.user.beltLevelName|| ''
          })
        }
      } catch {
        if (!cancelled) {
          setFormData({
            fullName: auth.user.fullName || '',
            email: auth.user.email || '',
            phoneNumber: auth.user.phoneNumber || '',
            beltLevelName: auth.user.beltLevelName || ''
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadUser()

    return () => {
      cancelled = true
    }
  }, [auth?.user?.id])

  return (
    <Card>
      <CardContent className='mbe-5'>
        <div className='flex max-sm:flex-col items-center gap-6'>
          <img height={100} width={100} className='rounded' src={imgSrc} alt='Avatar' />
          <div className='flex flex-grow flex-col gap-2'>
            <Typography variant='h6'>{formData.fullName || 'Người dùng'}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Ảnh đại diện được đồng bộ từ tài khoản Google.
            </Typography>
          </div>
        </div>
      </CardContent>
      <CardContent>
        <Alert severity='warning' className='mbe-5' icon={<i className='ri-alert-line' />}>
          Thông tin tài khoản chỉ hiển thị và <strong>không thể tự chỉnh sửa</strong>. Nếu cần cập nhật thông tin, vui
          lòng <strong>liên hệ Admin</strong> để được hỗ trợ.
        </Alert>

        {loading ? (
          <div className='flex items-center justify-center p-6'>
            <CircularProgress size={32} />
          </div>
        ) : (
          <Grid container spacing={5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Họ và tên'
                value={formData.fullName}
                disabled
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label='Email' value={formData.email} disabled InputProps={{ readOnly: true }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Số điện thoại'
                value={formData.phoneNumber || '(chưa cập nhật)'}
                disabled
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Cấp đai / Trình độ'
                value={formData.beltLevelName || '(chưa cập nhật)'}
                disabled
                InputProps={{ readOnly: true }}
              />
            </Grid>
            {/*<Grid size={{ xs: 12 }}>*/}
            {/*  <TextField*/}
            {/*    fullWidth*/}
            {/*    multiline*/}
            {/*    minRows={2}*/}
            {/*    label='Chứng chỉ / Bằng cấp'*/}
            {/*    value={formData.certification || '(chưa cập nhật)'}*/}
            {/*    disabled*/}
            {/*    InputProps={{ readOnly: true }}*/}
            {/*  />*/}
            {/*</Grid>*/}
          </Grid>
        )}
      </CardContent>
    </Card>
  )
}

export default AccountDetails
