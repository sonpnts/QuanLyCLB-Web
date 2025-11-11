'use client'

// React Imports
import { useState, useCallback, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'

// Third-party Imports
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { FilterFn } from '@tanstack/react-table'

import { AttendanceStatus } from '@/services/attendanceService'

// Type Imports
import type { GetUserAttendanceParams } from '@/services/attendanceService'

// Service Imports
import attendanceService from '@/services/attendanceService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Column Helper
const columnHelper = createColumnHelper<any>()

const AttendanceListTable = () => {
  // States
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  // Notification Hook
  const { showNotification } = useNotification()

  // Load attendance data
  const loadAttendance = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)

      const params: GetUserAttendanceParams = {
        userId,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      }

      const response = await attendanceService.getUserAttendance(params)

      if (response.success && response.data) {
        setFilteredData(response.data)
      } else {
        showNotification(response.message || 'Không thể tải dữ liệu điểm danh.', 'error')
      }
    } catch (error) {
      console.error('Error loading attendance:', error)
      showNotification('Đã có lỗi khi tải dữ liệu điểm danh.', 'error')
    } finally {
      setLoading(false)
    }
  }, [userId, fromDate, toDate, showNotification])

  // Handle search
  const handleSearch = () => {
    loadAttendance()
  }

  // Get status label
  const getStatusLabel = (status: AttendanceStatus) => {
    const statusMap = {
      [AttendanceStatus.Present]: { label: 'Có mặt', color: 'success' as const },
      [AttendanceStatus.Absent]: { label: 'Vắng mặt', color: 'error' as const },
      [AttendanceStatus.Late]: { label: 'Đi muộn', color: 'warning' as const },
      [AttendanceStatus.Excused]: { label: 'Có phép', color: 'info' as const },
      [AttendanceStatus.Pending]: { label: 'Chờ duyệt', color: 'default' as const }
    }

    return statusMap[status] || { label: 'Không xác định', color: 'default' as const }
  }

  // Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('classScheduleId', {
        header: 'Lịch học',
        cell: ({ row }) => (
          <Typography variant='body2' className='font-medium'>
            {row.original.classScheduleId}
          </Typography>
        )
      }),
      columnHelper.accessor('userId', {
        header: 'Người dùng',
        cell: ({ row }) => <Typography variant='body2'>{row.original.userId}</Typography>
      }),
      columnHelper.accessor('occurredAt', {
        header: 'Thời gian',
        cell: ({ row }) => (
          <Typography variant='body2'>{new Date(row.original.occurredAt).toLocaleString('vi-VN')}</Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        cell: ({ row }) => {
          const statusInfo = getStatusLabel(row.original.status)

          return <Chip label={statusInfo.label} color={statusInfo.color} variant='tonal' size='small' />
        }
      }),
      columnHelper.accessor('notes', {
        header: 'Ghi chú',
        cell: ({ row }) => <Typography variant='body2'>{row.original.notes || '-'}</Typography>
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

  return (
    <Card>
      <CardHeader title='Danh sách điểm danh' />
      <div className='p-5'>
        <Grid container spacing={4} className='mb-4'>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label='ID Người dùng'
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder='Nhập ID người dùng...'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label='Từ ngày'
              type='date'
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label='Đến ngày'
              type='date'
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button variant='contained' onClick={handleSearch} disabled={!userId || loading} fullWidth>
              {loading ? 'Đang tải...' : 'Tìm kiếm'}
            </Button>
          </Grid>
        </Grid>

        {filteredData.length > 0 ? (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className='p-4 text-left'>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className='border-t'>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className='p-4'>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Box className='text-center py-8'>
            <Typography variant='body1' color='text.secondary'>
              {userId ? 'Không có dữ liệu điểm danh' : 'Vui lòng nhập ID người dùng để tìm kiếm'}
            </Typography>
          </Box>
        )}
      </div>
    </Card>
  )
}

export default AttendanceListTable
