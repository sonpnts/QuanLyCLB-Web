'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Autocomplete from '@mui/material/Autocomplete'

// Type Imports
import type { ClassTransferType } from '@/types/apps/classTransferTypes'
import type { StudentType } from '@/types/apps/studentTypes'

// Service Imports
import classTransferService from '@/services/classTransferService'
import classService from '@/services/classService'
import studentService from '@/services/studentService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<ClassTransferType[]>>
}

const AddTransferDrawer = ({ open, handleClose, setData }: Props) => {
  const [formData, setFormData] = useState({
    studentId: '',
    fromClassId: '',
    toClassId: '',
    reason: ''
  })
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<StudentType[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)

  const { showNotification } = useNotification()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [classRes, studentRes] = await Promise.all([classService.getClasses({}), studentService.getStudents({})])
        if (classRes.success && classRes.data) setClasses(classRes.data)
        if (studentRes.success && studentRes.data) setStudents(studentRes.data)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    if (open) loadData()
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.studentId || !formData.fromClassId || !formData.toClassId) {
      showNotification('Vui lòng điền đầy đủ thông tin.', 'error')
      return
    }

    if (formData.fromClassId === formData.toClassId) {
      showNotification('Lớp đích phải khác lớp hiện tại.', 'error')
      return
    }

    try {
      setLoading(true)
      const response = await classTransferService.createClassTransfer({
        studentId: formData.studentId,
        fromClassId: formData.fromClassId,
        toClassId: formData.toClassId,
        reason: formData.reason || undefined
      })

      if (response.success && response.data) {
        setData(prev => [...prev, response.data!])
        showNotification('Tạo yêu cầu chuyển lớp thành công!', 'success')
        handleReset()
      } else {
        showNotification(response.message || 'Không thể tạo yêu cầu.', 'error')
      }
    } catch (error) {
      showNotification('Đã có lỗi khi tạo yêu cầu.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({ studentId: '', fromClassId: '', toClassId: '', reason: '' })
    setSelectedStudent(null)
    handleClose()
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
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
          <Autocomplete
            options={students}
            getOptionLabel={option => option.fullName}
            value={selectedStudent}
            onChange={(_, newValue) => {
              setSelectedStudent(newValue)
              setFormData({ ...formData, studentId: newValue?.id || '' })
            }}
            renderInput={params => <TextField {...params} label='Học viên *' />}
          />
          <FormControl fullWidth>
            <InputLabel>Từ lớp *</InputLabel>
            <Select
              label='Từ lớp *'
              value={formData.fromClassId}
              onChange={e => setFormData({ ...formData, fromClassId: e.target.value })}
            >
              {classes.map(cls => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Đến lớp *</InputLabel>
            <Select
              label='Đến lớp *'
              value={formData.toClassId}
              onChange={e => setFormData({ ...formData, toClassId: e.target.value })}
            >
              {classes.map(cls => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label='Lý do chuyển lớp'
            fullWidth
            multiline
            rows={3}
            value={formData.reason}
            onChange={e => setFormData({ ...formData, reason: e.target.value })}
          />
          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tạo yêu cầu'}
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

export default AddTransferDrawer
