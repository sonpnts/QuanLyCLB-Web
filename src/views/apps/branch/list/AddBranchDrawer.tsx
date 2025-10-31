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
import type { BranchType, CreateBranchRequest } from '@/services/branchService'

// Service Imports
import branchService from '@/services/branchService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  handleClose: () => void
  branchData?: BranchType[]
  setData: (data: BranchType[]) => void
  setFilteredData: (data: BranchType[]) => void
}

type FormValidateType = {
  name: string
  address?: string
  latitude: number
  longitude: number
  allowedRadiusMeters: number
  googleMapsEmbedUrl?: string
}

const AddBranchDrawer = (props: Props) => {
  const { open, handleClose, branchData, setData, setFilteredData } = props

  // States
  const [loading, setLoading] = useState(false)

  // Notification Hook
  const { showNotification } = useNotification()

  // Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<FormValidateType>({
    defaultValues: {
      name: '',
      address: '',
      latitude: 0,
      longitude: 0,
      allowedRadiusMeters: 100,
      googleMapsEmbedUrl: ''
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

      const createData: CreateBranchRequest = {
        name: data.name,
        address: data.address || undefined,
        latitude: data.latitude,
        longitude: data.longitude,
        allowedRadiusMeters: data.allowedRadiusMeters,
        googleMapsEmbedUrl: data.googleMapsEmbedUrl || undefined
      }

      const response = await branchService.createBranch(createData)

      if (response.success && response.data) {
        setData([response.data, ...(branchData || [])])
        setFilteredData([response.data, ...(branchData || [])])
        showNotification(response.message || 'Tạo chi nhánh thành công.', 'success')
        handleCloseDrawer()
      } else {
        showNotification(response.message || 'Không thể tạo chi nhánh.', 'error')
      }
    } catch (error) {
      console.error('Error creating branch:', error)
      showNotification('Đã có lỗi khi tạo chi nhánh.', 'error')
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
        <Typography variant='h5'>Thêm chi nhánh mới</Typography>
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
              label='Tên chi nhánh'
              {...register('name', { required: 'Tên chi nhánh là bắt buộc' })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='Địa chỉ'
              {...register('address')}
              error={!!errors.address}
              helperText={errors.address?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label='Vĩ độ'
              type='number'
              {...register('latitude', {
                required: 'Vĩ độ là bắt buộc',
                valueAsNumber: true,
                min: { value: -90, message: 'Vĩ độ phải từ -90 đến 90' },
                max: { value: 90, message: 'Vĩ độ phải từ -90 đến 90' }
              })}
              error={!!errors.latitude}
              helperText={errors.latitude?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label='Kinh độ'
              type='number'
              {...register('longitude', {
                required: 'Kinh độ là bắt buộc',
                valueAsNumber: true,
                min: { value: -180, message: 'Kinh độ phải từ -180 đến 180' },
                max: { value: 180, message: 'Kinh độ phải từ -180 đến 180' }
              })}
              error={!!errors.longitude}
              helperText={errors.longitude?.message}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='Bán kính cho phép (mét)'
              type='number'
              {...register('allowedRadiusMeters', {
                required: 'Bán kính là bắt buộc',
                valueAsNumber: true,
                min: { value: 1, message: 'Bán kính phải lớn hơn 0' }
              })}
              error={!!errors.allowedRadiusMeters}
              helperText={errors.allowedRadiusMeters?.message}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='Google Maps Embed URL'
              {...register('googleMapsEmbedUrl')}
              error={!!errors.googleMapsEmbedUrl}
              helperText={errors.googleMapsEmbedUrl?.message}
            />
          </Grid>
        </Grid>
        <Box className='flex gap-2 justify-end'>
          <Button variant='outlined' onClick={handleCloseDrawer}>
            Hủy
          </Button>
          <Button type='submit' variant='contained' disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo chi nhánh'}
          </Button>
        </Box>
      </form>
    </Drawer>
  )
}

export default AddBranchDrawer
