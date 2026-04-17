'use client'

// React Imports
import { logger } from '@/utils/logger'
import { useState, useEffect } from 'react'

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
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'

// Type Imports
import type { ClassType } from '@/types/apps/classTypes'
import type { BranchType } from '@/services/branchService'
import type { BulkCreateScheduleRequest } from '@/services/scheduleService'

// Service Imports
import scheduleService from '@/services/scheduleService'
import branchService from '@/services/branchService'

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
  branchId: string
}

const AddClassScheduleDrawer = (props: Props) => {
  const { open, handleClose, classData, onScheduleAdded } = props

  // States
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<BranchType[]>([])

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
      endTime: '',
      branchId: ''
    }
  })

  const selectedDays = watch('daysOfWeek')

  // Load branches
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const response = await branchService.getBranches({})

        if (response.success && response.data) {
          setBranches(response.data)
        }
      } catch (error) {
        logger.error('AddClassScheduleDrawer', 'Error loading branches', error)
      }
    }

    loadBranches()
  }, [])

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
        endTime: formatTimeForBackend(data.endTime),
        branchId: data.branchId
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
        <Typography variant='h5'>ThÃªm lá»‹ch há»c cho lá»›p: {classData.name}</Typography>
        <IconButton size='small' onClick={handleCloseDrawer}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 p-5'>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <Typography variant='h6' className='mb-2'>
              Chá»n ngÃ y trong tuáº§n
            </Typography>
            <Controller
              name='daysOfWeek'
              control={control}
              rules={{ required: 'Vui lÃ²ng chá»n Ã­t nháº¥t má»™t ngÃ y' }}
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
              NgÃ y Ä‘Ã£ chá»n:
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
              rules={{ required: 'Giá» báº¯t Ä‘áº§u lÃ  báº¯t buá»™c' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Giá» báº¯t Ä‘áº§u'
                  type='time'
                  error={!!errors.startTime}
                  helperText={errors.startTime?.message}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='endTime'
              control={control}
              rules={{ required: 'Giá» káº¿t thÃºc lÃ  báº¯t buá»™c' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Giá» káº¿t thÃºc'
                  type='time'
                  error={!!errors.endTime}
                  helperText={errors.endTime?.message}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              name='branchId'
              control={control}
              rules={{ required: 'Chi nhÃ¡nh lÃ  báº¯t buá»™c' }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.branchId}>
                  <InputLabel>Chi nhÃ¡nh</InputLabel>
                  <Select {...field} label='Chi nhÃ¡nh'>
                    {branches.map(branch => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.branchId && (
                    <Typography variant='caption' color='error' className='mt-1 ml-3'>
                      {errors.branchId.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </Grid>
        </Grid>

        <Box className='flex gap-2 justify-end'>
          <Button variant='outlined' onClick={handleCloseDrawer}>
            Há»§y
          </Button>
          <Button type='submit' variant='contained' disabled={loading}>
            {loading ? 'Äang thÃªm...' : 'ThÃªm lá»‹ch há»c'}
          </Button>
        </Box>
      </form>
    </Drawer>
  )
}

export default AddClassScheduleDrawer
