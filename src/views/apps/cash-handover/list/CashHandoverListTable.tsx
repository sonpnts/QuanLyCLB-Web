'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
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
import type { CashHandoverType } from '@/types/apps/cashHandoverTypes'
import { HandoverStatusLabel } from '@/types/apps/cashHandoverTypes'
import type { ClassType } from '@/types/apps/classTypes'
import type { UsersType } from '@/types/apps/userTypes'
import type { InstructorClassCollectionType } from '@/types/apps/financeTypes'
import cashHandoverService from '@/services/cashHandoverService'
import type { GetCashHandoversParams } from '@/services/cashHandoverService'
import classService from '@/services/classService'
import userService from '@/services/userService'
import financeService from '@/services/financeService'
import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'
import { hasAdminRole } from '@/utils/roleUtils'
import { hasPermission } from '@/utils/permissionUtils'

import AddCashHandoverDrawer from './AddCashHandoverDrawer'
import CashHandoverDetailDialog from './CashHandoverDetailDialog'
import TableFilters from './TableFilters'

import tableStyles from '@core/styles/table.module.css'

type OutstandingInstructorSummary = {
  instructorId: string
  instructorName: string
  classCount: number
  totalAvailableToHandover: number
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const getOtherFeeAmount = (row: CashHandoverType) =>
  Math.max(
    0,
    Number(row.snapshotTotalAmount || 0) -
      Number(row.snapshotTuitionAmount || 0) -
      Number(row.snapshotExamFeeAmount || 0) -
      Number(row.snapshotProductSalesAmount || 0)
  )

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
    () => hasPermission(auth?.permissions, 'CashHandover.ManageAll') || hasAdminRole(auth?.roles),
    [auth]
  )

  const userId = auth?.user?.id

  const [data, setData] = useState<CashHandoverType[]>([])
  const [classes, setClasses] = useState<ClassType[]>([])
  const [instructors, setInstructors] = useState<UsersType[]>([])
  const [filterParams, setFilterParams] = useState<GetCashHandoversParams>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectTarget, setRejectTarget] = useState<CashHandoverType | null>(null)

  const [addDrawerOpen, setAddDrawerOpen] = useState(false)
  const [presetInstructorId, setPresetInstructorId] = useState<string | undefined>(undefined)
  const [outstandingCollections, setOutstandingCollections] = useState<InstructorClassCollectionType[]>([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedHandover, setSelectedHandover] = useState<CashHandoverType | null>(null)

  const showNotificationRef = useRef(showNotification)
  showNotificationRef.current = showNotification

  useEffect(() => {
    const loadReferences = async () => {
      try {
        if (isAdmin) {
          const [classRes, instructorRes] = await Promise.all([
            classService.getClasses({ isActive: true, pageSize: 1000 }),
            userService.getCoaches()
          ])

          setClasses(classRes.data || [])
          setInstructors(instructorRes.data || [])
        } else if (userId) {
          const classRes = await classService.getClassesByUserId(userId)
          setClasses((classRes.data || []).filter(c => c.isActive !== false))
          setInstructors([])
        }
      } catch {
        // Ignore reference load failure
      }
    }

    loadReferences()
  }, [isAdmin, userId])

  useEffect(() => {
    const loadOutstandingCollections = async () => {
      if (!isAdmin || instructors.length === 0) {
        setOutstandingCollections([])
        return
      }

      const rows = await Promise.all(
        instructors.map(async instructor => {
          const response = await financeService.getClassCollectionsByInstructor(instructor.id)
          return (response.data || []).filter(item => item.availableToHandover > 0)
        })
      )

      setOutstandingCollections(rows.flat())
    }

    loadOutstandingCollections()
  }, [isAdmin, instructors])

  const outstandingByInstructor = useMemo<OutstandingInstructorSummary[]>(() => {
    const map = new Map<string, OutstandingInstructorSummary>()

    outstandingCollections.forEach(item => {
      const current = map.get(item.instructorId)

      if (current) {
        current.classCount += 1
        current.totalAvailableToHandover += Number(item.availableToHandover || 0)
      } else {
        map.set(item.instructorId, {
          instructorId: item.instructorId,
          instructorName: item.instructorName || item.instructorId,
          classCount: 1,
          totalAvailableToHandover: Number(item.availableToHandover || 0)
        })
      }
    })

    return Array.from(map.values()).sort((a, b) => b.totalAvailableToHandover - a.totalAvailableToHandover)
  }, [outstandingCollections])

  const loadHandovers = useCallback(async () => {
    try {
      setLoading(true)

      const effectiveParams: GetCashHandoversParams = isAdmin
        ? filterParams
        : { ...filterParams, instructorId: userId }

      const response = await cashHandoverService.getCashHandovers(effectiveParams)
      setData(response.data || [])
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [filterParams, isAdmin, userId])

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

  const openRejectDialog = (row: CashHandoverType) => {
    setRejectTarget(row)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    if (!rejectReason.trim()) {
      showNotificationRef.current('Vui lòng nhập lý do từ chối.', 'error')
      return
    }

    try {
      setRejectingId(rejectTarget.id)
      const response = await cashHandoverService.rejectCashHandover(rejectTarget.id, rejectReason.trim())

      if (!response.success || !response.data) {
        showNotificationRef.current(response.message || 'Không thể từ chối phiếu bàn giao.', 'error')
        return
      }

      setData(prev => prev.map(item => (item.id === rejectTarget.id ? response.data! : item)))
      showNotificationRef.current('Từ chối phiếu bàn giao thành công.', 'success')
      setRejectDialogOpen(false)
      setRejectTarget(null)
      setRejectReason('')
    } catch {
      showNotificationRef.current('Đã có lỗi khi từ chối phiếu bàn giao.', 'error')
    } finally {
      setRejectingId(null)
    }
  }

  const columns = useMemo<ColumnDef<CashHandoverType, any>[]>(
    () => [
      columnHelper.accessor('instructorName', {
        header: 'Người bàn giao',
        cell: ({ row }) => <Typography className='font-medium'>{row.original.instructorName || row.original.instructorId}</Typography>
      }),
      {
        id: 'classSummary',
        header: 'Chi tiết lớp',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography>{row.original.classCount > 1 ? `${row.original.classCount} lớp` : row.original.className || '-'}</Typography>
            {/*{row.original.details.length > 0 && (*/}
            {/*  <Typography variant='caption' color='text.secondary'>*/}
            {/*    {row.original.details.map(detail => detail.className).join(', ')}*/}
            {/*  </Typography>*/}
            {/*)}*/}
          </div>
        )
      },
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
      columnHelper.accessor('snapshotExamFeeAmount', {
        header: 'Lệ phí thi',
        cell: ({ row }) => <Typography>{formatCurrency(row.original.snapshotExamFeeAmount)}</Typography>
      }),
      columnHelper.accessor('snapshotProductSalesAmount', {
        header: 'Sản phẩm',
        cell: ({ row }) => <Typography>{formatCurrency(row.original.snapshotProductSalesAmount)}</Typography>
      }),
      {
        id: 'otherFeesAmount',
        header: 'Các khoản phí khác',
        cell: ({ row }) => <Typography>{formatCurrency(getOtherFeeAmount(row.original))}</Typography>
      },
      columnHelper.accessor('totalDeductionAmount', {
        header: 'Khoản trừ',
        cell: ({ row }) => (
          <Typography color={row.original.totalDeductionAmount > 0 ? 'error.main' : 'text.secondary'}>
            {row.original.totalDeductionAmount > 0 ? `-${formatCurrency(row.original.totalDeductionAmount)}` : formatCurrency(0)}
          </Typography>
        )
      }),
      columnHelper.accessor('amountHandedOver', {
        header: 'Số tiền đã nộp',
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
            color={
              row.original.status === 'Confirmed'
                ? 'success'
                : row.original.status === 'Rejected'
                  ? 'error'
                  : 'warning'
            }
            variant='tonal'
          />
        )
      }),
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className='flex items-center gap-1' onClick={event => event.stopPropagation()}>
            {isAdmin && row.original.status === 'Pending' && (
              <>
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
                <Tooltip title='Từ chối bàn giao'>
                  <IconButton
                    size='small'
                    color='error'
                    disabled={rejectingId === row.original.id}
                    onClick={() => openRejectDialog(row.original)}
                  >
                    <i className='ri-close-circle-line' />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </div>
        )
      }
    ],
    [isAdmin, confirmingId, rejectingId]
  )

  const openCreateDrawer = (instructorId?: string) => {
    setPresetInstructorId(instructorId)
    setAddDrawerOpen(true)
  }

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
        <TableFilters
          classes={classes}
          instructors={instructors}
          onFilterChange={handleFilterChange}
          showInstructorFilter={isAdmin}
          showClassFilter={isAdmin}
        />
        <Divider />
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Tìm kiếm bàn giao...'
            className='max-sm:is-full'
          />
          <Button variant='contained' onClick={() => openCreateDrawer()}>
            Tạo phiếu bàn giao
          </Button>
        </div>
        {isAdmin && outstandingByInstructor.length > 0 && (
          <div className='px-5 pb-4'>
            <Typography variant='subtitle2' className='mb-2'>
              Huấn luyện viên còn tiền cần bàn giao
            </Typography>
            <div className='flex flex-col gap-2'>
              {outstandingByInstructor.map(item => (
                <div key={item.instructorId} className='flex items-center justify-between border rounded p-2 gap-3'>
                  <div>
                    <Typography variant='body2'>{item.instructorName}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {item.classCount} lớp còn tiền
                    </Typography>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Typography variant='body2' color='warning.main'>
                      {formatCurrency(item.totalAvailableToHandover)}
                    </Typography>
                    <Button size='small' variant='outlined' onClick={() => openCreateDrawer(item.instructorId)}>
                      Tạo bàn giao
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
                  <tr key={row.id} onClick={() => handleOpenDetail(row.original)} style={{ cursor: 'pointer' }}>
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

      <AddCashHandoverDrawer
        open={addDrawerOpen}
        handleClose={() => {
          setAddDrawerOpen(false)
          setPresetInstructorId(undefined)
        }}
        setData={setData}
        presetInstructorId={presetInstructorId}
      />

      <CashHandoverDetailDialog open={detailOpen} data={selectedHandover} onClose={() => setDetailOpen(false)} />
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Từ chối phiếu bàn giao</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            label='Lý do từ chối'
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} color='inherit'>
            Hủy
          </Button>
          <Button onClick={handleReject} color='error' variant='contained' disabled={!rejectReason.trim() || !!rejectingId}>
            Từ chối
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default CashHandoverListTable
