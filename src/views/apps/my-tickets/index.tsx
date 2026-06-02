'use client'

// React Imports
import { useEffect, useState, useCallback, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { FilterFn } from '@tanstack/react-table'

// Service Imports
import attendanceService, { type GetUserAttendanceParams } from '@/services/attendanceService'
import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import { formatDateVN } from '@/utils/dateTime'

// Column Helper
const columnHelper = createColumnHelper<any>()

const MyTicketsView = () => {
  // States
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_data, setData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Hooks
  const { auth } = useAuth()
  const { showNotification } = useNotification()

  // Load tickets (using attendance records with tickets)
  const loadTickets = useCallback(async () => {
    if (!auth?.user?.id) return

    try {
      setLoading(true)

      // Get attendance records for the user
      // Filter those that have tickets
      const params: GetUserAttendanceParams = {
        userId: auth.user.id
      }

      const response = await attendanceService.getUserAttendance(params)

      if (response.success && response.data) {
        // Filter attendance records that have tickets
        // Note: The API structure might be different, adjust as needed
        const tickets = response.data
          .filter((record: any) => record.ticketId)
          .map((record: any) => ({
            id: record.ticketId || record.id,
            classScheduleId: record.classScheduleId,
            userId: record.userId,
            reason: record.notes || record.reason,
            status: record.status,
            createdAt: record.occurredAt || record.createdAt,
            attendanceRecord: record
          }))

        setData(tickets)
        setFilteredData(tickets)
      } else {
        showNotification(response.message || 'Không thể tải lịch sử phiếu.', 'error')
      }
    } catch (error) {
      console.error('Error loading tickets:', error)
      showNotification('Đã có lỗi khi tải lịch sử phiếu.', 'error')
    } finally {
      setLoading(false)
    }
  }, [auth?.user?.id, showNotification])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  // Get status label
  const getStatusLabel = (status: number) => {
    const statusMap: Record<number, { label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }> = {
      0: { label: 'Có mặt', color: 'success' },
      1: { label: 'Vắng mặt', color: 'error' },
      2: { label: 'Đi muộn', color: 'warning' },
      3: { label: 'Có phép', color: 'info' },
      4: { label: 'Chờ duyệt', color: 'default' }
    }

    return statusMap[status] || { label: 'Không xác định', color: 'default' }
  }

  // Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('classScheduleId', {
        header: 'Lịch học',
        cell: ({ row }) => (
          <Typography variant='body2' className='font-medium'>
            {row.original.classScheduleId || 'N/A'}
          </Typography>
        )
      }),
      columnHelper.accessor('reason', {
        header: 'Lý do',
        cell: ({ row }) => <Typography variant='body2'>{row.original.reason || '-'}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        cell: ({ row }) => {
          const statusInfo = getStatusLabel(row.original.status)

          return <Chip label={statusInfo.label} color={statusInfo.color} variant='tonal' size='small' />
        }
      }),
      columnHelper.accessor('createdAt', {
        header: 'Ngày tạo',
        cell: ({ row }) => (
          <Typography variant='body2'>
            {formatDateVN(row.original.createdAt)}
          </Typography>
        )
      })
    ],
    []
  )

  // Table
  const fuzzyFilter: FilterFn<any> = () => true

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    getCoreRowModel: getCoreRowModel()
  })

  if (loading) {
    return (
      <Box className='flex items-center justify-center min-h-[400px]'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Grid container spacing={{ xs: 4, sm: 6 }}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Lịch sử phiếu xin nghỉ' className='p-4 sm:p-6' />
          <div className='p-3 sm:p-5'>
            {filteredData.length > 0 ? (
              <Box
                className='overflow-x-auto -mx-3 sm:-mx-5 px-3 sm:px-5'
                sx={{
                  '&::-webkit-scrollbar': {
                    height: '8px'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: '4px'
                  }
                }}
              >
                <table className='w-full min-w-[600px]'>
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th
                            key={header.id}
                            className='p-3 sm:p-4 text-left text-xs sm:text-sm font-semibold whitespace-nowrap'
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id} className='border-t hover:bg-background'>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className='p-3 sm:p-4 text-xs sm:text-sm'>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            ) : (
              <Box className='text-center py-8 sm:py-12'>
                <i className='ri-file-list-line text-5xl sm:text-6xl text-textDisabled mb-4' />
                <Typography variant='body1' color='text.secondary' className='text-sm sm:text-base'>
                  Chưa có phiếu xin nghỉ nào
                </Typography>
              </Box>
            )}
          </div>
        </Card>
      </Grid>
    </Grid>
  )
}

export default MyTicketsView
