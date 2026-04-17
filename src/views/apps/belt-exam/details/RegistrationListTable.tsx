'use client'

import { logger } from '@/utils/logger'
import { useState, useEffect, useMemo } from 'react'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { toast } from 'react-toastify'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel
} from '@tanstack/react-table'

import beltExamService from '@/services/beltExamService'
import type { ExamRegistrationType, ExamSessionStatus } from '@/types/apps/beltExamTypes'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

interface Props {
  sessionId: string
  sessionStatus: ExamSessionStatus
  refreshTrigger: number
}

const columnHelper = createColumnHelper<ExamRegistrationType>()

const statusColors: Record<string, 'warning' | 'success' | 'error' | 'secondary'> = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error'
}

const RegistrationListTable = ({ sessionId, sessionStatus, refreshTrigger }: Props) => {
  const [data, setData] = useState<ExamRegistrationType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRegistrations = async () => {
    setLoading(true)
    try {
      const res = await beltExamService.getExamRegistrations({ examSessionId: sessionId })
      if (res.success && res.data) {
        setData(res.data)
      }
    } catch (error) {
      logger.error('RegistrationListTable', 'Li khi ly danh sch th sinh', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistrations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, refreshTrigger])

  const deleteRegistration = async (id: string) => {
    if (!confirm('Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a thÃ­ sinh nÃ y khá»i danh sÃ¡ch dá»± thi?')) return
    alert('TÃ­nh nÄƒng xÃ³a Ä‘ang Ä‘Æ°á»£c phÃ¡t triá»ƒn') // TODO: call APi
  }

  const rejectRegistration = async (id: string) => {
    if (!confirm('Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n tá»« chá»‘i/huá»· dá»± thi cá»§a há»c viÃªn nÃ y? Thao tÃ¡c nÃ y sáº½ xoÃ¡ luÃ´n hoÃ¡ Ä‘Æ¡n náº¿u há»c viÃªn Ä‘Ã£ Ä‘Ã³ng tiá»n.')) return
    
    try {
      const res = await beltExamService.rejectExamRegistration(id)
      if (res.success) {
        toast.success(res.message || 'Huá»· dá»± thi thÃ nh cÃ´ng')
        fetchRegistrations()
      } else {
        toast.error(res.message || 'CÃ³ lá»—i xáº£y ra')
      }
    } catch (error) {
      logger.error('RegistrationListTable', 'unknown', error)
      toast.error('Lá»—i káº¿t ná»‘i mÃ¡y chá»§')
    }
  }

  const columns = useMemo(
    () => {
      const cols = [
        columnHelper.accessor('studentName', {
          header: 'Há»c viÃªn',
          cell: ({ row }) => <Typography color='text.primary' fontWeight={500}>{row.original.studentName}</Typography>
        }),
        columnHelper.accessor('className', {
          header: 'Lá»›p',
          cell: ({ row }) => <Typography>{row.original.className}</Typography>
        }),
        columnHelper.accessor('currentBeltLevelName', {
          header: 'Cáº¥p hiá»‡n táº¡i',
          cell: ({ row }) => <Typography>{row.original.currentBeltLevelName || 'KhÃ´ng cÃ³'}</Typography>
        }),
        columnHelper.accessor('targetBeltLevelName', {
          header: 'Cáº¥p Ä‘ai thi lÃªn',
          cell: ({ row }) => <Typography color='primary' fontWeight={500}>{row.original.targetBeltLevelName}</Typography>
        }),
        columnHelper.accessor('isFeePaid', {
          header: 'Lá»‡ phÃ­',
          cell: ({ row }) => {
            const isPaid = row.original.isFeePaid
            return (
              <Box display='flex' flexDirection='column' alignItems='flex-start' gap={1}>
                <Typography variant='body2'>{formatCurrency(row.original.feeAmount ?? 0)}</Typography>
                <Chip
                  label={isPaid ? 'ÄÃ£ thu' : 'ChÆ°a thu'}
                  color={isPaid ? 'success' : 'error'}
                  variant='tonal'
                  size='small'
                />
              </Box>
            )
          }
        }),
        columnHelper.accessor('status', {
          header: 'Tráº¡ng thÃ¡i',
          cell: ({ row }) => (
            <Chip
              label={row.original.status}
              color={statusColors[row.original.status] || 'secondary'}
              variant='tonal'
              size='small'
            />
          )
        })
      ]

      if (sessionStatus === 'Draft') {
        cols.push(
          columnHelper.display({
            id: 'actions',
            header: 'HÃ nh Ä‘á»™ng',
            cell: ({ row }) => (
              <IconButton color='error' onClick={() => deleteRegistration(row.original.id)}>
                <i className='ri-delete-bin-7-line' />
              </IconButton>
            )
          }) as any
        )
      } else if (sessionStatus === 'Pending' || sessionStatus === 'Approved') {
        cols.push(
          columnHelper.display({
            id: 'actions',
            header: 'HÃ nh Ä‘á»™ng',
            cell: ({ row }) => (
              row.original.status !== 'Rejected' ? (
                <IconButton color='error' title='Huá»· dá»± thi' onClick={() => rejectRegistration(row.original.id)}>
                  <i className='ri-close-circle-line' />
                </IconButton>
              ) : null
            )
          }) as any
        )
      }
      return cols
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionStatus]
  )

  const table = useReactTable({
    data,
    columns: columns as any,
    filterFns: {} as any,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <Card>
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
                    ChÆ°a cÃ³ há»c viÃªn Ä‘Äƒng kÃ½
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
