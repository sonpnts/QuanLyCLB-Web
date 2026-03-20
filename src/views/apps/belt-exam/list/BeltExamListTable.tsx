'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
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
import type { ColumnDef, FilterFn } from '@tanstack/react-table'

import type { ExamSessionType } from '@/types/apps/beltExamTypes'
import { examSessionStatusObj } from '@/types/apps/beltExamTypes'

import AddExamSessionDrawer from './AddExamSessionDrawer'
import beltExamService from '@/services/beltExamService'
import { useNotification } from '@/contexts/notificationContext'
import tableStyles from '@core/styles/table.module.css'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const statusLabels: { [key: string]: string } = {
  Draft: 'Nháp',
  Pending: 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Từ chối',
  Completed: 'Hoàn thành'
}

const columnHelper = createColumnHelper<ExamSessionType>()

const BeltExamListTable = () => {
  const [addExamOpen, setAddExamOpen] = useState(false)
  const [data, setData] = useState<ExamSessionType[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedExam, setSelectedExam] = useState<ExamSessionType | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'submit'>('approve')

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
        if (response.success && response.data) {
          setData(response.data)
        } else {
          showNotificationRef.current(response.message || 'Không thể tải danh sách kỳ thi.', 'error')
        }
      } catch (error) {
        showNotificationRef.current('Đã có lỗi khi tải dữ liệu.', 'error')
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
      } else {
        response = await beltExamService.submitExamSession(selectedExam.id)
      }

      if (response.success) {
        const newStatus = actionType === 'approve' ? 'Approved' : actionType === 'reject' ? 'Rejected' : 'Pending'
        setData(prev => prev.map(e => e.id === selectedExam.id ? { ...e, status: newStatus as any } : e))
        showNotification(`${actionType === 'approve' ? 'Phê duyệt' : actionType === 'reject' ? 'Từ chối' : 'Gửi duyệt'} thành công!`, 'success')
        setActionDialogOpen(false)
        setSelectedExam(null)
      } else {
        showNotification(response.message || 'Thao tác thất bại.', 'error')
      }
    } catch (error) {
      showNotification('Đã có lỗi xảy ra.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openActionDialog = (exam: ExamSessionType, type: 'approve' | 'reject' | 'submit') => {
    setSelectedExam(exam)
    setActionType(type)
    setActionDialogOpen(true)
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
      columnHelper.accessor('beltLevelName', {
        header: 'Cấp đai',
        cell: ({ row }) => <Typography>{row.original.beltLevelName || '-'}</Typography>
      }),
      columnHelper.accessor('examDate', {
        header: 'Ngày thi',
        cell: ({ row }) => (
          <Typography>{new Date(row.original.examDate).toLocaleDateString('vi-VN')}</Typography>
        )
      }),
      columnHelper.accessor('registrationDeadline', {
        header: 'Hạn đăng ký',
        cell: ({ row }) => (
          <Typography>{new Date(row.original.registrationDeadline).toLocaleDateString('vi-VN')}</Typography>
        )
      }),
      columnHelper.accessor('examFee', {
        header: 'Lệ phí',
        cell: ({ row }) => <Typography>{formatCurrency(row.original.examFee)}</Typography>
      }),
      columnHelper.accessor('maxCandidates', {
        header: 'Số lượng',
        cell: ({ row }) => (
          <Typography>
            {row.original.currentCandidates || 0}/{row.original.maxCandidates}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Chip
            label={statusLabels[row.original.status]}
            size='small'
            color={examSessionStatusObj[row.original.status]}
            variant='tonal'
          />
        )
      }),
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => {
          const exam = row.original
          return (
            <Box className='flex items-center gap-1'>
              {exam.status === 'Draft' && (
                <IconButton
                  color='primary'
                  title='Gửi duyệt'
                  onClick={() => openActionDialog(exam, 'submit')}
                >
                  <i className='ri-send-plane-line' />
                </IconButton>
              )}
              {exam.status === 'Pending' && (
                <>
                  <IconButton
                    color='success'
                    title='Phê duyệt'
                    onClick={() => openActionDialog(exam, 'approve')}
                  >
                    <i className='ri-check-line' />
                  </IconButton>
                  <IconButton
                    color='error'
                    title='Từ chối'
                    onClick={() => openActionDialog(exam, 'reject')}
                  >
                    <i className='ri-close-line' />
                  </IconButton>
                </>
              )}
              <IconButton title='Xem chi tiết'>
                <i className='ri-eye-line text-textSecondary' />
              </IconButton>
            </Box>
          )
        }
      }
    ],
    []
  )

  const fuzzyFilter: FilterFn<any> = () => true

  const table = useReactTable({
    data,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
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
                  <tr key={row.id}>
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
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Phê duyệt kỳ thi' : actionType === 'reject' ? 'Từ chối kỳ thi' : 'Gửi duyệt kỳ thi'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc muốn {actionType === 'approve' ? 'phê duyệt' : actionType === 'reject' ? 'từ chối' : 'gửi duyệt'} kỳ thi <strong>{selectedExam?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Hủy</Button>
          <Button
            variant='contained'
            color={actionType === 'reject' ? 'error' : actionType === 'approve' ? 'success' : 'primary'}
            onClick={handleAction}
            disabled={loading}
          >
            {actionType === 'approve' ? 'Phê duyệt' : actionType === 'reject' ? 'Từ chối' : 'Gửi duyệt'}
          </Button>
        </DialogActions>
      </Dialog>

      <AddExamSessionDrawer open={addExamOpen} handleClose={() => setAddExamOpen(false)} setData={setData} />
    </>
  )
}

export default BeltExamListTable
