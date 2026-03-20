'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import TablePagination from '@mui/material/TablePagination'
import Chip from '@mui/material/Chip'
import type { TextFieldProps } from '@mui/material/TextField'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'

// Type Imports
import type { PaymentRecordType } from '@/types/apps/paymentTypes'
import { paymentTypeLabels, paymentMethodLabels } from '@/types/apps/paymentTypes'

// Component Imports
import TableFilters from './TableFilters'
import AddPaymentDrawer from './AddPaymentDrawer'

// Service Imports
import paymentService from '@/services/paymentService'
import type { GetPaymentsParams } from '@/services/paymentService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

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

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const columnHelper = createColumnHelper<PaymentRecordType>()

const PaymentListTable = () => {
  const [addPaymentOpen, setAddPaymentOpen] = useState(false)
  const [data, setData] = useState<PaymentRecordType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterParams, setFilterParams] = useState<GetPaymentsParams>({})

  const { showNotification } = useNotification()

  // Refs để tránh duplicate calls
  const showNotificationRef = useRef(showNotification)
  showNotificationRef.current = showNotification
  const dataLoadedRef = useRef(false)
  const currentFilterRef = useRef<string>('')

  const handleFilterChange = useCallback((params: GetPaymentsParams) => {
    setFilterParams(params)
  }, [])

  useEffect(() => {
    const filterKey = JSON.stringify(filterParams)

    if (dataLoadedRef.current && currentFilterRef.current === filterKey) {
      return
    }

    const loadPayments = async () => {
      try {
        setLoading(true)
        currentFilterRef.current = filterKey
        dataLoadedRef.current = true

        const response = await paymentService.getPayments(filterParams)
        if (response.success && response.data) {
          setData(response.data)
        } else {
          showNotificationRef.current(response.message || 'Không thể tải danh sách thanh toán.', 'error')
        }
      } catch (error) {
        showNotificationRef.current('Có lỗi khi tải dữ liệu.', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadPayments()
  }, [filterParams])

  const columns = useMemo<ColumnDef<PaymentRecordType, any>[]>(
    () => [
      columnHelper.accessor('studentName', {
        header: 'Học viên',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.studentName || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('className', {
        header: 'Lớp học',
        cell: ({ row }) => <Typography>{row.original.className || '-'}</Typography>
      }),
      columnHelper.accessor('type', {
        header: 'Loại thanh toán',
        cell: ({ row }) => (
          <Chip
            label={paymentTypeLabels[row.original.type] || row.original.type}
            size='small'
            color='primary'
            variant='tonal'
          />
        )
      }),
      columnHelper.accessor('amount', {
        header: 'Số tiền',
        cell: ({ row }) => (
          <Typography className='font-medium' color='success.main'>
            {formatCurrency(row.original.amount)}
          </Typography>
        )
      }),
      columnHelper.accessor('paymentDate', {
        header: 'Ngày thanh toán',
        cell: ({ row }) => <Typography>{new Date(row.original.paymentDate).toLocaleDateString('vi-VN')}</Typography>
      }),
      columnHelper.accessor('method', {
        header: 'Phương thức',
        cell: ({ row }) => (
          <Chip
            label={paymentMethodLabels[row.original.method] || row.original.method}
            size='small'
            color='secondary'
            variant='tonal'
          />
        )
      }),
      {
        id: 'period',
        header: 'Kỳ',
        cell: ({ row }) => (
          <Typography>
            {row.original.forMonth && row.original.forYear ? `${row.original.forMonth}/${row.original.forYear}` : '-'}
          </Typography>
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
        <CardHeader title='Quản lý thanh toán' />
        <TableFilters onFilterChange={handleFilterChange} />
        <Divider />
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <Button color='secondary' variant='outlined' startIcon={<i className='ri-upload-2-line text-xl' />}>
            Xuất báo cáo
          </Button>
          <div className='flex items-center gap-x-4 gap-4 flex-col max-sm:is-full sm:flex-row'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Tìm kiếm...'
              className='max-sm:is-full'
            />
            <Button variant='contained' onClick={() => setAddPaymentOpen(true)}>
              Thêm thanh toán
            </Button>
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
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />
      </Card>

      <AddPaymentDrawer open={addPaymentOpen} handleClose={() => setAddPaymentOpen(false)} setData={setData} />
    </>
  )
}

export default PaymentListTable
