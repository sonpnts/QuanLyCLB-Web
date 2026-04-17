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
        const response = await classService.getClasses({})

        if (response.success && response.data) {
          setClasses(response.data)
          // Hiá»ƒn thá»‹ máº·c Ä‘á»‹nh 5 lá»›p Ä‘áº§u tiÃªn
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

  // Lá»c bá» cÃ¡c lá»›p há»c viÃªn Ä‘Ã£ Ä‘Äƒng kÃ½
  const getAvailableClasses = useCallback(() => {
    if (!student) return filteredClasses

    const enrolledClassIds = ((student as any).classes || []).map((c: any) => c.classId)
    return filteredClasses.filter(cls => !enrolledClassIds.includes(cls.id))
  }, [filteredClasses, student])

  // Reset khi Ä‘Ã³ng drawer
  useEffect(() => {
    if (!open) {
      setSelectedClassId('')
      setSearchKeyword('')
      setEnrollmentDate('')
      setNotes('')
    } else {
      // Set ngÃ y máº·c Ä‘á»‹nh lÃ  hÃ´m nay
      setEnrollmentDate(new Date().toISOString().split('T')[0])
    }
  }, [open])

  const handleSubmit = async () => {
    if (!student || !selectedClassId) {
      showNotificationRef.current('Vui lÃ²ng chá»n lá»›p há»c.', 'error')
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
        showNotificationRef.current(response.message || 'ÄÄƒng kÃ½ lá»›p há»c thÃ nh cÃ´ng!', 'success')
        onEnrolled?.()
        onClose()
      } else {
        showNotificationRef.current(response.message || 'KhÃ´ng thá»ƒ Ä‘Äƒng kÃ½ lá»›p há»c.', 'error')
      }
    } catch (error) {
      logger.error('EnrollStudentDrawer', 'Error enrolling student', error)
      showNotificationRef.current('ÄÃ£ cÃ³ lá»—i khi Ä‘Äƒng kÃ½ lá»›p há»c.', 'error')
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
        <Typography variant='h5'>ÄÄƒng kÃ½ lá»›p há»c</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />

      <Box className='p-5 flex flex-col gap-4'>
        {/* ThÃ´ng tin há»c viÃªn */}
        <Box className='flex items-center gap-2'>
          <Typography variant='body2' color='text.secondary'>
            Há»c viÃªn:
          </Typography>
          <Chip label={student.fullName} color='primary' size='small' />
        </Box>

        {/* CÃ¡c lá»›p Ä‘Ã£ Ä‘Äƒng kÃ½ */}
        {((student as any).classes || []).length > 0 && (
          <Box>
            <Typography variant='body2' color='text.secondary' className='mb-1'>
              Äang há»c:
            </Typography>
            <Box className='flex flex-wrap gap-1'>
              {((student as any).classes || []).map((c: any) => (
                <Chip key={c.classId} label={c.className} size='small' variant='outlined' />
              ))}
            </Box>
          </Box>
        )}

        {/* TÃ¬m kiáº¿m lá»›p */}
        <TextField
          fullWidth
          label='TÃ¬m lá»›p há»c'
          placeholder='Nháº­p tÃªn hoáº·c mÃ£ lá»›p...'
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

        {/* Chá»n lá»›p */}
        <FormControl fullWidth>
          <InputLabel>Chá»n lá»›p há»c *</InputLabel>
          <Select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            label='Chá»n lá»›p há»c *'
            disabled={loading}
          >
            {loading ? (
              <MenuItem disabled>
                <CircularProgress size={20} className='mr-2' /> Äang táº£i...
              </MenuItem>
            ) : availableClasses.length === 0 ? (
              <MenuItem disabled>KhÃ´ng cÃ³ lá»›p phÃ¹ há»£p</MenuItem>
            ) : (
              availableClasses.map(cls => (
                <MenuItem key={cls.id} value={cls.id}>
                  <Box className='flex items-center gap-2'>
                    <span>{cls.name}</span>
                    <Chip label={cls.code} size='small' variant='outlined' />
                    <Typography variant='caption' color='text.secondary'>
                      ({cls.currentStudents || 0}/{cls.maxStudents})
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        {/* ThÃ´ng tin lá»›p Ä‘Ã£ chá»n */}
        {selectedClass && (
          <Box className='p-3 bg-gray-50 rounded'>
            <Typography variant='subtitle2'>{selectedClass.name}</Typography>
            <Typography variant='body2' color='text.secondary'>
              MÃ£ lá»›p: {selectedClass.code}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              SÄ© sá»‘: {selectedClass.currentStudents || 0}/{selectedClass.maxStudents}
            </Typography>
            {selectedClass.description && (
              <Typography variant='body2' color='text.secondary'>
                {selectedClass.description}
              </Typography>
            )}
          </Box>
        )}

        {/* NgÃ y Ä‘Äƒng kÃ½ */}
        <TextField
          fullWidth
          type='date'
          label='NgÃ y Ä‘Äƒng kÃ½'
          value={enrollmentDate}
          onChange={e => setEnrollmentDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />

        {/* Ghi chÃº */}
        <TextField
          fullWidth
          multiline
          rows={2}
          label='Ghi chÃº'
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder='Ghi chÃº thÃªm (tÃ¹y chá»n)...'
        />

        {/* Actions */}
        <Box className='flex gap-4 pt-4'>
          <Button variant='outlined' onClick={onClose} fullWidth>
            Há»§y
          </Button>
          <Button variant='contained' onClick={handleSubmit} disabled={!selectedClassId || submitting} fullWidth>
            {submitting ? 'Äang Ä‘Äƒng kÃ½...' : 'ÄÄƒng kÃ½'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default EnrollStudentDrawer
