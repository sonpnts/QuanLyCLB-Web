'use client'

// React Imports
import { logger } from '@/utils/logger'
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
    label: 'Äiá»ƒm danh bÃ¹',
    description: 'Äiá»ƒm danh bÃ¹ cho toÃ n bá»™ buá»•i há»c Ä‘Ã£ bá» lá»¡'
  },
  {
    value: 'checkout',
    label: 'Checkout',
    description: 'Checkout sá»›m hoáº·c Ä‘áº·c biá»‡t'
  },
  {
    value: 'overtime',
    label: 'LÃ m thÃªm giá»',
    description: 'LÃ m thÃªm giá» ngoÃ i lá»‹ch há»c'
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

  // Handle create ticket
  const handleCreateTicket = useCallback(async () => {
    if (!auth?.user?.id) {
      showNotification('Báº¡n chÆ°a Ä‘Äƒng nháº­p.', 'error')

      return
    }

    if (!selectedScheduleId) {
      showNotification('Vui lÃ²ng chá»n lá»‹ch há»c.', 'error')

      return
    }

    if (!ticketType) {
      showNotification('Vui lÃ²ng chá»n loáº¡i phiáº¿u.', 'error')

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
        showNotification('Táº¡o phiáº¿u thÃ nh cÃ´ng.', 'success')

        // Reset form
        setSelectedScheduleId('')
        setTicketType('compensatory')
        setReason('')
      } else {
        showNotification(response.message || 'KhÃ´ng thá»ƒ táº¡o phiáº¿u.', 'error')
      }
    } catch (error) {
      logger.error('index', 'Error creating ticket', error)
      showNotification('ÄÃ£ cÃ³ lá»—i khi táº¡o phiáº¿u.', 'error')
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
          <CardHeader title='Táº¡o phiáº¿u Ä‘iá»ƒm danh bÃ¹ / LÃ m thÃªm giá» / Checkout' className='p-4 sm:p-6' />
          <CardContent className='p-4 sm:p-6'>
            <Box className='flex flex-col gap-4 sm:gap-6'>
              <Alert severity='info' className='text-xs sm:text-sm'>
                Báº¡n cÃ³ thá»ƒ táº¡o phiáº¿u Ä‘á»ƒ Ä‘iá»ƒm danh bÃ¹ cho toÃ n bá»™ buá»•i há»c, checkout hoáº·c lÃ m thÃªm giá».
              </Alert>

              {/* Ticket Type Selection */}
              <FormControl fullWidth required>
                <InputLabel>Loáº¡i phiáº¿u</InputLabel>
                <Select
                  value={ticketType}
                  label='Loáº¡i phiáº¿u'
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
                label='LÃ½ do (tÃ¹y chá»n)'
                value={reason}
                onChange={e => setReason(e.target.value)}
                multiline
                rows={4}
                placeholder={
                  ticketType === 'compensatory'
                    ? 'Nháº­p lÃ½ do Ä‘iá»ƒm danh bÃ¹...'
                    : ticketType === 'checkout'
                      ? 'Nháº­p lÃ½ do checkout...'
                      : 'Nháº­p lÃ½ do lÃ m thÃªm giá»...'
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
                {loading ? 'Äang táº¡o...' : `Táº¡o phiáº¿u ${TICKET_TYPES.find(t => t.value === ticketType)?.label || ''}`}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default CreateTicketView
