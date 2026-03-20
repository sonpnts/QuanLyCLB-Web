'use client'

import { useState } from 'react'
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

import type { LeaveRequestType } from '@/types/apps/leaveRequestTypes'
import { leaveTypeLabels } from '@/types/apps/leaveRequestTypes'
import leaveRequestService from '@/services/leaveRequestService'
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<LeaveRequestType[]>>
}

const AddLeaveRequestDrawer = ({ open, handleClose, setData }: Props) => {
  const [formData, setFormData] = useState({
    leaveType: 0,
    startDate: '',
    endDate: '',
    reason: ''
  })
  const [loading, setLoading] = useState(false)

  const { showNotification } = useNotification()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
      showNotification('Vui lòng điền đầy đủ thông tin.', 'error')
      return
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      showNotification('Ngày bắt đầu phải trước ngày kết thúc.', 'error')
      return
    }

    try {
      setLoading(true)
      const response = await leaveRequestService.createLeaveRequest({
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason
      })

      if (response.success && response.data) {
        setData(prev => [...prev, response.data!])
        showNotification('Tạo đơn xin nghỉ thành công!', 'success')
        handleReset()
      } else {
        showNotification(response.message || 'Không thể tạo đơn.', 'error')
      }
    } catch (error) {
      showNotification('Đã có lỗi khi tạo đơn.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({ leaveType: 0, startDate: '', endDate: '', reason: '' })
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
        <Typography variant='h5'>Tạo đơn xin nghỉ</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          <FormControl fullWidth>
            <InputLabel>Loại nghỉ *</InputLabel>
            <Select
              label='Loại nghỉ *'
              value={formData.leaveType}
              onChange={e => setFormData({ ...formData, leaveType: Number(e.target.value) })}
            >
              {Object.entries(leaveTypeLabels).map(([key, label]) => (
                <MenuItem key={key} value={Number(key)}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type='date'
                label='Từ ngày *'
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type='date'
                label='Đến ngày *'
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            label='Lý do *'
            multiline
            rows={4}
            value={formData.reason}
            onChange={e => setFormData({ ...formData, reason: e.target.value })}
          />
          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tạo đơn'}
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
