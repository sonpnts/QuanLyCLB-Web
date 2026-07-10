'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { toLocalDateString } from '@/utils/dateTime'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
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
  classData: ClassType
  onStudentsAdded?: () => void
}

const PAGE_SIZE = 20

const mergeStudents = (current: StudentType[], incoming: StudentType[]) => {
  const studentMap = new Map<string, StudentType>()

  current.forEach(student => studentMap.set(student.id, student))
  incoming.forEach(student => studentMap.set(student.id, student))

  return Array.from(studentMap.values())
}

const AddStudentsToClassDrawer = ({ open, onClose, classData, onStudentsAdded }: Props) => {
  const { showNotification } = useNotification()
  const showNotificationRef = useRef(showNotification)

  showNotificationRef.current = showNotification

  const [searchKeyword, setSearchKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [students, setStudents] = useState<StudentType[]>([])
  const [selectedStudents, setSelectedStudents] = useState<StudentType[]>([])
  const [pageNumber, setPageNumber] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const listRef = useRef<HTMLDivElement | null>(null)
  const isFetchingRef = useRef(false)
  const requestSequenceRef = useRef(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedKeyword(searchKeyword.trim())
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchKeyword])

  const loadStudents = useCallback(
    async (nextPage: number, keyword: string, replace = false) => {
      if (isFetchingRef.current && !replace) return

      const requestId = ++requestSequenceRef.current

      try {
        isFetchingRef.current = true

        if (replace) {
          setLoadingInitial(true)
        } else {
          setLoadingMore(true)
        }

        const response = await studentService.getStudentsPaged({
          pageNumber: nextPage,
          pageSize: PAGE_SIZE,
          keyword: keyword || undefined,
          withoutClass: true
        })

        if (requestId !== requestSequenceRef.current) return

        if (response.success && response.data) {
          const nextRecords = response.data.records || []
          const totalRecords = response.data.totalRecords || 0

          let mergedCount = nextRecords.length

          setStudents(prev => {
            const nextList = replace ? nextRecords : mergeStudents(prev, nextRecords)

            mergedCount = nextList.length

            return nextList
          })
          setPageNumber(nextPage)
          setHasMore(mergedCount < totalRecords)
        } else if (replace) {
          setStudents([])
          setPageNumber(1)
          setHasMore(false)
        }
      } catch (error) {
        if (requestId !== requestSequenceRef.current) return

        logger.error('AddStudentsToClassDrawer', 'Error fetching students without class', error)

        if (replace) {
          setStudents([])
          setPageNumber(1)
          setHasMore(false)
        }
      } finally {
        if (requestId === requestSequenceRef.current) {
          isFetchingRef.current = false
          setLoadingInitial(false)
          setLoadingMore(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    if (!open) return

    setStudents([])
    setPageNumber(1)
    setHasMore(false)
    loadStudents(1, debouncedKeyword, true)
  }, [debouncedKeyword, loadStudents, open])

  useEffect(() => {
    if (!open) {
      requestSequenceRef.current += 1
      isFetchingRef.current = false
      setSearchKeyword('')
      setDebouncedKeyword('')
      setStudents([])
      setSelectedStudents([])
      setPageNumber(1)
      setHasMore(false)
      setLoadingInitial(false)
      setLoadingMore(false)
    }
  }, [open])

  const handleToggleStudent = (student: StudentType) => {
    setSelectedStudents(prev => {
      const exists = prev.some(item => item.id === student.id)

      return exists ? prev.filter(item => item.id !== student.id) : [...prev, student]
    })
  }

  const handleRemoveSelected = (studentId: string) => {
    setSelectedStudents(prev => prev.filter(student => student.id !== studentId))
  }

  const handleScroll = useCallback(() => {
    const container = listRef.current

    if (!container || loadingInitial || loadingMore || !hasMore) return

    const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 120

    if (isNearBottom) {
      loadStudents(pageNumber + 1, debouncedKeyword)
    }
  }, [debouncedKeyword, hasMore, loadStudents, loadingInitial, loadingMore, pageNumber])

  const handleSubmit = async () => {
    if (selectedStudents.length === 0) {
      showNotificationRef.current('Vui long chon it nhat mot hoc vien.', 'error')

      return
    }

    try {
      setSubmitting(true)
      const today = toLocalDateString()

      const results = await Promise.all(
        selectedStudents.map(student =>
          studentService.enrollStudent({
            studentId: student.id,
            classId: classData.id,
            enrollmentDate: today
          })
        )
      )

      const successCount = results.filter(result => result.success).length
      const failCount = results.length - successCount

      if (successCount > 0) {
        showNotificationRef.current(
          `Da them ${successCount} hoc vien vao lop${failCount > 0 ? `, ${failCount} that bai` : ''}.`,
          failCount > 0 ? 'warning' : 'success'
        )
        onStudentsAdded?.()
        onClose()
      } else {
        showNotificationRef.current('Khong the them hoc vien vao lop.', 'error')
      }
    } catch (error) {
      logger.error('AddStudentsToClassDrawer', 'Error enrolling students', error)
      showNotificationRef.current('Da co loi khi them hoc vien.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const emptyMessage = useMemo(() => {
    if (loadingInitial) return 'Dang tai danh sach hoc vien...'
    if (debouncedKeyword) return 'Khong tim thay hoc vien chua co lop phu hop.'

    return 'Khong con hoc vien nao chua co lop.'
  }, [debouncedKeyword, loadingInitial])

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
        <Typography variant='h5'>Them hoc vien vao lop</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />

      <Box className='flex h-full flex-col gap-4 p-5'>
        <Box className='flex items-center gap-2'>
          <Typography variant='body2' color='text.secondary'>
            Lop:
          </Typography>
          <Chip label={classData.name} color='primary' size='small' />
          <Chip label={classData.code} variant='outlined' size='small' />
        </Box>

        {selectedStudents.length > 0 && (
          <Box>
            <Typography variant='subtitle2' className='mb-2'>
              Da chon ({selectedStudents.length}):
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

        <TextField
          fullWidth
          label='Tim hoc vien chua co lop'
          placeholder='Nhap ten hoac so dien thoai...'
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <i className='ri-search-line' />
              </InputAdornment>
            ),
            endAdornment: loadingInitial ? (
              <InputAdornment position='end'>
                <CircularProgress size={20} />
              </InputAdornment>
            ) : null
          }}
        />

        <Box ref={listRef} className='flex-1 overflow-auto' onScroll={handleScroll}>
          {students.length === 0 ? (
            <Typography variant='body2' color='text.secondary' className='py-4 text-center'>
              {emptyMessage}
            </Typography>
          ) : (
            <List dense>
              {students.map(student => {
                const isSelected = selectedStudents.some(item => item.id === student.id)

                return (
                  <ListItem key={student.id} disablePadding>
                    <ListItemButton onClick={() => handleToggleStudent(student)} dense>
                      <Checkbox checked={isSelected} tabIndex={-1} disableRipple />
                      <ListItemText
                        primary={student.fullName}
                        secondary={
                          <Box className='flex items-center gap-2'>
                            <span>{student.phoneNumber || 'Chua co SDT'}</span>
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
              {loadingMore && (
                <ListItem>
                  <Box className='flex w-full items-center justify-center py-3'>
                    <CircularProgress size={22} />
                  </Box>
                </ListItem>
              )}
            </List>
          )}
        </Box>

        <Box className='flex gap-4 pt-4'>
          <Button variant='outlined' onClick={onClose} fullWidth>
            Huy
          </Button>
          <Button variant='contained' onClick={handleSubmit} disabled={selectedStudents.length === 0 || submitting} fullWidth>
            {submitting ? 'Dang them...' : `Them ${selectedStudents.length} hoc vien`}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AddStudentsToClassDrawer
