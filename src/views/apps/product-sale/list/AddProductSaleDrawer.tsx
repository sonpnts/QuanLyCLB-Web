'use client'

import { useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
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
import type { StudentType } from '@/types/apps/studentTypes'
import type { ProductType } from '@/types/apps/productTypes'
import type { ClassType } from '@/types/apps/classTypes'
import type { UsersType } from '@/types/apps/userTypes'
import productSaleService from '@/services/productSaleService'
import productService from '@/services/productService'
import classService from '@/services/classService'
import userService from '@/services/userService'
import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'
import { hasAdminRole } from '@/utils/roleUtils'
import studentService from '@/services/studentService'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<ProductSaleType[]>>
  sale?: ProductSaleType | null
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const AddProductSaleDrawer = ({ open, handleClose, setData, sale }: Props) => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<ProductType[]>([])
  const [classes, setClasses] = useState<ClassType[]>([])
  const [collectors, setCollectors] = useState<UsersType[]>([])
  const [classStudents, setClassStudents] = useState<StudentType[]>([])
  const isAdmin = hasAdminRole(auth?.roles)
  const isEditMode = !!sale

  const [formData, setFormData] = useState({
    productId: '',
    productVariantId: '',
    classId: '',
    quantity: '1',
    unitPrice: '',
    saleDate: '',
    soldByUserId: auth?.user?.id || '',
    buyerName: '',
    notes: ''
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, classesRes, coachesRes] = await Promise.all([
          productService.getSaleOptions(),
          classService.getClasses({ isActive: true, pageSize: 1000 }),
          isAdmin ? userService.getCoaches() : Promise.resolve({ success: true, data: [] })
        ])

        if (productsRes.success && productsRes.data) setProducts(productsRes.data)
        if (classesRes.success && classesRes.data) setClasses(classesRes.data)
        if (coachesRes.success && coachesRes.data) setCollectors(coachesRes.data)
      } catch {
        showNotification('Không thể tải dữ liệu cho form bán sản phẩm.', 'error')
      }
    }

    if (open) {
      void loadData()
    }
  }, [open, isAdmin, showNotification])

  useEffect(() => {
    if (!open) return

    if (sale) {
      setFormData({
        productId: sale.productId || '',
        productVariantId: sale.productVariantId || '',
        classId: sale.classId || '',
        quantity: String(sale.quantity || 1),
        unitPrice: String(sale.unitPrice || ''),
        saleDate: sale.saleDate ? sale.saleDate.slice(0, 10) : '',
        soldByUserId: sale.soldByUserId || auth?.user?.id || '',
        buyerName: sale.buyerName || '',
        notes: sale.notes || ''
      })
      
return
    }

    setFormData({
      productId: '',
      productVariantId: '',
      classId: '',
      quantity: '1',
      unitPrice: '',
      saleDate: '',
      soldByUserId: auth?.user?.id || '',
      buyerName: '',
      notes: ''
    })
  }, [open, sale, auth?.user?.id])

  useEffect(() => {
    if (!formData.classId) {
      setClassStudents([])
      
return
    }

    studentService
      .getStudents({ classId: formData.classId, pageSize: 1000 })
      .then(res => {
        if (res.success && res.data) setClassStudents(res.data)
        else setClassStudents([])
      })
      .catch(() => setClassStudents([]))
  }, [formData.classId])

  const selectedProduct = useMemo(() => products.find(item => item.id === formData.productId) || null, [formData.productId, products])

  const selectedVariants = useMemo(
    () => (selectedProduct?.variants || []).filter(item => item.isActive !== false),
    [selectedProduct]
  )

  const selectedVariant = useMemo(
    () => selectedVariants.find(item => item.id === formData.productVariantId) || null,
    [formData.productVariantId, selectedVariants]
  )

  const availableStock = useMemo(() => {
    const baseStock = selectedProduct?.hasVariants
      ? Number(selectedVariant?.stockQuantity || 0)
      : Number(selectedProduct?.totalStockQuantity || 0)

    if (!isEditMode || !sale || !selectedProduct) return baseStock

    const sameProduct = sale.productId === selectedProduct.id
    const sameVariant = (sale.productVariantId || '') === (selectedVariant?.id || '')

    if (!sameProduct || !sameVariant) return baseStock

    return baseStock + Number(sale.quantity || 0)
  }, [isEditMode, sale, selectedProduct, selectedVariant])

  const computedUnitPrice = useMemo(() => {
    if (!selectedProduct) return 0
    
return Number(selectedProduct.unitPrice || 0) + Number(selectedVariant?.additionalPrice || 0)
  }, [selectedProduct, selectedVariant])

  useEffect(() => {
    if (!selectedProduct) return

    setFormData(prev => ({
      ...prev,
      unitPrice: computedUnitPrice > 0 ? String(computedUnitPrice) : prev.unitPrice
    }))
  }, [computedUnitPrice, selectedProduct])

  const resetAndClose = () => {
    setFormData({
      productId: '',
      productVariantId: '',
      classId: '',
      quantity: '1',
      unitPrice: '',
      saleDate: '',
      soldByUserId: auth?.user?.id || '',
      buyerName: '',
      notes: ''
    })
    handleClose()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const quantity = Number(formData.quantity)
    const unitPrice = Number(formData.unitPrice)

    if (!formData.productId || quantity <= 0 || unitPrice <= 0) {
      showNotification('Vui lòng nhập đủ sản phẩm, số lượng và đơn giá hợp lệ.', 'error')
      
      return
    }

    if (selectedProduct?.hasVariants && !formData.productVariantId) {
      showNotification('Vui lòng chọn biến thể sản phẩm.', 'error')
      
return
    }

    if (availableStock <= 0) {
      showNotification('Sản phẩm đã hết hàng. Vui lòng thông báo tới admin.', 'error')
      
return
    }

    if (quantity > availableStock) {
      showNotification(`Số lượng vượt quá tồn kho hiện có (${availableStock}).`, 'error')
      
return
    }

    try {
      setLoading(true)

      const response =
        isEditMode && sale
          ? await productSaleService.updateProductSale(sale.id, {
              productVariantId: formData.productVariantId || undefined,
              quantity,
              unitPrice,
              saleDate: formData.saleDate || sale.saleDate || new Date().toISOString(),
              isActive: sale.isActive !== false,
              soldByUserId: formData.soldByUserId || undefined,
              buyerName: formData.buyerName.trim() || undefined,
              notes: formData.notes.trim() || undefined
            })
          : await productSaleService.createProductSale({
              productId: formData.productId,
              productVariantId: formData.productVariantId || undefined,
              classId: formData.classId,
              quantity,
              unitPrice,
              saleDate: formData.saleDate || undefined,
              soldByUserId: formData.soldByUserId || undefined,
              buyerName: formData.buyerName.trim() || undefined,
              notes: formData.notes.trim() || undefined
            })

      if (!response.success || !response.data) {
        showNotification(response.message || 'Không thể lưu giao dịch bán sản phẩm.', 'error')
        
return
      }

      setData(prev =>
        isEditMode ? prev.map(item => (item.id === response.data!.id ? response.data! : item)) : [response.data!, ...prev]
      )
      showNotification(isEditMode ? 'Cập nhật giao dịch bán sản phẩm thành công.' : 'Tạo giao dịch bán sản phẩm thành công.', 'success')
      resetAndClose()
    } catch {
      showNotification('Đã có lỗi khi lưu giao dịch.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleProductChange = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      productId,
      productVariantId: '',
      quantity: '1'
    }))
  }

  const productOptions = useMemo(
    () =>
      products.map(product => ({
        ...product,
        canSelect: product.hasVariants
          ? (product.variants || []).some(variant => variant.isActive !== false && Number(variant.stockQuantity || 0) > 0)
          : Number(product.totalStockQuantity || 0) > 0
      })),
    [products]
  )

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
        <Typography variant='h5'>{isEditMode ? 'Sửa giao dịch bán sản phẩm' : 'Tạo giao dịch bán sản phẩm'}</Typography>
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
              disabled={isEditMode}
              onChange={event => handleProductChange(String(event.target.value))}
            >
              {productOptions.map(product => (
                <MenuItem key={product.id} value={product.id} disabled={!product.canSelect && product.id !== formData.productId}>
                  {product.name}
                  {product.hasVariants
                    ? ` - ${(product.variants || []).filter(item => item.isActive !== false).length} biến thể`
                    : ` - còn ${Number(product.totalStockQuantity || 0)}`}
                  {!product.canSelect && product.id !== formData.productId ? ' - Hết hàng' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedProduct?.hasVariants ? (
            <FormControl fullWidth>
              <InputLabel>Biến thể *</InputLabel>
              <Select
                label='Biến thể *'
                value={formData.productVariantId}
                onChange={event => setFormData(prev => ({ ...prev, productVariantId: String(event.target.value), quantity: '1' }))}
              >
                {selectedVariants.map(item => {
                  const canSelect = Number(item.stockQuantity || 0) > 0 || item.id === formData.productVariantId

                  return (
                    <MenuItem key={item.id} value={item.id} disabled={!canSelect}>
                      {item.label} - {formatCurrency(Number(selectedProduct.unitPrice || 0) + Number(item.additionalPrice || 0))} - còn {item.stockQuantity}
                      {!canSelect ? ' - Hết hàng' : ''}
                    </MenuItem>
                  )
                })}
              </Select>
            </FormControl>
          ) : null}

          {isEditMode && !formData.classId ? (
            <TextField
              fullWidth
              label='Lớp'
              value='Khách lẻ (Không thuộc lớp)'
              disabled
            />
          ) : (
            <FormControl fullWidth>
              <InputLabel>Lớp *</InputLabel>
              <Select
                label='Lớp *'
                value={formData.classId}
                disabled={isEditMode}
                onChange={event => setFormData(prev => ({ ...prev, classId: String(event.target.value) }))}
              >
                {classes.map(item => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {isAdmin ? (
            <FormControl fullWidth>
              <InputLabel>Người thu tiền</InputLabel>
              <Select
                label='Người thu tiền'
                value={formData.soldByUserId}
                onChange={event => setFormData(prev => ({ ...prev, soldByUserId: String(event.target.value) }))}
              >
                <MenuItem value=''>Tự động theo user đăng nhập</MenuItem>
                {collectors.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}

          <div className='grid grid-cols-2 gap-4'>
            <TextField
              label='Số lượng *'
              type='number'
              value={formData.quantity}
              onChange={event => setFormData(prev => ({ ...prev, quantity: event.target.value }))}
              helperText={selectedProduct ? `Tồn kho còn lại: ${availableStock}` : 'Chọn sản phẩm để xem tồn kho'}
            />
            <TextField label='Đơn giá *' type='number' value={formData.unitPrice} disabled />
          </div>

          {selectedProduct ? (
            availableStock > 0 ? (
              <Alert severity='info'>
                {selectedVariant ? `Biến thể ${selectedVariant.label}` : 'Sản phẩm'} còn {availableStock} sản phẩm trong kho.
              </Alert>
            ) : (
              <Alert severity='warning'>Sản phẩm đã hết hàng. Vui lòng thông báo tới admin.</Alert>
            )
          ) : null}

          {/*<TextField*/}
          {/*  fullWidth*/}
          {/*  type='date'*/}
          {/*  label='Ngày bán'*/}
          {/*  value={formData.saleDate}*/}
          {/*  onChange={event => setFormData(prev => ({ ...prev, saleDate: event.target.value }))}*/}
          {/*  InputLabelProps={{ shrink: true }}*/}
          {/*/>*/}

          <Autocomplete
            freeSolo
            options={classStudents.map(student => student.fullName)}
            value={formData.buyerName}
            onChange={(_, newValue) => setFormData(prev => ({ ...prev, buyerName: newValue || '' }))}
            onInputChange={(_, newInputValue) => setFormData(prev => ({ ...prev, buyerName: newInputValue }))}
            renderInput={params => <TextField {...params} label='Người mua' />}
          />

          <TextField
            label='Ghi chú'
            multiline
            rows={3}
            value={formData.notes}
            onChange={event => setFormData(prev => ({ ...prev, notes: event.target.value }))}
          />

          <Typography variant='body2' color='text.secondary'>
            Tổng tiền dự kiến: {formatCurrency(Number(formData.quantity || 0) * Number(formData.unitPrice || 0))}
          </Typography>

          <div className='flex items-center gap-4'>
            <Button type='submit' variant='contained' disabled={loading || availableStock <= 0}>
              {loading ? 'Đang xử lý...' : isEditMode ? 'Lưu cập nhật' : 'Tạo giao dịch'}
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
