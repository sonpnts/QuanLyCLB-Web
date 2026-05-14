import { useEffect } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { useForm, Controller } from 'react-hook-form'

import type { ScheduleType } from '@/services/scheduleService'
import type { BranchType } from '@/types/apps/branchTypes'

import scheduleService from '@/services/scheduleService'
import { useNotification } from '@/contexts/notificationContext'
import { DAY_OF_WEEK_OPTIONS } from '@/utils/constants'
import { Messages } from '@/utils/messages'

type FormData = {
  dayOfWeek: number
  startTime: string
  endTime: string
}

type Props = {
  open: boolean
  onClose: () => void
  schedule: ScheduleType | null
  branches: BranchType[]
  onUpdated?: (data: ScheduleType) => void
}

function formatTimeForBackend(time: string): string {
  if (!time) return ''
  const parts = time.split(':')

  return parts.length === 2 ? `${parts[0]}:${parts[1]}:00` : time
}

function formatTimeForInput(time?: string): string {
  if (!time) return ''

  return time.length >= 5 ? time.substring(0, 5) : time
}

export default function EditScheduleDialog({ open, onClose, schedule, onUpdated }: Props) {
  const { showNotification } = useNotification()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      dayOfWeek: schedule?.dayOfWeek ?? 0,
      startTime: formatTimeForInput(schedule?.startTime),
      endTime: formatTimeForInput(schedule?.endTime)
    }
  })

  useEffect(() => {
    reset({
      dayOfWeek: typeof schedule?.dayOfWeek === 'number' ? schedule.dayOfWeek : 0,
      startTime: formatTimeForInput(schedule?.startTime),
      endTime: formatTimeForInput(schedule?.endTime)
    })
  }, [schedule, reset])

  const onSubmit = async (data: FormData) => {
    if (!schedule) {
      showNotification('Không tìm thấy lịch học để cập nhật', 'error')

      return
    }

    try {
      const res = await scheduleService.updateSchedule(schedule.id, {
        dayOfWeek: Number(data.dayOfWeek),
        startTime: formatTimeForBackend(data.startTime),
        endTime: formatTimeForBackend(data.endTime)
      })

      if (res.success && res.data) {
        showNotification(res.message || Messages.schedule.success.update, 'success')
        onUpdated?.(res.data)
        onClose()
      } else {
        showNotification(res.message || Messages.schedule.error.update, 'error')
      }
    } catch {
      showNotification(Messages.schedule.error.updateGeneric, 'error')
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Chỉnh sửa lịch học</DialogTitle>
      <DialogContent>
        <form id='edit-schedule-form' onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <Controller
                name='dayOfWeek'
                control={control}
                rules={{ required: 'Chọn ngày trong tuần' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.dayOfWeek}>
                    <InputLabel id='day-select-label'>Ngày</InputLabel>
                    <Select label='Ngày' labelId='day-select-label' {...field}>
                      {DAY_OF_WEEK_OPTIONS.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Controller
                name='startTime'
                control={control}
                rules={{ required: 'Chọn giờ bắt đầu' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Giờ bắt đầu'
                    type='time'
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.startTime}
                    helperText={errors.startTime?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Controller
                name='endTime'
                control={control}
                rules={{ required: 'Chọn giờ kết thúc' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Giờ kết thúc'
                    type='time'
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.endTime}
                    helperText={errors.endTime?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button form='edit-schedule-form' type='submit' variant='contained'>
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  )
}
