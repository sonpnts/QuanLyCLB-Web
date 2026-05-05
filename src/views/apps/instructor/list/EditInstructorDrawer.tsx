'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

// Type & Service Imports
import type { InstructorType, UpdateInstructorRequest } from '@/services/instructorService'
import instructorService from '@/services/instructorService'
import { useNotification } from '@/contexts/notificationContext'
import { logger } from '@/utils/logger'

type Props = {
  open: boolean
  instructor: InstructorType | null
  handleClose: () => void
  onUpdated: (updated: InstructorType) => void
}

type FormValues = {
  fullName: string
  phoneNumber: string
  certification: string
  memberCode: string
}

const EditInstructorDrawer = ({ open, instructor, handleClose, onUpdated }: Props) => {
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotification()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      certification: '',
      memberCode: ''
    }
  })

  // Điền dữ liệu hiện tại khi mở drawer
  useEffect(() => {
    if (instructor && open) {
      reset({
        fullName: instructor.fullName || '',
        phoneNumber: instructor.phoneNumber || '',
        certification: instructor.certification || '',
        memberCode: instructor.memberCode || ''
      })
    }
  }, [instructor, open, reset])

  const handleCloseDrawer = () => {
    reset()
    handleClose()
  }

  const onSubmit = async (formData: FormValues) => {
    if (!instructor) return

    try {
      setLoading(true)

      const payload: UpdateInstructorRequest = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || undefined,
        skillLevelId: null,
        certification: formData.certification || undefined,
        memberCode: formData.memberCode?.trim() || null
      }

      const response = await instructorService.updateInstructor(instructor.id, payload)

      if (response.success && response.data) {
        onUpdated(response.data)
        showNotification(response.message || 'Cập nhật huấn luyện viên thành công.', 'success')
        handleCloseDrawer()
      } else {
        showNotification(response.message || 'Không thể cập nhật huấn luyện viên.', 'error')
      }
    } catch (error) {
      logger.error('EditInstructorDrawer', 'onSubmit', error)
      showNotification('Đã có lỗi khi cập nhật huấn luyện viên.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleCloseDrawer}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 500, md: 600 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Chỉnh sửa huấn luyện viên</Typography>
        <IconButton size='small' onClick={handleCloseDrawer}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />

      {instructor && (
        <Box className='px-5 py-3' sx={{ bgcolor: 'action.hover' }}>
          <Typography variant='body2' color='text.secondary'>
            Email: <strong>{instructor.email || '—'}</strong>
          </Typography>
        </Box>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 p-5'>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='Họ và tên'
              InputLabelProps={{ shrink: true }}
              {...register('fullName', { required: 'Họ và tên là bắt buộc' })}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='Số điện thoại'
              InputLabelProps={{ shrink: true }}
              {...register('phoneNumber')}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label='Chứng chỉ'
              InputLabelProps={{ shrink: true }}
              {...register('certification')}
              placeholder='Ví dụ: ACE, NASM, ACSM'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label='Mã hội viên liên đoàn'
              InputLabelProps={{ shrink: true }}
              {...register('memberCode')}
              placeholder='VD: HV00123'
              helperText='Dùng để tra cứu cấp đai liên đoàn tự động'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant='caption' color='text.secondary'>
                Cấp đai liên đoàn
              </Typography>
              <Chip
                label={instructor?.federationBeltRank || 'Cấp 10 hoặc chuyển mã'}
                size='small'
                sx={{
                  alignSelf: 'flex-start',
                  bgcolor: instructor?.federationBeltLevelColorCode
                    ? `${instructor.federationBeltLevelColorCode}22`
                    : 'action.hover',
                  borderLeft: instructor?.federationBeltLevelColorCode
                    ? `3px solid ${instructor.federationBeltLevelColorCode}`
                    : undefined,
                  fontWeight: instructor?.federationBeltRank ? 600 : 400,
                  color: instructor?.federationBeltLevelColorCode || 'text.secondary'
                }}
              />
              <Typography variant='caption' color='text.disabled'>
                Chỉ đọc — tra cứu từ liên đoàn theo mã hội viên
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box className='flex gap-2 justify-end mt-2'>
          <Button variant='outlined' onClick={handleCloseDrawer} disabled={loading}>
            Hủy
          </Button>
          <Button type='submit' variant='contained' disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </Box>
      </form>
    </Drawer>
  )
}

export default EditInstructorDrawer
