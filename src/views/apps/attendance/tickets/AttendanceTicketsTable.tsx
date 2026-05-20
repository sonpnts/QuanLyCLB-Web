'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import type { FilterFn } from '@tanstack/react-table'

import attendanceService from '@/services/attendanceService'
import type { CreateTicketRequest, TicketApprovalRequest } from '@/services/attendanceService'
import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import { TICKET_REASONS } from '@/types/apps/attendanceTypes'
import { buildModulePermissionMap } from '@/utils/rbac'
import { logger } from '@/utils/logger'

const columnHelper = createColumnHelper<any>()

const AttendanceTicketsTable = () => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()

  const ticketPermissions = useMemo(
    () => buildModulePermissionMap(auth?.permissions, auth?.roles, 'AttendanceTicket'),
    [auth?.permissions, auth?.roles]
  )

  const [filteredData, setFilteredData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [createTicketOpen, setCreateTicketOpen] = useState(false)
  const [approveTicketOpen, setApproveTicketOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)

  const [classScheduleId, setClassScheduleId] = useState('')
  const [userId, setUserId] = useState('')
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [approve, setApprove] = useState(true)
  const [approver, setApprover] = useState('')
  const [notes, setNotes] = useState('')

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true)

      const mockData = [
        {
          id: '1',
          classScheduleId: 'schedule-1',
          userId: 'user-1',
          reason: 'Bù ca chấm công bị thiếu',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ]

      setFilteredData(mockData)
    } catch (error) {
      logger.error('AttendanceTicketsTable', 'Error loading tickets', error)
      showNotification('Đã có lỗi khi tải phiếu chấm công bù.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  useEffect(() => {
    if (!ticketPermissions.canView) return
    loadTickets()
  }, [loadTickets, ticketPermissions.canView])

  const handleCreateTicket = async () => {
    try {
      setLoading(true)

      const resolvedReason = reason === 'other' ? customReason || undefined : reason || undefined

      const createData: CreateTicketRequest = {
        classScheduleId,
        userId,
        reason: resolvedReason,
        createdBy: 'current-user',
        createdByUserId: 'current-user-id'
      }

      const response = await attendanceService.createTicket(createData)

      if (response.success) {
        showNotification('Tạo phiếu chấm công bù thành công.', 'success')
        setCreateTicketOpen(false)
        setClassScheduleId('')
        setUserId('')
        setReason('')
        setCustomReason('')
        loadTickets()
      } else {
        showNotification(response.message || 'Không thể tạo phiếu chấm công bù.', 'error')
      }
    } catch (error) {
      logger.error('AttendanceTicketsTable', 'Error creating ticket', error)
      showNotification('Đã có lỗi khi tạo phiếu chấm công bù.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveTicket = async () => {
    if (!selectedTicket) return

    try {
      setLoading(true)

      const approvalData: TicketApprovalRequest = {
        approve,
        approver: approver || undefined,
        notes: notes || undefined,
        updatedByUserId: 'current-user-id'
      }

      const response = await attendanceService.approveTicket(selectedTicket.id, approvalData)

      if (response.success) {
        showNotification(approve ? 'Duyệt phiếu chấm công bù thành công.' : 'Từ chối phiếu chấm công bù thành công.', 'success')
        setApproveTicketOpen(false)
        setSelectedTicket(null)
        setApprover('')
        setNotes('')
        loadTickets()
      } else {
        showNotification(response.message || 'Không thể xử lý phiếu chấm công bù.', 'error')
      }
    } catch (error) {
      logger.error('AttendanceTicketsTable', 'Error approving ticket', error)
      showNotification('Đã có lỗi khi xử lý phiếu chấm công bù.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }> = {
      pending: { label: 'Chờ duyệt', color: 'warning' },
      approved: { label: 'Đã duyệt', color: 'success' },
      rejected: { label: 'Từ chối', color: 'error' }
    }

    return statusMap[status] || { label: 'Không xác định', color: 'default' }
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor('classScheduleId', {
        header: 'Lịch học',
        cell: ({ row }) => <Typography variant='body2' className='font-medium'>{row.original.classScheduleId}</Typography>
      }),
      columnHelper.accessor('userId', {
        header: 'Huấn luyện viên',
        cell: ({ row }) => <Typography variant='body2'>{row.original.userId}</Typography>
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
        cell: ({ row }) => <Typography variant='body2'>{new Date(row.original.createdAt).toLocaleDateString('vi-VN')}</Typography>
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <Box className='flex items-center gap-2'>
            {ticketPermissions.canApprove && row.original.status === 'pending' ? (
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
            ) : null}
          </Box>
        )
      })
    ],
    [ticketPermissions.canApprove]
  )

  const fuzzyFilter: FilterFn<any> = () => true

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Phiếu chấm công bù'
          subheader='Màn này dùng cho việc tạo và duyệt ticket chấm công bù cho coach.'
          action={
            ticketPermissions.canCreate ? (
              <Button variant='contained' onClick={() => setCreateTicketOpen(true)}>
                Tạo phiếu chấm công bù
              </Button>
            ) : null
          }
        />
        <div className='p-5'>
          {!ticketPermissions.canView ? (
            <Box className='text-center py-8'>
              <Typography variant='body1' color='text.secondary'>
                Bạn không có quyền xem phiếu chấm công bù.
              </Typography>
            </Box>
          ) : filteredData.length > 0 ? (
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
                {loading ? 'Đang tải...' : 'Chưa có phiếu chấm công bù nào'}
              </Typography>
            </Box>
          )}
        </div>
      </Card>

      <Dialog open={createTicketOpen} onClose={() => setCreateTicketOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Tạo phiếu chấm công bù</DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-4 pt-4'>
            <TextField fullWidth label='ID lịch học' value={classScheduleId} onChange={event => setClassScheduleId(event.target.value)} required />
            <TextField fullWidth label='ID huấn luyện viên' value={userId} onChange={event => setUserId(event.target.value)} required />
            <FormControl fullWidth>
              <InputLabel>Lý do</InputLabel>
              <Select value={reason} onChange={event => setReason(event.target.value)} label='Lý do'>
                {TICKET_REASONS.map(item => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
                <MenuItem value='other'>Khác (nhập thêm)</MenuItem>
              </Select>
            </FormControl>
            {reason === 'other' ? (
              <TextField fullWidth label='Lý do khác' value={customReason} onChange={event => setCustomReason(event.target.value)} sx={{ mt: 2 }} />
            ) : null}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateTicketOpen(false)}>Hủy</Button>
          <Button onClick={handleCreateTicket} variant='contained' disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo phiếu'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={approveTicketOpen} onClose={() => setApproveTicketOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Duyệt phiếu chấm công bù</DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-4 pt-4'>
            <FormControl fullWidth>
              <InputLabel>Quyết định</InputLabel>
              <Select label='Quyết định' value={approve ? 'true' : 'false'} onChange={event => setApprove(event.target.value === 'true')}>
                <MenuItem value='true'>Duyệt</MenuItem>
                <MenuItem value='false'>Từ chối</MenuItem>
              </Select>
            </FormControl>
            <TextField fullWidth label='Người duyệt' value={approver} onChange={event => setApprover(event.target.value)} />
            <TextField fullWidth label='Ghi chú' value={notes} onChange={event => setNotes(event.target.value)} multiline rows={3} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveTicketOpen(false)}>Hủy</Button>
          <Button onClick={handleApproveTicket} variant='contained' disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AttendanceTicketsTable
