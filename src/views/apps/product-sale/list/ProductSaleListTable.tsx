'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { TextFieldProps } from '@mui/material/TextField'

import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import { fuzzyFilter } from '@/utils/tableHelpers'

import type { ProductSaleType } from '@/types/apps/productSaleTypes'
import type { ProductType } from '@/types/apps/productTypes'
import type { ClassType } from '@/types/apps/classTypes'
import type { UsersType } from '@/types/apps/userTypes'
import paymentService from '@/services/paymentService'
import productSaleService from '@/services/productSaleService'
import type { GetProductSalesParams } from '@/services/productSaleService'
import productService from '@/services/productService'
import classService from '@/services/classService'
import userService from '@/services/userService'
import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'
import { hasAdminRole } from '@/utils/roleUtils'
import { buildModulePermissionMap } from '@/utils/rbac'

import AddProductSaleDrawer from './AddProductSaleDrawer'
import TableFilters from './TableFilters'

import tableStyles from '@core/styles/table.module.css'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const PRODUCT_PAYMENT_TYPE = 3

const mapPaymentProductRecord = (payment: any): ProductSaleType => ({
  id: payment.id,
  source: 'payment',
  receiptNumber: payment.receiptNumber,
  studentName: payment.studentName,
  productId: payment.productId,
  productName: payment.productName || payment.description || 'Sản phẩm',
  classId: payment.classId,
  className: payment.className,
  soldByUserId: payment.collectedByUserId,
  soldByUserName: payment.collectedByUserName,
  quantity: 1,
  unitPrice: Number(payment.originalAmount ?? payment.amount ?? 0),
  totalAmount: Number(payment.amount ?? 0),
  saleDate: payment.paymentDate || payment.createdAt,
  buyerName: payment.studentName,
  notes: payment.description,
  isActive: payment.isActive ?? true,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt
})

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

const columnHelper = createColumnHelper<ProductSaleType>()

