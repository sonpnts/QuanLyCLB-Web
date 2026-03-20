'use client'

// React Imports
import { useState, useEffect, useCallback } from 'react'

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

// Service Imports
import attendanceService, { type CreateTicketRequest } from '@/services/attendanceService'
import scheduleService, { type ScheduleType } from '@/services/scheduleService'
import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'

// Ticket types
type TicketType = 'compensatory' | 'checkout' | 'overtime'

const TICKET_TYPES: { value: TicketType; label: string; description: string }[] = [
  {
    value: 'compensatory',
    label: 'Điểm danh bù',
    description: 'Điểm danh bù cho toàn bộ buổi học đã bỏ lỡ'
  },
  {
    value: 'checkout',
    label: 'Checkout',
    description: 'Checkout sớm hoặc đặc biệt'
  },
  {
    value: 'overtime',
    label: 'Làm thêm giờ',
    description: 'Làm thêm giờ ngoài lịch học'
  }
]

const CreateTicketView = () => {
  // States
  const [schedules, setSchedules] = useState<ScheduleType[]>([])
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('')
  const [ticketType, setTicketType] = useState<TicketType>('compensatory')
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

  // Handle create ticket
  const handleCreateTicket = useCallback(async () => {
    if (!auth?.user?.id) {
      showNotification('Bạn chưa đăng nhập.', 'error')

      return
    }

    if (!selectedScheduleId) {
      showNotification('Vui lòng chọn lịch học.', 'error')

      return
    }

    if (!ticketType) {
      showNotification('Vui lòng chọn loại phiếu.', 'error')

      return
    }

    setLoading(true)

    try {
      // Get ticket type label
      const ticketTypeLabel = TICKET_TYPES.find(t => t.value === ticketType)?.label || ''

      // Format reason with ticket type prefix
      const formattedReason = reason
        ? `[${ticketTypeLabel.toUpperCase()}] ${reason}`
        : `[${ticketTypeLabel.toUpperCase()}]`

      const ticketData: CreateTicketRequest = {
        classScheduleId: selectedScheduleId,
        userId: auth.user.id,
        reason: formattedReason,
        createdBy: auth.user.fullName || undefined,
        createdByUserId: auth.user.id
      }

      const response = await attendanceService.createTicket(ticketData)

      if (response.success) {
        showNotification('Tạo phiếu thành công.', 'success')

        // Reset form
        setSelectedScheduleId('')
        setTicketType('compensatory')
        setReason('')
      } else {
        showNotification(response.message || 'Không thể tạo phiếu.', 'error')
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      showNotification('Đã có lỗi khi tạo phiếu.', 'error')
    } finally {
      setLoading(false)
    }
  }, [auth?.user, selectedScheduleId, ticketType, reason, showNotification])

  // Get selected schedule
  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId)

  return (
    <Grid container spacing={{ xs: 4, sm: 6 }}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Tạo phiếu điểm danh bù / Làm thêm giờ / Checkout' className='p-4 sm:p-6' />
          <CardContent className='p-4 sm:p-6'>
            <Box className='flex flex-col gap-4 sm:gap-6'>
              <Alert severity='info' className='text-xs sm:text-sm'>
                Bạn có thể tạo phiếu để điểm danh bù cho toàn bộ buổi học, checkout hoặc làm thêm giờ.
              </Alert>

              {/* Ticket Type Selection */}
              <FormControl fullWidth required>
                <InputLabel>Loại phiếu</InputLabel>
                <Select
                  value={ticketType}
                  label='Loại phiếu'
                  onChange={e => setTicketType(e.target.value as TicketType)}
                  disabled={loading}
                >
                  {TICKET_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box>
                        <Typography variant='body1' className='font-medium'>
                          {type.label}
                        </Typography>
                        <Typography variant='body2' color='text.secondary' className='text-xs'>
                          {type.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Schedule Selection */}
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
                label='Lý do (tùy chọn)'
                value={reason}
                onChange={e => setReason(e.target.value)}
                multiline
                rows={4}
                placeholder={
                  ticketType === 'compensatory'
                    ? 'Nhập lý do điểm danh bù...'
                    : ticketType === 'checkout'
                      ? 'Nhập lý do checkout...'
                      : 'Nhập lý do làm thêm giờ...'
                }
                disabled={loading}
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
                onClick={handleCreateTicket}
                disabled={!selectedScheduleId || !ticketType || loading || loadingSchedules}
                startIcon={
                  loading ? <CircularProgress size={20} color='inherit' /> : <i className='ri-file-add-line' />
                }
                fullWidth
                sx={{
                  minHeight: { xs: '48px', sm: '56px' },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                {loading ? 'Đang tạo...' : `Tạo phiếu ${TICKET_TYPES.find(t => t.value === ticketType)?.label || ''}`}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default CreateTicketView
