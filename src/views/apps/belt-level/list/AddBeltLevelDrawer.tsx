'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'

// Type Imports
import type { BeltLevelType } from '@/types/apps/beltExamTypes'

// Service Imports
import beltLevelService from '@/services/beltLevelService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  onClose: () => void
  onAdded: (beltLevel: BeltLevelType) => void
}

const AddBeltLevelDrawer = ({ open, onClose, onAdded }: Props) => {
  // States
  const [formData, setFormData] = useState({
    name: '',
    order: '',
    description: '',
    color: '#000000',
    isDang: false
  })

  const [loading, setLoading] = useState(false)

  const { showNotification } = useNotification()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showNotification('Vui lòng nhập tên cấp đai.', 'error')

      return
    }

    if (!formData.order || isNaN(Number(formData.order))) {
      showNotification('Vui lòng nhập thứ tự hợp lệ.', 'error')

      return
    }

    try {
      setLoading(true)

      const response = await beltLevelService.createBeltLevel({
        name: formData.name,
        order: Number(formData.order),
        description: formData.description || undefined,
        colorCode: formData.color || undefined,
        isDang: formData.isDang
      })

      if (response.success && response.data) {
        onAdded(response.data)
        showNotification('Thêm cấp đai thành công!', 'success')
        handleReset()
      } else {
        showNotification(response.message || 'Không thể thêm cấp đai.', 'error')
      }
    } catch (error) {
      showNotification('Đã có lỗi khi thêm cấp đai.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      name: '',
      order: '',
      description: '',
      color: '#000000',
      isDang: false
    })
    onClose()
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
        <Typography variant='h5'>Thêm cấp đai mới</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          <TextField
            label='Tên cấp đai *'
            fullWidth
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder='VD: Đai trắng, Đai vàng...'
          />
          <TextField
            label='Thứ tự *'
            type='number'
            fullWidth
            value={formData.order}
            onChange={e => setFormData({ ...formData, order: e.target.value })}
            placeholder='VD: 1, 2, 3...'
            helperText='Thứ tự từ thấp đến cao (1 là thấp nhất)'
          />
          <TextField
            label='Mô tả'
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder='Mô tả về cấp đai này...'
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.isDang}
                onChange={e => setFormData({ ...formData, isDang: e.target.checked })}
              />
            }
            label='Là Đẳng (đai đen có cấp độ)'
          />
          <Box>
            <Typography variant='body2' className='mb-2'>
              Màu sắc
            </Typography>
            <Box className='flex items-center gap-3'>
              <input
                type='color'
                value={formData.color}
                onChange={e => setFormData({ ...formData, color: e.target.value })}
                style={{ width: 50, height: 40, cursor: 'pointer', border: '1px solid #ddd', borderRadius: 4 }}
              />
              <TextField
                size='small'
                value={formData.color}
                onChange={e => setFormData({ ...formData, color: e.target.value })}
                placeholder='#000000'
                sx={{ width: 120 }}
              />
            </Box>
          </Box>
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

export default AddBeltLevelDrawer
