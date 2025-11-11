import React, { useEffect, useMemo } from 'react'

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

// Type Imports
import type { ScheduleType } from '@/services/scheduleService'
import type { BranchType } from '@/types/apps/branchTypes'

// Service Imports
import scheduleService from '@/services/scheduleService'
import { useNotification } from '@/contexts/notificationContext'
import { DAY_OF_WEEK_OPTIONS } from '@/utils/constants'
import { Messages } from '@/utils/messages'

type FormData = {
  dayOfWeek: number
  startTime: string
  endTime: string
  branchId: string
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

  if (parts.length === 2) return `${parts[0]}:${parts[1]}:00`

  return time
}

export default function EditScheduleDialog({ open, onClose, schedule, branches, onUpdated }: Props) {
  const { showNotification } = useNotification()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      dayOfWeek: schedule?.dayOfWeek ?? 0,
      startTime: schedule ? schedule.startTime.substring(0, 5) : '',
      endTime: schedule ? schedule.endTime.substring(0, 5) : '',
      branchId: schedule?.branchId || ''
    }
  })

  // Helper function to format time for input (HH:mm)
  const formatTimeForInput = (time: string) => {
    if (!time) return ''

    // Nếu time có format HH:mm:ss, lấy HH:mm
    if (time.length >= 5) {
      return time.substring(0, 5)
    }

    return time
  }

  useEffect(() => {
    if (schedule) {
      reset(
        {
          dayOfWeek: schedule.dayOfWeek ?? 0,
          startTime: formatTimeForInput(schedule.startTime),
          endTime: formatTimeForInput(schedule.endTime),
          branchId: schedule.branchId || ''
        },
        { keepDefaultValues: false }
      )
    } else {
      // Reset form nếu schedule là null
      reset({
        dayOfWeek: 0,
        startTime: '',
        endTime: '',
        branchId: ''
      })
    }
  }, [schedule, reset])

  const onSubmit = async (data: FormData) => {
    if (!schedule) {
      showNotification('Không tìm thấy lịch học để cập nhật', 'error')

      return
    }

    try {
      // Chỉ gửi các field có thay đổi hoặc có giá trị
      const payload: any = {}

      if (data.dayOfWeek !== undefined) {
        payload.dayOfWeek = Number(data.dayOfWeek)
      }

      if (data.startTime) {
        payload.startTime = formatTimeForBackend(data.startTime)
      }

      if (data.endTime) {
        payload.endTime = formatTimeForBackend(data.endTime)
      }

      // Luôn gửi branchId - từ form nếu có, hoặc từ schedule hiện tại
      payload.branchId = data.branchId || schedule?.branchId

      const res = await scheduleService.updateSchedule(schedule.id, payload)

      if (res.success && res.data) {
        showNotification(res.message || Messages.schedule.success.update, 'success')
        if (onUpdated) onUpdated(res.data)
        onClose()
      } else {
        showNotification(res.message || Messages.schedule.error.update, 'error')
      }
    } catch (err) {
      showNotification(Messages.schedule.error.updateGeneric, 'error')
    }
  }

  // Đảm bảo luôn có branch hiện tại trong danh sách với thông tin đầy đủ
  const extendedBranches = useMemo(() => {
    const branchesList = branches || []

    if (!schedule?.branchId) return branchesList

    // Kiểm tra xem branch hiện tại đã có trong danh sách chưa
    const existingBranch = branchesList.find(b => b.id === schedule.branchId)

    if (existingBranch) {
      // Branch đã có trong danh sách, sử dụng thông tin đầy đủ từ đó
      return branchesList
    }

    // Nếu branch chưa có trong danh sách, thêm vào với thông tin từ schedule.branch
    // Ưu tiên thông tin từ schedule.branch nếu có đầy đủ, nếu không thì dùng thông tin tối thiểu
    const currentBranch = schedule.branch
      ? {
          ...schedule.branch,
          id: schedule.branchId,
          name: schedule.branch.name || 'Chi nhánh không xác định',
          address: schedule.branch.address || ''
        }
      : { id: schedule.branchId, name: 'Chi nhánh đã bị xóa', address: '' }

    return [currentBranch, ...branchesList]
  }, [branches, schedule])

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
                    <Select labelId='day-select-label' {...field}>
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
                    fullWidth
                    label='Giờ bắt đầu'
                    type='time'
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
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
                    fullWidth
                    label='Giờ kết thúc'
                    type='time'
                    value={field.value || ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.endTime}
                    helperText={errors.endTime?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              {/*{schedule?.branch && (*/}
              {/*  <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>*/}
              {/*    <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.5 }}>*/}
              {/*      Chi nhánh hiện tại:*/}
              {/*    </Typography>*/}
              {/*    <Chip*/}
              {/*      label={schedule.branch.name || 'Không xác định'}*/}
              {/*      color='primary'*/}
              {/*      variant='outlined'*/}
              {/*      size='small'*/}
              {/*    />*/}
              {/*    {schedule.branch.address && (*/}
              {/*      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>*/}
              {/*        {schedule.branch.address}*/}
              {/*      </Typography>*/}
              {/*    )}*/}
              {/*  </Box>*/}
              {/*)}*/}
              <Controller
                name='branchId'
                control={control}

                // Không bắt buộc vì branchId là optional trong UpdateClassScheduleRequest

                // Nhưng đảm bảo luôn có giá trị từ schedule nếu form không có
                render={({ field }) => {
                  // Ưu tiên field.value (giá trị từ form), sau đó fallback về schedule.branchId
                  const currentValue = field.value || schedule?.branchId || ''

                  return (
                    <FormControl fullWidth sx={{ minWidth: 180 }} error={!!errors.branchId}>
                      <InputLabel id='branch-select-label' shrink={!!currentValue}>
                        Chi nhánh
                      </InputLabel>
                      <Select
                        labelId='branch-select-label'
                        label='Chi nhánh'
                        value={currentValue}
                        onChange={e => {
                          field.onChange(e.target.value)
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        displayEmpty
                        renderValue={selected => {
                          // Nếu không có giá trị
                          if (!selected || selected === '') {
                            return schedule?.branch?.name || ''
                          }

                          // Tìm branch trong extendedBranches
                          const branch = extendedBranches.find(b => b.id === selected)

                          if (branch) {
                            return branch.name
                          }

                          // Fallback về schedule.branch nếu không tìm thấy trong danh sách
                          return schedule?.branch?.name || ''
                        }}
                        MenuProps={{ PaperProps: { style: { minWidth: 180 } } }}
                      >
                        {(extendedBranches || []).map(b => (
                          <MenuItem key={b.id} value={b.id}>
                            {b.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )
                }}
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
