'use client'

// React Imports
import { logger } from '@/utils/logger'
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
        showNotification(response.message || 'KhÃ´ng thá»ƒ táº£i lá»‹ch sá»­ phiáº¿u.', 'error')
      }
    } catch (error) {
      logger.error('index', 'Error loading tickets', error)
      showNotification('ÄÃ£ cÃ³ lá»—i khi táº£i lá»‹ch sá»­ phiáº¿u.', 'error')
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
      0: { label: 'CÃ³ máº·t', color: 'success' },
      1: { label: 'Váº¯ng máº·t', color: 'error' },
      2: { label: 'Äi muá»™n', color: 'warning' },
      3: { label: 'CÃ³ phÃ©p', color: 'info' },
      4: { label: 'Chá» duyá»‡t', color: 'default' }
    }

    return statusMap[status] || { label: 'KhÃ´ng xÃ¡c Ä‘á»‹nh', color: 'default' }
  }

  // Columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('classScheduleId', {
        header: 'Lá»‹ch há»c',
        cell: ({ row }) => (
          <Typography variant='body2' className='font-medium'>
            {row.original.classScheduleId || 'N/A'}
          </Typography>
        )
      }),
      columnHelper.accessor('reason', {
        header: 'LÃ½ do',
        cell: ({ row }) => <Typography variant='body2'>{row.original.reason || '-'}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Tráº¡ng thÃ¡i',
        cell: ({ row }) => {
          const statusInfo = getStatusLabel(row.original.status)

          return <Chip label={statusInfo.label} color={statusInfo.color} variant='tonal' size='small' />
        }
      }),
      columnHelper.accessor('createdAt', {
        header: 'NgÃ y táº¡o',
        cell: ({ row }) => (
          <Typography variant='body2'>
            {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString('vi-VN') : '-'}
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
          <CardHeader title='Lá»‹ch sá»­ phiáº¿u xin nghá»‰' className='p-4 sm:p-6' />
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
                  ChÆ°a cÃ³ phiáº¿u xin nghá»‰ nÃ o
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