const ProductSaleListTable = () => {
  const router = useRouter()
  const { showNotification } = useNotification()
  const { auth } = useAuth()
  const isAdmin = hasAdminRole(auth?.roles)
  const productSalePermissions = useMemo(
    () => buildModulePermissionMap(auth?.permissions, auth?.roles, 'ProductSale'),
    [auth?.permissions, auth?.roles]
  )

  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<ProductSaleType | null>(null)
  const [data, setData] = useState<ProductSaleType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterParams, setFilterParams] = useState<GetProductSalesParams>({})

  const [products, setProducts] = useState<ProductType[]>([])
  const [classes, setClasses] = useState<ClassType[]>([])
  const [collectors, setCollectors] = useState<UsersType[]>([])

  const showNotificationRef = useRef(showNotification)
  showNotificationRef.current = showNotification

  const handleFilterChange = useCallback((params: GetProductSalesParams) => {
    setFilterParams(params)
  }, [])

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [productsRes, classesRes, coachesRes] = await Promise.all([
          productService.getSaleOptions(),
          classService.getClasses({ isActive: true, pageSize: 1000 }),
          isAdmin ? userService.getCoaches().catch(() => ({ success: true, data: [] })) : Promise.resolve({ success: true, data: [] })
        ])

        if (productsRes.success && productsRes.data) setProducts(productsRes.data)
        if (classesRes.success && classesRes.data) setClasses(classesRes.data)
        if (coachesRes.success && coachesRes.data) setCollectors(coachesRes.data)
      } catch (error) {
        // silently ignore reference data load errors
      }
    }

    loadReferences()
  }, [isAdmin])

  const loadSales = useCallback(async () => {
    try {
      setLoading(true)
      const [legacyResponse, paymentResponse] = await Promise.all([
        productSaleService.getProductSales(filterParams),
        paymentService.getPayments({
          pageSize: 1000,
          classId: filterParams.classId,
          collectedByUserId: filterParams.soldByUserId,
          paymentDateFrom: filterParams.saleDateFrom,
          paymentDateTo: filterParams.saleDateTo,
          type: PRODUCT_PAYMENT_TYPE
        })
      ])

      const legacyRows =
        legacyResponse.success && legacyResponse.data
          ? legacyResponse.data.map(item => ({ ...item, source: 'product-sale' as const }))
          : []
      const paymentRows =
        paymentResponse.success && paymentResponse.data
          ? paymentResponse.data
              .filter(item => !!item.productId)
              .filter(item => !filterParams.productId || item.productId === filterParams.productId)
              .map(mapPaymentProductRecord)
          : []

      setData(
        [...paymentRows, ...legacyRows].sort(
          (a, b) => new Date(b.saleDate || b.createdAt || 0).getTime() - new Date(a.saleDate || a.createdAt || 0).getTime()
        )
      )
    } catch (error) {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [filterParams])

  useEffect(() => {
    loadSales()
  }, [loadSales])

  const handleDelete = async (id: string) => {
    try {
      const response = await productSaleService.deleteProductSale(id)

      if (!response.success) {
        showNotificationRef.current(response.message || 'Không thể xóa giao dịch.', 'error')
        return
      }

      setData(prev => prev.map(item => (item.id === id ? { ...item, isActive: false } : item)))
      showNotificationRef.current('Đã xóa mềm giao dịch.', 'success')
    } catch (error) {
      showNotificationRef.current('Đã có lỗi khi xóa giao dịch.', 'error')
    }
  }

  const handleRestore = async (id: string) => {
    try {
      const response = await productSaleService.restoreProductSale(id)

      if (!response.success) {
        showNotificationRef.current(response.message || 'Không thể khôi phục giao dịch.', 'error')
        return
      }

      setData(prev => prev.map(item => (item.id === id ? { ...item, isActive: true } : item)))
      showNotificationRef.current('Khôi phục giao dịch thành công.', 'success')
    } catch (error) {
      showNotificationRef.current('Đã có lỗi khi khôi phục giao dịch.', 'error')
    }
  }

  const handleEdit = (sale: ProductSaleType) => {
    setSelectedSale(sale)
    setEditDrawerOpen(true)
  }

  const columns = useMemo<ColumnDef<ProductSaleType, any>[]>(() => {
    const nextColumns: ColumnDef<ProductSaleType, any>[] = [
      columnHelper.accessor('receiptNumber', {
        header: 'Biên lai',
        cell: ({ row }) =>
          row.original.receiptNumber ? (
            <Typography
              component={Link}
              href={`/apps/invoice/preview/${encodeURIComponent(row.original.receiptNumber)}`}
              color='primary.main'
              className='font-mono text-sm'
            >
              {row.original.receiptNumber}
            </Typography>
          ) : (
            <Typography color='text.secondary'>-</Typography>
          )
      }),
      columnHelper.accessor('studentName', {
        header: 'Học viên',
        cell: ({ row }) => <Typography>{row.original.studentName || row.original.buyerName || '-'}</Typography>
      }),
      columnHelper.accessor('productName', {
        header: 'Sản phẩm',
        cell: ({ row }) => <Typography className='font-medium'>{row.original.productName || '-'}</Typography>
      }),
      columnHelper.accessor('className', {
        header: 'Lớp',
        cell: ({ row }) => <Typography>{row.original.className || '-'}</Typography>
      }),
      columnHelper.accessor('soldByUserName', {
        header: 'Người thu',
        cell: ({ row }) => <Typography>{row.original.soldByUserName || '-'}</Typography>
      }),
      columnHelper.accessor('quantity', {
        header: 'SL',
        cell: ({ row }) => <Typography>{row.original.quantity}</Typography>
      }),
      columnHelper.accessor('unitPrice', {
        header: 'Đơn giá',
        cell: ({ row }) => <Typography>{formatCurrency(row.original.unitPrice)}</Typography>
      }),
      columnHelper.accessor('totalAmount', {
        header: 'Thành tiền',
        cell: ({ row }) => (
          <Typography className='font-medium' color='success.main'>
            {formatCurrency(row.original.totalAmount)}
          </Typography>
        )
      }),
      columnHelper.accessor('saleDate', {
        header: 'Ngày bán',
        cell: ({ row }) => <Typography>{row.original.saleDate ? new Date(row.original.saleDate).toLocaleDateString('vi-VN') : '-'}</Typography>
      }),
      columnHelper.accessor('isActive', {
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Chip
            size='small'
            variant='tonal'
            color={row.original.isActive !== false ? 'success' : 'secondary'}
            label={row.original.isActive !== false ? 'Đang hoạt động' : 'Ngừng hoạt động'}
          />
        )
      })
    ]

    nextColumns.push({
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          {row.original.source === 'payment' && row.original.receiptNumber && (
            <IconButton
              color='primary'
              title='Xem biên lai'
              onClick={() => router.push(`/apps/invoice/preview/${encodeURIComponent(row.original.receiptNumber!)}`)}
            >
              <i className='ri-eye-line' />
            </IconButton>
          )}
          {productSalePermissions.canUpdate && row.original.source !== 'payment' && row.original.isActive !== false && (
            <IconButton color='primary' title='Chỉnh sửa' onClick={() => handleEdit(row.original)}>
              <i className='ri-edit-box-line' />
            </IconButton>
          )}
          {productSalePermissions.canDelete &&
            row.original.source !== 'payment' &&
            (row.original.isActive !== false ? (
              <IconButton color='error' title='Xóa mềm' onClick={() => handleDelete(row.original.id)}>
                <i className='ri-delete-bin-6-line' />
              </IconButton>
            ) : (
              <IconButton color='success' title='Khôi phục' onClick={() => handleRestore(row.original.id)}>
                <i className='ri-loop-left-line' />
              </IconButton>
            ))}
        </div>
      )
    })

    return nextColumns
  }, [productSalePermissions.canDelete, productSalePermissions.canUpdate, router])

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

  return (
    <>
      <Card>
        <CardHeader title='Danh sách giao dịch bán sản phẩm' />
        <TableFilters products={products} classes={classes} collectors={collectors} onFilterChange={handleFilterChange} />
        <Divider />
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Tìm kiếm giao dịch...'
            className='max-sm:is-full'
          />
          {productSalePermissions.canCreate && (
            <Button variant='contained' onClick={() => setAddDrawerOpen(true)}>
              Tạo giao dịch
            </Button>
          )}
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
                  <td colSpan={columns.length} className='text-center'>
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
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          onRowsPerPageChange={event => table.setPageSize(Number(event.target.value))}
        />
      </Card>

      {productSalePermissions.canCreate && (
        <AddProductSaleDrawer open={addDrawerOpen} handleClose={() => setAddDrawerOpen(false)} setData={setData} />
      )}
      {productSalePermissions.canUpdate && (
        <AddProductSaleDrawer
          open={editDrawerOpen}
          handleClose={() => {
            setEditDrawerOpen(false)
            setSelectedSale(null)
          }}
          setData={setData}
          sale={selectedSale}
        />
      )}
    </>
  )
}

export default ProductSaleListTable
