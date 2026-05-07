'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
import productSaleService from '@/services/productSaleService'
import type { GetProductSalesParams } from '@/services/productSaleService'
import productService from '@/services/productService'
import classService from '@/services/classService'
import userService from '@/services/userService'
import { useNotification } from '@/contexts/notificationContext'

import AddProductSaleDrawer from './AddProductSaleDrawer'
import TableFilters from './TableFilters'

import tableStyles from '@core/styles/table.module.css'

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

const columnHelper = createColumnHelper<ProductSaleType>()

const ProductSaleListTable = () => {
  const { showNotification } = useNotification()

  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
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
          productService.getProducts({}),
          classService.getClasses({ isActive: true, pageSize: 1000 }),
          userService.getCoaches()
        ])

        if (productsRes.success && productsRes.data) setProducts(productsRes.data)
        if (classesRes.success && classesRes.data) setClasses(classesRes.data)
        if (coachesRes.success && coachesRes.data) setCollectors(coachesRes.data)
      } catch (error) {
        // silently ignore reference data load errors
      }
    }

    loadReferences()
  }, [])

  const loadSales = useCallback(async () => {
    try {
      setLoading(true)
      const response = await productSaleService.getProductSales(filterParams)

      if (!response.success || !response.data) {
        setData([])
        return
      }

      setData(response.data)
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

  const columns = useMemo<ColumnDef<ProductSaleType, any>[]>(
    () => [
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
      }),
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            {row.original.isActive !== false ? (
              <IconButton color='error' title='Xóa mềm' onClick={() => handleDelete(row.original.id)}>
                <i className='ri-delete-bin-6-line' />
              </IconButton>
            ) : (
              <IconButton color='success' title='Khôi phục' onClick={() => handleRestore(row.original.id)}>
                <i className='ri-loop-left-line' />
              </IconButton>
            )}
          </div>
        )
      }
    ],
    []
  )

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
          <Button variant='contained' onClick={() => setAddDrawerOpen(true)}>
            Tạo giao dịch
          </Button>
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

      <AddProductSaleDrawer open={addDrawerOpen} handleClose={() => setAddDrawerOpen(false)} setData={setData} />
    </>
  )
}

export default ProductSaleListTable
