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
import Stack from '@mui/material/Stack'
import type { TextFieldProps } from '@mui/material/TextField'

// Third-party Imports
import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

// Type Imports
import type { AuditLogType } from '@/types/apps/auditLogTypes'
import { AuditActionColors, auditActionLabels } from '@/types/apps/auditLogTypes'
import { formatDateTimeVN } from '@/utils/dateTime'
import { fuzzyFilter } from '@/utils/tableHelpers'

// Component Imports
import TableFilters from './TableFilters'

// Service Imports
import auditLogService from '@/services/auditLogService'
import type { GetAuditLogsParams } from '@/services/auditLogService'

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

const columnHelper = createColumnHelper<AuditLogType>()

const AuditLogListTable = () => {
  // States
  const [data, setData] = useState<AuditLogType[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [filterParams, setFilterParams] = useState<GetAuditLogsParams>({})
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLogType | null>(null)

  const { showNotification } = useNotification()

  const showNotificationRef = useRef(showNotification)

  showNotificationRef.current = showNotification

  const handleFilterChange = useCallback((params: GetAuditLogsParams) => {
    setPage(0)
    setFilterParams(params)
  }, [])

  // Load audit logs
  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        setLoading(true)

        const response = await auditLogService.getAuditLogsPaged({
          ...filterParams,
          keyword: keyword.trim() || undefined,
          pageNumber: page + 1,
          pageSize
        })

        if (response.success && response.data) {
          setData(response.data.items || [])
          setTotalCount(response.data.totalCount || 0)
        } else {
          setData([])
          setTotalCount(0)
          showNotificationRef.current(response.message || 'Không thể tải danh sách nhật ký.', 'error')
        }
      } catch (error) {
        setData([])
        setTotalCount(0)
        showNotificationRef.current('Đã có lỗi khi tải dữ liệu.', 'error')
      } finally {
        setLoading(false)
      }
    }

    void loadAuditLogs()
  }, [filterParams, keyword, page, pageSize])

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
          <Typography className='font-medium' color='text.primary'>
            {row.original.userName}
          </Typography>
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader title='Nhật ký hệ thống (Audit Logs)' />
        <TableFilters onFilterChange={handleFilterChange} />
        <Divider />
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <DebouncedInput
            value={keyword}
            onChange={value => {
              setPage(0)
              setKeyword(String(value))
            }}
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
              {table.getRowModel().rows.length === 0 ? (
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
          count={totalCount}
          rowsPerPage={pageSize}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={e => {
            setPageSize(Number(e.target.value))
            setPage(0)
          }}
        />
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth='lg' fullWidth>
        <DialogTitle>Chi tiết nhật ký</DialogTitle>
        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
          {selectedLog && (
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  gap: 2
                }}
              >
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>Thời gian</Typography>
                  <Typography sx={{ overflowWrap: 'anywhere' }}>{formatDateTimeVN(selectedLog.timestamp)}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>Người dùng</Typography>
                  <Typography sx={{ overflowWrap: 'anywhere' }}>{selectedLog.userName}</Typography>
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
                  <Typography sx={{ overflowWrap: 'anywhere' }}>{selectedLog.entityId || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>Địa chỉ IP</Typography>
                  <Typography sx={{ overflowWrap: 'anywhere' }}>{selectedLog.ipAddress || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>User Agent</Typography>
                  <Typography
                    variant='body2'
                    sx={{ overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'normal' }}
                  >
                    {selectedLog.userAgent || '-'}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant='subtitle2' color='text.secondary'>Mô tả</Typography>
                <Typography sx={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{selectedLog.description}</Typography>
              </Box>
              {selectedLog.oldValues && (
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>Giá trị cũ</Typography>
                  <Box
                    component='pre'
                    sx={{
                      m: 0,
                      p: 2,
                      borderRadius: 1.5,
                      bgcolor: 'grey.100',
                      fontSize: 13,
                      overflow: 'auto',
                      maxHeight: 240,
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word'
                    }}
                  >
                    {formatJson(selectedLog.oldValues)}
                  </Box>
                </Box>
              )}
              {selectedLog.newValues && (
                <Box>
                  <Typography variant='subtitle2' color='text.secondary'>Giá trị mới</Typography>
                  <Box
                    component='pre'
                    sx={{
                      m: 0,
                      p: 2,
                      borderRadius: 1.5,
                      bgcolor: 'grey.100',
                      fontSize: 13,
                      overflow: 'auto',
                      maxHeight: 240,
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word'
                    }}
                  >
                    {formatJson(selectedLog.newValues)}
                  </Box>
                </Box>
              )}
            </Stack>
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

