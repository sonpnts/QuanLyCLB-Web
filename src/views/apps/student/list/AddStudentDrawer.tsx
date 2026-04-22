'use client'
import { logger } from '@/utils/logger'

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

// Type Imports
import type { StudentType } from '@/types/apps/studentTypes'
import type { BeltLevelType } from '@/types/apps/beltExamTypes'

// Service Imports
import studentService from '@/services/studentService'
import beltExamService from '@/services/beltExamService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<StudentType[]>>
}

const AddStudentDrawer = ({ open, handleClose, setData }: Props) => {
  // States
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    address: '',
    identityNumber: '',
    dateOfBirth: '',
    gender: '',
    currentBeltLevelId: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [beltLevels, setBeltLevels] = useState<BeltLevelType[]>([])

  const { showNotification } = useNotification()

  // Load belt levels
  useEffect(() => {
    const loadBeltLevels = async () => {
      try {
        const response = await beltExamService.getBeltLevels()

        if (response.success && Array.isArray(response.data)) {
          setBeltLevels(response.data)
        } else {
          setBeltLevels([])
        }
      } catch (error) {
        logger.error('AddStudentDrawer', 'Error loading belt levels', error)
        setBeltLevels([])
      }
    }

    if (open) {
      loadBeltLevels()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.fullName.trim()) {
      showNotification('Vui lòng nhập họ tên học viên.', 'error')

      return
    }

    try {
      setLoading(true)

      const response = await studentService.createStudent({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        identityNumber: formData.identityNumber || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender !== '' ? formData.gender === 'true' : undefined,
        currentBeltLevelId: formData.currentBeltLevelId || undefined,
        notes: formData.notes || undefined
      })

      if (response.success && response.data) {
        setData(prev => [...prev, response.data!])
        showNotification('Thêm học viên thành công!', 'success')
        handleReset()
      } else {
        showNotification(response.message || 'Không thể thêm học viên.', 'error')
      }
    } catch (error) {
      showNotification('Đã có lỗi khi thêm học viên.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      fullName: '',
      phoneNumber: '',
      email: '',
      address: '',
      identityNumber: '',
      dateOfBirth: '',
      gender: '',
      currentBeltLevelId: '',
      notes: ''
    })
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
        <Typography variant='h5'>Thêm học viên mới</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          <TextField
            label='Họ và tên *'
            fullWidth
            value={formData.fullName}
            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
          />
          <TextField
            label='Số điện thoại'
            fullWidth
            value={formData.phoneNumber}
            onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
          />
          <TextField
            label='Email'
            type='email'
            fullWidth
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField
            label='Địa chỉ'
            fullWidth
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
          />
          <TextField
            label='CMND/CCCD'
            fullWidth
            value={formData.identityNumber}
            onChange={e => setFormData({ ...formData, identityNumber: e.target.value })}
          />
          <TextField
            label='Ngày sinh'
            type='date'
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.dateOfBirth}
            onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
          <FormControl fullWidth>
            <InputLabel>Giới tính</InputLabel>
            <Select
              label='Giới tính'
              value={formData.gender}
              onChange={e => setFormData({ ...formData, gender: e.target.value })}
            >
              <MenuItem value=''>Chọn giới tính</MenuItem>
              <MenuItem value='true'>Nam</MenuItem>
              <MenuItem value='false'>Nữ</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Cấp đai hiện tại</InputLabel>
            <Select
              label='Cấp đai hiện tại'
              value={formData.currentBeltLevelId}
              onChange={e => setFormData({ ...formData, currentBeltLevelId: e.target.value })}
            >
              <MenuItem value=''>Chưa có cấp đai</MenuItem>
              {beltLevels.map(belt => (
                <MenuItem key={belt.id} value={belt.id}>
                  {belt.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label='Ghi chú'
            fullWidth
            multiline
            rows={3}
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Thêm mới'}
            </Button>
            <Button variant='outlined' color='error' type='reset' onClick={handleReset}>
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddStudentDrawer
