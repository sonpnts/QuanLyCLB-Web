'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import TablePagination from '@mui/material/TablePagination'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
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
import type { AuditLogType } from '@/types/apps/auditLogTypes'
import { AuditActionColors, auditActionLabels } from '@/types/apps/auditLogTypes'
import { formatDateTimeVN } from '@/utils/dateTime'

// Component Imports
import TableFilters from './TableFilters'

// Service Imports
import auditLogService from '@/services/auditLogService'
import type { GetAuditLogsParams } from '@/services/auditLogService'

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

const columnHelper = createColumnHelper<AuditLogType>()

const AuditLogListTable = () => {
  // States
  const [data, setData] = useState<AuditLogType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterParams, setFilterParams] = useState<GetAuditLogsParams>({})
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLogType | null>(null)

  const { showNotification } = useNotification()

  // Refs để tránh duplicate calls
  const showNotificationRef = useRef(showNotification)

  showNotificationRef.current = showNotification
  const dataLoadedRef = useRef(false)
  const currentFilterRef = useRef<string>('')

  const handleFilterChange = useCallback((params: GetAuditLogsParams) => {
    setFilterParams(params)
  }, [])

  // Load audit logs
  useEffect(() => {
    const filterKey = JSON.stringify(filterParams)

    if (dataLoadedRef.current && currentFilterRef.current === filterKey) {
      return
    }

    const loadAuditLogs = async () => {
      try {
        setLoading(true)
        currentFilterRef.current = filterKey
        dataLoadedRef.current = true

        const response = await auditLogService.getAuditLogs(filterParams)

        if (response.success && response.data) {
          setData(response.data)
        } else {
          showNotificationRef.current(response.message || 'Không thể tải danh sách nhật ký.', 'error')
        }
      } catch (error) {
        showNotificationRef.current('Đã có lỗi khi tải dữ liệu.', 'error')
      } finally {
        setLoading(false)
      }
    }

    loadAuditLogs()
  }, [filterParams])

  const handleViewDetail = (log: AuditLogType) => {
    setSelectedLog(log)
    setDetailDialogOpen(true)
  }

  const formatJson = (jsonString?: string) => {
    if (!jsonString) return '-'

    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2)
    } catch {
      return jsonString
    }
  }

  const columns = useMemo<ColumnDef<AuditLogType, any>[]>(
    () => [
      columnHelper.accessor('timestamp', {
        header: 'Thời gian',
        cell: ({ row }) => (
          <Typography variant='body2'>
            {formatDateTimeVN(row.original.timestamp)}
          </Typography>
        )
      }),
      columnHelper.accessor('userName', {
        header: 'Người dùng',
        cell: ({ row }) => (
          <Box>
            <Typography className='font-medium' color='text.primary'>
              {row.original.userName}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.original.userRole}
            </Typography>
          </Box>
        )
      }),
      columnHelper.accessor('action', {
        header: 'Hành động',
        cell: ({ row }) => (
          <Chip
            label={auditActionLabels[row.original.action] || row.original.action}
            size='small'
            color={AuditActionColors[row.original.action] || 'default'}
            variant='tonal'
          />
        )
      }),
      columnHelper.accessor('entityType', {
        header: 'Đối tượng',
        cell: ({ row }) => (
          <Typography variant='body2'>{row.original.entityType}</Typography>
        )
      }),
      columnHelper.accessor('description', {
        header: 'Mô tả',
        cell: ({ row }) => (
          <Typography variant='body2' className='max-w-[250px] truncate'>
            {row.original.description}
          </Typography>
        )
      }),
      columnHelper.accessor('isSuccess', {
        header: 'Kết quả',
        cell: ({ row }) => (
          <Chip
            label={row.original.isSuccess ? 'Thành công' : 'Thất bại'}
            size='small'
            color={row.original.isSuccess ? 'success' : 'error'}
            variant='tonal'
          />
        )
      }),
      columnHelper.accessor('ipAddress', {
        header: 'IP',
        cell: ({ row }) => (
          <Typography variant='body2'>{row.original.ipAddress || '-'}</Typography>
        )
      })
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
        <CardHeader title='Nhật ký hệ thống (Audit Logs)' />
        <TableFilters onFilterChange={handleFilterChange} />
        <Divider />
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Tìm kiếm...'
            className='max-sm:is-full'
          />
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
                  <tr key={row.id} onClick={() => handleViewDetail(row.original)} style={{ cursor: 'pointer' }}>
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
          rowsPerPageOptions={[10, 25, 50, 100]}
          component='div'
          className='border-bs'
          count={table.getPrePaginationRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Chi tiết nhật ký</DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Box className='flex flex-col gap-4'>
              <Box className='grid grid-cols-2 gap-4'>
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>Thời gian</Typography>
                  <Typography>{formatDateTimeVN(selectedLog.timestamp)}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>Người dùng</Typography>
                  <Typography>{selectedLog.userName} ({selectedLog.userRole})</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>Hành động</Typography>
                  <Chip
                    label={auditActionLabels[selectedLog.action] || selectedLog.action}
                    size='small'
                    color={AuditActionColors[selectedLog.action] || 'default'}
                    variant='tonal'
                  />
                </Box>
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>Kết quả</Typography>
                  <Chip
                    label={selectedLog.isSuccess ? 'Thành công' : 'Thất bại'}
                    size='small'
                    color={selectedLog.isSuccess ? 'success' : 'error'}
                    variant='tonal'
                  />
                </Box>
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>Đối tượng</Typography>
                  <Typography>{selectedLog.entityType}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>ID đối tượng</Typography>
                  <Typography>{selectedLog.entityId || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>Địa chỉ IP</Typography>
                  <Typography>{selectedLog.ipAddress || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>User Agent</Typography>
                  <Typography variant='body2' className='break-all'>{selectedLog.userAgent || '-'}</Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant='subtitle2' color='text.secondary'>Mô tả</Typography>
                <Typography>{selectedLog.description}</Typography>
              </Box>
              {selectedLog.oldValues && (
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>Giá trị cũ</Typography>
                  <Box component='pre' className='bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40'>
                    {formatJson(selectedLog.oldValues)}
                  </Box>
                </Box>
              )}
              {selectedLog.newValues && (
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>Giá trị mới</Typography>
                  <Box component='pre' className='bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40'>
                    {formatJson(selectedLog.newValues)}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AuditLogListTable

