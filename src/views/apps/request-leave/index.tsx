'use client'

// React Imports
import { useState, useEffect, useCallback, forwardRef } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'

// Styled Component Imports
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'

// Service Imports
import attendanceService, { type CreateTicketRequest } from '@/services/attendanceService'
import scheduleService, { type ScheduleType } from '@/services/scheduleService'
import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'

// Custom Input for Date Range Picker
const DateRangeInput = forwardRef<HTMLInputElement, { label?: string; value?: string }>((props, ref) => {
  return <TextField inputRef={ref} fullWidth label={props.label || 'Chọn khoảng thời gian'} value={props.value || ''} />
})

DateRangeInput.displayName = 'DateRangeInput'

const RequestLeaveView = () => {
  // States
  const [schedules, setSchedules] = useState<ScheduleType[]>([])
  const [useSchedule, setUseSchedule] = useState<boolean>(false) // Chọn theo schedule hoặc tự chọn ngày
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [startTime, setStartTime] = useState<string>('09:00')
  const [endTime, setEndTime] = useState<string>('18:00')
  const [allDay, setAllDay] = useState<boolean>(false)
  const [reason, setReason] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loadingSchedules, setLoadingSchedules] = useState(false)

  // Hooks
  const { auth } = useAuth()
  const { showNotification } = useNotification()

  // Load schedules
  const loadSchedules = useCallback(async () => {
    try {
      setLoadingSchedules(true)

      // Get all active schedules for the user
      const response = await scheduleService.getSchedules({ IsActive: true })

      if (response.success && response.data) {
        setSchedules(response.data)
      } else {
        showNotification(response.message || 'Không thể tải lịch học.', 'error')
      }
    } catch (error) {
      console.error('Error loading schedules:', error)
      showNotification('Đã có lỗi khi tải lịch học.', 'error')
    } finally {
      setLoadingSchedules(false)
    }
  }, [showNotification])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  // Format date range string
  const formatDateRange = () => {
    if (!startDate) return ''

    if (!endDate || startDate.toDateString() === endDate.toDateString()) {
      const dateStr = startDate.toLocaleDateString('vi-VN')
      const timeStr = allDay ? '' : ` (${startTime} - ${endTime})`

      
return `${dateStr}${timeStr}`
    }

    const startStr = startDate.toLocaleDateString('vi-VN')
    const endStr = endDate.toLocaleDateString('vi-VN')
    const timeStr = allDay ? '' : ` (${startTime} - ${endTime})`

    
return `${startStr} đến ${endStr}${timeStr}`
  }

  // Handle request leave
  const handleRequestLeave = useCallback(async () => {
    if (!auth?.user?.id) {
      showNotification('Bạn chưa đăng nhập.', 'error')
      
return
    }

    if (useSchedule) {
      if (!selectedScheduleId) {
        showNotification('Vui lòng chọn lịch học.', 'error')
        
return
      }
    } else {
      if (!startDate) {
        showNotification('Vui lòng chọn ngày bắt đầu.', 'error')
        
return
      }
    }

    if (!reason.trim()) {
      showNotification('Vui lòng nhập lý do xin nghỉ.', 'error')
      
return
    }

    setLoading(true)

    try {
      // Format reason with date/time information
      let dateTimeInfo = ''

      if (useSchedule && selectedScheduleId) {
        const schedule = schedules.find(s => s.id === selectedScheduleId)

        if (schedule) {
          dateTimeInfo = ` - Lịch: ${schedule.class?.name || schedule.class?.code || 'N/A'} (${schedule.startTime} - ${schedule.endTime})`
        }
      } else if (startDate) {
        dateTimeInfo = ` - Thời gian: ${formatDateRange()}`
      }

      const ticketData: CreateTicketRequest = {
        classScheduleId: useSchedule && selectedScheduleId ? selectedScheduleId : '', // Có thể empty nếu tự chọn ngày
        userId: auth.user.id,
        reason: `[XIN NGHỈ PHÉP] ${reason}${dateTimeInfo}`,
        createdBy: auth.user.fullName || undefined,
        createdByUserId: auth.user.id
      }

      const response = await attendanceService.createTicket(ticketData)

      if (response.success) {
        showNotification('Gửi đơn xin nghỉ phép thành công.', 'success')

        // Reset form
        setUseSchedule(false)
        setSelectedScheduleId('')
        setStartDate(null)
        setEndDate(null)
        setStartTime('09:00')
        setEndTime('18:00')
        setAllDay(false)
        setReason('')
      } else {
        showNotification(response.message || 'Không thể gửi đơn xin nghỉ phép.', 'error')
      }
    } catch (error) {
      console.error('Error requesting leave:', error)
      showNotification('Đã có lỗi khi gửi đơn xin nghỉ phép.', 'error')
    } finally {
      setLoading(false)
    }
  }, [auth?.user, useSchedule, selectedScheduleId, startDate, endDate, startTime, endTime, allDay, reason, schedules, showNotification, formatDateRange])

  // Get selected schedule
  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId)

  return (
    <Grid container spacing={{ xs: 4, sm: 6 }}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Xin nghỉ phép' className='p-4 sm:p-6' />
          <CardContent className='p-4 sm:p-6'>
            <Box className='flex flex-col gap-4 sm:gap-6'>
              <Alert severity='info' className='text-xs sm:text-sm'>
                Bạn có thể tạo đơn xin nghỉ phép cho một hoặc nhiều ngày với thời gian cụ thể. Đơn xin nghỉ sẽ được gửi đến quản lý để phê duyệt.
              </Alert>

              {/* Toggle: Chọn theo schedule hoặc tự chọn ngày */}
              <FormControlLabel
                control={
                  <Switch
                    checked={useSchedule}
                    onChange={e => {
                      setUseSchedule(e.target.checked)

                      if (e.target.checked) {
                        setStartDate(null)
                        setEndDate(null)
                      } else {
                        setSelectedScheduleId('')
                      }
                    }}
                  />
                }
                label='Chọn theo lịch học'
              />

              {useSchedule ? (

                /* Schedule Selection */
                <FormControl fullWidth required>
                  <InputLabel>Chọn lịch học</InputLabel>
                  <Select
                    value={selectedScheduleId}
                    label='Chọn lịch học'
                    onChange={e => setSelectedScheduleId(e.target.value)}
                    disabled={loadingSchedules || loading}
                  >
                    {schedules.map(schedule => (
                      <MenuItem key={schedule.id} value={schedule.id}>
                        <Box>
                          <Typography variant='body1' className='font-medium'>
                            {schedule.class?.name || schedule.class?.code || 'Lớp học'}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {schedule.startTime} - {schedule.endTime} | {schedule.branch?.name || 'Chi nhánh'}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (

                /* Date Range Selection với thời gian */
                <Box className='flex flex-col gap-4'>
                  {/* Date Range Picker */}
                  <AppReactDatepicker
                    selectsRange
                    startDate={startDate}
                    endDate={endDate}
                    selected={startDate}
                    onChange={(dates: [Date | null, Date | null]) => {
                      const [start, end] = dates

                      setStartDate(start)
                      setEndDate(end)
                    }}
                    minDate={new Date()}
                    customInput={<DateRangeInput label='Chọn khoảng thời gian xin nghỉ' />}
                    dateFormat='dd/MM/yyyy'
                    isClearable
                  />

                  {/* All Day Toggle */}
                  <FormControlLabel
                    control={
                      <Switch checked={allDay} onChange={e => setAllDay(e.target.checked)} />
                    }
                    label='Cả ngày'
                  />

                  {/* Time Selection - chỉ hiển thị nếu không phải all day */}
                  {!allDay && (
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          fullWidth
                          label='Giờ bắt đầu'
                          type='time'
                          value={startTime}
                          onChange={e => setStartTime(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ step: 300 }} // 5 minutes
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          fullWidth
                          label='Giờ kết thúc'
                          type='time'
                          value={endTime}
                          onChange={e => setEndTime(e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          inputProps={{ step: 300 }} // 5 minutes
                        />
                      </Grid>
                    </Grid>
                  )}

                  {/* Display selected date range */}
                  {startDate && (
                    <Box className='p-3 sm:p-4 border rounded bg-background'>
                      <Typography variant='subtitle2' className='mb-2 font-medium text-sm sm:text-base'>
                        Khoảng thời gian đã chọn:
                      </Typography>
                      <Typography variant='body2' color='text.secondary' className='text-xs sm:text-sm'>
                        {formatDateRange()}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {/* Selected Schedule Info */}
              {selectedSchedule && (
                <Box className='p-3 sm:p-4 border rounded bg-background'>
                  <Typography variant='subtitle2' className='mb-2 font-medium text-sm sm:text-base'>
                    Thông tin lịch học đã chọn:
                  </Typography>
                  <Typography variant='body2' color='text.secondary' className='text-xs sm:text-sm mb-1'>
                    <strong>Lớp:</strong> {selectedSchedule.class?.name || selectedSchedule.class?.code || 'N/A'}
                  </Typography>
                  <Typography variant='body2' color='text.secondary' className='text-xs sm:text-sm mb-1'>
                    <strong>Thời gian:</strong> {selectedSchedule.startTime} - {selectedSchedule.endTime}
                  </Typography>
                  {selectedSchedule.branch && (
                    <>
                      <Typography variant='body2' color='text.secondary' className='text-xs sm:text-sm mb-1'>
                        <strong>Chi nhánh:</strong> {selectedSchedule.branch.name}
                      </Typography>
                      {selectedSchedule.branch.address && (
                        <Typography variant='body2' color='text.secondary' className='text-xs sm:text-sm break-words'>
                          <strong>Địa chỉ:</strong> {selectedSchedule.branch.address}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              )}

              {/* Reason */}
              <TextField
                fullWidth
                label='Lý do xin nghỉ'
                value={reason}
                onChange={e => setReason(e.target.value)}
                multiline
                rows={4}
                placeholder='Nhập lý do xin nghỉ phép...'
                disabled={loading}
                required
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }
                }}
              />

              {/* Submit Button */}
              <Button
                variant='contained'
                size='large'
                onClick={handleRequestLeave}
                disabled={
                  (useSchedule ? !selectedScheduleId : !startDate) || !reason.trim() || loading || loadingSchedules
                }
                startIcon={
                  loading ? <CircularProgress size={20} color='inherit' /> : <i className='ri-file-paper-2-line' />
                }
                fullWidth
                sx={{
                  minHeight: { xs: '48px', sm: '56px' },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                {loading ? 'Đang gửi...' : 'Gửi đơn xin nghỉ phép'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default RequestLeaveView
