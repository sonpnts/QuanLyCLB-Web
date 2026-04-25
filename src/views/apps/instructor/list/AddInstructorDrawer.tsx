'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'

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
import CircularProgress from '@mui/material/CircularProgress'

// Type Imports
import type { InstructorType, CreateInstructorRequest } from '@/services/instructorService'
import type { BeltLevelType } from '@/types/apps/beltExamTypes'

// Service Imports
import instructorService from '@/services/instructorService'
import beltLevelService from '@/services/beltLevelService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'
import { logger } from '@/utils/logger'

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
  skillLevelId?: string
  certification?: string
}

const AddInstructorDrawer = (props: Props) => {
  const { open, handleClose, instructorData, setData, setFilteredData } = props

  const [loading, setLoading] = useState(false)
  const [beltLevels, setBeltLevels] = useState<BeltLevelType[]>([])
  const [beltLevelsLoading, setBeltLevelsLoading] = useState(false)

  const { showNotification } = useNotification()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset
  } = useForm<FormValidateType>({
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      skillLevelId: '',
      certification: ''
    }
  })

  // Load danh sách cấp đai
  useEffect(() => {
    if (!open) return
    const fetchBeltLevels = async () => {
      setBeltLevelsLoading(true)
      try {
        const res = await beltLevelService.getBeltLevels({ pageSize: 100 })
        if (res.success && res.data) {
          setBeltLevels(res.data.filter(b => b.isActive !== false))
        }
      } catch (err) {
        logger.error('AddInstructorDrawer', 'fetchBeltLevels', err)
      } finally {
        setBeltLevelsLoading(false)
      }
    }
    fetchBeltLevels()
  }, [open])

  const handleCloseDrawer = () => {
    reset()
    handleClose()
  }

  const onSubmit = async (data: FormValidateType) => {
    try {
      setLoading(true)

      const createData: CreateInstructorRequest = {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber || undefined,
        skillLevelId: data.skillLevelId || null,
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
      logger.error('AddInstructorDrawer', 'Error creating instructor', error)
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
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='skillLevelId'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label='Cấp đai'
                  disabled={beltLevelsLoading}
                  InputProps={{
                    endAdornment: beltLevelsLoading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : undefined
                  }}
                >
                  <MenuItem value=''>
                    <em>— Chưa xác định —</em>
                  </MenuItem>
                  {[...beltLevels]
                    .sort((a, b) => {
                      if ((a.isDang ?? false) !== (b.isDang ?? false)) return (a.isDang ? 1 : 0) - (b.isDang ? 1 : 0)
                      return (a.order ?? 0) - (b.order ?? 0)
                    })
                    .map(belt => (
                      <MenuItem key={belt.id} value={belt.id}>
                        {belt.name}
                      </MenuItem>
                    ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label='Chứng chỉ'
              {...register('certification')}
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
