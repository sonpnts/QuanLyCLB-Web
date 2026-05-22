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
import type { CreateProductInventoryEntryRequest } from '@/services/productService'
import type { ProductInventoryTransactionType, ProductType } from '@/types/apps/productTypes'
import { buildModulePermissionMap } from '@/utils/rbac'

import tableStyles from '@core/styles/table.module.css'

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const transactionTypeOptions = [
  { value: 'Import', label: 'Nhập hàng' },
  { value: 'AdjustmentIncrease', label: 'Điều chỉnh tăng' },
  { value: 'AdjustmentDecrease', label: 'Điều chỉnh giảm' }
]

const transactionTypeLabelMap: Record<string, string> = {
  Import: 'Nhập hàng',
  AdjustmentIncrease: 'Điều chỉnh tăng',
  AdjustmentDecrease: 'Điều chỉnh giảm',
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
  const [form, setForm] = useState<CreateProductInventoryEntryRequest>({
    productId: '',
    productVariantId: undefined,
    quantity: 1,
    unitCost: undefined,
    transactionType: 'Import',
    notes: ''
  })

  const selectedProduct = useMemo(() => products.find(item => item.id === form.productId) || null, [form.productId, products])
  const displayedProducts = useMemo(
    () => (filters.productId ? products.filter(item => item.id === filters.productId) : products),
    [filters.productId, products]
  )
  const selectedVariants = useMemo(() => (selectedProduct?.variants || []).filter(item => item.isActive !== false), [selectedProduct])

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
        notes: form.notes?.trim() || undefined,
        unitCost: form.unitCost ? Number(form.unitCost) : undefined
      })

      if (!response.success) {
        showNotification(response.message || 'Không thể cập nhật kho sản phẩm.', 'error')
        return
      }

      showNotification('Đã cập nhật kho sản phẩm thành công.', 'success')
      setForm({
        productId: '',
        productVariantId: undefined,
        quantity: 1,
        unitCost: undefined,
        transactionType: 'Import',
        notes: ''
      })
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
          <Card>
            <CardHeader title='Nhập hàng và điều chỉnh kho' />
            <Divider />
            <CardContent>
              {inventoryPermissions.canUpdate ? (
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
                          productVariantId: undefined
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
                      <FormControl fullWidth>
                        <InputLabel>Loại giao dịch</InputLabel>
                        <Select
                          label='Loại giao dịch'
                          value={form.transactionType}
                          onChange={event =>
                            setForm(prev => ({ ...prev, transactionType: String(event.target.value) }))
                          }
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
                        onChange={event => setForm(prev => ({ ...prev, notes: event.target.value }))}
                      />
                    </Grid>
                  </Grid>

                  <Box>
                    <Button type='submit' variant='contained' disabled={submitting}>
                      {submitting ? 'Đang cập nhật...' : 'Lưu giao dịch kho'}
                    </Button>
                  </Box>
                </form>
              ) : (
                <Alert severity='info'>Bạn chỉ có quyền xem kho, không có quyền nhập hàng hoặc điều chỉnh kho.</Alert>
              )}
            </CardContent>
          </Card>
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
          // subheader='Có thể lọc theo loại giao dịch và nguồn dữ liệu để kiểm tra nhanh bán hàng hoặc nhập kho.'
          action={
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ width: '100%', alignItems: 'stretch' }}
            >
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
