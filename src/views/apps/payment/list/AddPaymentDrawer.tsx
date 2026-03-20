'use client'

import { useState, useEffect } from 'react'
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

import type { PaymentRecordType } from '@/types/apps/paymentTypes'
import type { StudentType } from '@/types/apps/studentTypes'

import paymentService from '@/services/paymentService'
import classService from '@/services/classService'
import studentService from '@/services/studentService'
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<PaymentRecordType[]>>
}

const AddPaymentDrawer = ({ open, handleClose, setData }: Props) => {
  const [formData, setFormData] = useState({
    studentId: '',
    classId: '',
    paymentType: 'MonthlyFee',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notes: ''
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

    if (!formData.studentId || !formData.amount) {
      showNotification('Vui lòng điền đầy đủ thông tin.', 'error')
      return
    }

    try {
      setLoading(true)

      // Map string values to numbers
      let typeNum = 0
      if (formData.paymentType === 'ExamFee') typeNum = 1
      else if (formData.paymentType === 'RegistrationFee') typeNum = 2
      else if (formData.paymentType === 'Other') typeNum = 3

      let methodNum = 0
      if (formData.paymentMethod === 'BankTransfer') methodNum = 1
      else if (formData.paymentMethod === 'Card') methodNum = 2

      const response = await paymentService.createPayment({
        studentId: formData.studentId,
        classId: formData.classId || undefined,
        type: typeNum,
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        method: methodNum,
        forMonth: formData.month,
        forYear: formData.year,
        description: formData.notes || undefined
      })

      if (response.success && response.data) {
        setData(prev => [...prev, response.data!])
        showNotification('Thêm thanh toán thành công!', 'success')
        handleReset()
      } else {
        showNotification(response.message || 'Không thể thêm thanh toán.', 'error')
      }
    } catch (error) {
      showNotification('Đã có lỗi khi thêm thanh toán.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      studentId: '',
      classId: '',
      paymentType: 'MonthlyFee',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      notes: ''
    })
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
        <Typography variant='h5'>Thêm thanh toán</Typography>
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
            <InputLabel>Lớp học</InputLabel>
            <Select
              label='Lớp học'
              value={formData.classId}
              onChange={e => setFormData({ ...formData, classId: e.target.value })}
            >
              <MenuItem value=''>Không chọn</MenuItem>
              {classes.map(cls => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Loại thanh toán *</InputLabel>
            <Select
              label='Loại thanh toán *'
              value={formData.paymentType}
              onChange={e => setFormData({ ...formData, paymentType: e.target.value })}
            >
              <MenuItem value='MonthlyFee'>Học phí tháng</MenuItem>
              <MenuItem value='ExamFee'>Phí thi cấp</MenuItem>
              <MenuItem value='RegistrationFee'>Phí đăng ký</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label='Số tiền *'
            type='number'
            fullWidth
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: e.target.value })}
          />
          <TextField
            label='Ngày thanh toán'
            type='date'
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.paymentDate}
            onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
          />
          <FormControl fullWidth>
            <InputLabel>Phương thức</InputLabel>
            <Select
              label='Phương thức'
              value={formData.paymentMethod}
              onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
            >
              <MenuItem value='Cash'>Tiền mặt</MenuItem>
              <MenuItem value='BankTransfer'>Chuyển khoản</MenuItem>
              <MenuItem value='Card'>Thẻ</MenuItem>
              <MenuItem value='Other'>Khác</MenuItem>
            </Select>
          </FormControl>
          <div className='flex gap-4'>
            <TextField
              label='Tháng'
              type='number'
              value={formData.month}
              onChange={e => setFormData({ ...formData, month: parseInt(e.target.value) })}
              inputProps={{ min: 1, max: 12 }}
            />
            <TextField
              label='Năm'
              type='number'
              value={formData.year}
              onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
            />
          </div>
          <TextField
            label='Ghi chú'
            fullWidth
            multiline
            rows={2}
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Thêm mới'}
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

export default AddPaymentDrawer
