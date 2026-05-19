'use client'

import { useEffect, useMemo, useState } from 'react'

import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import classService from '@/services/classService'
import studentAttendanceService from '@/services/studentAttendanceService'
import type { StudentAbsenceType } from '@/services/studentAttendanceService'
import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import { hasAdminRole } from '@/utils/roleUtils'

type ClassOption = {
  id: string
  code?: string
  name: string
}

type StudentOption = {
  id: string
  fullName: string
  phoneNumber?: string
}

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<StudentAbsenceType[]>>
}

const AddLeaveRequestDrawer = ({ open, handleClose, setData }: Props) => {
  const { auth } = useAuth()
  const isAdmin = hasAdminRole(auth?.roles)
  const { showNotification } = useNotification()

  const [classes, setClasses] = useState<ClassOption[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [classId, setClassId] = useState('')
  const [student, setStudent] = useState<StudentOption | null>(null)
  const [dateInput, setDateInput] = useState('')
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const selectedClassName = useMemo(() => classes.find(item => item.id === classId)?.name || '', [classes, classId])

  useEffect(() => {
    const loadClasses = async () => {
      if (!open) return

      const response = isAdmin
        ? await classService.getClasses({ isActive: true, pageSize: 1000 })
        : await studentAttendanceService.getCoachClasses()

      if (response.success && response.data) {
        const mapped = response.data.map((item: any) => ({
          id: item.id || item.classId,
          code: item.code || item.classCode,
          name: item.name || item.className
        }))
        setClasses(mapped)
      }
    }

    loadClasses()
  }, [open, isAdmin])

  useEffect(() => {
    const loadStudents = async () => {
      if (!classId) {
        setStudents([])
        return
      }

      const response = await classService.getClassStudents(classId, { pageNumber: 1, pageSize: 5000 })
      if (response.success && response.data) {
        setStudents(
          (response.data.records || []).map((item: any) => ({
            id: item.studentId || item.id,
            fullName: item.studentName || item.fullName || item.name,
            phoneNumber: item.phoneNumber || item.studentPhone
          }))
        )
      }
    }

    setStudent(null)
    loadStudents()
  }, [classId])

  const handleAddDate = () => {
    if (!dateInput) return
    setSelectedDates(prev => Array.from(new Set([...prev, dateInput])).sort())
    setDateInput('')
  }

  const handleReset = () => {
    setClassId('')
    setStudent(null)
    setDateInput('')
    setSelectedDates([])
    setReason('')
    setStudents([])
    handleClose()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!classId || !student?.id || selectedDates.length === 0 || !reason.trim()) {
      showNotification('Vui lòng chọn lớp, học viên, buổi nghỉ và nhập lý do.', 'error')
      return
    }

    try {
      setLoading(true)
      const response = await studentAttendanceService.createExcusedAbsences({
        classId,
        studentId: student.id,
        attendanceDates: selectedDates,
        reason: reason.trim()
      })

      if (!response.success) {
        showNotification(response.message || 'Không thể tạo xin nghỉ phép cho học viên.', 'error')
        return
      }

      if (response.data?.length) {
        setData(prev => {
          const existing = new Map(prev.map(item => [item.id, item]))
          response.data!.forEach(item => existing.set(item.id, item))
          return Array.from(existing.values()).sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate))
        })
      }

      showNotification('Đã ghi nhận xin nghỉ phép cho học viên.', 'success')
      handleReset()
    } catch {
      showNotification('Đã có lỗi khi tạo xin nghỉ phép.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 340, sm: 480 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Xin nghỉ phép</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          <FormControl fullWidth>
            <InputLabel>Lớp *</InputLabel>
            <Select label='Lớp *' value={classId} onChange={event => setClassId(String(event.target.value))}>
              {classes.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.code ? `${item.code} - ${item.name}` : item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Autocomplete
            options={students}
            value={student}
            disabled={!classId}
            getOptionLabel={option => option.fullName || ''}
            onChange={(_, value) => setStudent(value)}
            renderInput={params => (
              <TextField {...params} label='Tìm và chọn học viên *' placeholder={selectedClassName ? 'Nhập tên học viên...' : 'Chọn lớp trước'} />
            )}
          />

          <div className='flex gap-2'>
            <TextField
              fullWidth
              type='date'
              label='Buổi nghỉ'
              value={dateInput}
              onChange={event => setDateInput(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant='outlined' onClick={handleAddDate} disabled={!dateInput}>
              Thêm
            </Button>
          </div>

          <div className='flex flex-wrap gap-2'>
            {selectedDates.length === 0 ? (
              <Typography variant='body2' color='text.secondary'>
                Chưa chọn buổi nghỉ nào
              </Typography>
            ) : (
              selectedDates.map(date => (
                <Chip
                  key={date}
                  label={new Date(date).toLocaleDateString('vi-VN')}
                  onDelete={() => setSelectedDates(prev => prev.filter(item => item !== date))}
                  color='warning'
                  variant='tonal'
                />
              ))
            )}
          </div>

          <TextField
            fullWidth
            label='Lý do xin nghỉ phép *'
            multiline
            rows={4}
            value={reason}
            onChange={event => setReason(event.target.value)}
          />

          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu xin nghỉ phép'}
            </Button>
            <Button variant='outlined' color='error' onClick={handleReset}>
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddLeaveRequestDrawer
