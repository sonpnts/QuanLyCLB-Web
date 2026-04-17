'use client'

// React Imports
import { logger } from '@/utils/logger'
import { useEffect, useState, useCallback, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

// Third-party Imports
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { FilterFn } from '@tanstack/react-table'

// Type Imports
import type { CreateTicketRequest, TicketApprovalRequest } from '@/services/attendanceService'
import { TICKET_REASONS } from '@/types/apps/attendanceTypes'

// Service Imports
import attendanceService from '@/services/attendanceService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Column Helper
const columnHelper = createColumnHelper<any>()

const AttendanceTicketsTable = () => {
  // States
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createTicketOpen, setCreateTicketOpen] = useState(false)
  const [approveTicketOpen, setApproveTicketOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)

  // Form states
  const [classScheduleId, setClassScheduleId] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [reason, setReason] = useState<string>('')
  const [customReason, setCustomReason] = useState<string>('')
  const [approve, setApprove] = useState<boolean>(true)
  const [approver, setApprover] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // Notification Hook
  const { showNotification } = useNotification()

  // Load tickets (mock data for now)
  const loadTickets = useCallback(async () => {
    try {
      setLoading(true)

      // Mock data - replace with actual API call when available
      const mockData = [
        {
          id: '1',
          classScheduleId: 'schedule-1',
          userId: 'user-1',
          reason: 'Bá»‹ á»‘m',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ]

      setFilteredData(mockData)
    } catch (error) {
      logger.error('AttendanceTicketsTable', 'Error loading tickets', error)
      showNotification('ÄÃ£ cÃ³ lá»—i khi táº£i phiáº¿u xin nghá»‰.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  // Handle create ticket
  const handleCreateTicket = async () => {
    try {
      setLoading(true)

      const resolvedReason = reason === 'other' ? customReason || undefined : reason || undefined

      const createData: CreateTicketRequest = {
        classScheduleId,
        userId,
        reason: resolvedReason,
        createdBy: 'current-user', // Replace with actual user
        createdByUserId: 'current-user-id' // Replace with actual user ID
      }

      const response = await attendanceService.createTicket(createData)

      if (response.success) {
        showNotification('Táº¡o phiáº¿u xin nghá»‰ thÃ nh cÃ´ng.', 'success')
        setCreateTicketOpen(false)
        setClassScheduleId('')
        setUserId('')
        setReason('')
        setCustomReason('')
        loadTickets()
      } else {
        showNotification(response.message || 'KhÃ´ng thá»ƒ táº¡o phiáº¿u xin nghá»‰.', 'error')
      }
    } catch (error) {
      logger.error('AttendanceTicketsTable', 'Error creating ticket', error)
      showNotification('ÄÃ£ cÃ³ lá»—i khi táº¡o phiáº¿u xin nghá»‰.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Handle approve ticket
  const handleApproveTicket = async () => {
    if (!selectedTicket) return

    try {
      setLoading(true)

      const approvalData: TicketApprovalRequest = {
        approve,
        approver: approver || undefined,
        notes: notes || undefined,
        updatedByUserId: 'current-user-id' // Replace with actual user ID
      }

      const response = await attendanceService.approveTicket(selectedTicket.id, approvalData)

      if (response.success) {
        showNotification(approve ? 'Duyá»‡t phiáº¿u xin nghá»‰ thÃ nh cÃ´ng.' : 'Tá»« chá»‘i phiáº¿u xin nghá»‰ thÃ nh cÃ´ng.', 'success')
        setApproveTicketOpen(false)
        setSelectedTicket(null)
        setApprover('')
        setNotes('')
        loadTickets()
      } else {
        showNotification(response.message || 'KhÃ´ng thá»ƒ xá»­ lÃ½ phiáº¿u xin nghá»‰.', 'error')
      }
    } catch (error) {
      logger.error('AttendanceTicketsTable', 'Error approving ticket', error)
      showNotification('ÄÃ£ cÃ³ lá»—i khi xá»­ lÃ½ phiáº¿u xin nghá»‰.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Get status label
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }> = {
      pending: { label: 'Chá» duyá»‡t', color: 'warning' },
      approved: { label: 'ÄÃ£ duyá»‡t', color: 'success' },
      rejected: { label: 'Tá»« chá»‘i', color: 'error' }
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
            {row.original.classScheduleId}
          </Typography>
        )
      }),
      columnHelper.accessor('userId', {
        header: 'NgÆ°á»i dÃ¹ng',
        cell: ({ row }) => <Typography variant='body2'>{row.original.userId}</Typography>
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
          <Typography variant='body2'>{new Date(row.original.createdAt).toLocaleDateString('vi-VN')}</Typography>
        )
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Thao tÃ¡c',
        cell: ({ row }) => (
          <Box className='flex items-center gap-2'>
            {row.original.status === 'pending' && (
              <IconButton
                size='small'
                onClick={() => {
                  setSelectedTicket(row.original)
                  setApproveTicketOpen(true)
                }}
                color='primary'
              >
                <i className='ri-check-line text-xl' />
              </IconButton>
            )}
          </Box>
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

  return (
    <>
      <Card>
        <CardHeader
          title='Phiáº¿u xin nghá»‰'
          action={
            <Button variant='contained' onClick={() => setCreateTicketOpen(true)}>
              Táº¡o phiáº¿u xin nghá»‰
            </Button>
          }
        />
        <div className='p-5'>
          {filteredData.length > 0 ? (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id} className='p-4 text-left'>
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
                ChÆ°a cÃ³ phiáº¿u xin nghá»‰ nÃ o
              </Typography>
            </Box>
          )}
        </div>
      </Card>

      {/* Create Ticket Dialog */}
      <Dialog open={createTicketOpen} onClose={() => setCreateTicketOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Táº¡o phiáº¿u xin nghá»‰</DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-4 pt-4'>
            <TextField
              fullWidth
              label='ID Lá»‹ch há»c'
              value={classScheduleId}
              onChange={e => setClassScheduleId(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label='ID NgÆ°á»i dÃ¹ng'
              value={userId}
              onChange={e => setUserId(e.target.value)}
              required
            />
            <FormControl fullWidth>
              <InputLabel>LÃ½ do</InputLabel>
              <Select value={reason} onChange={e => setReason(e.target.value)} label='LÃ½ do'>
                {TICKET_REASONS.map(r => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
                <MenuItem value='other'>KhÃ¡c (nháº­p thÃªm)</MenuItem>
              </Select>
            </FormControl>
            {reason === 'other' && (
              <TextField
                fullWidth
                label='LÃ½ do khÃ¡c'
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                sx={{ mt: 2 }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateTicketOpen(false)}>Há»§y</Button>
          <Button onClick={handleCreateTicket} variant='contained' disabled={loading}>
            {loading ? 'Äang táº¡o...' : 'Táº¡o phiáº¿u'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Ticket Dialog */}
      <Dialog open={approveTicketOpen} onClose={() => setApproveTicketOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Duyá»‡t phiáº¿u xin nghá»‰</DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-4 pt-4'>
            <FormControl fullWidth>
              <InputLabel>Quyáº¿t Ä‘á»‹nh</InputLabel>
              <Select
                label='Quyáº¿t Ä‘á»‹nh'
                value={approve ? 'true' : 'false'}
                onChange={e => setApprove(e.target.value === 'true')}
              >
                <MenuItem value='true'>Duyá»‡t</MenuItem>
                <MenuItem value='false'>Tá»« chá»‘i</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label='NgÆ°á»i duyá»‡t' value={approver} onChange={e => setApprover(e.target.value)} />
            <TextField
              fullWidth
              label='Ghi chÃº'
              value={notes}
              onChange={e => setNotes(e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveTicketOpen(false)}>Há»§y</Button>
          <Button onClick={handleApproveTicket} variant='contained' disabled={loading}>
            {loading ? 'Äang xá»­ lÃ½...' : 'XÃ¡c nháº­n'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AttendanceTicketsTable
