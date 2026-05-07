'use client'

import { useEffect, useState } from 'react'

import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { ProductSaleType } from '@/types/apps/productSaleTypes'
import type { ProductType } from '@/types/apps/productTypes'
import type { ClassType } from '@/types/apps/classTypes'
import type { UsersType } from '@/types/apps/userTypes'
import productSaleService from '@/services/productSaleService'
import productService from '@/services/productService'
import classService from '@/services/classService'
import userService from '@/services/userService'
import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<ProductSaleType[]>>
}

const AddProductSaleDrawer = ({ open, handleClose, setData }: Props) => {
  const { auth } = useAuth()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<ProductType[]>([])
  const [classes, setClasses] = useState<ClassType[]>([])
  const [collectors, setCollectors] = useState<UsersType[]>([])

  const [formData, setFormData] = useState({
    productId: '',
    classId: '',
    quantity: '1',
    unitPrice: '',
    soldByUserId: auth?.user.id || '',
    buyerName: '',
    notes: ''
  })

  const { showNotification } = useNotification()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, classesRes, coachesRes] = await Promise.all([
          productService.getProducts({ isActive: true }),
          classService.getClasses({ isActive: true, pageSize: 1000 }),
          userService.getCoaches()
        ])

        if (productsRes.success && productsRes.data) setProducts(productsRes.data)
        if (classesRes.success && classesRes.data) setClasses(classesRes.data)
        if (coachesRes.success && coachesRes.data) {
          setCollectors(coachesRes.data)
          setFormData(prev => ({
            ...prev,
            soldByUserId: prev.soldByUserId || auth?.user.id || ''
          }))
        }
      } catch (error) {
        showNotification('Không thể tải dữ liệu cho form bán sản phẩm.', 'error')
      }
    }

    if (open) loadData()
  }, [open, auth?.user.id, showNotification])

  const resetAndClose = () => {
    setFormData({
      productId: '',
      classId: '',
      quantity: '1',
      unitPrice: '',
      soldByUserId: auth?.user.id || '',
      buyerName: '',
      notes: ''
    })
    handleClose()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const quantity = Number(formData.quantity)
    const unitPrice = Number(formData.unitPrice)

    if (!formData.productId || !formData.classId || quantity <= 0 || unitPrice <= 0) {
      showNotification('Vui lòng nhập đủ sản phẩm, lớp, số lượng và đơn giá hợp lệ.', 'error')
      return
    }

    try {
      setLoading(true)
      const response = await productSaleService.createProductSale({
        productId: formData.productId,
        classId: formData.classId,
        quantity,
        unitPrice,
        soldByUserId: formData.soldByUserId || undefined,
        buyerName: formData.buyerName.trim() || undefined,
        notes: formData.notes.trim() || undefined
      })

      if (!response.success || !response.data) {
        showNotification(response.message || 'Không thể tạo giao dịch bán sản phẩm.', 'error')
        return
      }

      setData(prev => [response.data!, ...prev])
      showNotification('Tạo giao dịch bán sản phẩm thành công.', 'success')
      resetAndClose()
    } catch (error) {
      showNotification('Đã có lỗi khi tạo giao dịch.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleProductChange = (productId: string) => {
    const selectedProduct = products.find(item => item.id === productId)

    setFormData(prev => ({
      ...prev,
      productId,
      unitPrice: selectedProduct?.unitPrice ? String(selectedProduct.unitPrice) : prev.unitPrice
    }))
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={resetAndClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 440 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Tạo giao dịch bán sản phẩm</Typography>
        <IconButton size='small' onClick={resetAndClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          <FormControl fullWidth>
            <InputLabel>Sản phẩm *</InputLabel>
            <Select
              label='Sản phẩm *'
              value={formData.productId}
              onChange={event => handleProductChange(event.target.value)}
            >
              {products.map(product => (
                <MenuItem key={product.id} value={product.id}>
                  {product.code} - {product.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Lớp *</InputLabel>
            <Select
              label='Lớp *'
              value={formData.classId}
              onChange={event => setFormData(prev => ({ ...prev, classId: event.target.value }))}
            >
              {classes.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Người thu tiền</InputLabel>
            <Select
              label='Người thu tiền'
              value={formData.soldByUserId}
              onChange={event => setFormData(prev => ({ ...prev, soldByUserId: event.target.value }))}
            >
              <MenuItem value=''>Tự động theo user đăng nhập</MenuItem>
              {collectors.map(user => (
                <MenuItem key={user.id} value={user.id}>
                  {user.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <div className='grid grid-cols-2 gap-4'>
            <TextField
              label='Số lượng *'
              type='number'
              value={formData.quantity}
              onChange={event => setFormData(prev => ({ ...prev, quantity: event.target.value }))}
            />
            <TextField
              label='Đơn giá *'
              type='number'
              value={formData.unitPrice}
              onChange={event => setFormData(prev => ({ ...prev, unitPrice: event.target.value }))}
            />
          </div>

          <TextField
            label='Người mua'
            value={formData.buyerName}
            onChange={event => setFormData(prev => ({ ...prev, buyerName: event.target.value }))}
          />

          <TextField
            label='Ghi chú'
            multiline
            rows={3}
            value={formData.notes}
            onChange={event => setFormData(prev => ({ ...prev, notes: event.target.value }))}
          />

          <Typography variant='body2' color='text.secondary'>
            Tổng tiền dự kiến: {(Number(formData.quantity || 0) * Number(formData.unitPrice || 0)).toLocaleString('vi-VN')} VND
          </Typography>

          <div className='flex items-center gap-4'>
            <Button type='submit' variant='contained' disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tạo giao dịch'}
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

export default AddProductSaleDrawer
