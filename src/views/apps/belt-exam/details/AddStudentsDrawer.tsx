'use client'
import { logger } from '@/utils/logger'

import { useState, useEffect } from 'react'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Checkbox from '@mui/material/Checkbox'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Box from '@mui/material/Box'
import { toast } from 'react-toastify'

import classService from '@/services/classService'
import beltExamService from '@/services/beltExamService'
import type { ClassType } from '@/types/apps/classTypes'

interface AddStudentsDrawerProps {
  open: boolean
  handleClose: () => void
  sessionId: string
  onSuccess: () => void
}

const AddStudentsDrawer = ({ open, handleClose, sessionId, onSuccess }: AddStudentsDrawerProps) => {
  const [classes, setClasses] = useState<ClassType[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null)
  
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      fetchClasses()
      resetState()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const resetState = () => {
    setSelectedClass(null)
    setStudents([])
    setSelectedStudents([])
  }

  const fetchClasses = async () => {
    setLoadingClasses(true)
    try {
      const res = await classService.getClasses({ isActive: true, pageSize: 1000 })
      if (res.success && res.data) {
        setClasses(res.data)
      }
    } catch (error) {
      logger.error('AddStudentsDrawer', 'Error fetching classes', error)
    } finally {
      setLoadingClasses(false)
    }
  }

  const fetchStudents = async (classId: string) => {
    setLoadingStudents(true)
    try {
      const res = await classService.getClassStudents(classId)
      if (res.success && res.data) {
        // Chỉ lấy học viên Active (giả sử có trường isActive)
        const activeStudents = res.data.filter((s: any) => s.isActive !== false)
        setStudents(activeStudents)
        // Mặc định chọn tất cả
        setSelectedStudents(activeStudents.map((s: any) => s.id))
      }
    } catch (error) {
      logger.error('AddStudentsDrawer', 'Error fetching students', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleClassChange = (newClass: ClassType | null) => {
    setSelectedClass(newClass)
    if (newClass) {
      fetchStudents(newClass.id!)
    } else {
      setStudents([])
      setSelectedStudents([])
    }
  }

  const handleToggle = (studentId: string) => {
    const currentIndex = selectedStudents.indexOf(studentId)
    const newSelected = [...selectedStudents]

    if (currentIndex === -1) {
      newSelected.push(studentId)
    } else {
      newSelected.splice(currentIndex, 1)
    }
    setSelectedStudents(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map(s => s.id))
    }
  }

  const handleSubmit = async () => {
    if (!selectedClass || selectedStudents.length === 0) return

    setSubmitting(true)
    try {
      const payload = {
        examSessionId: sessionId,
        classId: selectedClass.id!,
        studentIds: selectedStudents
      }

      // Giả sử gọi batchExamRegistration
      const res = await beltExamService.batchExamRegistration(payload)
      if (res.success) {
        toast.success(res.message || 'Thêm học viên dự thi thành công')
        onSuccess()
        handleClose()
      } else {
        toast.error(res.message || 'Có lỗi xảy ra khi thêm học viên')
      }
    } catch (error) {
      logger.error('AddStudentsDrawer', 'Error submitting registrations', error)
      toast.error('Có lỗi xảy ra khi thêm học viên')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <Box className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Thêm Võ Sinh Dự Thi</Typography>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </Box>
      <Divider />
      
      <Box className='flex flex-col gap-5 p-5'>
        <Autocomplete
          options={classes}
          getOptionLabel={option => option.name || ''}
          value={selectedClass}
          onChange={(_, newValue) => handleClassChange(newValue)}
          loading={loadingClasses}
          renderInput={params => (
            <TextField
              {...params}
              label='Chọn Lớp'
              variant='outlined'
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingClasses ? <CircularProgress color='inherit' size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                )
              }}
            />
          )}
        />

        {selectedClass && (
          <Box>
            <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
              <Typography variant='subtitle2'>
                Lựa chọn Võ sinh ({selectedStudents.length}/{students.length})
              </Typography>
              <Button size='small' onClick={handleSelectAll}>
                {selectedStudents.length === students.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </Button>
            </Box>
            
            {loadingStudents ? (
              <Box display='flex' justifyContent='center' my={4}>
                <CircularProgress />
              </Box>
            ) : students.length > 0 ? (
              <List sx={{ width: '100%', bgcolor: 'background.paper', border: '1px solid var(--mui-palette-divider)', borderRadius: 1, maxHeight: 400, overflow: 'auto' }}>
                {students.map((student) => {
                  const labelId = `checkbox-list-label-${student.id}`
                  const isChecked = selectedStudents.indexOf(student.id) !== -1

                  return (
                    <ListItem
                      key={student.id}
                      disablePadding
                      onClick={() => handleToggle(student.id)}
                      sx={{ borderBottom: '1px solid var(--mui-palette-divider)', '&:last-child': { borderBottom: 'none' } }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge='start'
                          checked={isChecked}
                          tabIndex={-1}
                          disableRipple
                          inputProps={{ 'aria-labelledby': labelId }}
                        />
                      </ListItemIcon>
                      <ListItemText 
                        id={labelId} 
                        primary={student.fullName || student.name} 
                        secondary={student.currentBeltLevelName ? `Đai: ${student.currentBeltLevelName}` : 'Chưa có cấp đai'} 
                      />
                    </ListItem>
                  )
                })}
              </List>
            ) : (
              <Typography color='textSecondary' align='center' my={4}>
                Không có võ sinh nào trong lớp.
              </Typography>
            )}
          </Box>
        )}

        <Box className='flex items-center gap-4' mt={4}>
          <Button 
            variant='contained' 
            onClick={handleSubmit} 
            disabled={!selectedClass || selectedStudents.length === 0 || submitting}
            fullWidth
          >
            {submitting ? 'Đang thêm...' : 'Xác nhận Thêm Học viên'}
          </Button>
          <Button variant='outlined' color='secondary' onClick={handleClose} fullWidth>
            Huỷ
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default AddStudentsDrawer
