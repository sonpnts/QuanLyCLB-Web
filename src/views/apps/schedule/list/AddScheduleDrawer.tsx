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
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

// Type Imports
import type { ScheduleType, CreateClassScheduleRequest } from '@/services/scheduleService'

// Service Imports
import scheduleService from '@/services/scheduleService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Utils Imports
import { DAY_OF_WEEK_OPTIONS } from '@/utils/constants'
import { Messages } from '@/utils/messages'

type Props = {
  open: boolean
  handleClose: () => void
  scheduleData?: ScheduleType[]
  setData: (data: ScheduleType[]) => void
  setFilteredData: (data: ScheduleType[]) => void
}

type FormValidateType = {
  classId: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

const AddScheduleDrawer = (props: Props) => {
  const { open, handleClose, scheduleData, setData, setFilteredData } = props

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
    setValue,
    watch
  } = useForm<FormValidateType>({
    defaultValues: {
      classId: '',
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '09:00'
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

      const createData: CreateClassScheduleRequest = {
        classId: data.classId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime
      }

      const response = await scheduleService.createSchedule(createData)

      if (response.success && response.data) {
        setData([response.data, ...(scheduleData || [])])
        setFilteredData([response.data, ...(scheduleData || [])])
        showNotification(response.message || Messages.schedule.success.create, 'success')
        handleCloseDrawer()
      } else {
        showNotification(response.message || Messages.schedule.error.create, 'error')
      }
    } catch (error) {
      showNotification(Messages.schedule.error.createGeneric, 'error')
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
        <Typography variant='h5'>Thêm lịch học mới</Typography>
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
              label='ID Lớp học'
              {...register('classId', { required: 'ID Lớp học là bắt buộc' })}
              error={!!errors.classId}
              helperText={errors.classId?.message}
              placeholder='Nhập ID lớp học...'
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth error={!!errors.dayOfWeek}>
              <InputLabel>Thứ trong tuần</InputLabel>
              <Select
                value={watch('dayOfWeek')}
                label='Thứ trong tuần'
                onChange={e => setValue('dayOfWeek', e.target.value as number)}
              >
                {DAY_OF_WEEK_OPTIONS.map(day => (
                  <MenuItem key={day.value} value={day.value}>
                    {day.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.dayOfWeek && (
                <Typography variant='caption' color='error' className='mt-1 ml-3'>
                  {errors.dayOfWeek.message}
                </Typography>
              )}
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label='Giờ bắt đầu'
              type='time'
              {...register('startTime', { required: 'Giờ bắt đầu là bắt buộc' })}
              error={!!errors.startTime}
              helperText={errors.startTime?.message}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label='Giờ kết thúc'
              type='time'
              {...register('endTime', { required: 'Giờ kết thúc là bắt buộc' })}
              error={!!errors.endTime}
              helperText={errors.endTime?.message}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
        <Box className='flex gap-2 justify-end'>
          <Button variant='outlined' onClick={handleCloseDrawer}>
            Hủy
          </Button>
          <Button type='submit' variant='contained' disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo lịch học'}
          </Button>
        </Box>
      </form>
    </Drawer>
  )
}

export default AddScheduleDrawer
