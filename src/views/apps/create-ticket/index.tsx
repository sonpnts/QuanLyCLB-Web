'use client'

import { useState, useEffect, useCallback } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'

import { logger } from '@/utils/logger'

import attendanceService from '@/services/attendanceService'
import scheduleService, { type ScheduleType } from '@/services/scheduleService'
import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'

type TicketType = 'compensatory' | 'checkout' | 'overtime'

const TICKET_TYPES: { value: TicketType; label: string; description: string }[] = [
  { value: 'compensatory', label: 'Điểm danh bù', description: 'Điểm danh bù cho toàn bộ buổi học đã bỏ lỡ' },
  { value: 'checkout', label: 'Checkout', description: 'Checkout sớm hoặc đặc biệt' },
  { value: 'overtime', label: 'Làm thêm giờ', description: 'Làm thêm giờ ngoài lịch học' }
]

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

const CreateTicketView = () => {
  const [schedules, setSchedules] = useState<ScheduleType[]>([])
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([])
  const [ticketType, setTicketType] = useState<TicketType>('compensatory')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSchedules, setLoadingSchedules] = useState(false)

  const { auth } = useAuth()
  const { showNotification } = useNotification()

  const loadSchedules = useCallback(async () => {
    try {
      setLoadingSchedules(true)
      const response = await scheduleService.getSchedules({ IsActive: true })
      if (response.success && response.data) {
        setSchedules(response.data)
      } else {
        showNotification(response.message || 'Không thể tải lịch học.', 'error')
      }
    } catch (error) {
      logger.error('index', 'Error loading schedules', error)
      showNotification('Đã có lỗi khi tải lịch học.', 'error')
    } finally {
      setLoadingSchedules(false)
    }
  }, [showNotification])

  useEffect(() => { loadSchedules() }, [loadSchedules])

  const handleScheduleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value
    setSelectedScheduleIds(typeof value === 'string' ? value.split(',') : value)
  }

  const handleCreateTicket = useCallback(async () => {
    if (!auth?.user?.id) {
      showNotification('Bạn chưa đăng nhập.', 'error')
      return
    }
    if (selectedScheduleIds.length === 0) {
      showNotification('Vui lòng chọn ít nhất một lịch học.', 'error')
      return
    }

    setLoading(true)
    try {
      const ticketTypeLabel = TICKET_TYPES.find(t => t.value === ticketType)?.label || ''
      const formattedReason = reason ? `[${ticketTypeLabel.toUpperCase()}] ${reason}` : `[${ticketTypeLabel.toUpperCase()}]`

      let successCount = 0, failCount = 0
      for (const scheduleId of selectedScheduleIds) {
        const response = await attendanceService.createTicket({
          classScheduleId: scheduleId,
          userId: auth.user.id,
          reason: formattedReason,
          createdBy: auth.user.fullName || undefined,
          createdByUserId: auth.user.id
        })
        if (response.success) successCount++; else failCount++
      }

      if (failCount === 0) {
        showNotification(`Đã tạo thành công ${successCount} phiếu.`, 'success')
      } else {
        showNotification(`Thành công: ${successCount}, Thất bại: ${failCount}`, 'warning')
      }
      setSelectedScheduleIds([])
      setReason('')
    } catch (error) {
      logger.error('index', 'Error creating ticket', error)
      showNotification('Đã có lỗi khi tạo phiếu.', 'error')
    } finally {
      setLoading(false)
    }
  }, [auth?.user, selectedScheduleIds, ticketType, reason, showNotification])

  return (
    <Grid container spacing={{ xs: 4, sm: 6 }}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Tạo phiếu điểm danh bù / Làm thêm giờ / Checkout' className='p-4 sm:p-6' />
          <CardContent className='p-4 sm:p-6'>
            <Box className='flex flex-col gap-4 sm:gap-6'>
              <Alert severity='info' className='text-xs sm:text-sm'>
                Bạn có thể tạo phiếu cho nhiều buổi học cùng lúc. Chọn các lịch học cần tạo phiếu và nhập lý do.
              </Alert>

              {/* Ticket Type */}
              <FormControl fullWidth required>
                <InputLabel>Loại phiếu</InputLabel>
                <Select value={ticketType} label='Loại phiếu' onChange={e => setTicketType(e.target.value as TicketType)} disabled={loading}>
                  {TICKET_TYPES.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box>
                        <Typography variant='body1' className='font-medium'>{type.label}</Typography>
                        <Typography variant='body2' color='text.secondary' className='text-xs'>{type.description}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Reason - moved up */}
              <TextField
                fullWidth required
                label='Lý do'
                value={reason}
                onChange={e => setReason(e.target.value)}
                multiline
                rows={3}
                placeholder={
                  ticketType === 'compensatory' ? 'Nhập lý do điểm danh bù...'
                    : ticketType === 'checkout' ? 'Nhập lý do checkout...'
                      : 'Nhập lý do làm thêm giờ...'
                }
                disabled={loading}
              />

              {/* Schedule Multi-Select */}
              <FormControl fullWidth required>
                <InputLabel>Chọn lịch học ({selectedScheduleIds.length} đã chọn)</InputLabel>
                <Select
                  multiple
                  value={selectedScheduleIds}
                  label={`Chọn lịch học (${selectedScheduleIds.length} đã chọn)`}
                  onChange={handleScheduleChange}
                  disabled={loadingSchedules || loading}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.length === 0 ? (
                        <Typography variant='body2' color='text.secondary'>Chọn lịch học...</Typography>
                      ) : (
                        <Chip key='count' label={`${selected.length} lịch`} size='small' color='primary' />
                      )}
                    </Box>
                  )}
                >
                  {schedules.map(schedule => (
                    <MenuItem key={schedule.id} value={schedule.id}>
                      <Checkbox checked={selectedScheduleIds.indexOf(schedule.id) > -1} />
                      <ListItemText
                        primary={`${schedule.class?.code || 'Lớp'} - ${schedule.class?.name || ''}`}
                        secondary={`${WEEKDAY_LABELS[schedule.dayOfWeek]} ${schedule.startTime} - ${schedule.endTime} | ${schedule.branch?.name || ''}`}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Submit */}
              <Button
                variant='contained'
                size='large'
                onClick={handleCreateTicket}
                disabled={selectedScheduleIds.length === 0 || !reason.trim() || loading || loadingSchedules}
                startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <i className='ri-file-add-line' />}
                fullWidth
                sx={{ minHeight: { xs: '48px', sm: '56px' }, fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                {loading ? 'Đang tạo...' : `Tạo ${selectedScheduleIds.length > 0 ? selectedScheduleIds.length : ''} phiếu ${TICKET_TYPES.find(t => t.value === ticketType)?.label || ''}`}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default CreateTicketView
