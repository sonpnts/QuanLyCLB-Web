'use client'

// React Imports
import { logger } from '@/utils/logger'
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
  return <TextField inputRef={ref} fullWidth label={props.label || 'Chá»n khoáº£ng thá»i gian'} value={props.value || ''} />
})

DateRangeInput.displayName = 'DateRangeInput'

const RequestLeaveView = () => {
  // States
  const [schedules, setSchedules] = useState<ScheduleType[]>([])
  const [useSchedule, setUseSchedule] = useState<boolean>(false) // Chá»n theo schedule hoáº·c tá»± chá»n ngÃ y
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
        showNotification(response.message || 'KhÃ´ng thá»ƒ táº£i lá»‹ch há»c.', 'error')
      }
    } catch (error) {
      logger.error('index', 'Error loading schedules', error)
      showNotification('ÄÃ£ cÃ³ lá»—i khi táº£i lá»‹ch há»c.', 'error')
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

    return `${startStr} Ä‘áº¿n ${endStr}${timeStr}`
  }

  // Handle request leave
  const handleRequestLeave = useCallback(async () => {
    if (!auth?.user?.id) {
      showNotification('Báº¡n chÆ°a Ä‘Äƒng nháº­p.', 'error')

      return
    }

    if (useSchedule) {
      if (!selectedScheduleId) {
        showNotification('Vui lÃ²ng chá»n lá»‹ch há»c.', 'error')

        return
      }
    } else {
      if (!startDate) {
        showNotification('Vui lÃ²ng chá»n ngÃ y báº¯t Ä‘áº§u.', 'error')

        return
      }
    }

    if (!reason.trim()) {
      showNotification('Vui lÃ²ng nháº­p lÃ½ do xin nghá»‰.', 'error')

      return
    }

    setLoading(true)

    try {
      // Format reason with date/time information
      let dateTimeInfo = ''

      if (useSchedule && selectedScheduleId) {
        const schedule = schedules.find(s => s.id === selectedScheduleId)

        if (schedule) {
          dateTimeInfo = ` - Lá»‹ch: ${schedule.class?.name || schedule.class?.code || 'N/A'} (${schedule.startTime} - ${schedule.endTime})`
        }
      } else if (startDate) {
        dateTimeInfo = ` - Thá»i gian: ${formatDateRange()}`
      }

      const ticketData: CreateTicketRequest = {
        classScheduleId: useSchedule && selectedScheduleId ? selectedScheduleId : '', // CÃ³ thá»ƒ empty náº¿u tá»± chá»n ngÃ y
        userId: auth.user.id,
        reason: `[XIN NGHá»ˆ PHÃ‰P] ${reason}${dateTimeInfo}`,
        createdBy: auth.user.fullName || undefined,
        createdByUserId: auth.user.id
      }

      const response = await attendanceService.createTicket(ticketData)

      if (response.success) {
        showNotification('Gá»­i Ä‘Æ¡n xin nghá»‰ phÃ©p thÃ nh cÃ´ng.', 'success')

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
        showNotification(response.message || 'KhÃ´ng thá»ƒ gá»­i Ä‘Æ¡n xin nghá»‰ phÃ©p.', 'error')
      }
    } catch (error) {
      logger.error('index', 'Error requesting leave', error)
      showNotification('ÄÃ£ cÃ³ lá»—i khi gá»­i Ä‘Æ¡n xin nghá»‰ phÃ©p.', 'error')
    } finally {
      setLoading(false)
    }
  }, [
    auth?.user,
    useSchedule,
    selectedScheduleId,
    startDate,
    endDate,
    startTime,
    endTime,
    allDay,
    reason,
    schedules,
    showNotification,
    formatDateRange
  ])

  // Get selected schedule
  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId)

  return (
    <Grid container spacing={{ xs: 4, sm: 6 }}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Xin nghá»‰ phÃ©p' className='p-4 sm:p-6' />
          <CardContent className='p-4 sm:p-6'>
            <Box className='flex flex-col gap-4 sm:gap-6'>
              <Alert severity='info' className='text-xs sm:text-sm'>
                Báº¡n cÃ³ thá»ƒ táº¡o Ä‘Æ¡n xin nghá»‰ phÃ©p cho má»™t hoáº·c nhiá»u ngÃ y vá»›i thá»i gian cá»¥ thá»ƒ. ÄÆ¡n xin nghá»‰ sáº½ Ä‘Æ°á»£c gá»­i
                Ä‘áº¿n quáº£n lÃ½ Ä‘á»ƒ phÃª duyá»‡t.
              </Alert>

              {/* Toggle: Chá»n theo schedule hoáº·c tá»± chá»n ngÃ y */}
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
                label='Chá»n theo lá»‹ch há»c'
              />

              {useSchedule ? (

                /* Schedule Selection */
                <FormControl fullWidth required>
                  <InputLabel>Chá»n lá»‹ch há»c</InputLabel>
                  <Select
                    value={selectedScheduleId}
                    label='Chá»n lá»‹ch há»c'
                    onChange={e => setSelectedScheduleId(e.target.value)}
                    disabled={loadingSchedules || loading}
                  >
                    {schedules.map(schedule => (
                      <MenuItem key={schedule.id} value={schedule.id}>
                        <Box>
                          <Typography variant='body1' className='font-medium'>
                            {schedule.class?.name || schedule.class?.code || 'Lá»›p há»c'}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {schedule.startTime} - {schedule.endTime} | {schedule.branch?.name || 'Chi nhÃ¡nh'}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (

                /* Date Range Selection vá»›i thá»i gian */
                <Box className='flex flex-col gap-4'>
                  {/* Date Range Picker */}
                  <AppReactDatepicker
                    selectsRange
                    startDate={startDate ?? undefined}
                    endDate={endDate ?? undefined}
                    selected={startDate ?? undefined}
                    onChange={(dates: [Date | null, Date | null]) => {
                      const [start, end] = dates

                      setStartDate(start)
                      setEndDate(end)
                    }}
                    minDate={new Date()}
                    customInput={<DateRangeInput label='Chá»n khoáº£ng thá»i gian xin nghá»‰' />}
                    dateFormat='dd/MM/yyyy'
                    isClearable
                  />

                  {/* All Day Toggle */}
                  <FormControlLabel
                    control={<Switch checked={allDay} onChange={e => setAllDay(e.target.checked)} />}
                    label='Cáº£ ngÃ y'
                  />

                  {/* Time Selection - chá»‰ hiá»ƒn thá»‹ náº¿u khÃ´ng pháº£i all day */}
                  {!allDay && (
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          fullWidth
                          label='Giá» báº¯t Ä‘áº§u'
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
                          label='Giá» káº¿t thÃºc'
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
                        Khoáº£ng thá»i gian Ä‘Ã£ chá»n:
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
                    ThÃ´ng tin lá»‹ch há»c Ä‘Ã£ chá»n:
                  </Typography>
                  <Typography variant='body2' color='text.secondary' className='text-xs sm:text-sm mb-1'>
                    <strong>Lá»›p:</strong> {selectedSchedule.class?.name || selectedSchedule.class?.code || 'N/A'}
                  </Typography>
                  <Typography variant='body2' color='text.secondary' className='text-xs sm:text-sm mb-1'>
                    <strong>Thá»i gian:</strong> {selectedSchedule.startTime} - {selectedSchedule.endTime}
                  </Typography>
                  {selectedSchedule.branch && (
                    <>
                      <Typography variant='body2' color='text.secondary' className='text-xs sm:text-sm mb-1'>
                        <strong>Chi nhÃ¡nh:</strong> {selectedSchedule.branch.name}
                      </Typography>
                      {selectedSchedule.branch.address && (
                        <Typography variant='body2' color='text.secondary' className='text-xs sm:text-sm break-words'>
                          <strong>Äá»‹a chá»‰:</strong> {selectedSchedule.branch.address}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              )}

              {/* Reason */}
              <TextField
                fullWidth
                label='LÃ½ do xin nghá»‰'
                value={reason}
                onChange={e => setReason(e.target.value)}
                multiline
                rows={4}
                placeholder='Nháº­p lÃ½ do xin nghá»‰ phÃ©p...'
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
                {loading ? 'Äang gá»­i...' : 'Gá»­i Ä‘Æ¡n xin nghá»‰ phÃ©p'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default RequestLeaveView
