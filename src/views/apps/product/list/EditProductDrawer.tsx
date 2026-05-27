'use client'

import { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { ProductType } from '@/types/apps/productTypes'
import productService from '@/services/productService'
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  handleClose: () => void
  product: ProductType | null
  onSaved: (updated: ProductType) => void
}

type VariantForm = {
  id?: string
  clientId: string
  label: string
  size: string
  color: string
  additionalPrice: string
  isActive: boolean
}

const createVariantRow = (): VariantForm => ({
  clientId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  label: '',
  size: '',
  color: '',
  additionalPrice: '0',
  isActive: true
})

const EditProductDrawer = ({ open, handleClose, product, onSaved }: Props) => {
  const { showNotification } = useNotification()

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unitPrice: '',
    description: '',
    isActive: true
  })

  const [variants, setVariants] = useState<VariantForm[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!product) return

    setFormData({
      name: product.name || '',
      category: product.category || '',
      unitPrice: String(product.unitPrice || ''),
      description: product.description || '',
      isActive: product.isActive ?? true
    })
    setVariants(
      (product.variants || []).map(item => ({
        id: item.id,
        clientId: item.id,
        label: item.label || '',
        size: item.size || '',
        color: item.color || '',
        additionalPrice: String(item.additionalPrice || 0),
        isActive: item.isActive ?? true
      }))
    )
  }, [product])

  const updateVariant = (clientId: string, payload: Partial<VariantForm>) => {
    setVariants(prev => prev.map(item => (item.clientId === clientId ? { ...item, ...payload } : item)))
  }

  const removeVariant = (clientId: string) => {
    setVariants(prev => prev.filter(item => item.clientId !== clientId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!product) return

    if (!formData.name.trim() || !formData.category.trim()) {
      showNotification('Vui lòng nhập đầy đủ tên sản phẩm và danh mục.', 'error')
      
return
    }

    const unitPrice = Number(formData.unitPrice)

    if (Number.isNaN(unitPrice) || unitPrice <= 0) {
      showNotification('Đơn giá phải lớn hơn 0.', 'error')
      
return
    }

    try {
      setLoading(true)

      const response = await productService.updateProduct(product.id, {
        name: formData.name.trim(),
        category: formData.category.trim(),
        unitPrice,
        description: formData.description.trim() || undefined,
        isActive: formData.isActive,
        variants: variants
          .filter(item => item.label.trim())
          .map(item => ({
            id: item.id,
            label: item.label.trim(),
            size: item.size.trim() || undefined,
            color: item.color.trim() || undefined,
            additionalPrice: Number(item.additionalPrice || 0),
            isActive: item.isActive
          }))
      })

      if (response.success && response.data) {
        onSaved(response.data)
        showNotification('Cập nhật sản phẩm thành công.', 'success')
        handleClose()
      } else {
        showNotification(response.message || 'Không thể cập nhật sản phẩm.', 'error')
      }
    } catch {
      showNotification('Đã có lỗi khi cập nhật sản phẩm.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      anchor='right'
      variant='temporary'
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 560 } } }}
    >
      <Box className='flex justify-between items-center pli-5 plb-4' sx={{ backgroundColor: 'background.default' }}>
        <Typography variant='h5'>Chỉnh sửa sản phẩm</Typography>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </Box>

      <Divider />

      {product && (
        <Box className='p-5'>
          <Typography variant='body2' color='text.secondary' className='mb-4'>
            Mã sản phẩm: <Chip label={product.code} size='small' color='primary' variant='tonal' />
          </Typography>
        </Box>
      )}

      <Box component='form' onSubmit={handleSubmit} className='flex flex-col gap-5 p-5'>
        <TextField fullWidth label='Tên sản phẩm *' value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} />
        <TextField fullWidth label='Danh mục *' value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))} />
        <TextField fullWidth label='Đơn giá gốc *' type='number' inputProps={{ min: 0 }} value={formData.unitPrice} onChange={e => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))} />
        <TextField fullWidth multiline rows={3} label='Mô tả' value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} />

        <Paper variant='outlined' className='p-4'>
          <Stack spacing={3}>
            <div className='flex items-center justify-between gap-3'>
              <Box>
                <Typography variant='subtitle1' fontWeight={600}>Biến thể sản phẩm</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Quản lý size, màu sắc và phần giá chênh lệch theo từng biến thể.
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
                  <Paper key={item.clientId} variant='outlined' className='p-3'>
                    <Stack spacing={2}>
                      <div className='flex items-center justify-between gap-3'>
                        <Typography variant='subtitle2' fontWeight={600}>Biến thể</Typography>
                        <div className='flex items-center gap-2'>
                          <FormControlLabel
                            control={<Switch checked={item.isActive} onChange={event => updateVariant(item.clientId, { isActive: event.target.checked })} color='success' />}
                            label={item.isActive ? 'Đang dùng' : 'Ẩn'}
                          />
                          <IconButton color='error' onClick={() => removeVariant(item.clientId)}>
                            <i className='ri-delete-bin-line' />
                          </IconButton>
                        </div>
                      </div>
                      <TextField label='Tên biến thể *' value={item.label} onChange={event => updateVariant(item.clientId, { label: event.target.value })} />
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                        <TextField label='Size' value={item.size} onChange={event => updateVariant(item.clientId, { size: event.target.value })} />
                        <TextField label='Màu sắc' value={item.color} onChange={event => updateVariant(item.clientId, { color: event.target.value })} />
                      </div>
                      <TextField label='Phụ thu so với giá gốc' type='number' value={item.additionalPrice} onChange={event => updateVariant(item.clientId, { additionalPrice: event.target.value })} />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>

        <FormControlLabel control={<Switch checked={formData.isActive} onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} color='success' />} label={formData.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'} />

        <Box className='flex items-center gap-4 mt-4'>
          <Button fullWidth type='submit' variant='contained' disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
          <Button fullWidth variant='outlined' color='secondary' onClick={handleClose} disabled={loading}>
            Hủy
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default EditProductDrawer
