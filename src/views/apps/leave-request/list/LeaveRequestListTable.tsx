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
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Box from '@mui/material/Box'
import type { TextFieldProps } from '@mui/material/TextField'

// Third-party Imports
import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import { fuzzyFilter } from '@/utils/tableHelpers'

// Type Imports
import type { LeaveRequestType } from '@/types/apps/leaveRequestTypes'
import { leaveTypeLabels, leaveTypeColors, leaveStatusLabels, leaveStatusColors } from '@/types/apps/leaveRequestTypes'

// Component Imports
import TableFilters from './TableFilters'
import AddLeaveRequestDrawer from './AddLeaveRequestDrawer'

// Service Imports
import leaveRequestService from '@/services/leaveRequestService'
import type { GetLeaveRequestsParams } from '@/services/leaveRequestService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

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

const columnHelper = createColumnHelper<LeaveRequestType>()

const LeaveRequestListTable = () => {
  // States
  const [addRequestOpen, setAddRequestOpen] = useState(false)
  const [data, setData] = useState<LeaveRequestType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterParams, setFilterParams] = useState<GetLeaveRequestsParams>({})

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestType | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  const { showNotification } = useNotification()

  // Refs để tránh duplicate calls
  const showNotificationRef = useRef(showNotification)
  showNotificationRef.current = showNotification
  const dataLoadedRef = useRef(false)
  const currentFilterRef = useRef<string>('')

  const handleFilterChange = useCallback((params: GetLeaveRequestsParams) => {
    setFilterParams(params)
  }, [])

  // Load leave requests
  useEffect(() => {
    const filterKey = JSON.stringify(filterParams)

    if (dataLoadedRef.current && currentFilterRef.current === filterKey) {
      return
    }

    const loadRequests = async () => {
      try {
        setLoading(true)
        currentFilterRef.current = filterKey
        dataLoadedRef.current = true

        const response = await leaveRequestService.getLeaveRequests(filterParams)
        if (response.success && response.data) {
          setData(response.data)
        } else {
          setData([])
        }
      } catch (error) {
        setData([])
      } finally {
        setLoading(false)
      }
    }
    loadRequests()
  }, [filterParams])

  const handleApprove = async () => {
    if (!selectedRequest) return
    try {
      setLoading(true)
      const response = await leaveRequestService.approveLeaveRequest(selectedRequest.id, {
        notes: approvalNotes || undefined
      })
      if (response.success) {
        setData(prev => prev.map(r => (r.id === selectedRequest.id ? { ...r, status: 1 as const } : r)))
        showNotification('Phê duyệt đơn xin nghỉ thành công!', 'success')
        setApproveDialogOpen(false)
        setApprovalNotes('')
        setSelectedRequest(null)
      } else {
        showNotification(response.message || 'Không thể phê duyệt.', 'error')
      }
    } catch (error) {
      showNotification('Đã có lỗi khi phê duyệt.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      showNotification('Vui lòng nhập lý do từ chối.', 'error')
      return
    }
    try {
      setLoading(true)
      const response = await leaveRequestService.rejectLeaveRequest(selectedRequest.id, {
        reason: rejectionReason
      })
      if (response.success) {
        setData(prev => prev.map(r => (r.id === selectedRequest.id ? { ...r, status: 2 as const } : r)))
        showNotification('Đã từ chối đơn xin nghỉ.', 'success')
        setRejectDialogOpen(false)
        setRejectionReason('')
        setSelectedRequest(null)
      } else {
        showNotification(response.message || 'Không thể từ chối.', 'error')
      }
    } catch (error) {
      showNotification('Đã có lỗi khi từ chối.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const columns = useMemo<ColumnDef<LeaveRequestType, any>[]>(
    () => [
      columnHelper.accessor('userName', {
        header: 'Người xin nghỉ',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.userName}
          </Typography>
        )
      }),
      columnHelper.accessor('leaveType', {
        header: 'Loại nghỉ',
        cell: ({ row }) => (
          <Chip
            label={leaveTypeLabels[row.original.leaveType]}
            size='small'
            color={leaveTypeColors[row.original.leaveType]}
            variant='tonal'
          />
        )
      }),
      columnHelper.accessor('startDate', {
        header: 'Từ ngày',
        cell: ({ row }) => <Typography>{new Date(row.original.startDate).toLocaleDateString('vi-VN')}</Typography>
      }),
      columnHelper.accessor('endDate', {
        header: 'Đến ngày',
        cell: ({ row }) => <Typography>{new Date(row.original.endDate).toLocaleDateString('vi-VN')}</Typography>
      }),
      columnHelper.accessor('reason', {
        header: 'Lý do',
        cell: ({ row }) => (
          <Typography variant='body2' className='max-w-[200px] truncate'>
            {row.original.reason}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Chip
            label={leaveStatusLabels[row.original.status]}
            size='small'
            color={leaveStatusColors[row.original.status]}
            variant='tonal'
          />
        )
      }),
      columnHelper.accessor('createdAt', {
        header: 'Ngày tạo',
        cell: ({ row }) => <Typography>{new Date(row.original.createdAt).toLocaleDateString('vi-VN')}</Typography>
      }),
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => {
          const isPending = row.original.status === 0
          return (
            <Box className='flex items-center gap-1'>
              {isPending && (
                <>
                  <IconButton
                    color='success'
                    title='Phê duyệt'
                    onClick={() => {
                      setSelectedRequest(row.original)
                      setApproveDialogOpen(true)
                    }}
                  >
                    <i className='ri-check-line' />
                  </IconButton>
                  <IconButton
                    color='error'
                    title='Từ chối'
                    onClick={() => {
                      setSelectedRequest(row.original)
                      setRejectDialogOpen(true)
                    }}
                  >
                    <i className='ri-close-line' />
                  </IconButton>
                </>
              )}
              <IconButton title='Xem chi tiết'>
                <i className='ri-eye-line text-textSecondary' />
              </IconButton>
            </Box>
          )
        }
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
        <CardHeader title='Quản lý đơn xin nghỉ phép' />
        <TableFilters onFilterChange={handleFilterChange} />
        <Divider />
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Tìm kiếm...'
            className='max-sm:is-full'
          />
          <Button variant='contained' onClick={() => setAddRequestOpen(true)}>
            Tạo đơn xin nghỉ
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
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Phê duyệt đơn xin nghỉ</DialogTitle>
        <DialogContent>
          <Typography className='mb-4'>
            Bạn có chắc muốn phê duyệt đơn xin nghỉ của <strong>{selectedRequest?.userName}</strong>?
          </Typography>
          <TextField
            label='Ghi chú (tùy chọn)'
            fullWidth
            multiline
            rows={3}
            value={approvalNotes}
            onChange={e => setApprovalNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Hủy</Button>
          <Button variant='contained' color='success' onClick={handleApprove} disabled={loading}>
            Phê duyệt
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Từ chối đơn xin nghỉ</DialogTitle>
        <DialogContent>
          <Typography className='mb-4'>
            Bạn có chắc muốn từ chối đơn xin nghỉ của <strong>{selectedRequest?.userName}</strong>?
          </Typography>
          <TextField
            label='Lý do từ chối *'
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Hủy</Button>
          <Button variant='contained' color='error' onClick={handleReject} disabled={loading}>
            Từ chối
          </Button>
        </DialogActions>
      </Dialog>

      <AddLeaveRequestDrawer open={addRequestOpen} handleClose={() => setAddRequestOpen(false)} setData={setData} />
    </>
  )
}

export default LeaveRequestListTable
