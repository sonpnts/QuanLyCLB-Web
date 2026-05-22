'use client'

import { useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
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

type VariantForm = {
  id: string
  label: string
  size: string
  color: string
  additionalPrice: string
}

const createVariantRow = (): VariantForm => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  label: '',
  size: '',
  color: '',
  additionalPrice: '0'
})

const AddProductDrawer = ({ open, handleClose, setData }: Props) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    unitPrice: '',
    description: ''
  })
  const [variants, setVariants] = useState<VariantForm[]>([])

  const { showNotification } = useNotification()

  const resetAndClose = () => {
    setFormData({
      code: '',
      name: '',
      category: '',
      unitPrice: '',
      description: ''
    })
    setVariants([])
    handleClose()
  }

  const updateVariant = (id: string, payload: Partial<VariantForm>) => {
    setVariants(prev => prev.map(item => (item.id === id ? { ...item, ...payload } : item)))
  }

  const removeVariant = (id: string) => {
    setVariants(prev => prev.filter(item => item.id !== id))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.code || !formData.name || !formData.category || !formData.unitPrice) {
      showNotification('Vui lòng nhập đủ Mã, Tên, Danh mục và Đơn giá.', 'error')
      return
    }

    const unitPrice = Number(formData.unitPrice)
    if (Number.isNaN(unitPrice) || unitPrice <= 0) {
      showNotification('Đơn giá phải là số lớn hơn 0.', 'error')
      return
    }

    const normalizedVariants = variants
      .filter(item => item.label.trim())
      .map(item => ({
        label: item.label.trim(),
        size: item.size.trim() || undefined,
        color: item.color.trim() || undefined,
        additionalPrice: Number(item.additionalPrice || 0),
        isActive: true
      }))

    try {
      setLoading(true)
      const response = await productService.createProduct({
        code: formData.code.trim(),
        name: formData.name.trim(),
        category: formData.category.trim(),
        unitPrice,
        description: formData.description.trim() || undefined,
        variants: normalizedVariants
      })

      if (!response.success || !response.data) {
        showNotification(response.message || 'Không thể tạo sản phẩm.', 'error')
        return
      }

      setData(prev => [response.data!, ...prev])
      showNotification('Tạo sản phẩm thành công.', 'success')
      resetAndClose()
    } catch {
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
      sx={{ '& .MuiDrawer-paper': { width: { xs: 360, sm: 520 } } }}
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
          <TextField label='Mã sản phẩm *' value={formData.code} onChange={event => setFormData(prev => ({ ...prev, code: event.target.value }))} />
          <TextField label='Tên sản phẩm *' value={formData.name} onChange={event => setFormData(prev => ({ ...prev, name: event.target.value }))} />
          <TextField label='Danh mục *' value={formData.category} onChange={event => setFormData(prev => ({ ...prev, category: event.target.value }))} />
          <TextField label='Đơn giá gốc *' type='number' value={formData.unitPrice} onChange={event => setFormData(prev => ({ ...prev, unitPrice: event.target.value }))} />
          <TextField label='Mô tả' multiline rows={3} value={formData.description} onChange={event => setFormData(prev => ({ ...prev, description: event.target.value }))} />

          <Paper variant='outlined' className='p-4'>
            <Stack spacing={3}>
              <div className='flex items-center justify-between gap-3'>
                <Box>
                  <Typography variant='subtitle1' fontWeight={600}>Biến thể sản phẩm</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Có thể thêm size, màu sắc hoặc tên biến thể riêng cho từng sản phẩm.
                  </Typography>
                </Box>
                <Button variant='outlined' size='small' startIcon={<i className='ri-add-line' />} onClick={() => setVariants(prev => [...prev, createVariantRow()])}>
                  Thêm biến thể
                </Button>
              </div>

              {variants.length === 0 ? (
                <Typography variant='body2' color='text.secondary'>Sản phẩm này hiện chưa có biến thể.</Typography>
              ) : (
                <Stack spacing={3}>
                  {variants.map(item => (
                    <Paper key={item.id} variant='outlined' className='p-3'>
                      <Stack spacing={2}>
                        <div className='flex items-center justify-between gap-3'>
                          <Typography variant='subtitle2' fontWeight={600}>Biến thể</Typography>
                          <IconButton color='error' onClick={() => removeVariant(item.id)}>
                            <i className='ri-delete-bin-line' />
                          </IconButton>
                        </div>
                        <TextField label='Tên biến thể *' value={item.label} onChange={event => updateVariant(item.id, { label: event.target.value })} />
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                          <TextField label='Size' value={item.size} onChange={event => updateVariant(item.id, { size: event.target.value })} />
                          <TextField label='Màu sắc' value={item.color} onChange={event => updateVariant(item.id, { color: event.target.value })} />
                        </div>
                        <TextField
                          label='Phụ thu so với giá gốc'
                          type='number'
                          value={item.additionalPrice}
                          onChange={event => updateVariant(item.id, { additionalPrice: event.target.value })}
                        />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Stack>
          </Paper>

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
