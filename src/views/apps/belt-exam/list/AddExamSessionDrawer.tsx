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
import Grid from '@mui/material/Grid2'
import InputAdornment from '@mui/material/InputAdornment'

import type { ExamSessionType, BeltLevelType } from '@/types/apps/beltExamTypes'
import beltExamService from '@/services/beltExamService'
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<ExamSessionType[]>>
}

const AddExamSessionDrawer = ({ open, handleClose, setData }: Props) => {
  const [formData, setFormData] = useState({
    name: '',
    examDate: '',
    registrationDeadline: '',
    beltLevelId: '',
    examFee: 0,
    maxCandidates: 50
  })
  const [loading, setLoading] = useState(false)
  const [beltLevels, setBeltLevels] = useState<BeltLevelType[]>([])

  const { showNotification } = useNotification()

  useEffect(() => {
    const loadBeltLevels = async () => {
      try {
        const response = await beltExamService.getBeltLevels()
        if (response.success && response.data) {
          setBeltLevels(response.data)
        }
      } catch (error) {
        console.error('Error loading belt levels:', error)
      }
    }
    if (open) loadBeltLevels()
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.examDate || !formData.registrationDeadline || !formData.beltLevelId) {
      showNotification('Vui lòng điền đầy đủ thông tin bắt buộc.', 'error')
      return
    }

    try {
      setLoading(true)
      const response = await beltExamService.createExamSession({
        name: formData.name,
        examDate: formData.examDate,
        registrationDeadline: formData.registrationDeadline,
        beltLevelId: formData.beltLevelId,
        examFee: formData.examFee,
        maxCandidates: formData.maxCandidates
      })

      if (response.success && response.data) {
        setData(prev => [...prev, response.data!])
        showNotification('Tạo kỳ thi thành công!', 'success')
        handleReset()
      } else {
        showNotification(response.message || 'Không thể tạo kỳ thi.', 'error')
      }
    } catch (error) {
      showNotification('Đã có lỗi khi tạo kỳ thi.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      name: '',
      examDate: '',
      registrationDeadline: '',
      beltLevelId: '',
      examFee: 0,
      maxCandidates: 50
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
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
          <FormControl fullWidth>
            <InputLabel>Cấp đai *</InputLabel>
            <Select
              label='Cấp đai *'
              value={formData.beltLevelId}
              onChange={e => setFormData({ ...formData, beltLevelId: e.target.value })}
            >
              {beltLevels.map(level => (
                <MenuItem key={level.id} value={level.id}>
                  {level.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type='date'
                label='Ngày thi *'
                value={formData.examDate}
                onChange={e => setFormData({ ...formData, examDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type='date'
                label='Hạn đăng ký *'
                value={formData.registrationDeadline}
                onChange={e => setFormData({ ...formData, registrationDeadline: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            type='number'
            label='Lệ phí thi'
            value={formData.examFee}
            onChange={e => setFormData({ ...formData, examFee: Number(e.target.value) })}
            InputProps={{
              endAdornment: <InputAdornment position='end'>VNĐ</InputAdornment>
            }}
          />
          <TextField
            fullWidth
            type='number'
            label='Số lượng tối đa'
            value={formData.maxCandidates}
            onChange={e => setFormData({ ...formData, maxCandidates: Number(e.target.value) })}
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
