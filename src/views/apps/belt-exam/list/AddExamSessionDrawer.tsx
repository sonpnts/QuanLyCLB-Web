'use client'

import { useState } from 'react'

import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useNotification } from '@/contexts/notificationContext'
import beltExamService from '@/services/beltExamService'
import type { ExamSessionType } from '@/types/apps/beltExamTypes'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<ExamSessionType[]>>
}

const AddExamSessionDrawer = ({ open, handleClose, setData }: Props) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    examDate: '',
    location: '',
    registrationDeadline: '',
    examFee: ''
  })
  const [loading, setLoading] = useState(false)
  const { showNotification } = useNotification()

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      examDate: '',
      location: '',
      registrationDeadline: '',
      examFee: ''
    })
    handleClose()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.name || !formData.examDate) {
      showNotification('Vui lòng điền đầy đủ thông tin bắt buộc.', 'error')

      return
    }

    try {
      setLoading(true)

      const response = await beltExamService.createExamSession({
        name: formData.name,
        description: formData.description || undefined,
        examDate: formData.examDate,
        location: formData.location || undefined,
        registrationDeadline: formData.registrationDeadline || undefined,
        examFee: formData.examFee ? parseFloat(formData.examFee) : undefined
      })

      if (!response.success || !response.data) {
        showNotification(response.message || 'Không thể tạo kỳ thi.', 'error')

        return
      }

      setData(prev => [...prev, response.data as ExamSessionType])
      showNotification('Tạo kỳ thi thành công.', 'success')
      handleReset()
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
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 450 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Tạo kỳ thi mới</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          <TextField
            fullWidth
            label='Tên kỳ thi *'
            value={formData.name}
            onChange={event => setFormData(prev => ({ ...prev, name: event.target.value }))}
          />
          <TextField
            fullWidth
            type='date'
            label='Ngày thi *'
            value={formData.examDate}
            onChange={event => setFormData(prev => ({ ...prev, examDate: event.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label='Địa điểm thi'
            value={formData.location}
            onChange={event => setFormData(prev => ({ ...prev, location: event.target.value }))}
          />
          <TextField
            fullWidth
            type='number'
            label='Lệ phí thi (VND)'
            value={formData.examFee}
            onChange={event => setFormData(prev => ({ ...prev, examFee: event.target.value }))}
            inputProps={{ min: 0, step: 1000 }}
            helperText='Lệ phí chung áp dụng cho tất cả học viên trong kỳ thi này.'
            InputProps={{
              endAdornment: <InputAdornment position='end'>VND</InputAdornment>
            }}
          />
          <TextField
            fullWidth
            type='datetime-local'
            label='Hạn đăng ký'
            value={formData.registrationDeadline}
            onChange={event => setFormData(prev => ({ ...prev, registrationDeadline: event.target.value }))}
            InputLabelProps={{ shrink: true }}
            helperText='HLV sẽ dùng trực tiếp hạn này khi kỳ thi được mở đăng ký.'
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label='Mô tả'
            value={formData.description}
            onChange={event => setFormData(prev => ({ ...prev, description: event.target.value }))}
          />
          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tạo kỳ thi'}
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

export default AddExamSessionDrawer
