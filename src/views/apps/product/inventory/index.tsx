'use client'

import { useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import productService from '@/services/productService'
import type {
  CreateProductInventoryBatchEntryRequest,
  CreateProductInventoryEntryRequest
} from '@/services/productService'
import type { ProductInventoryTransactionType, ProductType } from '@/types/apps/productTypes'
import { buildModulePermissionMap } from '@/utils/rbac'

import tableStyles from '@core/styles/table.module.css'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const transactionTypeOptions = [
  { value: 'Import', label: 'Nhập hàng' },
  { value: 'AdjustmentIncrease', label: 'Điều chỉnh tăng' },
  { value: 'AdjustmentDecrease', label: 'Điều chỉnh giảm' },
  { value: 'DamageWriteOff', label: 'Giảm tồn hàng lỗi' }
] as const

const transactionTypeLabelMap: Record<string, string> = {
  Import: 'Nhập hàng',
  AdjustmentIncrease: 'Điều chỉnh tăng',
  AdjustmentDecrease: 'Điều chỉnh giảm',
  DamageWriteOff: 'Giảm tồn hàng lỗi',
  Sale: 'Bán hàng',
  SaleRestore: 'Hoàn kho do xóa bán hàng',
  PaymentSale: 'Bán hàng',
  PaymentSaleRestore: 'Hoàn kho do xóa bán hàng'
}

const referenceTypeLabelMap: Record<string, string> = {
  Manual: 'Nhập kho / điều chỉnh',
  ProductSale: 'Dữ liệu bán hàng',
  PaymentRecord: 'Dữ liệu bán hàng'
}

type InventoryActionType = 'Import' | 'AdjustmentIncrease' | 'AdjustmentDecrease' | 'DamageWriteOff'

type BulkInventoryRow = {
  productVariantId?: string
  label: string
  stockQuantity: number
  quantity: number
  unitCost?: number
}

const ProductInventoryView = () => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()

  const inventoryPermissions = useMemo(
    () => buildModulePermissionMap(auth?.permissions, auth?.roles, 'ProductInventory'),
    [auth?.permissions, auth?.roles]
  )

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [products, setProducts] = useState<ProductType[]>([])
  const [transactions, setTransactions] = useState<ProductInventoryTransactionType[]>([])
  const [filters, setFilters] = useState({ productId: '' })
  const [transactionFilters, setTransactionFilters] = useState({ transactionType: '', referenceType: '' })
  const [transactionPage, setTransactionPage] = useState(0)
  const [transactionRowsPerPage, setTransactionRowsPerPage] = useState(10)
  const [inventoryActionType, setInventoryActionType] = useState<InventoryActionType>('Import')

  const [form, setForm] = useState<CreateProductInventoryEntryRequest>({
    productId: '',
    productVariantId: undefined,
    quantity: 1,
    unitCost: undefined,
    transactionType: 'DamageWriteOff',
    notes: ''
  })

  const [importForm, setImportForm] = useState<{
    productId: string
    transactionType: 'Import' | 'AdjustmentIncrease'
    notes: string
    items: BulkInventoryRow[]
  }>({
    productId: '',
    transactionType: 'Import',
    notes: '',
    items: []
  })

  const selectedProduct = useMemo(
    () => products.find(item => item.id === form.productId) || null,
    [form.productId, products]
  )

  const selectedImportProduct = useMemo(
    () => products.find(item => item.id === importForm.productId) || null,
    [importForm.productId, products]
  )

  const displayedProducts = useMemo(
    () => (filters.productId ? products.filter(item => item.id === filters.productId) : products),
    [filters.productId, products]
  )

  const selectedVariants = useMemo(
    () => (selectedProduct?.variants || []).filter(item => item.isActive !== false),
    [selectedProduct]
  )

  const filteredTransactions = useMemo(() => {
    return transactions.filter(item => {
      if (transactionFilters.transactionType && item.transactionType !== transactionFilters.transactionType) {
        return false
      }

      if (transactionFilters.referenceType) {
        const normalizedReferenceType = item.referenceType === 'Manual' ? 'Manual' : 'Sales'

        if (normalizedReferenceType !== transactionFilters.referenceType) {
          return false
        }
      }

      return true
    })
  }, [transactions, transactionFilters.referenceType, transactionFilters.transactionType])

  const pagedTransactions = useMemo(() => {
    const start = transactionPage * transactionRowsPerPage

    
return filteredTransactions.slice(start, start + transactionRowsPerPage)
  }, [filteredTransactions, transactionPage, transactionRowsPerPage])

  const totals = useMemo(() => {
    return products.reduce(
      (accumulator, product) => {
        accumulator.totalProducts += 1
        accumulator.totalVariants += (product.variants || []).filter(item => item.isActive !== false).length
        accumulator.totalUnits += Number(product.totalStockQuantity || 0)
        accumulator.totalValue += Number(product.unitPrice || 0) * Number(product.totalStockQuantity || 0)
        
return accumulator
      },
      { totalProducts: 0, totalVariants: 0, totalUnits: 0, totalValue: 0 }
    )
  }, [products])

  const isBulkInventoryAction = inventoryActionType === 'Import' || inventoryActionType === 'AdjustmentIncrease'

  const loadData = async () => {
    try {
      setLoading(true)

      const [inventoryRes, transactionRes] = await Promise.all([
        productService.getInventory({ pageSize: 500, isActive: true }),
        productService.getInventoryTransactions(filters.productId || undefined)
      ])

      setProducts(inventoryRes.success && inventoryRes.data ? inventoryRes.data : [])
      setTransactions(transactionRes.success && transactionRes.data ? transactionRes.data : [])
    } catch {
      showNotification('Không thể tải dữ liệu kho sản phẩm.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [filters.productId])

  useEffect(() => {
    setTransactionPage(0)
  }, [transactionFilters])

  useEffect(() => {
    if (!selectedImportProduct) {
      setImportForm(prev => ({ ...prev, items: [] }))
      
return
    }

    const activeVariants = (selectedImportProduct.variants || []).filter(item => item.isActive !== false)

    if (activeVariants.length > 0) {
      setImportForm(prev => ({
        ...prev,
        items: activeVariants.map(item => ({
          productVariantId: item.id,
          label: item.label,
          stockQuantity: item.stockQuantity,
          quantity: 0,
          unitCost: undefined
        }))
      }))
      
return
    }

    setImportForm(prev => ({
      ...prev,
      items: [
        {
          productVariantId: undefined,
          label: 'Sản phẩm mặc định',
          stockQuantity: Number(selectedImportProduct.totalStockQuantity || 0),
          quantity: 0,
          unitCost: undefined
        }
      ]
    }))
  }, [selectedImportProduct])

  const resetSingleForm = (nextType: InventoryActionType) => {
    setForm({
      productId: '',
      productVariantId: undefined,
      quantity: 1,
      unitCost: undefined,
      transactionType: nextType,
      notes: ''
    })
  }

  const resetBulkForm = (nextType: InventoryActionType) => {
    setImportForm({
      productId: '',
      transactionType: nextType === 'AdjustmentIncrease' ? 'AdjustmentIncrease' : 'Import',
      notes: '',
      items: []
    })
  }

  const handleActionTypeChange = (nextType: InventoryActionType) => {
    setInventoryActionType(nextType)
    resetSingleForm(nextType)
    resetBulkForm(nextType)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.productId || Number(form.quantity || 0) <= 0) {
      showNotification('Vui lòng chọn sản phẩm và số lượng hợp lệ.', 'error')
      
return
    }

    if (selectedProduct?.hasVariants && !form.productVariantId) {
      showNotification('Vui lòng chọn biến thể sản phẩm.', 'error')
      
return
    }

    try {
      setSubmitting(true)

      const response = await productService.createInventoryEntry({
        ...form,
        transactionType: inventoryActionType,
        notes: form.notes?.trim() || undefined,
        unitCost: form.unitCost ? Number(form.unitCost) : undefined
      })

      if (!response.success) {
        showNotification(response.message || 'Không thể cập nhật kho sản phẩm.', 'error')
        
return
      }

      showNotification('Đã cập nhật kho sản phẩm thành công.', 'success')
      resetSingleForm(inventoryActionType)
      await loadData()
    } finally {
      setSubmitting(false)
    }
  }

  const handleImportSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!importForm.productId) {
      showNotification('Vui lòng chọn sản phẩm cần nhập kho.', 'error')
      
return
    }

    const items = importForm.items
      .filter(item => Number(item.quantity || 0) > 0)
      .map(item => ({
        productVariantId: item.productVariantId,
        quantity: Number(item.quantity || 0),
        unitCost: item.unitCost,
        notes: undefined
      }))

    if (items.length === 0) {
      showNotification('Vui lòng nhập số lượng cho ít nhất một biến thể.', 'error')
      
return
    }

    try {
      setSubmitting(true)

      const payload: CreateProductInventoryBatchEntryRequest = {
        productId: importForm.productId,
        transactionType: importForm.transactionType,
        notes: importForm.notes.trim() || undefined,
        items
      }

      const response = await productService.createInventoryEntries(payload)

      if (!response.success) {
        showNotification(response.message || 'Không thể cập nhật kho nhiều biến thể.', 'error')
        
return
      }

      showNotification('Đã cập nhật kho cho các biến thể đã chọn.', 'success')
      resetBulkForm(inventoryActionType)
      await loadData()
    } finally {
      setSubmitting(false)
    }
  }

  if (!inventoryPermissions.canView) {
    return <Alert severity='warning'>Bạn không có quyền xem quản lý kho sản phẩm.</Alert>
  }

  return (
    <Stack spacing={5}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card variant='outlined'>
            <CardContent>
              <Typography color='text.secondary'>Tổng sản phẩm</Typography>
              <Typography variant='h4'>{totals.totalProducts}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card variant='outlined'>
            <CardContent>
              <Typography color='text.secondary'>Tổng biến thể</Typography>
              <Typography variant='h4'>{totals.totalVariants}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card variant='outlined'>
            <CardContent>
              <Typography color='text.secondary'>Tổng tồn kho</Typography>
              <Typography variant='h4'>{totals.totalUnits}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card variant='outlined'>
            <CardContent>
              <Typography color='text.secondary'>Giá trị tồn kho ước tính</Typography>
              <Typography variant='h6'>{formatCurrency(totals.totalValue)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={5}>
        <Grid size={{ xs: 12, xl: 5 }}>
          <Stack spacing={5}>
            <Card>
              <CardHeader
                title='Quản lý kho'
                subheader='Nhập, tăng tồn hoặc giảm tồn ngay trong cùng một khu thao tác. Form sẽ đổi theo loại giao dịch bạn chọn.'
              />
              <Divider />
              <CardContent>
                {inventoryPermissions.canUpdate ? (
                  <Stack spacing={4}>
                    <Grid container spacing={4}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth>
                          <InputLabel>Loại giao dịch</InputLabel>
                          <Select
                            label='Loại giao dịch'
                            value={inventoryActionType}
                            onChange={event => handleActionTypeChange(String(event.target.value) as InventoryActionType)}
                          >
                            {transactionTypeOptions.map(item => (
                              <MenuItem key={item.value} value={item.value}>
                                {item.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Alert severity={isBulkInventoryAction ? 'info' : 'warning'}>
                          {isBulkInventoryAction
                            ? 'Loại này hỗ trợ nhập hoặc tăng tồn cho nhiều biến thể trong cùng một lần lưu.'
                            : 'Loại này dùng để giảm tồn, loại bỏ hàng hỏng lỗi hoặc điều chỉnh giảm tồn kho.'}
                        </Alert>
                      </Grid>
                    </Grid>

                    {isBulkInventoryAction ? (
                      <form onSubmit={handleImportSubmit} className='flex flex-col gap-4'>
                        <FormControl fullWidth>
                          <InputLabel>Sản phẩm</InputLabel>
                          <Select
                            label='Sản phẩm'
                            value={importForm.productId}
                            onChange={event =>
                              setImportForm(prev => ({
                                ...prev,
                                productId: String(event.target.value),
                                transactionType: inventoryActionType === 'AdjustmentIncrease' ? 'AdjustmentIncrease' : 'Import'
                              }))
                            }
                          >
                            {products.map(item => (
                              <MenuItem key={item.id} value={item.id}>
                                {item.code} - {item.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <TextField
                          fullWidth
                          label='Ghi chú chung'
                          value={importForm.notes}
                          onChange={event => setImportForm(prev => ({ ...prev, notes: event.target.value }))}
                        />

                        {!selectedImportProduct ? (
                          <Alert severity='info'>Chọn sản phẩm để nhập số lượng cho từng biến thể.</Alert>
                        ) : (
                          <Stack spacing={2}>
                            {importForm.items.map((item, index) => (
                              <Grid container spacing={3} key={`${item.productVariantId || 'base'}-${index}`}>
                                <Grid size={{ xs: 12, md: 5 }}>
                                  <TextField
                                    fullWidth
                                    label='Biến thể'
                                    value={`${item.label} - tồn ${item.stockQuantity}`}
                                    slotProps={{ input: { readOnly: true } }}
                                  />
                                </Grid>
                                <Grid size={{ xs: 12, md: 3 }}>
                                  <TextField
                                    fullWidth
                                    label='Số lượng'
                                    type='number'
                                    value={item.quantity}
                                    onChange={event =>
                                      setImportForm(prev => ({
                                        ...prev,
                                        items: prev.items.map((row, rowIndex) =>
                                          rowIndex === index ? { ...row, quantity: Number(event.target.value) || 0 } : row
                                        )
                                      }))
                                    }
                                  />
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                  <TextField
                                    fullWidth
                                    label='Đơn giá nhập'
                                    type='number'
                                    value={item.unitCost ?? ''}
                                    onChange={event =>
                                      setImportForm(prev => ({
                                        ...prev,
                                        items: prev.items.map((row, rowIndex) =>
                                          rowIndex === index
                                            ? {
                                                ...row,
                                                unitCost: event.target.value ? Number(event.target.value) : undefined
                                              }
                                            : row
                                        )
                                      }))
                                    }
                                  />
                                </Grid>
                              </Grid>
                            ))}
                          </Stack>
                        )}

                        <Box>
                          <Button type='submit' variant='contained' disabled={submitting}>
                            {submitting ? 'Đang cập nhật...' : 'Lưu quản lý kho'}
                          </Button>
                        </Box>
                      </form>
                    ) : (
                      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
                        <FormControl fullWidth>
                          <InputLabel>Sản phẩm</InputLabel>
                          <Select
                            label='Sản phẩm'
                            value={form.productId}
                            onChange={event =>
                              setForm(prev => ({
                                ...prev,
                                productId: String(event.target.value),
                                productVariantId: undefined,
                                transactionType: inventoryActionType
                              }))
                            }
                          >
                            {products.map(item => (
                              <MenuItem key={item.id} value={item.id}>
                                {item.code} - {item.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        {selectedProduct?.hasVariants ? (
                          <FormControl fullWidth>
                            <InputLabel>Biến thể</InputLabel>
                            <Select
                              label='Biến thể'
                              value={form.productVariantId || ''}
                              onChange={event =>
                                setForm(prev => ({ ...prev, productVariantId: String(event.target.value) || undefined }))
                              }
                            >
                              {selectedVariants.map(item => (
                                <MenuItem key={item.id} value={item.id}>
                                  {item.label} - tồn {item.stockQuantity}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : null}

                        <Grid container spacing={4}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              fullWidth
                              label='Loại giao dịch'
                              value={transactionTypeLabelMap[inventoryActionType] || inventoryActionType}
                              slotProps={{ input: { readOnly: true } }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              fullWidth
                              label='Số lượng'
                              type='number'
                              value={form.quantity}
                              onChange={event => setForm(prev => ({ ...prev, quantity: Number(event.target.value) || 0 }))}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              fullWidth
                              label='Đơn giá nhập (nếu có)'
                              type='number'
                              value={form.unitCost ?? ''}
                              onChange={event =>
                                setForm(prev => ({
                                  ...prev,
                                  unitCost: event.target.value ? Number(event.target.value) : undefined
                                }))
                              }
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              fullWidth
                              label='Ghi chú'
                              value={form.notes || ''}
                              onChange={event =>
                                setForm(prev => ({ ...prev, notes: event.target.value, transactionType: inventoryActionType }))
                              }
                            />
                          </Grid>
                        </Grid>

                        <Box>
                          <Button type='submit' variant='contained' disabled={submitting}>
                            {submitting ? 'Đang cập nhật...' : 'Lưu quản lý kho'}
                          </Button>
                        </Box>
                      </form>
                    )}
                  </Stack>
                ) : (
                  <Alert severity='info'>Bạn chỉ có quyền xem kho, không có quyền nhập hàng hoặc điều chỉnh kho.</Alert>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, xl: 7 }}>
          <Card>
            <CardHeader
              title='Tồn kho hiện tại'
              action={
                <FormControl sx={{ minWidth: 220 }} size='small'>
                  <InputLabel>Lọc theo sản phẩm</InputLabel>
                  <Select
                    label='Lọc theo sản phẩm'
                    value={filters.productId}
                    onChange={event => setFilters(prev => ({ ...prev, productId: String(event.target.value) }))}
                  >
                    <MenuItem value=''>Tất cả sản phẩm</MenuItem>
                    {products.map(item => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.code} - {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              }
            />
            <Divider />
            <CardContent>
              <div className='overflow-x-auto'>
                <table className={tableStyles.table}>
                  <thead>
                    <tr>
                      <th>Mã sản phẩm</th>
                      <th>Tên sản phẩm</th>
                      <th>Danh mục</th>
                      <th>Tồn kho</th>
                      <th>Biến thể</th>
                      <th>Đơn giá gốc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className='text-center'>
                          {loading ? 'Đang tải...' : 'Không có dữ liệu'}
                        </td>
                      </tr>
                    ) : (
                      displayedProducts.map(item => (
                        <tr key={item.id}>
                          <td>{item.code}</td>
                          <td>{item.name}</td>
                          <td>{item.category || '-'}</td>
                          <td>{Number(item.totalStockQuantity || 0)}</td>
                          <td>
                            {(item.variants || []).filter(variant => variant.isActive !== false).length > 0 ? (
                              <Stack spacing={0.5}>
                                {(item.variants || [])
                                  .filter(variant => variant.isActive !== false)
                                  .map(variant => (
                                    <Typography key={variant.id} variant='body2'>
                                      {variant.label}: {variant.stockQuantity}
                                    </Typography>
                                  ))}
                              </Stack>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>{formatCurrency(Number(item.unitPrice || 0))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardHeader
          title='Lịch sử giao dịch kho'
          action={
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%', alignItems: 'stretch' }}>
              <FormControl fullWidth sx={{ minWidth: { sm: 220 }, flex: 1 }}>
                <InputLabel>Loại giao dịch</InputLabel>
                <Select
                  label='Loại giao dịch'
                  value={transactionFilters.transactionType}
                  onChange={event =>
                    setTransactionFilters(prev => ({ ...prev, transactionType: String(event.target.value) }))
                  }
                >
                  <MenuItem value=''>Tất cả</MenuItem>
                  {[...new Set(transactions.map(item => item.transactionType).filter(Boolean))].map(item => (
                    <MenuItem key={item} value={item}>
                      {transactionTypeLabelMap[item] || item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ minWidth: { sm: 220 }, flex: 1 }}>
                <InputLabel>Nguồn dữ liệu</InputLabel>
                <Select
                  label='Nguồn dữ liệu'
                  value={transactionFilters.referenceType}
                  onChange={event =>
                    setTransactionFilters(prev => ({ ...prev, referenceType: String(event.target.value) }))
                  }
                >
                  <MenuItem value=''>Tất cả</MenuItem>
                  <MenuItem value='Manual'>Nhập kho / điều chỉnh</MenuItem>
                  <MenuItem value='Sales'>Dữ liệu bán hàng</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          }
        />
        <Divider />
        <CardContent>
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Sản phẩm</th>
                  <th>Biến thể</th>
                  <th>Loại giao dịch</th>
                  <th>Nguồn dữ liệu</th>
                  <th>Biến động</th>
                  <th>Tồn sau giao dịch</th>
                  <th>Đơn giá nhập</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {pagedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className='text-center'>
                      {loading ? 'Đang tải...' : 'Không có giao dịch phù hợp'}
                    </td>
                  </tr>
                ) : (
                  pagedTransactions.map(item => (
                    <tr key={item.id}>
                      <td>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '-'}</td>
                      <td>{item.productName}</td>
                      <td>{item.productVariantLabel || '-'}</td>
                      <td>
                        <Chip
                          size='small'
                          label={transactionTypeLabelMap[item.transactionType] || item.transactionType}
                          variant='tonal'
                        />
                      </td>
                      <td>{referenceTypeLabelMap[item.referenceType || ''] || 'Khác'}</td>
                      <td>{item.quantityChange > 0 ? `+${item.quantityChange}` : item.quantityChange}</td>
                      <td>{item.stockAfterTransaction}</td>
                      <td>{item.unitCost ? formatCurrency(Number(item.unitCost)) : '-'}</td>
                      <td>{item.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            component='div'
            rowsPerPageOptions={[10, 25, 50]}
            count={filteredTransactions.length}
            rowsPerPage={transactionRowsPerPage}
            page={transactionPage}
            onPageChange={(_, page) => setTransactionPage(page)}
            onRowsPerPageChange={event => {
              setTransactionRowsPerPage(Number(event.target.value))
              setTransactionPage(0)
            }}
          />
        </CardContent>
      </Card>
    </Stack>
  )
}

export default ProductInventoryView
