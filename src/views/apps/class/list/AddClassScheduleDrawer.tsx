
// React Imports
import { useState } from 'react'

import { useForm, Controller } from 'react-hook-form'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'

import { logger } from '@/utils/logger'

// Type Imports
import type { ClassType } from '@/types/apps/classTypes'
import type { BulkCreateScheduleRequest } from '@/services/scheduleService'

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
  classData: ClassType
  onScheduleAdded?: () => void
}

type FormValidateType = {
  daysOfWeek: number[]
  startTime: string
  endTime: string
}

const AddClassScheduleDrawer = (props: Props) => {
  const { open, handleClose, classData, onScheduleAdded } = props

  // States
  const [loading, setLoading] = useState(false)

  // Notification Hook
  const { showNotification } = useNotification()

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<FormValidateType>({
    defaultValues: {
      daysOfWeek: [],
      startTime: '',
      endTime: ''
    }
  })

  const selectedDays = watch('daysOfWeek')

  // Helper to convert 'HH:mm' to 'HH:mm:00'
  function formatTimeForBackend(time: string) {
    if (!time) return ''

    const parts = time.split(':')

    if (parts.length === 2) {
      return `${parts[0]}:${parts[1]}:00`
    }

    return time
  }

  // Handle close
  const handleCloseDrawer = () => {
    reset()
    handleClose()
  }

  // Handle submit
  const onSubmit = async (data: FormValidateType) => {
    if (data.daysOfWeek.length === 0) {
      showNotification(Messages.schedule.validation.selectDay, 'error')

      return
    }

    try {
      setLoading(true)

      const createData: BulkCreateScheduleRequest = {
        classId: classData.id,
        daysOfWeek: data.daysOfWeek,
        startTime: formatTimeForBackend(data.startTime),
        endTime: formatTimeForBackend(data.endTime)
      }

      const response = await scheduleService.createClassSchedules(classData.id, createData)

      if (response.success && response.data) {
        showNotification(response.message || Messages.class.success.addSchedule, 'success')
        onScheduleAdded?.()
        handleCloseDrawer()
      } else {
        showNotification(response.message || Messages.class.error.addSchedule, 'error')
      }
    } catch (error) {
      logger.error('AddClassScheduleDrawer', 'Error creating schedules', error)
      showNotification(Messages.class.error.addScheduleGeneric, 'error')
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
        <Typography variant='h5'>Thêm lịch học cho lớp: {classData.name}</Typography>
        <IconButton size='small' onClick={handleCloseDrawer}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 p-5'>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <Typography variant='h6' className='mb-2'>
              Chọn ngày trong tuần
            </Typography>
            <Controller
              name='daysOfWeek'
              control={control}
              rules={{ required: 'Vui lòng chọn ít nhất một ngày' }}
              render={({ field }) => (
                <FormGroup row>
                  {DAY_OF_WEEK_OPTIONS.map(day => (
                    <FormControlLabel
                      key={day.value}
                      control={
                        <Checkbox
                          checked={field.value.includes(day.value)}
                          onChange={e => {
                            if (e.target.checked) {
                              field.onChange([...field.value, day.value])
                            } else {
                              field.onChange(field.value.filter((d: number) => d !== day.value))
                            }
                          }}
                        />
                      }
                      label={day.label}
                    />
                  ))}
                </FormGroup>
              )}
            />
            {errors.daysOfWeek && (
              <Typography variant='caption' color='error' className='mt-1'>
                {errors.daysOfWeek.message}
              </Typography>
            )}
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant='h6' className='mb-2'>
              Ngày đã chọn:
            </Typography>
            <Box className='flex flex-wrap gap-1'>
              {selectedDays.map(dayValue => {
                const day = DAY_OF_WEEK_OPTIONS.find(d => d.value === dayValue)

                return <Chip key={dayValue} label={day?.label} color='primary' variant='tonal' size='small' />
              })}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='startTime'
              control={control}
              rules={{ required: 'Giờ bắt đầu là bắt buộc' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Giờ bắt đầu'
                  type='time'
                  error={!!errors.startTime}
                  helperText={errors.startTime?.message}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='endTime'
              control={control}
              rules={{ required: 'Giờ kết thúc là bắt buộc' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Giờ kết thúc'
                  type='time'
                  error={!!errors.endTime}
                  helperText={errors.endTime?.message}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Grid>

        </Grid>

        <Box className='flex gap-2 justify-end'>
          <Button variant='outlined' onClick={handleCloseDrawer}>
            Hủy
          </Button>
          <Button type='submit' variant='contained' disabled={loading}>
            {loading ? 'Đang thêm...' : 'Thêm lịch học'}
          </Button>
        </Box>
      </form>
    </Drawer>
  )
}

export default AddClassScheduleDrawer
