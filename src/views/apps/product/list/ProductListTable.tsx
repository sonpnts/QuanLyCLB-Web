'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { TextFieldProps } from '@mui/material/TextField'

import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'

import type { ProductType } from '@/types/apps/productTypes'
import productService from '@/services/productService'
import type { GetProductsParams } from '@/services/productService'
import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'
import useConfirmAction from '@/hooks/useConfirmAction'
import { buildModulePermissionMap } from '@/utils/rbac'

import AddProductDrawer from './AddProductDrawer'
import EditProductDrawer from './EditProductDrawer'
import TableFilters from './TableFilters'

import tableStyles from '@core/styles/table.module.css'

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })

  return itemRank.passed
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => onChange(value), debounce)

    return () => clearTimeout(timeout)
  }, [value, debounce, onChange])

  return <TextField {...props} value={value} onChange={event => setValue(event.target.value)} size='small' />
}

const columnHelper = createColumnHelper<ProductType>()

const ProductListTable = () => {
  const router = useRouter()
  const { showNotification } = useNotification()
  const { confirm, confirmDialog } = useConfirmAction()
  const { auth } = useAuth()
  const productPermissions = useMemo(
    () => buildModulePermissionMap(auth?.permissions, auth?.roles, 'Product'),
    [auth?.permissions, auth?.roles]
  )
  const bundlePermissions = useMemo(
    () => buildModulePermissionMap(auth?.permissions, auth?.roles, 'ProductBundle'),
    [auth?.permissions, auth?.roles]
  )
  const inventoryPermissions = useMemo(
    () => buildModulePermissionMap(auth?.permissions, auth?.roles, 'ProductInventory'),
    [auth?.permissions, auth?.roles]
  )
  const reportPermissions = useMemo(
    () => buildModulePermissionMap(auth?.permissions, auth?.roles, 'ProductReport'),
    [auth?.permissions, auth?.roles]
  )

  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null)
  const [variantSummaryProduct, setVariantSummaryProduct] = useState<ProductType | null>(null)
  const [data, setData] = useState<ProductType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterParams, setFilterParams] = useState<GetProductsParams>({})

  const showNotificationRef = useRef(showNotification)
  showNotificationRef.current = showNotification

  const handleFilterChange = useCallback((params: GetProductsParams) => {
    setFilterParams(params)
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await productService.getProducts({ pageSize: 300, ...filterParams })

      if (!response.success || !response.data) {
        showNotificationRef.current(response.message || 'Không thể tải danh sách sản phẩm.', 'error')
        return
      }

      setData(response.data)
    } catch {
      showNotificationRef.current('Đã có lỗi khi tải danh sách sản phẩm.', 'error')
    } finally {
      setLoading(false)
    }
  }, [filterParams])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa sản phẩm',
      description: 'Bạn có chắc chắn muốn xóa mềm sản phẩm này?',
      confirmText: 'Xóa'
    })

    if (!confirmed) return

    try {
      const response = await productService.deleteProduct(id)

      if (!response.success) {
        showNotificationRef.current(response.message || 'Không thể xóa sản phẩm.', 'error')
        return
      }

      setData(prev => prev.map(item => (item.id === id ? { ...item, isActive: false } : item)))
      showNotificationRef.current('Đã xóa mềm sản phẩm.', 'success')
    } catch {
      showNotificationRef.current('Đã có lỗi khi xóa sản phẩm.', 'error')
    }
  }

  const handleEdit = (product: ProductType) => {
    setSelectedProduct(product)
    setEditDrawerOpen(true)
  }

  const handleSaved = (updated: ProductType) => {
    setData(prev => prev.map(item => (item.id === updated.id ? updated : item)))
    setVariantSummaryProduct(prev => (prev?.id === updated.id ? updated : prev))
  }

  const handleRestore = async (id: string) => {
    try {
      const response = await productService.restoreProduct(id)

      if (!response.success) {
        showNotificationRef.current(response.message || 'Không thể khôi phục sản phẩm.', 'error')
        return
      }

      setData(prev => prev.map(item => (item.id === id ? { ...item, isActive: true } : item)))
      showNotificationRef.current('Khôi phục sản phẩm thành công.', 'success')
    } catch {
      showNotificationRef.current('Đã có lỗi khi khôi phục sản phẩm.', 'error')
    }
  }

  const columns = useMemo<ColumnDef<ProductType, any>[]>(() => {
    const nextColumns: ColumnDef<ProductType, any>[] = [
      // columnHelper.accessor('code', {
      //   header: 'Mã sản phẩm',
      //   cell: ({ row }) => <Typography className='font-medium'>{row.original.code}</Typography>
      // }),
      columnHelper.accessor('name', {
        header: 'Tên sản phẩm',
        cell: ({ row }) => (
          <Stack spacing={0.5}>
            <Typography>{row.original.name}</Typography>
            {row.original.description ? (
              <Typography variant='caption' color='text.secondary'>
                {row.original.description}
              </Typography>
            ) : null}
          </Stack>
        )
      }),
      columnHelper.accessor('category', {
        header: 'Danh mục',
        cell: ({ row }) => <Typography>{row.original.category || '-'}</Typography>
      }),
      columnHelper.accessor('unitPrice', {
        header: 'Giá gốc',
        cell: ({ row }) => (
          <Typography className='font-medium' color='success.main'>
            {formatCurrency(row.original.unitPrice)}
          </Typography>
        )
      }),
      columnHelper.display({
        id: 'variantCount',
        header: 'Biến thể',
        cell: ({ row }) => {
          const variants = (row.original.variants || []).filter(item => item.isActive !== false)

          return (
            <Stack spacing={0.5}>
              <Typography>{variants.length}</Typography>
              {variants.length > 0 ? (
                <Typography variant='caption' color='text.secondary'>
                  {variants.slice(0, 2).map(item => item.label).join(', ')}
                  {variants.length > 2 ? '...' : ''}
                </Typography>
              ) : null}
            </Stack>
          )
        }
      }),
      columnHelper.display({
        id: 'stockQuantity',
        header: 'Tồn kho',
        cell: ({ row }) => (
          <Stack spacing={0.75}>
            <Typography className='font-medium'>{Number(row.original.totalStockQuantity || 0)}</Typography>
            <Button variant='text' size='small' sx={{ justifyContent: 'flex-start', p: 0, minWidth: 0 }} onClick={() => setVariantSummaryProduct(row.original)}>
              Xem chi tiết tồn kho
            </Button>
          </Stack>
        )
      }),
      columnHelper.accessor('isActive', {
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Chip
            size='small'
            variant='tonal'
            color={row.original.isActive ? 'success' : 'secondary'}
            label={row.original.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
          />
        )
      })
    ]

    if (productPermissions.canUpdate || productPermissions.canDelete) {
      nextColumns.push({
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            {productPermissions.canUpdate ? (
              <IconButton color='primary' title='Chỉnh sửa' onClick={() => handleEdit(row.original)}>
                <i className='ri-edit-box-line' />
              </IconButton>
            ) : null}
            {productPermissions.canDelete ? (
              row.original.isActive ? (
                <IconButton color='error' title='Xóa mềm' onClick={() => handleDelete(row.original.id)}>
                  <i className='ri-delete-bin-6-line' />
                </IconButton>
              ) : (
                <IconButton color='success' title='Khôi phục' onClick={() => handleRestore(row.original.id)}>
                  <i className='ri-loop-left-line' />
                </IconButton>
              )
            ) : null}
          </div>
        )
      })
    }

    return nextColumns
  }, [productPermissions.canDelete, productPermissions.canUpdate])

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const activeVariantSummary = useMemo(
    () => (variantSummaryProduct?.variants || []).filter(item => item.isActive !== false),
    [variantSummaryProduct]
  )

  return (
    <>
      <Card>
        <CardHeader title='Danh sách sản phẩm' />
        <TableFilters onFilterChange={handleFilterChange} />
        <Divider />
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Tìm kiếm sản phẩm...'
            className='max-sm:is-full'
          />
          <div className='flex gap-2 flex-wrap'>
            {inventoryPermissions.canView ? (
              <Button variant='outlined' color='secondary' onClick={() => router.push('/apps/product/inventory')}>
                Quản lý kho
              </Button>
            ) : null}
            {bundlePermissions.canView ? (
              <Button variant='outlined' color='warning' onClick={() => router.push('/apps/product/bundles')}>
                Quản lý combo
              </Button>
            ) : null}
            {reportPermissions.canView ? (
              <Button variant='outlined' color='info' onClick={() => router.push('/apps/product/report')}>
                Báo cáo sản phẩm
              </Button>
            ) : null}
            {productPermissions.canCreate ? (
              <Button variant='contained' onClick={() => setAddDrawerOpen(true)}>
                Thêm sản phẩm
              </Button>
            ) : null}
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={classnames({
                            'flex items-center': header.column.getIsSorted(),
                            'cursor-pointer select-none': header.column.getCanSort()
                          })}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getFilteredRowModel().rows.length === 0 ? (
                <tr>
                  <td className='text-center' colSpan={columns.length}>
                    {loading ? 'Đang tải...' : 'Không có dữ liệu'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          className='border-bs'
          count={table.getPrePaginationRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          onRowsPerPageChange={event => table.setPageSize(Number(event.target.value))}
        />
      </Card>

      <Dialog open={!!variantSummaryProduct} onClose={() => setVariantSummaryProduct(null)} maxWidth='sm' fullWidth>
        <DialogTitle>Tổng quan tồn kho sản phẩm</DialogTitle>
        <DialogContent>
          {variantSummaryProduct ? (
            <Stack spacing={3} sx={{ pt: 1 }}>
              <div>
                <Typography variant='h6'> {variantSummaryProduct.name}</Typography>
                <Typography color='text.secondary'>Tổng tồn kho hiện tại: {Number(variantSummaryProduct.totalStockQuantity || 0)}</Typography>
              </div>

              {activeVariantSummary.length > 0 ? (
                <Stack spacing={1.5}>
                  {activeVariantSummary.map(variant => (
                    <Card key={variant.id} variant='outlined'>
                      <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ p: 3 }}>
                        <div>
                          <Typography fontWeight={600}>{variant.label}</Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {variant.size ? `Size ${variant.size}` : 'Không có size'}
                            {variant.color ? ` • ${variant.color}` : ''}
                          </Typography>
                        </div>
                        <Chip color='primary' variant='tonal' label={`${variant.stockQuantity} sản phẩm`} />
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Alert severity='info'>Sản phẩm này không có biến thể. Tổng tồn kho hiện tại là {Number(variantSummaryProduct.totalStockQuantity || 0)}.</Alert>
              )}
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>

      {productPermissions.canCreate ? (
        <AddProductDrawer open={addDrawerOpen} handleClose={() => setAddDrawerOpen(false)} setData={setData} />
      ) : null}
      {productPermissions.canUpdate ? (
        <EditProductDrawer
          open={editDrawerOpen}
          handleClose={() => {
            setEditDrawerOpen(false)
            setSelectedProduct(null)
          }}
          product={selectedProduct}
          onSaved={handleSaved}
        />
      ) : null}
      {confirmDialog}
    </>
  )
}

export default ProductListTable
