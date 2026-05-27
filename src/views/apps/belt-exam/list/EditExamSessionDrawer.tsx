'use client'

import { useEffect, useState } from 'react'

import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { ExamSessionType } from '@/types/apps/beltExamTypes'
import beltExamService from '@/services/beltExamService'
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  session: ExamSessionType | null
  onClose: () => void
  setData: React.Dispatch<React.SetStateAction<ExamSessionType[]>>
}

const toDateInput = (isoOrDate?: string) => {
  if (!isoOrDate) return ''

  // API returns DateOnly as ISO-like string, keep first 10 chars.
  return isoOrDate.slice(0, 10)
}

const toDateTimeLocalInput = (iso?: string) => {
  if (!iso) return ''

  // Convert ISO -> yyyy-MM-ddTHH:mm for input datetime-local
  const d = new Date(iso)

  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')

  
return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    if (!formData.name.trim() || !formData.examDate) {
      showNotification('Vui lòng điền đầy đủ thông tin bắt buộc.', 'error')
      
return
    }

    try {
      setLoading(true)

      const res = await beltExamService.updateExamSession(session.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        examDate: formData.examDate,
        location: formData.location.trim() || undefined,
        isActive: formData.isActive,
        registrationDeadline: formData.registrationDeadline || undefined,
        examFee: formData.examFee ? Number(formData.examFee) : undefined
      })

      if (res.success && res.data) {
        setData(prev => prev.map(x => (x.id === session.id ? res.data! : x)))
        showNotification('Cập nhật kỳ thi thành công!', 'success')
        onClose()
      } else {
        showNotification(res.message || 'Không thể cập nhật kỳ thi.', 'error')
      }
    } catch {
      showNotification('Đã có lỗi khi cập nhật kỳ thi.', 'error')
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
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type='date'
                label='Ngày thi *'
                value={formData.examDate}
                onChange={e => setFormData(prev => ({ ...prev, examDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type='number'
                label='Lệ phí thi (VND)'
                value={formData.examFee}
                onChange={e => setFormData(prev => ({ ...prev, examFee: e.target.value }))}
                inputProps={{ min: 0, step: 1000 }}
                InputProps={{ endAdornment: <InputAdornment position='end'>VND</InputAdornment> }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label='Địa điểm thi'
            value={formData.location}
            onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
          />

          <TextField
            fullWidth
            type='datetime-local'
            label='Hạn đăng ký (tùy chọn)'
            value={formData.registrationDeadline}
            onChange={e => setFormData(prev => ({ ...prev, registrationDeadline: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label='Mô tả'
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />

          <FormControlLabel
            control={<Switch checked={formData.isActive} onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} />}
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

