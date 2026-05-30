'use client'

import { useEffect, useState, useMemo, useRef } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'

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

import type { ExamSessionType } from '@/types/apps/beltExamTypes'
import { examSessionStatusColors } from '@/types/apps/beltExamTypes'

import AddExamSessionDrawer from './AddExamSessionDrawer'
import EditExamSessionDrawer from './EditExamSessionDrawer'
import beltExamService from '@/services/beltExamService'
import { useNotification } from '@/contexts/notificationContext'
import tableStyles from '@core/styles/table.module.css'
import { fuzzyFilter } from '@/utils/tableHelpers'

const statusLabels: { [key: string]: string } = {
  Draft: 'Nháp',
  Pending: 'Chờ duyệt',
  PendingApproval: 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Từ chối',
  Completed: 'Hoàn thành',
  Open: 'Đang mở ĐK',
  Closed: 'Đã đóng ĐK',
  Locked: 'Đã chốt'
}

const columnHelper = createColumnHelper<ExamSessionType>()

const BeltExamListTable = () => {
  const router = useRouter()
  const [addExamOpen, setAddExamOpen] = useState(false)
  const [editExamOpen, setEditExamOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<ExamSessionType | null>(null)
  const [data, setData] = useState<ExamSessionType[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedExam, setSelectedExam] = useState<ExamSessionType | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'submit' | 'open'>('approve')
  const [openDeadline, setOpenDeadline] = useState('')

  const { showNotification } = useNotification()

  // Refs để tránh duplicate calls
  const showNotificationRef = useRef(showNotification)

  showNotificationRef.current = showNotification
  const dataLoadedRef = useRef(false)

  useEffect(() => {
    if (dataLoadedRef.current) return

    const loadExams = async () => {
      try {
        dataLoadedRef.current = true
        setLoading(true)
        const response = await beltExamService.getExamSessions()

        setData(response.data || [])
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    }

    loadExams()
  }, [])

  const handleAction = async () => {
    if (!selectedExam) return

    try {
      setLoading(true)
      let response

      if (actionType === 'approve') {
        response = await beltExamService.approveExamSession(selectedExam.id)
      } else if (actionType === 'reject') {
        response = await beltExamService.rejectExamSession(selectedExam.id)
      } else if (actionType === 'open') {
        response = await beltExamService.openSession(selectedExam.id, openDeadline || undefined)
      } else {
        response = await beltExamService.submitExamSession(selectedExam.id)
      }

      if (response.success) {
        const newStatus =
          actionType === 'approve'
            ? 'Approved'
            : actionType === 'reject'
              ? 'Rejected'
              : actionType === 'open'
                ? 'Open'
                : 'Pending'

        setData(prev => prev.map(e => (e.id === selectedExam.id ? { ...e, status: newStatus as any } : e)))

        const label =
          actionType === 'approve'
            ? 'Phê duyệt'
            : actionType === 'reject'
              ? 'Từ chối'
              : actionType === 'open'
                ? 'Mở đăng ký'
                : 'Gửi duyệt'

        showNotification(`${label} thành công!`, 'success')
        setActionDialogOpen(false)
        setSelectedExam(null)
        setOpenDeadline('')
      } else {
        showNotification(response.message || 'Thao tác thất bại.', 'error')
      }
    } catch (error) {
      showNotification('Đã có lỗi xảy ra.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openActionDialog = (exam: ExamSessionType, type: 'approve' | 'reject' | 'submit' | 'open') => {
    setSelectedExam(exam)
    setActionType(type)
    setActionDialogOpen(true)
  }

  const openEditDrawer = (exam: ExamSessionType) => {
    setEditingExam(exam)
    setEditExamOpen(true)
  }

  const columns = useMemo<ColumnDef<ExamSessionType, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Tên kỳ thi',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.name}
          </Typography>
        )
      }),
      columnHelper.accessor('examDate', {
        header: 'Ngày thi',
        cell: ({ row }) => <Typography>{new Date(row.original.examDate).toLocaleDateString('vi-VN')}</Typography>
      }),
      columnHelper.accessor('location', {
        header: 'Địa điểm',
        cell: ({ row }) => <Typography>{row.original.location || '-'}</Typography>
      }),
      columnHelper.accessor('totalRegistrations', {
        header: 'Số lượt đ.ký',
        cell: ({ row }) => <Typography>{row.original.totalRegistrations || 0}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Chip
            label={statusLabels[row.original.status as string] ?? row.original.status}
            size='small'
            color={examSessionStatusColors[row.original.status as string] ?? 'default'}
            variant='tonal'
          />
        )
      }),
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => {
          const exam = row.original
          const isNewFlow = ['Open', 'Closed', 'Locked'].includes(exam.status as string)

          return (
            <Box className='flex items-center gap-1' onClick={event => event.stopPropagation()}>
              <IconButton color='primary' title='Chỉnh sửa' onClick={() => openEditDrawer(exam)}>
                <i className='ri-pencil-line' />
              </IconButton>
              {exam.status === 'Draft' && (
                <>
                  <IconButton color='primary' title='Gửi duyệt' onClick={() => openActionDialog(exam, 'submit')}>
                    <i className='ri-send-plane-line' />
                  </IconButton>
                  <IconButton
                    color='success'
                    title='Mở đăng ký (HLV flow)'
                    onClick={() => openActionDialog(exam, 'open')}
                  >
                    <i className='ri-door-open-line' />
                  </IconButton>
                </>
              )}
              {(exam.status === 'Pending' || (exam.status as string) === 'PendingApproval') && (
                <>
                  <IconButton color='success' title='Phê duyệt' onClick={() => openActionDialog(exam, 'approve')}>
                    <i className='ri-check-line' />
                  </IconButton>
                  <IconButton color='error' title='Từ chối' onClick={() => openActionDialog(exam, 'reject')}>
                    <i className='ri-close-line' />
                  </IconButton>
                </>
              )}
              {(exam.status as string) === 'Approved' && (
                <IconButton
                  color='success'
                  title='Mở đăng ký (HLV flow)'
                  onClick={() => openActionDialog(exam, 'open')}
                >
                  <i className='ri-door-open-line' />
                </IconButton>
              )}
              {isNewFlow && (
                <IconButton
                  component={Link}
                  href={`/apps/belt-exam/${exam.id}/admin`}
                  title='Quản trị kỳ thi'
                  color='secondary'
                >
                  <i className='ri-admin-line' />
                </IconButton>
              )}
              {/* Row click handles "view" */}
            </Box>
          )
        }
      }
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    initialState: { pagination: { pageSize: 10 } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Quản lý kỳ thi cấp đai'
          action={
            <Button variant='contained' onClick={() => setAddExamOpen(true)}>
              Tạo kỳ thi mới
            </Button>
          }
        />
        <Divider />
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
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/apps/belt-exam/${row.original.id}/admin`)}
                    style={{ cursor: 'pointer' }}
                  >
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

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          {actionType === 'approve'
            ? 'Phê duyệt kỳ thi'
            : actionType === 'reject'
              ? 'Từ chối kỳ thi'
              : actionType === 'open'
                ? 'Mở đăng ký thi cấp'
                : 'Gửi duyệt kỳ thi'}
        </DialogTitle>
        <DialogContent className='flex flex-col gap-4 pt-2'>
          <Typography>
            Bạn có chắc muốn{' '}
            {actionType === 'approve'
              ? 'phê duyệt'
              : actionType === 'reject'
                ? 'từ chối'
                : actionType === 'open'
                  ? 'mở đăng ký cho'
                  : 'gửi duyệt'}{' '}
            kỳ thi <strong>{selectedExam?.name}</strong>?
          </Typography>
          {actionType === 'open' && (
            <TextField
              label='Hạn đăng ký (tùy chọn)'
              type='datetime-local'
              size='small'
              fullWidth
              value={openDeadline}
              onChange={e => setOpenDeadline(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText='Để trống nếu không có hạn. HLV sẽ tự nộp trước ngày thi.'
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setActionDialogOpen(false)
              setOpenDeadline('')
            }}
          >
            Hủy
          </Button>
          <Button
            variant='contained'
            color={
              actionType === 'reject'
                ? 'error'
                : actionType === 'open'
                  ? 'success'
                  : actionType === 'approve'
                    ? 'success'
                    : 'primary'
            }
            onClick={handleAction}
            disabled={loading}
          >
            {actionType === 'approve'
              ? 'Phê duyệt'
              : actionType === 'reject'
                ? 'Từ chối'
                : actionType === 'open'
                  ? 'Mở ĐK'
                  : 'Gửi duyệt'}
          </Button>
        </DialogActions>
      </Dialog>

      <AddExamSessionDrawer open={addExamOpen} handleClose={() => setAddExamOpen(false)} setData={setData} />
      <EditExamSessionDrawer
        open={editExamOpen}
        session={editingExam}
        onClose={() => {
          setEditExamOpen(false)
          setEditingExam(null)
        }}
        setData={setData}
      />
    </>
  )
}

export default BeltExamListTable
