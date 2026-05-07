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
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'
import Checkbox from '@mui/material/Checkbox'
import InputAdornment from '@mui/material/InputAdornment'

// Types
import type { ClassType } from '@/types/apps/classTypes'
import type { StudentType } from '@/types/apps/studentTypes'

// Services
import studentService from '@/services/studentService'

// Context
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  onClose: () => void
  classData: ClassType
  onStudentsAdded?: () => void
}

const AddStudentsToClassDrawer = ({ open, onClose, classData, onStudentsAdded }: Props) => {
  const { showNotification } = useNotification()
  const showNotificationRef = useRef(showNotification)
  showNotificationRef.current = showNotification

  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<StudentType[]>([])
  const [selectedStudents, setSelectedStudents] = useState<StudentType[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Search students với debounce
  const searchStudents = useCallback(
    async (keyword: string) => {
      if (!keyword.trim()) {
        setSearchResults([])
        return
      }

      try {
        setSearching(true)
        const response = await studentService.getStudents({
          keyword,
          pageSize: 10
        })

        if (response.success && response.data) {
          // Lọc bỏ học viên đã có trong lớp này
          const filtered = response.data.filter(student => {
            const classes = (student as any).classes || []
            return !classes.some((c: any) => c.classId === classData.id)
          })
          setSearchResults(filtered)
        }
      } catch (error) {
        logger.error('AddStudentsToClassDrawer', 'Error searching students', error)
      } finally {
        setSearching(false)
      }
    },
    [classData.id]
  )

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchStudents(searchKeyword)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchKeyword, searchStudents])

  // Reset khi đóng drawer
  useEffect(() => {
    if (!open) {
      setSearchKeyword('')
      setSearchResults([])
      setSelectedStudents([])
    }
  }, [open])

  const handleToggleStudent = (student: StudentType) => {
    setSelectedStudents(prev => {
      const exists = prev.find(s => s.id === student.id)
      if (exists) {
        return prev.filter(s => s.id !== student.id)
      }
      return [...prev, student]
    })
  }

  const handleRemoveSelected = (studentId: string) => {
    setSelectedStudents(prev => prev.filter(s => s.id !== studentId))
  }

  const handleSubmit = async () => {
    if (selectedStudents.length === 0) {
      showNotificationRef.current('Vui lòng chọn ít nhất một học viên.', 'error')
      return
    }

    try {
      setSubmitting(true)
      const today = new Date().toISOString().split('T')[0]

      // Enroll từng học viên
      const results = await Promise.all(
        selectedStudents.map(student =>
          studentService.enrollStudent({
            studentId: student.id,
            classId: classData.id,
            enrollmentDate: today
          })
        )
      )

      const successCount = results.filter(r => r.success).length
      const failCount = results.length - successCount

      if (successCount > 0) {
        showNotificationRef.current(
          `Đã thêm ${successCount} học viên vào lớp${failCount > 0 ? `, ${failCount} thất bại` : ''}.`,
          failCount > 0 ? 'warning' : 'success'
        )
        onStudentsAdded?.()
        onClose()
      } else {
        showNotificationRef.current('Không thể thêm học viên vào lớp.', 'error')
      }
    } catch (error) {
      logger.error('AddStudentsToClassDrawer', 'Error enrolling students', error)
      showNotificationRef.current('Đã có lỗi khi thêm học viên.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 450 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Thêm học viên vào lớp</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />

      <Box className='p-5 flex flex-col gap-4 h-full'>
        {/* Thông tin lớp */}
        <Box className='flex items-center gap-2'>
          <Typography variant='body2' color='text.secondary'>
            Lớp:
          </Typography>
          <Chip label={classData.name} color='primary' size='small' />
          <Chip label={classData.code} variant='outlined' size='small' />
        </Box>

        {/* Học viên đã chọn */}
        {selectedStudents.length > 0 && (
          <Box>
            <Typography variant='subtitle2' className='mb-2'>
              Đã chọn ({selectedStudents.length}):
            </Typography>
            <Box className='flex flex-wrap gap-1'>
              {selectedStudents.map(student => (
                <Chip
                  key={student.id}
                  label={student.fullName}
                  size='small'
                  onDelete={() => handleRemoveSelected(student.id)}
                  color='primary'
                  variant='tonal'
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Tìm kiếm */}
        <TextField
          fullWidth
          label='Tìm học viên'
          placeholder='Nhập tên hoặc số điện thoại...'
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <i className='ri-search-line' />
              </InputAdornment>
            ),
            endAdornment: searching ? (
              <InputAdornment position='end'>
                <CircularProgress size={20} />
              </InputAdornment>
            ) : null
          }}
        />

        {/* Kết quả tìm kiếm */}
        <Box className='flex-1 overflow-auto'>
          {searchKeyword && searchResults.length === 0 && !searching ? (
            <Typography variant='body2' color='text.secondary' className='text-center py-4'>
              Không tìm thấy học viên phù hợp
            </Typography>
          ) : (
            <List dense>
              {searchResults.map(student => {
                const isSelected = selectedStudents.some(s => s.id === student.id)
                return (
                  <ListItem key={student.id} disablePadding>
                    <ListItemButton onClick={() => handleToggleStudent(student)} dense>
                      <Checkbox checked={isSelected} tabIndex={-1} disableRipple />
                      <ListItemText
                        primary={student.fullName}
                        secondary={
                          <Box className='flex items-center gap-2'>
                            <span>{student.phoneNumber || 'Chưa có SĐT'}</span>
                            {student.beltLevelName && (
                              <Chip label={student.beltLevelName} size='small' variant='outlined' />
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </List>
          )}
        </Box>

        {/* Actions */}
        <Box className='flex gap-4 pt-4'>
          <Button variant='outlined' onClick={onClose} fullWidth>
            Hủy
          </Button>
          <Button
            variant='contained'
            onClick={handleSubmit}
            disabled={selectedStudents.length === 0 || submitting}
            fullWidth
          >
            {submitting ? 'Đang thêm...' : `Thêm ${selectedStudents.length} học viên`}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AddStudentsToClassDrawer
