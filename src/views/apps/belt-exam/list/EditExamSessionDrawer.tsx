'use client'

import { useEffect, useState } from 'react'

import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useNotification } from '@/contexts/notificationContext'
import beltExamService from '@/services/beltExamService'
import type { ExamSessionType } from '@/types/apps/beltExamTypes'

type Props = {
  open: boolean
  session: ExamSessionType | null
  onClose: () => void
  setData: React.Dispatch<React.SetStateAction<ExamSessionType[]>>
}

const toDateInput = (value?: string) => {
  if (!value) return ''

  return value.slice(0, 10)
}

const toDateTimeLocalInput = (value?: string) => {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const pad = (input: number) => String(input).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const EditExamSessionDrawer = ({ open, session, onClose, setData }: Props) => {
  const { showNotification } = useNotification()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    examDate: '',
    location: '',
    registrationDeadline: '',
    examFee: '',
    isActive: true
  })

  useEffect(() => {
    if (!open || !session) return

    setFormData({
      name: session.name || '',
      description: session.description || '',
      examDate: toDateInput(session.examDate),
      location: session.location || '',
      registrationDeadline: toDateTimeLocalInput(session.registrationDeadline),
      examFee: session.examFee != null ? String(session.examFee) : '',
      isActive: Boolean(session.isActive)
    })
  }, [open, session])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!session) return

    if (!formData.name.trim() || !formData.examDate) {
      showNotification('Vui lòng điền đầy đủ thông tin bắt buộc.', 'error')

      return
    }

    try {
      setLoading(true)

      const response = await beltExamService.updateExamSession(session.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        examDate: formData.examDate,
        location: formData.location.trim() || undefined,
        isActive: formData.isActive,
        registrationDeadline: formData.registrationDeadline || undefined,
        examFee: formData.examFee ? Number(formData.examFee) : undefined
      })

      if (!response.success || !response.data) {
        showNotification(response.message || 'Không thể cập nhật kỳ thi.', 'error')

        return
      }

      setData(prev => prev.map(item => (item.id === session.id ? response.data as ExamSessionType : item)))
      showNotification('Cập nhật kỳ thi thành công.', 'success')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 460 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Chỉnh sửa kỳ thi</Typography>
        <IconButton size='small' onClick={onClose}>
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

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type='date'
                label='Ngày thi *'
                value={formData.examDate}
                onChange={event => setFormData(prev => ({ ...prev, examDate: event.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type='number'
                label='Lệ phí thi (VND)'
                value={formData.examFee}
                onChange={event => setFormData(prev => ({ ...prev, examFee: event.target.value }))}
                inputProps={{ min: 0, step: 1000 }}
                InputProps={{ endAdornment: <InputAdornment position='end'>VND</InputAdornment> }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label='Địa điểm thi'
            value={formData.location}
            onChange={event => setFormData(prev => ({ ...prev, location: event.target.value }))}
          />

          <TextField
            fullWidth
            type='datetime-local'
            label='Hạn đăng ký'
            value={formData.registrationDeadline}
            onChange={event => setFormData(prev => ({ ...prev, registrationDeadline: event.target.value }))}
            InputLabelProps={{ shrink: true }}

            // helperText='Đây là hạn dùng cho bước HLV đăng ký, không nhập lại ở lúc mở kỳ thi.'
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label='Mô tả'
            value={formData.description}
            onChange={event => setFormData(prev => ({ ...prev, description: event.target.value }))}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={event => setFormData(prev => ({ ...prev, isActive: event.target.checked }))}
              />
            }
            label='Kích hoạt'
          />

          <div className='flex items-center gap-4 flex-wrap'>
            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Lưu'}
            </Button>
            <Button variant='outlined' color='secondary' onClick={onClose} disabled={loading}>
              Đóng
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default EditExamSessionDrawer
