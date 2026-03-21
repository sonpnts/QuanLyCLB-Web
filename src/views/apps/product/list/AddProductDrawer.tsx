'use client'

import { useState } from 'react'

import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { ProductType } from '@/types/apps/productTypes'
import productService from '@/services/productService'
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<ProductType[]>>
}

const AddProductDrawer = ({ open, handleClose, setData }: Props) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    unitPrice: '',
    description: ''
  })

  const { showNotification } = useNotification()

  const resetAndClose = () => {
    setFormData({
      code: '',
      name: '',
      category: '',
      unitPrice: '',
      description: ''
    })
    handleClose()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.code || !formData.name || !formData.unitPrice) {
      showNotification('Vui lòng nhập đủ Mã, Tên và Đơn giá.', 'error')
      return
    }

    const unitPrice = Number(formData.unitPrice)

    if (Number.isNaN(unitPrice) || unitPrice <= 0) {
      showNotification('Đơn giá phải là số lớn hơn 0.', 'error')
      return
    }

    try {
      setLoading(true)
      const response = await productService.createProduct({
        code: formData.code.trim(),
        name: formData.name.trim(),
        category: formData.category.trim() || undefined,
        unitPrice,
        description: formData.description.trim() || undefined
      })

      if (!response.success || !response.data) {
        showNotification(response.message || 'Không thể tạo sản phẩm.', 'error')
        return
      }

      setData(prev => [response.data!, ...prev])
      showNotification('Tạo sản phẩm thành công.', 'success')
      resetAndClose()
    } catch (error) {
      showNotification('Đã có lỗi khi tạo sản phẩm.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={resetAndClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 420 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Tạo sản phẩm</Typography>
        <IconButton size='small' onClick={resetAndClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          <TextField
            label='Mã sản phẩm *'
            value={formData.code}
            onChange={event => setFormData(prev => ({ ...prev, code: event.target.value }))}
          />
          <TextField
            label='Tên sản phẩm *'
            value={formData.name}
            onChange={event => setFormData(prev => ({ ...prev, name: event.target.value }))}
          />
          <TextField
            label='Danh mục'
            value={formData.category}
            onChange={event => setFormData(prev => ({ ...prev, category: event.target.value }))}
          />
          <TextField
            label='Đơn giá *'
            type='number'
            value={formData.unitPrice}
            onChange={event => setFormData(prev => ({ ...prev, unitPrice: event.target.value }))}
          />
          <TextField
            label='Mô tả'
            multiline
            rows={3}
            value={formData.description}
            onChange={event => setFormData(prev => ({ ...prev, description: event.target.value }))}
          />
          <div className='flex items-center gap-4'>
            <Button type='submit' variant='contained' disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tạo sản phẩm'}
            </Button>
            <Button variant='outlined' color='error' onClick={resetAndClose}>
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddProductDrawer
