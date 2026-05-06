'use client'
import { logger } from '@/utils/logger'

import { useState, useEffect, useRef, useCallback } from 'react'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'

// Types
import type { StudentType } from '@/types/apps/studentTypes'
import type { ClassType } from '@/types/apps/classTypes'

// Services
import studentService from '@/services/studentService'
import classService from '@/services/classService'

// Context
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  onClose: () => void
  student: StudentType | null
  onEnrolled?: () => void
}

const EnrollStudentDrawer = ({ open, onClose, student, onEnrolled }: Props) => {
  const { showNotification } = useNotification()
  const showNotificationRef = useRef(showNotification)
  showNotificationRef.current = showNotification

  const [classes, setClasses] = useState<ClassType[]>([])
  const [filteredClasses, setFilteredClasses] = useState<ClassType[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [enrollmentDate, setEnrollmentDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const classesLoadedRef = useRef(false)

  // Load classes
  useEffect(() => {
    if (!open || classesLoadedRef.current) return

    const loadClasses = async () => {
      try {
        setLoading(true)
        classesLoadedRef.current = true
        // Chỉ lấy các lớp đang hoạt động để đăng ký học viên
        const response = await classService.getClasses({ isActive: true, pageSize: 1000 })

        if (response.success && response.data) {
          setClasses(response.data)
          // Hiển thị mặc định 5 lớp đầu tiên
          setFilteredClasses(response.data.slice(0, 5))
        }
      } catch (error) {
        logger.error('EnrollStudentDrawer', 'Error loading classes', error)
      } finally {
        setLoading(false)
      }
    }

    loadClasses()
  }, [open])

  // Filter classes khi search
  useEffect(() => {
    if (!searchKeyword.trim()) {
      setFilteredClasses(classes.slice(0, 5))
      return
    }

    const keyword = searchKeyword.toLowerCase()
    const filtered = classes.filter(
      cls => cls.name.toLowerCase().includes(keyword) || cls.code.toLowerCase().includes(keyword)
    )
    setFilteredClasses(filtered.slice(0, 10))
  }, [searchKeyword, classes])

  // Lọc bỏ các lớp học viên đã đăng ký
  const getAvailableClasses = useCallback(() => {
    if (!student) return filteredClasses

    const enrolledClassIds = ((student as any).classes || []).map((c: any) => c.classId)
    return filteredClasses.filter(cls => !enrolledClassIds.includes(cls.id))
  }, [filteredClasses, student])

  // Reset khi đóng drawer
  useEffect(() => {
    if (!open) {
      setSelectedClassId('')
      setSearchKeyword('')
      setEnrollmentDate('')
      setNotes('')
    } else {
      // Set ngày mặc định là hôm nay
      setEnrollmentDate(new Date().toISOString().split('T')[0])
    }
  }, [open])

  const handleSubmit = async () => {
    if (!student || !selectedClassId) {
      showNotificationRef.current('Vui lòng chọn lớp học.', 'error')
      return
    }

    try {
      setSubmitting(true)

      const response = await studentService.enrollStudent({
        studentId: student.id,
        classId: selectedClassId,
        enrollmentDate: enrollmentDate || new Date().toISOString().split('T')[0],
        notes: notes || undefined
      })

      if (response.success) {
        showNotificationRef.current(response.message || 'Đăng ký lớp học thành công!', 'success')
        onEnrolled?.()
        onClose()
      } else {
        showNotificationRef.current(response.message || 'Không thể đăng ký lớp học.', 'error')
      }
    } catch (error) {
      logger.error('EnrollStudentDrawer', 'Error enrolling student', error)
      showNotificationRef.current('Đã có lỗi khi đăng ký lớp học.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!student) return null

  const availableClasses = getAvailableClasses()
  const selectedClass = classes.find(c => c.id === selectedClassId)

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 400 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Đăng ký lớp học</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />

      <Box className='p-5 flex flex-col gap-4'>
        {/* Thông tin học viên */}
        <Box className='flex items-center gap-2'>
          <Typography variant='body2' color='text.secondary'>
            Học viên:
          </Typography>
          <Chip label={student.fullName} color='primary' size='small' />
        </Box>

        {/* Các lớp đã đăng ký */}
        {((student as any).classes || []).length > 0 && (
          <Box>
            <Typography variant='body2' color='text.secondary' className='mb-1'>
              Đang học:
            </Typography>
            <Box className='flex flex-wrap gap-1'>
              {((student as any).classes || []).map((c: any) => (
                <Chip key={c.classId} label={c.className} size='small' variant='outlined' />
              ))}
            </Box>
          </Box>
        )}

        {/* Tìm kiếm lớp */}
        <TextField
          fullWidth
          label='Tìm lớp học'
          placeholder='Nhập tên hoặc mã lớp...'
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <i className='ri-search-line' />
              </InputAdornment>
            )
          }}
        />

        {/* Chọn lớp */}
        <FormControl fullWidth>
          <InputLabel>Chọn lớp học *</InputLabel>
          <Select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            label='Chọn lớp học *'
            disabled={loading}
          >
            {loading ? (
              <MenuItem disabled>
                <CircularProgress size={20} className='mr-2' /> Đang tải...
              </MenuItem>
            ) : availableClasses.length === 0 ? (
              <MenuItem disabled>Không có lớp phù hợp</MenuItem>
            ) : (
              availableClasses.map(cls => (
                <MenuItem key={cls.id} value={cls.id}>
                  <Box className='flex items-center gap-2'>
                    <span>{cls.name}</span>
                    <Chip label={cls.code} size='small' variant='outlined' />
                    <Typography variant='caption' color='text.secondary'>
                      ({cls.currentStudents || 0} học viên)
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {/* Thông tin lớp đã chọn */}
        {selectedClass && (
          <Box className='p-3 bg-gray-50 rounded'>
            <Typography variant='subtitle2'>{selectedClass.name}</Typography>
            <Typography variant='body2' color='text.secondary'>
              Mã lớp: {selectedClass.code}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Sĩ số: {selectedClass.currentStudents || 0} học viên
            </Typography>
            {selectedClass.description && (
              <Typography variant='body2' color='text.secondary'>
                {selectedClass.description}
              </Typography>
            )}
          </Box>
        )}

        {/* Ngày đăng ký */}
        <TextField
          fullWidth
          type='date'
          label='Ngày đăng ký'
          value={enrollmentDate}
          onChange={e => setEnrollmentDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        {/* Ghi chú */}
        <TextField
          fullWidth
          multiline
          rows={2}
          label='Ghi chú'
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder='Ghi chú thêm (tùy chọn)...'
        />

        {/* Actions */}
        <Box className='flex gap-4 pt-4'>
          <Button variant='outlined' onClick={onClose} fullWidth>
            Hủy
          </Button>
          <Button variant='contained' onClick={handleSubmit} disabled={!selectedClassId || submitting} fullWidth>
            {submitting ? 'Đang đăng ký...' : 'Đăng ký'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default EnrollStudentDrawer
