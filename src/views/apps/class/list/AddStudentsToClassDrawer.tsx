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

  // Search students vá»›i debounce
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
          // Lá»c bá» há»c viÃªn Ä‘Ã£ cÃ³ trong lá»›p nÃ y
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

  // Reset khi Ä‘Ã³ng drawer
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
      showNotificationRef.current('Vui lÃ²ng chá»n Ã­t nháº¥t má»™t há»c viÃªn.', 'error')
      return
    }

    try {
      setSubmitting(true)
      const today = new Date().toISOString().split('T')[0]

      // Enroll tá»«ng há»c viÃªn
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
          `ÄÃ£ thÃªm ${successCount} há»c viÃªn vÃ o lá»›p${failCount > 0 ? `, ${failCount} tháº¥t báº¡i` : ''}.`,
          failCount > 0 ? 'warning' : 'success'
        )
        onStudentsAdded?.()
        onClose()
      } else {
        showNotificationRef.current('KhÃ´ng thá»ƒ thÃªm há»c viÃªn vÃ o lá»›p.', 'error')
      }
    } catch (error) {
      logger.error('AddStudentsToClassDrawer', 'Error enrolling students', error)
      showNotificationRef.current('ÄÃ£ cÃ³ lá»—i khi thÃªm há»c viÃªn.', 'error')
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
        <Typography variant='h5'>ThÃªm há»c viÃªn vÃ o lá»›p</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />

      <Box className='p-5 flex flex-col gap-4 h-full'>
        {/* ThÃ´ng tin lá»›p */}
        <Box className='flex items-center gap-2'>
          <Typography variant='body2' color='text.secondary'>
            Lá»›p:
          </Typography>
          <Chip label={classData.name} color='primary' size='small' />
          <Chip label={classData.code} variant='outlined' size='small' />
        </Box>

        {/* Há»c viÃªn Ä‘Ã£ chá»n */}
        {selectedStudents.length > 0 && (
          <Box>
            <Typography variant='subtitle2' className='mb-2'>
              ÄÃ£ chá»n ({selectedStudents.length}):
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

        {/* TÃ¬m kiáº¿m */}
        <TextField
          fullWidth
          label='TÃ¬m há»c viÃªn'
          placeholder='Nháº­p tÃªn hoáº·c sá»‘ Ä‘iá»‡n thoáº¡i...'
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

        {/* Káº¿t quáº£ tÃ¬m kiáº¿m */}
        <Box className='flex-1 overflow-auto'>
          {searchKeyword && searchResults.length === 0 && !searching ? (
            <Typography variant='body2' color='text.secondary' className='text-center py-4'>
              KhÃ´ng tÃ¬m tháº¥y há»c viÃªn phÃ¹ há»£p
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
                            <span>{student.phoneNumber || 'ChÆ°a cÃ³ SÄT'}</span>
                            {student.currentBeltLevelName && (
                              <Chip label={student.currentBeltLevelName} size='small' variant='outlined' />
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
            Há»§y
          </Button>
          <Button
            variant='contained'
            onClick={handleSubmit}
            disabled={selectedStudents.length === 0 || submitting}
            fullWidth
          >
            {submitting ? 'Äang thÃªm...' : `ThÃªm ${selectedStudents.length} há»c viÃªn`}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AddStudentsToClassDrawer
