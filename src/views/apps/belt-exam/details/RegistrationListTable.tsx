'use client'

import { useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table'

import beltExamService from '@/services/beltExamService'
import type { ExamRegistrationType, ExamSessionStatus } from '@/types/apps/beltExamTypes'
import { examRegistrationStatusColors, examRegistrationStatusLabels } from '@/types/apps/beltExamTypes'
import { logger } from '@/utils/logger'
import { fuzzyFilter } from '@/utils/tableHelpers'

const columnHelper = createColumnHelper<ExamRegistrationType>()

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

interface Props {
  sessionId: string
  sessionStatus: ExamSessionStatus
  refreshTrigger: number
}

const RegistrationListTable = ({ sessionId, sessionStatus, refreshTrigger }: Props) => {
  const [data, setData] = useState<ExamRegistrationType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRegistrations = async () => {
      setLoading(true)

      try {
        const result = await beltExamService.getExamRegistrations({ examSessionId: sessionId, pageSize: 1000 })

        if (result.success && result.data) {
          setData(result.data)
        } else {
          setData([])
        }
      } catch (error) {
        logger.error('RegistrationListTable', 'fetchRegistrations', error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchRegistrations()
  }, [refreshTrigger, sessionId])

  const columns = useMemo(
    () => [
      columnHelper.accessor('studentName', {
        header: 'Học viên',
        cell: ({ row }) => (
          <Typography color='text.primary' fontWeight={500}>
            {row.original.studentName}
          </Typography>
        )
      }),
      columnHelper.accessor('className', {
        header: 'Lớp',
        cell: ({ row }) => <Typography>{row.original.className}</Typography>
      }),
      columnHelper.accessor('currentBeltLevelName', {
        header: 'Cấp hiện tại',
        cell: ({ row }) => <Typography>{row.original.currentBeltLevelName || '—'}</Typography>
      }),
      columnHelper.accessor('targetBeltLevelName', {
        header: 'Cấp thi',
        cell: ({ row }) => (
          <Typography color='primary.main' fontWeight={500}>
            {row.original.targetBeltLevelName}
          </Typography>
        )
      }),
      columnHelper.accessor('isFeePaid', {
        header: 'Lệ phí',
        cell: ({ row }) => (
          <Box display='flex' flexDirection='column' alignItems='flex-start' gap={1}>
            <Typography variant='body2'>{formatCurrency(row.original.feeAmount ?? 0)}</Typography>
            <Chip
              label={row.original.isFeePaid ? 'Đã thu' : 'Chưa thu'}
              color={row.original.isFeePaid ? 'success' : 'warning'}
              variant='tonal'
              size='small'
            />
          </Box>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Chip
            label={examRegistrationStatusLabels[row.original.status] ?? row.original.status}
            color={examRegistrationStatusColors[row.original.status] ?? 'secondary'}
            variant='tonal'
            size='small'
          />
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
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <Card>
      <Box className='flex items-center justify-between px-4 py-3'>
        <Typography variant='h6'>Danh sách đăng ký</Typography>
        <Chip
          size='small'
          variant='tonal'
          color={sessionStatus === 'Locked' ? 'error' : sessionStatus === 'Open' ? 'primary' : 'secondary'}
          label={sessionStatus === 'Locked' ? 'Chỉ xem' : sessionStatus === 'Open' ? 'Đang nhận đăng ký' : 'Bản nháp'}
        />
      </Box>

      {loading && data.length === 0 ? (
        <Box sx={{ p: 5, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <table className='table-auto w-full'>
            <thead className='bg-actionHover'>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className='px-4 py-3 text-left font-medium text-textSecondary uppercase text-sm'>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className='border-b border-divider'>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className='px-4 py-3'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {data.length === 0 && !loading && (
                <tr>
                  <td colSpan={columns.length} className='px-4 py-8 text-center text-textSecondary'>
                    Chưa có học viên đăng ký.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>
      )}
    </Card>
  )
}

export default RegistrationListTable
