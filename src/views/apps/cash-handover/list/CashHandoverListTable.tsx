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
import Tooltip from '@mui/material/Tooltip'
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

import type { CashHandoverType } from '@/types/apps/cashHandoverTypes'
import { HandoverStatusLabel } from '@/types/apps/cashHandoverTypes'
import type { ClassType } from '@/types/apps/classTypes'
import type { UsersType } from '@/types/apps/userTypes'
import cashHandoverService from '@/services/cashHandoverService'
import type { GetCashHandoversParams } from '@/services/cashHandoverService'
import classService from '@/services/classService'
import userService from '@/services/userService'
import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'

import AddCashHandoverDrawer from './AddCashHandoverDrawer'
import CashHandoverDetailDialog from './CashHandoverDetailDialog'
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

const columnHelper = createColumnHelper<CashHandoverType>()

const CashHandoverListTable = () => {
  const { showNotification } = useNotification()
  const { auth } = useAuth()

  const isAdmin = useMemo(
    () => auth?.roles?.some((r: string) => r === 'Admin' || r === 'SuperAdmin') ?? false,
    [auth]
  )

  const [data, setData] = useState<CashHandoverType[]>([])
  const [classes, setClasses] = useState<ClassType[]>([])
  const [instructors, setInstructors] = useState<UsersType[]>([])
  const [filterParams, setFilterParams] = useState<GetCashHandoversParams>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedHandover, setSelectedHandover] = useState<CashHandoverType | null>(null)

  const showNotificationRef = useRef(showNotification)
  showNotificationRef.current = showNotification

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [classRes, instructorRes] = await Promise.all([classService.getClasses({}), userService.getCoaches()])

        setClasses(classRes.data || [])
        setInstructors(instructorRes.data || [])
      } catch {
        // Silently fail — list shows empty state
      }
    }

    loadReferences()
  }, [])

  const loadHandovers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await cashHandoverService.getCashHandovers(filterParams)

      setData(response.data || [])
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [filterParams])

  useEffect(() => {
    loadHandovers()
  }, [loadHandovers])

  const handleFilterChange = useCallback((params: GetCashHandoversParams) => {
    setFilterParams(params)
  }, [])

  const handleOpenDetail = async (row: CashHandoverType) => {
    try {
      const response = await cashHandoverService.getCashHandoverById(row.id)

      if (!response.success || !response.data) {
        showNotificationRef.current(response.message || 'Không thể tải chi tiết phiếu bàn giao.', 'error')
        return
      }

      setSelectedHandover(response.data)
      setDetailOpen(true)
    } catch {
      showNotificationRef.current('Đã có lỗi khi tải chi tiết phiếu.', 'error')
    }
  }

  const handleConfirm = async (id: string) => {
    try {
      setConfirmingId(id)
      const response = await cashHandoverService.confirmCashHandover(id)

      if (!response.success || !response.data) {
        showNotificationRef.current(response.message || 'Không thể xác nhận phiếu bàn giao.', 'error')
        return
      }

      setData(prev => prev.map(item => (item.id === id ? response.data! : item)))
      showNotificationRef.current('Xác nhận bàn giao tiền thành công.', 'success')
    } catch {
      showNotificationRef.current('Đã có lỗi khi xác nhận phiếu bàn giao.', 'error')
    } finally {
      setConfirmingId(null)
    }
  }

  const columns = useMemo<ColumnDef<CashHandoverType, any>[]>(
    () => [
      columnHelper.accessor('className', {
        header: 'Lớp',
        cell: ({ row }) => (
          <Typography className='font-medium'>{row.original.className || row.original.classId}</Typography>
        )
      }),
      columnHelper.accessor('instructorName', {
        header: 'Huấn luyện viên',
        cell: ({ row }) => <Typography>{row.original.instructorName || row.original.instructorId}</Typography>
      }),
      columnHelper.accessor('handoverAt', {
        header: 'Ngày bàn giao',
        cell: ({ row }) => (
          <Typography>
            {row.original.handoverAt ? new Date(row.original.handoverAt).toLocaleString('vi-VN') : '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('snapshotTuitionAmount', {
        header: 'Học phí',
        cell: ({ row }) => <Typography>{formatCurrency(row.original.snapshotTuitionAmount)}</Typography>
      }),
      columnHelper.accessor('snapshotProductSalesAmount', {
        header: 'Sản phẩm',
        cell: ({ row }) => <Typography>{formatCurrency(row.original.snapshotProductSalesAmount)}</Typography>
      }),
      columnHelper.accessor('totalDeductionAmount', {
        header: 'Khoản trừ',
        cell: ({ row }) => (
          <Typography color={row.original.totalDeductionAmount > 0 ? 'error.main' : 'text.secondary'}>
            {row.original.totalDeductionAmount > 0 ? `−${formatCurrency(row.original.totalDeductionAmount)}` : '—'}
          </Typography>
        )
      }),
      columnHelper.accessor('amountHandedOver', {
        header: 'Đã nộp',
        cell: ({ row }) => (
          <Typography className='font-medium' color='success.main'>
            {formatCurrency(row.original.amountHandedOver)}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Chip
            label={HandoverStatusLabel[row.original.status] ?? row.original.status}
            size='small'
            color={row.original.status === 'Confirmed' ? 'success' : 'warning'}
            variant='tonal'
          />
        )
      }),
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className='flex items-center gap-1'>
            <Tooltip title='Xem chi tiết'>
              <IconButton size='small' onClick={() => handleOpenDetail(row.original)}>
                <i className='ri-eye-line text-textSecondary' />
              </IconButton>
            </Tooltip>
            {isAdmin && row.original.status === 'Pending' && (
              <Tooltip title='Xác nhận bàn giao'>
                <IconButton
                  size='small'
                  color='success'
                  disabled={confirmingId === row.original.id}
                  onClick={() => handleConfirm(row.original.id)}
                >
                  <i className='ri-check-double-line' />
                </IconButton>
              </Tooltip>
            )}
          </div>
        )
      }
    ],
    [isAdmin, confirmingId]
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
        <CardHeader title='Lịch sử bàn giao tiền' />
        <TableFilters classes={classes} instructors={instructors} onFilterChange={handleFilterChange} />
        <Divider />
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Tìm kiếm bàn giao...'
            className='max-sm:is-full'
          />
          <Button variant='contained' onClick={() => setAddDrawerOpen(true)}>
            Tạo phiếu bàn giao
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

      <AddCashHandoverDrawer open={addDrawerOpen} handleClose={() => setAddDrawerOpen(false)} setData={setData} />

      <CashHandoverDetailDialog open={detailOpen} data={selectedHandover} onClose={() => setDetailOpen(false)} />
    </>
  )
}

export default CashHandoverListTable
