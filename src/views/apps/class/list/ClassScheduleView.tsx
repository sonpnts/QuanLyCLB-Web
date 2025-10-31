'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Grid from '@mui/material/Grid2'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

// Type Imports
import type { ClassType } from '@/types/apps/classTypes'
import type { ScheduleType } from '@/services/scheduleService'
import type { BranchType } from '@/types/apps/branchTypes'

// Service Imports
import scheduleService from '@/services/scheduleService'
import branchService from '@/services/branchService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'
import EditScheduleDialog from './EditScheduleDialog'

// Utils Imports
import { getDayName } from '@/utils/constants'
import { Messages } from '@/utils/messages'

type Props = {
  classData: ClassType
  onClose: () => void
}

const ClassScheduleView = ({ classData, onClose }: Props) => {
  // States
  const [schedules, setSchedules] = useState<ScheduleType[]>([])
  const [branches, setBranches] = useState<BranchType[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleType | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedScheduleEdit, setSelectedScheduleEdit] = useState<ScheduleType | null>(null)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [selectedRestore, setSelectedRestore] = useState<ScheduleType | null>(null)
  const [branchFilter, setBranchFilter] = useState('')

  // Notification Hook
  const { showNotification } = useNotification()

  // Load schedules for the class
  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true)

      const response = await scheduleService.getSchedules({
        ClassId: classData.id
      })

      if (response.success && response.data) {
        setSchedules(response.data)
      } else {
        showNotification(response.message || Messages.schedule.error.load, 'error')
      }
    } catch (error) {
      console.error('Error loading schedules:', error)
      showNotification(Messages.schedule.error.loadGeneric, 'error')
    } finally {
      setLoading(false)
    }
  }, [classData.id, showNotification])

  // Load branches
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const response = await branchService.getBranches({})

        if (response.success && response.data) {
          setBranches(response.data)
        }
      } catch (error) {
        console.error('Error loading branches:', error)
      }
    }

    loadBranches()
  }, [])

  // Load schedules when component mounts
  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  // Lấy danh sách branch duy nhất
  const uniqueBranches = useMemo(() => {
    const branchMap = new Map()

    ;(schedules || []).forEach(sch => {
      if (sch.branch?.id && sch.branch?.name) branchMap.set(sch.branch.id, sch.branch.name)
    })

    return Array.from(branchMap.entries())
  }, [schedules])

  // Handle delete schedule
  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return

    try {
      setLoading(true)
      const response = await scheduleService.deleteSchedule(selectedSchedule.id)

      if (response.success) {
        setSchedules(prevSchedules => prevSchedules.filter(schedule => schedule.id !== selectedSchedule.id))
        showNotification(Messages.schedule.success.delete, 'success')
        setDeleteDialogOpen(false)
        setSelectedSchedule(null)
      } else {
        showNotification(response.message || Messages.schedule.error.delete, 'error')
      }
    } catch (error) {
      console.error('Error deleting schedule:', error)
      showNotification(Messages.schedule.error.deleteGeneric, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Format time
  const formatTime = (time: string) => {
    return time.substring(0, 5) // Remove seconds if present
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth='lg' fullWidth>
      <DialogTitle>
        <Box className='flex items-center justify-between'>
          <Typography variant='h6'>Lịch học - {classData.name}</Typography>
          <Button variant='outlined' onClick={onClose}>
            Đóng
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        <FormControl fullWidth variant='outlined' size='small' sx={{ mb: 3, maxWidth: 300 }}>
          <InputLabel id='branch-filter-label'>Chi nhánh</InputLabel>
          <Select
            labelId='branch-filter-label'
            label='Chi nhánh'
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
          >
            <MenuItem value=''>Tất cả chi nhánh</MenuItem>
            {uniqueBranches.map(([id, name]) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {loading ? (
          <Box className='text-center py-8'>
            <Typography variant='body1'>Đang tải...</Typography>
          </Box>
        ) : schedules && schedules.length > 0 ? (
          <Grid container spacing={3}>
            {(schedules.filter(sch => !branchFilter || sch.branch?.id === branchFilter) || []).map(
              (schedule, index) => (
                <Grid key={schedule.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card variant='outlined' className='p-4'>
                    <Box className='flex items-center justify-between mb-2'>
                      <Typography variant='h6' className='font-medium'>
                        {getDayName(schedule.dayOfWeek)}
                      </Typography>
                      <Box className='flex items-center gap-2'>
                        {schedule.isActive ? (
                          <IconButton
                            size='small'
                            onClick={() => {
                              setSelectedScheduleEdit(schedule)
                              setShowEdit(true)
                            }}
                            color='primary'
                            title='Sửa'
                          >
                            <i className='ri-edit-box-line text-sm' />
                          </IconButton>
                        ) : (
                          <IconButton
                            size='small'
                            onClick={() => {
                              setSelectedRestore(schedule)
                              setRestoreDialogOpen(true)
                            }}
                            color='success'
                            title='Khôi phục'
                          >
                            <i className='ri-restart-line text-sm' />
                          </IconButton>
                        )}
                        <IconButton
                          size='small'
                          onClick={() => {
                            setSelectedSchedule(schedule)
                            setDeleteDialogOpen(true)
                          }}
                          color='error'
                          title='Xóa lịch học'
                        >
                          <i className='ri-delete-bin-7-line text-sm' />
                        </IconButton>
                      </Box>
                    </Box>
                    <Box className='space-y-2'>
                      <Box className='flex items-center gap-2'>
                        <i className='ri-time-line text-sm text-textSecondary' />
                        <Typography variant='body2'>
                          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                        </Typography>
                      </Box>
                      <Box className='flex items-center gap-2'>
                        <i className='ri-building-line text-sm text-textSecondary' />
                        <Typography variant='body2'>{schedule.branch?.name || 'Chi nhánh không xác định'}</Typography>
                      </Box>
                      <Box className='flex items-center gap-2'>
                        <Chip
                          label={schedule.isActive ? 'Hoạt động' : 'Không hoạt động'}
                          color={schedule.isActive ? 'success' : 'error'}
                          variant='tonal'
                          size='small'
                        />
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              )
            )}
          </Grid>
        ) : (
          <Box className='text-center py-8'>
            <Typography variant='body1' color='text.secondary'>
              {Messages.class.info.noSchedule}
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa lịch học</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa lịch học {selectedSchedule ? getDayName(selectedSchedule.dayOfWeek) : ''}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleDeleteSchedule} color='error' variant='contained' disabled={loading}>
            {loading ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
      <EditScheduleDialog
        open={showEdit}
        onClose={() => setShowEdit(false)}
        schedule={selectedScheduleEdit}
        branches={branches}
        onUpdated={() => {
          setShowEdit(false)
          setSelectedScheduleEdit(null)
          loadSchedules()
        }}
      />
      {/* Dialog xác nhận khôi phục */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
        <DialogTitle>Xác nhận khôi phục lịch học</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn khôi phục lịch học {selectedRestore ? getDayName(selectedRestore.dayOfWeek) : ''}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Hủy</Button>
          <Button
            onClick={async () => {
              if (!selectedRestore) return
              setLoading(true)
              const res = await scheduleService.restoreSchedule(selectedRestore.id)
              setLoading(false)
              if (res.success && res.data) {
                showNotification(res.message || Messages.schedule.success.restore, 'success')
                setSchedules(x => x.map(s => (s.id === selectedRestore.id ? res.data : s)))
                setRestoreDialogOpen(false)
                setSelectedRestore(null)
              } else {
                showNotification(res.message || Messages.schedule.error.restore, 'error')
              }
            }}
            color='success'
            variant='contained'
            disabled={loading}
          >
            {loading ? 'Đang khôi phục...' : 'Khôi phục'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}

export default ClassScheduleView
