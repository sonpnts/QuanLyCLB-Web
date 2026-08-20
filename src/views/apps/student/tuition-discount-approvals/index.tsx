'use client'

import { useCallback, useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useNotification } from '@/contexts/notificationContext'
import studentService, { type PaginatedResult, type TuitionDiscountRequestRow } from '@/services/studentService'
import { formatDateTimeVN } from '@/utils/dateTime'
import useStudentViewDrawer from '@/views/apps/student/list/useStudentViewDrawer'

const formatVnd = (value: number) => `${Math.round(value || 0).toLocaleString('vi-VN')}đ`

const getStatusChip = (status: TuitionDiscountRequestRow['status']) => {
  const value = typeof status === 'string' ? status.toLowerCase() : String(status)

  if (value.includes('approved') || value === '2') return <Chip label='Đã duyệt' color='success' size='small' />
  if (value.includes('rejected') || value === '3') return <Chip label='Từ chối' color='error' size='small' />
  if (value.includes('pending') || value === '1') return <Chip label='Chờ duyệt' color='warning' size='small' />

  return <Chip label='-' size='small' variant='outlined' />
}

const emptyPagedResult = (): PaginatedResult<TuitionDiscountRequestRow> => ({
  records: [],
  totalRecords: 0
})

const StudentTuitionDiscountApprovalsPage = () => {
  const { showNotification } = useNotification()
  const { openStudentDrawer, studentDrawerElement } = useStudentViewDrawer()

  const [tab, setTab] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [pendingPage, setPendingPage] = useState(0)
  const [pendingRowsPerPage, setPendingRowsPerPage] = useState(10)
  const [pendingData, setPendingData] = useState<PaginatedResult<TuitionDiscountRequestRow>>(emptyPagedResult)
  const [pendingLoading, setPendingLoading] = useState(false)
  const [historyPage, setHistoryPage] = useState(0)
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(10)
  const [historyData, setHistoryData] = useState<PaginatedResult<TuitionDiscountRequestRow>>(emptyPagedResult)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [decideOpen, setDecideOpen] = useState(false)
  const [decideDiscountId, setDecideDiscountId] = useState<string | null>(null)
  const [decideApprove, setDecideApprove] = useState(true)
  const [decideNote, setDecideNote] = useState('')
  const [deciding, setDeciding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadPending = useCallback(async (page = pendingPage, pageSize = pendingRowsPerPage, search = keyword) => {
    setPendingLoading(true)

    try {
      const res = await studentService.getPendingTuitionDiscountRequestsPaged({
        pageNumber: page + 1,
        pageSize,
        keyword: search.trim() || undefined
      })

      setPendingData(res.data || emptyPagedResult())
    } finally {
      setPendingLoading(false)
    }
  }, [keyword, pendingPage, pendingRowsPerPage])

  const loadHistory = useCallback(async (page = historyPage, pageSize = historyRowsPerPage, search = keyword) => {
    setHistoryLoading(true)

    try {
      const res = await studentService.getHistoryTuitionDiscountRequestsPaged({
        pageNumber: page + 1,
        pageSize,
        keyword: search.trim() || undefined
      })

      setHistoryData(res.data || emptyPagedResult())
    } finally {
      setHistoryLoading(false)
    }
  }, [historyPage, historyRowsPerPage, keyword])

  useEffect(() => {
    setPendingPage(0)
    setHistoryPage(0)
  }, [keyword])

  useEffect(() => {
    if (tab === 0) loadPending(pendingPage, pendingRowsPerPage)
  }, [loadPending, pendingPage, pendingRowsPerPage, tab])

  useEffect(() => {
    if (tab === 1) loadHistory(historyPage, historyRowsPerPage)
  }, [historyPage, historyRowsPerPage, loadHistory, tab])

  const openDecide = (discountId: string, approve: boolean) => {
    setDecideDiscountId(discountId)
    setDecideApprove(approve)
    setDecideNote('')
    setDecideOpen(true)
  }

  const submitDecide = async () => {
    if (!decideDiscountId) return

    setDeciding(true)

    try {
      const res = await studentService.decideTuitionDiscount(decideDiscountId, {
        approve: decideApprove,
        note: decideNote.trim() || undefined
      })

      if (!res.success) {
        showNotification(res.message || 'Không cập nhật được', 'error')
        return
      }

      showNotification(res.message || 'Đã cập nhật', 'success')
      setDecideOpen(false)
      setPendingPage(0)
      setHistoryPage(0)
      await Promise.all([loadPending(0, pendingRowsPerPage), loadHistory(0, historyRowsPerPage)])
    } finally {
      setDeciding(false)
    }
  }

  const handleDelete = async (discountId: string) => {
    if (!window.confirm('Xóa cấu hình giảm học phí này để về giá gốc?')) return

    setDeletingId(discountId)

    try {
      const res = await studentService.deleteTuitionDiscount(discountId)

      if (!res.success) {
        showNotification(res.message || 'Không xóa được cấu hình', 'error')
        return
      }

      showNotification(res.message || 'Đã xóa cấu hình giảm học phí', 'success')
      await Promise.all([loadPending(pendingPage, pendingRowsPerPage), loadHistory(historyPage, historyRowsPerPage)])
    } finally {
      setDeletingId(null)
    }
  }

  const activeRows = tab === 0 ? pendingData.records : historyData.records
  const activeLoading = tab === 0 ? pendingLoading : historyLoading
  const activeTotal = tab === 0 ? pendingData.totalRecords : historyData.totalRecords
  const activePage = tab === 0 ? pendingPage : historyPage
  const activeRowsPerPage = tab === 0 ? pendingRowsPerPage : historyRowsPerPage

  return (
    <Box className='flex flex-col gap-6'>
      <Card>
        <CardContent>
          <Typography variant='h5' sx={{ mb: 1 }}>
            Duyệt giảm trừ / miễn học phí
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Quản lý yêu cầu chờ duyệt, theo dõi kỳ áp dụng và cho phép xóa cấu hình đã duyệt.
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box className='mb-2 flex items-center justify-between gap-3 flex-wrap'>
            <Tabs value={tab} onChange={(_event, value) => setTab(value)}>
              <Tab label='Chờ duyệt' />
              <Tab label='Lịch sử' />
            </Tabs>

            <TextField
              size='small'
              label='Tìm kiếm'
              placeholder='Tên, mã, SĐT, lý do...'
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
              sx={{ minWidth: 280 }}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          <TableContainer>
            <Table size='small'>
              <TableHead>
                {tab === 0 ? (
                  <TableRow>
                    <TableCell>Học viên</TableCell>
                    <TableCell>Lớp</TableCell>
                    <TableCell align='right'>Giảm</TableCell>
                    <TableCell>Kỳ áp dụng</TableCell>
                    <TableCell>Lý do</TableCell>
                    <TableCell>Người tạo</TableCell>
                    <TableCell>Thời gian</TableCell>
                    <TableCell align='right'>Hành động</TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell>Học viên</TableCell>
                    <TableCell>Lớp</TableCell>
                    <TableCell align='right'>Giảm</TableCell>
                    <TableCell>Kỳ áp dụng</TableCell>
                    <TableCell>Kết quả</TableCell>
                    <TableCell>Người tạo</TableCell>
                    <TableCell>Người duyệt</TableCell>
                    <TableCell>Ghi chú</TableCell>
                    <TableCell>Thời gian xử lý</TableCell>
                    <TableCell align='right'>Tác vụ</TableCell>
                  </TableRow>
                )}
              </TableHead>

              <TableBody>
                {!activeLoading && activeRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={tab === 0 ? 8 : 10}>
                      <Typography variant='body2' color='text.secondary'>
                        {tab === 0 ? 'Không có yêu cầu nào đang chờ duyệt.' : 'Chưa có yêu cầu lịch sử nào.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}

                {activeRows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Typography
                        variant='body2'
                        sx={{ fontWeight: 600, cursor: 'pointer' }}
                        color='primary'
                        onClick={() => openStudentDrawer(row.studentId)}
                      >
                        {row.studentName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {row.studentCode || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.className || '-'}</TableCell>
                    <TableCell align='right'>{formatVnd(row.discountAmount || 0)}</TableCell>
                    <TableCell>{row.periodLabel}</TableCell>

                    {tab === 0 ? (
                      <>
                        <TableCell>{row.reason}</TableCell>
                        <TableCell>{row.requestedByName || '-'}</TableCell>
                        <TableCell>{formatDateTimeVN(row.requestedAt)}</TableCell>
                        <TableCell align='right'>
                          <Box className='flex items-center justify-end gap-2'>
                            <Button size='small' variant='contained' color='success' onClick={() => openDecide(row.id, true)}>
                              Duyệt
                            </Button>
                            <Button size='small' variant='outlined' color='error' onClick={() => openDecide(row.id, false)}>
                              Từ chối
                            </Button>
                          </Box>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{getStatusChip(row.status)}</TableCell>
                        <TableCell>{row.requestedByName || '-'}</TableCell>
                        <TableCell>{row.decidedByName || '-'}</TableCell>
                        <TableCell>{row.decisionNote || '-'}</TableCell>
                        <TableCell>{formatDateTimeVN(row.decidedAt)}</TableCell>
                        <TableCell align='right'>
                          <Button size='small' color='error' variant='outlined' onClick={() => handleDelete(row.id)} disabled={deletingId === row.id}>
                            {deletingId === row.id ? 'Đang xóa...' : 'Xóa'}
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component='div'
            count={activeTotal}
            page={activePage}
            onPageChange={(_event, newPage) => {
              if (tab === 0) {
                setPendingPage(newPage)
                return
              }

              setHistoryPage(newPage)
            }}
            rowsPerPage={activeRowsPerPage}
            onRowsPerPageChange={event => {
              const nextValue = Number(event.target.value)

              if (tab === 0) {
                setPendingRowsPerPage(nextValue)
                setPendingPage(0)
                return
              }

              setHistoryRowsPerPage(nextValue)
              setHistoryPage(0)
            }}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage='Số dòng'
          />
        </CardContent>
      </Card>

      <Dialog open={decideOpen} onClose={() => setDecideOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{decideApprove ? 'Duyệt giảm học phí' : 'Từ chối giảm học phí'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label='Ghi chú (tùy chọn)'
            value={decideNote}
            onChange={event => setDecideNote(event.target.value)}
            multiline
            minRows={3}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecideOpen(false)} disabled={deciding}>
            Hủy
          </Button>
          <Button variant='contained' onClick={submitDecide} disabled={deciding}>
            {deciding ? 'Đang lưu...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>

      {studentDrawerElement}
    </Box>
  )
}

export default StudentTuitionDiscountApprovalsPage
