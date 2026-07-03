'use client'

import { useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import productService from '@/services/productService'
import type { ProductBundleType, ProductType } from '@/types/apps/productTypes'
import { buildModulePermissionMap } from '@/utils/rbac'

import tableStyles from '@core/styles/table.module.css'

type BundleItemForm = {
  id?: string
  clientId: string
  productId: string
  quantity: number
  discountAmount: string
}

const createBundleItemRow = (): BundleItemForm => ({
  clientId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  productId: '',
  quantity: 1,
  discountAmount: ''
})

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const ProductBundleView = () => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState<ProductType[]>([])
  const [bundles, setBundles] = useState<ProductBundleType[]>([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBundle, setEditingBundle] = useState<ProductBundleType | null>(null)

  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true
  })

  const [items, setItems] = useState<BundleItemForm[]>([])

  const loadData = async () => {
    try {
      setLoading(true)

      const [productRes, bundleRes] = await Promise.all([
        productService.getProducts({ pageSize: 500, isActive: true }),
        productService.getBundles({ pageSize: 500 })
      ])

      setProducts(productRes.success && productRes.data ? productRes.data : [])
      setBundles(bundleRes.success && bundleRes.data ? bundleRes.data : [])
    } catch {
      showNotification('Không thể tải dữ liệu combo sản phẩm.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi')),
    [products]
  )

  const bundlePermissions = useMemo(
    () => buildModulePermissionMap(auth?.permissions, auth?.roles, 'ProductBundle'),
    [auth?.permissions, auth?.roles]
  )

  const pagedBundles = useMemo(() => {
    const start = page * rowsPerPage

    
return bundles.slice(start, start + rowsPerPage)
  }, [bundles, page, rowsPerPage])

  const totalDiscount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.discountAmount || 0) * Number(item.quantity || 0), 0),
    [items]
  )

  const openCreateDialog = () => {
    setEditingBundle(null)
    setForm({
      code: '',
      name: '',
      description: '',
      isActive: true
    })
    setItems([createBundleItemRow()])
    setDialogOpen(true)
  }

  const openEditDialog = (bundle: ProductBundleType) => {
    setEditingBundle(bundle)
    setForm({
      code: bundle.code,
      name: bundle.name,
      description: bundle.description || '',
      isActive: bundle.isActive
    })
    setItems(
      bundle.items.map(item => ({
        id: item.id,
        clientId: item.id,
        productId: item.productId,
        quantity: item.quantity,
        discountAmount: String(item.discountAmount || '')
      }))
    )
    setDialogOpen(true)
  }

  const updateItem = (clientId: string, payload: Partial<BundleItemForm>) => {
    setItems(prev => prev.map(item => (item.clientId === clientId ? { ...item, ...payload } : item)))
  }

  const removeItem = (clientId: string) => {
    setItems(prev => prev.filter(item => item.clientId !== clientId))
  }

  const handleSave = async () => {
    if (!editingBundle && !bundlePermissions.canCreate) {
      showNotification('Bạn không có quyền tạo combo.', 'error')
      
return
    }

    if (editingBundle && !bundlePermissions.canUpdate) {
      showNotification('Bạn không có quyền cập nhật combo.', 'error')
      
return
    }

    if (!form.name.trim() || items.length === 0) {
      showNotification('Vui lòng nhập tên combo và ít nhất một dòng sản phẩm.', 'error')
      
return
    }

    if (!editingBundle && !form.code.trim()) {
      showNotification('Vui lòng nhập mã combo.', 'error')
      
return
    }

    const normalizedItems = items.map((item, index) => ({
      id: item.id,
      productId: item.productId,
      quantity: Number(item.quantity || 0),
      discountAmount: Number(item.discountAmount || 0),
      sortOrder: index,
      isActive: true
    }))

    if (normalizedItems.some(item => !item.productId || item.quantity <= 0 || item.discountAmount <= 0)) {
      showNotification('Các dòng combo phải chọn sản phẩm, số lượng và mức giảm hợp lệ.', 'error')
      
return
    }

    try {
      setSaving(true)

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        items: normalizedItems,
        isActive: form.isActive
      }

      const response = editingBundle
        ? await productService.updateBundle(editingBundle.id, payload)
        : await productService.createBundle({
            code: form.code.trim(),
            ...payload
          })

      if (!response.success || !response.data) {
        showNotification(response.message || 'Không thể lưu combo.', 'error')
        
return
      }

      if (editingBundle) {
        setBundles(prev => prev.map(item => (item.id === response.data!.id ? response.data! : item)))
      } else {
        setBundles(prev => [response.data!, ...prev])
      }

      showNotification(editingBundle ? 'Cập nhật combo thành công.' : 'Tạo combo thành công.', 'success')
      setDialogOpen(false)
    } catch {
      showNotification('Đã có lỗi khi lưu combo.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          title='Combo sản phẩm'
          subheader='Combo chỉ cấu hình sản phẩm và mức giảm trên từng món. Lúc bán, hệ thống vẫn bung thành các dòng lẻ để chọn biến thể và trừ kho bình thường.'
          action={
            <Button variant='contained' onClick={openCreateDialog} disabled={!bundlePermissions.canCreate}>
              Thêm combo
            </Button>
          }
        />
        <Divider />
        <CardContent>
          {!bundlePermissions.canView ? (
            <Alert severity='warning'>Bạn không có quyền quản lý combo sản phẩm.</Alert>
          ) : loading ? (
            <Alert severity='info'>Đang tải dữ liệu combo...</Alert>
          ) : (
            <div className='overflow-x-auto'>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>Mã combo</th>
                    <th>Tên combo</th>
                    <th>Tổng giảm</th>
                    <th>Số dòng</th>
                    <th>Trạng thái</th>
                    <th>Chi tiết</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedBundles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className='text-center'>
                        Không có combo nào.
                      </td>
                    </tr>
                  ) : (
                    pagedBundles.map(bundle => (
                      <tr key={bundle.id}>
                        <td>{bundle.code}</td>
                        <td>
                          <Stack spacing={0.5}>
                            <Typography>{bundle.name}</Typography>
                            {bundle.description ? (
                              <Typography variant='caption' color='text.secondary'>
                                {bundle.description}
                              </Typography>
                            ) : null}
                          </Stack>
                        </td>
                        <td>
                          <Typography color='warning.main' fontWeight={700}>
                            {formatCurrency(bundle.items.reduce((sum, item) => sum + Number(item.discountAmount || 0) * Number(item.quantity || 0), 0))}
                          </Typography>
                        </td>
                        <td>{bundle.items.length}</td>
                        <td>
                          <Chip
                            size='small'
                            color={bundle.isActive ? 'success' : 'secondary'}
                            variant='tonal'
                            label={bundle.isActive ? 'Đang dùng' : 'Ngừng dùng'}
                          />
                        </td>
                        <td>
                          <Stack spacing={0.5}>
                            {bundle.items.map(item => (
                              <Typography key={item.id} variant='body2'>
                                {item.productName} x{item.quantity} (giảm {formatCurrency(item.discountAmount)})
                              </Typography>
                            ))}
                          </Stack>
                        </td>
                        <td>
                          <Button
                            size='small'
                            variant='outlined'
                            onClick={() => openEditDialog(bundle)}
                            disabled={!bundlePermissions.canUpdate}
                          >
                            Chỉnh sửa
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          <TablePagination
            component='div'
            count={bundles.length}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={event => {
              setRowsPerPage(Number(event.target.value))
              setPage(0)
            }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='lg' fullWidth>
        <DialogTitle>{editingBundle ? 'Chỉnh sửa combo' : 'Tạo combo mới'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label='Mã combo'
                  value={form.code}
                  onChange={event => setForm(prev => ({ ...prev, code: event.target.value }))}
                  disabled={Boolean(editingBundle) || !bundlePermissions.canCreate}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  label='Tên combo'
                  value={form.name}
                  onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
                  disabled={editingBundle ? !bundlePermissions.canUpdate : !bundlePermissions.canCreate}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Alert severity='info'>Không nhập giá combo. Chỉ cần cấu hình mức giảm trên từng món.</Alert>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label='Mô tả'
              value={form.description}
              onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))}
              disabled={editingBundle ? !bundlePermissions.canUpdate : !bundlePermissions.canCreate}
            />

            {editingBundle ? (
              <FormControlLabel
                control={<Switch checked={form.isActive} onChange={event => setForm(prev => ({ ...prev, isActive: event.target.checked }))} />}
                label={form.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                disabled={!bundlePermissions.canUpdate}
              />
            ) : null}

            <Stack direction='row' justifyContent='space-between' alignItems='center'>
              <Typography variant='subtitle1' fontWeight={700}>
                Dòng sản phẩm trong combo
              </Typography>
              <Button
                variant='outlined'
                onClick={() => setItems(prev => [...prev, createBundleItemRow()])}
                disabled={editingBundle ? !bundlePermissions.canUpdate : !bundlePermissions.canCreate}
              >
                Thêm dòng
              </Button>
            </Stack>

            {items.map((item, index) => {
              const product = products.find(row => row.id === item.productId)

              return (
                <Card key={item.clientId} variant='outlined'>
                  <CardContent>
                    <Grid container spacing={3} alignItems='center'>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          select
                          fullWidth
                          label='Sản phẩm'
                          value={item.productId}
                          onChange={event => updateItem(item.clientId, { productId: String(event.target.value) })}
                          disabled={editingBundle ? !bundlePermissions.canUpdate : !bundlePermissions.canCreate}
                        >
                          {sortedProducts.map(row => (
                            <MenuItem key={row.id} value={row.id}>
                              {row.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField
                          fullWidth
                          label='Số lượng'
                          type='number'
                          value={item.quantity}
                          onChange={event => updateItem(item.clientId, { quantity: Number(event.target.value) || 0 })}
                          disabled={editingBundle ? !bundlePermissions.canUpdate : !bundlePermissions.canCreate}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                          fullWidth
                          label='Giảm trên mỗi món'
                          type='number'
                          value={item.discountAmount}
                          onChange={event => updateItem(item.clientId, { discountAmount: event.target.value })}
                          disabled={editingBundle ? !bundlePermissions.canUpdate : !bundlePermissions.canCreate}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 1 }}>
                        <IconButton
                          color='error'
                          onClick={() => removeItem(item.clientId)}
                          disabled={items.length === 1 || (editingBundle ? !bundlePermissions.canUpdate : !bundlePermissions.canCreate)}
                        >
                          <i className='ri-delete-bin-line' />
                        </IconButton>
                      </Grid>
                    </Grid>
                    <Typography variant='caption' color='text.secondary'>
                      Dòng {index + 1}
                      {product?.hasVariants ? ' - biến thể sẽ được chọn khi bán' : ''}
                    </Typography>
                  </CardContent>
                </Card>
              )
            })}

            <Alert severity='info'>
              Tổng giảm hiện tại: {formatCurrency(totalDiscount)}. Khi đưa vào phiếu thu, mỗi món sẽ bung thành dòng lẻ để chọn biến thể và trừ kho bình thường.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            variant='contained'
            disabled={saving || (editingBundle ? !bundlePermissions.canUpdate : !bundlePermissions.canCreate)}
          >
            {saving ? 'Đang lưu...' : editingBundle ? 'Lưu thay đổi' : 'Tạo combo'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ProductBundleView
