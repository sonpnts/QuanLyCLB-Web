'use client'

// React Imports
import { useState } from 'react'

import { useForm } from 'react-hook-form'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'

// Type Imports
import type { InstructorType, CreateInstructorRequest } from '@/services/instructorService'

// Service Imports
import instructorService from '@/services/instructorService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  handleClose: () => void
  instructorData?: InstructorType[]
  setData: (data: InstructorType[]) => void
  setFilteredData: (data: InstructorType[]) => void
}

type FormValidateType = {
  fullName: string
  email: string
  phoneNumber?: string
  skillLevel?: string
  certification?: string
}

const AddInstructorDrawer = (props: Props) => {
  const { open, handleClose, instructorData, setData, setFilteredData } = props

  // States
  const [loading, setLoading] = useState(false)

  // Notification Hook
  const { showNotification } = useNotification()

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormValidateType>({
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      skillLevel: '',
      certification: ''
    }
  })

  // Handle close
  const handleCloseDrawer = () => {
    reset()
    handleClose()
  }

  // Handle submit
  const onSubmit = async (data: FormValidateType) => {
    try {
      setLoading(true)

      const createData: CreateInstructorRequest = {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber || undefined,
        skillLevel: data.skillLevel || undefined,
        certification: data.certification || undefined
      }

      const response = await instructorService.createInstructor(createData)

      if (response.success && response.data) {
        setData([response.data, ...(instructorData || [])])
        setFilteredData([response.data, ...(instructorData || [])])
        showNotification(response.message || 'Tạo huấn luyện viên thành công.', 'success')
        handleCloseDrawer()
      } else {
        showNotification(response.message || 'Không thể tạo huấn luyện viên.', 'error')
      }
    } catch (error) {
      console.error('Error creating instructor:', error)
      showNotification('Đã có lỗi khi tạo huấn luyện viên.', 'error')
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
        <Typography variant='h5'>Thêm huấn luyện viên mới</Typography>
        <IconButton size='small' onClick={handleCloseDrawer}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 p-5'>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='Họ và tên'
              {...register('fullName', { required: 'Họ và tên là bắt buộc' })}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='Email'
              type='email'
              {...register('email', {
                required: 'Email là bắt buộc',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email không hợp lệ'
                }
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='Số điện thoại'
              {...register('phoneNumber')}
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label='Trình độ'
              {...register('skillLevel')}
              error={!!errors.skillLevel}
              helperText={errors.skillLevel?.message}
              placeholder='Ví dụ: Beginner, Intermediate, Advanced'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label='Chứng chỉ'
              {...register('certification')}
              error={!!errors.certification}
              helperText={errors.certification?.message}
              placeholder='Ví dụ: ACE, NASM, ACSM'
            />
          </Grid>
        </Grid>
        <Box className='flex gap-2 justify-end'>
          <Button variant='outlined' onClick={handleCloseDrawer}>
            Hủy
          </Button>
          <Button type='submit' variant='contained' disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo huấn luyện viên'}
          </Button>
        </Box>
      </form>
    </Drawer>
  )
}

export default AddInstructorDrawer





