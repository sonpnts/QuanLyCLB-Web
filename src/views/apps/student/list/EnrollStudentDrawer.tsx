'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { ClassType } from '@/types/apps/classTypes'
import type { StudentType } from '@/types/apps/studentTypes'
import studentService from '@/services/studentService'
import { useNotification } from '@/contexts/notificationContext'
import { logger } from '@/utils/logger'

type Props = {
  open: boolean
  onClose: () => void
  student: StudentType | null
  classOptions?: ClassType[]
  onEnrolled?: () => void
}

const EnrollStudentDrawer = ({ open, onClose, student, classOptions = [], onEnrolled }: Props) => {
  const { showNotification } = useNotification()
  const showNotificationRef = useRef(showNotification)

  showNotificationRef.current = showNotification

  const [filteredClasses, setFilteredClasses] = useState<ClassType[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [enrollmentDate, setEnrollmentDate] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!searchKeyword.trim()) {
      setFilteredClasses(classOptions.slice(0, 5))

      return
    }

    const keyword = searchKeyword.toLowerCase()

    setFilteredClasses(
      classOptions
        .filter(cls => cls.name.toLowerCase().includes(keyword) || cls.code.toLowerCase().includes(keyword))
        .slice(0, 10)
    )
  }, [classOptions, searchKeyword])

  useEffect(() => {
    if (!open) {
      setSelectedClassId('')
      setSearchKeyword('')
      setEnrollmentDate('')
      setNotes('')

      return
    }

    setEnrollmentDate(new Date().toISOString().split('T')[0])

    if (classOptions.length === 1) {
      setSelectedClassId(classOptions[0].id)
    } else if (selectedClassId && !classOptions.some(cls => cls.id === selectedClassId)) {
      setSelectedClassId('')
    }
  }, [classOptions, open, selectedClassId])

  const availableClasses = useMemo(() => {
    if (!student) return filteredClasses

    const enrolledClassIds = ((student as any).classes || []).map((item: any) => item.classId)

    return filteredClasses.filter(cls => !enrolledClassIds.includes(cls.id))
  }, [filteredClasses, student])

  const selectedClass = useMemo(
    () => classOptions.find(item => item.id === selectedClassId),
    [classOptions, selectedClassId]
  )

  const handleSubmit = useCallback(async () => {
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
  }, [enrollmentDate, notes, onClose, onEnrolled, selectedClassId, student])

  if (!student) return null

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

      <Box className='flex flex-col gap-4 p-5'>
        <Box className='flex items-center gap-2'>
          <Typography variant='body2' color='text.secondary'>
            Học viên:
          </Typography>
          <Chip label={student.fullName} color='primary' size='small' />
        </Box>

        {((student as any).classes || []).length > 0 && (
          <Box>
            <Typography variant='body2' color='text.secondary' className='mb-1'>
              Đang học:
            </Typography>
            <Box className='flex flex-wrap gap-1'>
              {((student as any).classes || []).map((item: any) => (
                <Chip key={item.classId} label={item.className} size='small' variant='outlined' />
              ))}
            </Box>
          </Box>
        )}

        <TextField
          fullWidth
          label='Tìm lớp học'
          placeholder='Nhập tên hoặc mã lớp...'
          value={searchKeyword}
          onChange={event => setSearchKeyword(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <i className='ri-search-line' />
              </InputAdornment>
            )
          }}
        />

        <FormControl fullWidth>
          <InputLabel>Chọn lớp học *</InputLabel>
          <Select
            value={selectedClassId}
            onChange={event => setSelectedClassId(event.target.value)}
            label='Chọn lớp học *'
            disabled={classOptions.length === 0}
          >
            {classOptions.length === 0 ? (
              <MenuItem disabled>Không có lớp khả dụng</MenuItem>
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

        {selectedClass && (
          <Box className='rounded bg-gray-50 p-3'>
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

        <TextField
          fullWidth
          type='date'
          label='Ngày đăng ký'
          value={enrollmentDate}
          onChange={event => setEnrollmentDate(event.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          fullWidth
          multiline
          rows={2}
          label='Ghi chú'
          value={notes}
          onChange={event => setNotes(event.target.value)}
          placeholder='Ghi chú thêm (tùy chọn)...'
        />

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
