'use client'

// React Imports
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

// MUI Imports
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { logger } from '@/utils/logger'

// Type Imports
import type { ClassTransferType } from '@/types/apps/classTransferTypes'
import type { StudentType } from '@/types/apps/studentTypes'

// Service Imports
import classTransferService from '@/services/classTransferService'
import classService from '@/services/classService'
import studentService from '@/services/studentService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'
import { hasAdminRole } from '@/utils/roleUtils'
import { hasPermission } from '@/utils/permissionUtils'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<ClassTransferType[]>>
}

/** Lấy lớp đang học (Active) đầu tiên của học viên */
const getActiveClass = (student: StudentType) =>
  student.classes?.find(c => c.status === 'Active') ?? student.classes?.[0] ?? null

/** Hiển thị học viên trong dropdown: "Tên – Lớp A, Lớp B" */
const studentLabel = (s: StudentType) => {
  const classNames = s.classes?.filter(c => c.status === 'Active').map(c => c.className).join(', ')

  
return classNames ? `${s.fullName}  –  ${classNames}` : s.fullName
}

const AddTransferDrawer = ({ open, handleClose, setData }: Props) => {
  const { auth } = useAuth()
  const isAdmin = hasPermission(auth?.permissions, 'ClassTransfer.Approve') || hasAdminRole(auth?.roles)
  const currentUserId = auth?.user.id

  // ── Form state ────────────────────────────────────────────────────────────
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)
  const [fromClassId, setFromClassId] = useState('')
  const [fromClassName, setFromClassName] = useState('')
  const [toClassId, setToClassId] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  // ── Student search (debounced) ────────────────────────────────────────────
  const [studentInput, setStudentInput] = useState('')
  const [studentOptions, setStudentOptions] = useState<StudentType[]>([])
  const [studentLoading, setStudentLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── All active classes ────────────────────────────────────────────────────
  const [classes, setClasses] = useState<any[]>([])
  const [myClasses, setMyClasses] = useState<any[]>([])
  const [classesLoaded, setClassesLoaded] = useState(false)

  const { showNotification } = useNotification()

  // ── Load classes on open ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return

    const load = async () => {
      try {
        // Coach needs to be able to select destination among all active classes.
        const res = await classService.getClassLookup({ isActive: true, pageSize: 5000 })

        if (res.success && res.data) setClasses(res.data)

        // For non-admin, still load "my classes" to validate FromClass permission.
        if (!isAdmin && currentUserId) {
          const mine = await classService.getClassesByUserId(currentUserId, { isActive: true, pageSize: 2000 })

          if (mine.success && mine.data) setMyClasses(mine.data)
        } else {
          setMyClasses([])
        }
      } catch (err) {
        logger.error('AddTransferDrawer', 'Error loading classes', err)
      } finally {
        setClassesLoaded(true)
      }
      }

    load()
  }, [open, isAdmin, currentUserId])

  // ── Load initial students when drawer opens ───────────────────────────────
  // Debounced student search
  const searchStudents = useCallback(async (keyword: string) => {
    setStudentLoading(true)

    try {
      if (isAdmin) {
        const res = await studentService.getStudents({ keyword, isSuspended: false, pageSize: 50 })

        setStudentOptions(res.success && res.data ? res.data : [])

        return
      }

      if (!classesLoaded) {
        setStudentOptions([])

        return
      }

      const classIds = myClasses.map(cls => cls.id).filter(Boolean)

      if (classIds.length === 0) {
        setStudentOptions([])

        return
      }

      const responses = await Promise.all(
        classIds.map(classId => studentService.getStudents({ classId, keyword, isSuspended: false, pageSize: 100 }))
      )

      const merged = responses
        .filter(response => response.success && Array.isArray(response.data))
        .flatMap(response => response.data || [])

      const uniqueStudents = Array.from(new Map(merged.map(student => [student.id, student])).values())

      setStudentOptions(uniqueStudents)
    } catch (err) {
      logger.error('AddTransferDrawer', 'Error searching students', err)
      setStudentOptions([])
    } finally {
      setStudentLoading(false)
    }
  }, [classesLoaded, isAdmin, myClasses])

  useEffect(() => {
    if (!open || (!isAdmin && !classesLoaded)) return
    searchStudents('')
  }, [open, isAdmin, classesLoaded, searchStudents])

  const handleStudentInputChange = (_: React.SyntheticEvent, value: string) => {
    setStudentInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchStudents(value), 350)
  }

  // ── When student is selected, auto-fill from-class ───────────────────────
  const handleStudentChange = (_: React.SyntheticEvent, student: StudentType | null) => {
    setSelectedStudent(student)
    setToClassId('')

    if (student) {
      const active = getActiveClass(student)

      setFromClassId(active?.classId ?? '')
      setFromClassName(active?.className ?? 'Chưa có lớp')
    } else {
      setFromClassId('')
      setFromClassName('')
    }
  }

  // ── Class options filtered by role ────────────────────────────────────────
  const fromClassOptions = useMemo(() => {
    if (isAdmin) return classes
    
return myClasses
  }, [classes, myClasses, isAdmin])

  // To-class: exclude the from-class, only from active classes
  const toClassOptions = useMemo(
    () =>
      classes
        .filter(c => c.id !== fromClassId)
        .slice()
        .sort((a, b) => String(a.code || '').localeCompare(String(b.code || ''), 'vi')),
    [classes, fromClassId]
  )

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStudent || !fromClassId || !toClassId) {
      showNotification('Vui lòng chọn học viên và lớp đích.', 'error')
      
return
    }

    if (!reason.trim()) {
      showNotification('Vui lòng nhập lý do chuyển lớp.', 'error')
      
return
    }

    if (fromClassId === toClassId) {
      showNotification('Lớp đích phải khác lớp hiện tại.', 'error')
      
return
    }

    if (!isAdmin) {
      const allowed = fromClassOptions.some(c => c.id === fromClassId)

      if (!allowed) {
        showNotification('Bạn chỉ có thể tạo yêu cầu từ lớp mình đang phụ trách.', 'error')
        
return
      }
    }

    try {
      setLoading(true)

      const response = await classTransferService.createClassTransfer({
        studentId: selectedStudent.id,
        fromClassId,
        toClassId,
        reason: reason.trim()
      })

      if (response.success && response.data) {
        setData(prev => [...prev, response.data!])
        showNotification('Tạo yêu cầu chuyển lớp thành công!', 'success')
        handleReset()
      } else {
        showNotification(response.message || 'Không thể tạo yêu cầu.', 'error')
      }
    } catch (error: any) {
      if (error?.response?.status === 403) {
        showNotification('Không có quyền tạo yêu cầu chuyển lớp từ lớp nguồn này.', 'error')
      } else {
        showNotification('Đã có lỗi khi tạo yêu cầu.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedStudent(null)
    setStudentInput('')
    setFromClassId('')
    setFromClassName('')
    setToClassId('')
    setReason('')
    handleClose()
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 440 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Tạo yêu cầu chuyển lớp</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />

      <div className='p-5'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          {!isAdmin && (
            <Typography variant='body2' color='warning.main'>
              Chỉ hiển thị lớp bạn đang được phân công để tạo yêu cầu chuyển lớp.
            </Typography>
          )}

          {/* ── Tìm kiếm học viên ─────────────────────────────────── */}
          <Autocomplete
            options={studentOptions}
            getOptionLabel={studentLabel}
            value={selectedStudent}
            inputValue={studentInput}
            onInputChange={handleStudentInputChange}
            onChange={handleStudentChange}
            loading={studentLoading}
            filterOptions={x => x}   // tắt client-side filter, để server filter
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            noOptionsText='Không tìm thấy học viên'
            loadingText='Đang tìm...'
            renderOption={(props, option) => {
              const activeClass = getActiveClass(option)

              
return (
                <Box component='li' {...props} key={option.id}>
                  <Box>
                    <Typography variant='body2' fontWeight={500}>
                      {option.fullName}
                    </Typography>
                    {activeClass && (
                      <Typography variant='caption' color='text.secondary'>
                        {activeClass.className}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )
            }}
            renderInput={params => (
              <TextField
                {...params}
                label='Học viên *'
                placeholder='Tìm theo tên...'
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {studentLoading && <CircularProgress size={16} />}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />

          {/* ── Lớp hiện tại (read-only, tự điền khi chọn HV) ────── */}
          <TextField
            label='Lớp hiện tại'
            value={fromClassName}
            disabled
            fullWidth
            placeholder='Tự động điền khi chọn học viên'
            helperText={
              selectedStudent && !fromClassId
                ? 'Học viên này chưa được ghi danh vào lớp nào'
                : ''
            }
            InputProps={{ readOnly: true }}
          />

          {/* ── Lớp đích ──────────────────────────────────────────── */}
          <FormControl fullWidth>
            <InputLabel>Chuyển đến lớp *</InputLabel>
            <Select
              label='Chuyển đến lớp *'
              value={toClassId}
              onChange={e => setToClassId(e.target.value)}
              disabled={!fromClassId}
            >
              {toClassOptions.map(cls => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.code || cls.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* ── Lý do ─────────────────────────────────────────────── */}
          <TextField
            label='Lý do chuyển lớp *'
            fullWidth
            multiline
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
          />

          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit' disabled={loading || !fromClassId}>
              {loading ? 'Đang xử lý...' : 'Tạo yêu cầu'}
            </Button>
            <Button variant='outlined' color='error' onClick={handleReset} disabled={loading}>
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddTransferDrawer

