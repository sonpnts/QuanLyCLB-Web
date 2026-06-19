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
import type { ClassTransferType } from '@/types/apps/classTransferTypes'
import { classTransferStatusObj, classTransferStatusLabels } from '@/types/apps/classTransferTypes'

// Component Imports
import TableFilters from './TableFilters'
import AddTransferDrawer from './AddTransferDrawer'

// Service Imports
import classTransferService from '@/services/classTransferService'
import type { GetClassTransfersParams } from '@/services/classTransferService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'
import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'

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
  const onChangeRef = useRef(onChange)

  onChangeRef.current = onChange

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (value === initialValue) return

    const timeout = setTimeout(() => {
      onChangeRef.current(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value, debounce, initialValue])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

const columnHelper = createColumnHelper<ClassTransferType>()

const ClassTransferListTable = () => {
  // States
  const [addTransferOpen, setAddTransferOpen] = useState(false)
  const [data, setData] = useState<ClassTransferType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterParams, setFilterParams] = useState<GetClassTransfersParams>({})

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<ClassTransferType | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  const { showNotification } = useNotification()
  const { auth } = useAuth()
  const isAdmin = hasPermission(auth?.permissions, 'ClassTransfer.Approve') || hasAdminRole(auth?.roles)

  // Refs để tránh duplicate calls
  const showNotificationRef = useRef(showNotification)

  showNotificationRef.current = showNotification
  const dataLoadedRef = useRef(false)
  const currentFilterRef = useRef<string>('')

  const handleFilterChange = useCallback((params: GetClassTransfersParams) => {
    setFilterParams(params)
  }, [])

  // Load transfers
  useEffect(() => {
    const filterKey = JSON.stringify(filterParams)

    if (dataLoadedRef.current && currentFilterRef.current === filterKey) {
      return
    }

    const loadTransfers = async () => {
      try {
        setLoading(true)
        currentFilterRef.current = filterKey
        dataLoadedRef.current = true

        const response = await classTransferService.getClassTransfers(filterParams)

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

    loadTransfers()
  }, [filterParams])

  const handleApprove = async () => {
    if (!selectedTransfer) return

    try {
      setLoading(true)

      const response = await classTransferService.approveClassTransfer(selectedTransfer.id, {
        approvalNotes: approvalNotes || undefined
      })

      if (response.success) {
        setData(prev => prev.map(t => (t.id === selectedTransfer.id ? { ...t, status: 'Approved' as const } : t)))
        showNotification('Phê duyệt chuyển lớp thành công!', 'success')
        setApproveDialogOpen(false)
        setApprovalNotes('')
        setSelectedTransfer(null)
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
    if (!selectedTransfer || !rejectionReason.trim()) {
      showNotification('Vui lòng nhập lý do từ chối.', 'error')
      
return
    }

    try {
      setLoading(true)

      const response = await classTransferService.rejectClassTransfer(selectedTransfer.id, {
        rejectionReason
      })

      if (response.success) {
        setData(prev => prev.map(t => (t.id === selectedTransfer.id ? { ...t, status: 'Rejected' as const } : t)))
        showNotification('Đã từ chối yêu cầu chuyển lớp.', 'success')
        setRejectDialogOpen(false)
        setRejectionReason('')
        setSelectedTransfer(null)
      } else {
        showNotification(response.message || 'Không thể từ chối.', 'error')
      }
    } catch (error) {
      showNotification('Đã có lỗi khi từ chối.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = useCallback(async (id: string) => {
    try {
      setLoading(true)
      const response = await classTransferService.cancelClassTransfer(id)

      if (response.success) {
        setData(prev => prev.map(t => (t.id === id ? { ...t, status: 'Cancelled' as const } : t)))
        showNotification('Đã hủy yêu cầu chuyển lớp.', 'success')
      } else {
        showNotification(response.message || 'Không thể hủy.', 'error')
      }
    } catch (error) {
      showNotification('Đã có lỗi khi hủy.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  const columns = useMemo<ColumnDef<ClassTransferType, any>[]>(
    () => [
      columnHelper.accessor('studentName', {
        header: 'Học viên',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.studentName}
          </Typography>
        )
      }),
      columnHelper.accessor('fromClassName', {
        header: 'Từ lớp',
        cell: ({ row }) => <Typography>{row.original.fromClassName}</Typography>
      }),
      columnHelper.accessor('toClassName', {
        header: 'Đến lớp',
        cell: ({ row }) => <Typography>{row.original.toClassName}</Typography>
      }),
      columnHelper.accessor('reason', {
        header: 'Lý do',
        cell: ({ row }) => (
          <Typography variant='body2' className='max-w-[200px] truncate'>
            {row.original.reason || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('requestDate', {
        header: 'Ngày yêu cầu',
        cell: ({ row }) => (
          <Typography>
            {new Date(row.original.requestDate).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </Typography>
        )
      }),
      columnHelper.accessor('createdByUserName', {
        header: 'Người gửi',
        cell: ({ row }) => <Typography>{row.original.createdByUserName || '-'}</Typography>
      }),
      columnHelper.accessor('approvedByUserName', {
        header: 'Người duyệt',
        cell: ({ row }) => <Typography>{row.original.approvedByUserName || '-'}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Chip
            label={classTransferStatusLabels[row.original.status]}
            size='small'
            color={classTransferStatusObj[row.original.status]}
            variant='tonal'
          />
        )
      }),
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => {
          const isPending = row.original.status === 'Pending'

          
return (
            <div className='flex items-center gap-1'>
              {isPending && isAdmin && (
                <>
                  <IconButton
                    color='success'
                    title='Phê duyệt'
                    onClick={() => {
                      setSelectedTransfer(row.original)
                      setApproveDialogOpen(true)
                    }}
                  >
                    <i className='ri-check-line' />
                  </IconButton>
                  <IconButton
                    color='error'
                    title='Từ chối'
                    onClick={() => {
                      setSelectedTransfer(row.original)
                      setRejectDialogOpen(true)
                    }}
                  >
                    <i className='ri-close-line' />
                  </IconButton>
                </>
              )}
              {isPending && (
                <IconButton color='secondary' title='Hủy yêu cầu' onClick={() => handleCancel(row.original.id)}>
                  <i className='ri-forbid-line' />
                </IconButton>
              )}
              {/*<IconButton title='Xem chi tiết'>*/}
              {/*  <i className='ri-eye-line text-textSecondary' />*/}
              {/*</IconButton>*/}
            </div>
          )
        }
      }
    ],
    [handleCancel, isAdmin]
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
        <CardHeader title='Quản lý yêu cầu chuyển lớp' />
        <TableFilters onFilterChange={handleFilterChange} />
        <Divider />
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Tìm kiếm...'
            className='max-sm:is-full'
          />
          <Button variant='contained' onClick={() => setAddTransferOpen(true)}>
            Tạo yêu cầu chuyển lớp
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
          count={table.getPrePaginationRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />
      </Card>

      {isAdmin && (
        <>
          {/* Approve Dialog */}
          <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth='sm' fullWidth>
            <DialogTitle>Phê duyệt chuyển lớp</DialogTitle>
            <DialogContent>
              <Typography className='mb-4'>
                Bạn có chắc muốn phê duyệt yêu cầu chuyển lớp của học viên <strong>{selectedTransfer?.studentName}</strong>?
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
            <DialogTitle>Từ chối chuyển lớp</DialogTitle>
            <DialogContent>
              <Typography className='mb-4'>
                Bạn có chắc muốn từ chối yêu cầu chuyển lớp của học viên <strong>{selectedTransfer?.studentName}</strong>?
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
        </>
      )}

      <AddTransferDrawer open={addTransferOpen} handleClose={() => setAddTransferOpen(false)} setData={setData} />
    </>
  )
}

export default ClassTransferListTable
