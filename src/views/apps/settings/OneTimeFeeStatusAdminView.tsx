'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import classService from '@/services/classService'
import oneTimeFeeService from '@/services/oneTimeFeeService'
import { useNotification } from '@/contexts/notificationContext'
import type { ClassType } from '@/types/apps/classTypes'
import type {
  FeeDefinitionType,
  OneTimeFeeAdminStatusType
} from '@/types/apps/oneTimeFeeTypes'

const formatCurrency = (amount?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(amount || 0))

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString('vi-VN') : '-')

const translatePaidSource = (value?: string | null) => {
  switch (value) {
    case 'Payment':
      return 'Qua thanh toán'
    case 'Manual':
      return 'Đánh dấu tay'
    case 'LegacyPayment':
      return 'Dữ liệu cũ'
    case 'Waived':
      return 'Miễn áp dụng'
    default:
      return '-'
  }
}

const OneTimeFeeStatusAdminView = () => {
  const { showNotification } = useNotification()

  const [loadingFilters, setLoadingFilters] = useState(true)
  const [loadingTable, setLoadingTable] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [classes, setClasses] = useState<ClassType[]>([])
  const [definitions, setDefinitions] = useState<FeeDefinitionType[]>([])
  const [records, setRecords] = useState<OneTimeFeeAdminStatusType[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [classId, setClassId] = useState('')
  const [feeCode, setFeeCode] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [keyword, setKeyword] = useState('')
  const [dialogRow, setDialogRow] = useState<OneTimeFeeAdminStatusType | null>(null)
  const [dialogNote, setDialogNote] = useState('')

  const activeDefinitions = useMemo(
    () => definitions.filter(item => item.isActive && item.isOneTime).sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    [definitions]
  )

  const loadFilters = useCallback(async () => {
    try {
      setLoadingFilters(true)
      const [classResponse, definitionResponse] = await Promise.all([
        classService.getClasses({ isActive: true, pageSize: 1000 }),
        oneTimeFeeService.getDefinitions()
      ])

      setClasses((classResponse.data || []).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi')))
      setDefinitions(definitionResponse.success ? definitionResponse.data || [] : [])
    } catch {
      showNotification('Đã có lỗi khi tải dữ liệu bộ lọc phí 1 lần.', 'error')
    } finally {
      setLoadingFilters(false)
    }
  }, [showNotification])

  const loadStatuses = useCallback(async () => {
    try {
      setLoadingTable(true)
      const response = await oneTimeFeeService.getAdminStatuses({
        classId: classId || undefined,
        feeCode: feeCode || undefined,
        isPaid: statusFilter === 'all' ? undefined : statusFilter === 'paid',
        keyword: keyword.trim() || undefined,
        pageNumber: page + 1,
        pageSize: rowsPerPage
      })

      if (!response.success || !response.data) {
        setRecords([])
        setTotalRecords(0)
        showNotification(response.message || 'Không thể tải tổng hợp phí 1 lần.', 'error')
        return
      }

      setRecords(response.data.records || [])
      setTotalRecords(response.data.totalRecords || 0)
    } catch {
      setRecords([])
      setTotalRecords(0)
      showNotification('Đã có lỗi khi tải danh sách phí 1 lần.', 'error')
    } finally {
      setLoadingTable(false)
    }
  }, [classId, feeCode, keyword, page, rowsPerPage, showNotification, statusFilter])

  useEffect(() => {
    loadFilters()
  }, [loadFilters])

  useEffect(() => {
    loadStatuses()
  }, [loadStatuses])

  const openMarkPaidDialog = (row: OneTimeFeeAdminStatusType) => {
    setDialogRow(row)
    setDialogNote('')
  }

  const closeDialog = () => {
    if (submitting) return
    setDialogRow(null)
    setDialogNote('')
  }

  const handleConfirmMarkPaid = async () => {
    if (!dialogRow) return

    try {
      setSubmitting(true)
      const response = await oneTimeFeeService.markPaidManually({
        studentId: dialogRow.studentId,
        classId: dialogRow.classId,
        feeCode: dialogRow.feeCode,
        note: dialogNote.trim() || undefined
      })

      if (!response.success) {
        showNotification(response.message || 'Không thể cập nhật trạng thái đã đóng.', 'error')
        return
      }

      showNotification(response.message || 'Đã cập nhật trạng thái đã đóng.', 'success')
      closeDialog()
      loadStatuses()
    } catch {
      showNotification('Đã có lỗi khi cập nhật trạng thái đã đóng.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title='Tổng hợp phí 1 lần'
        subheader='Theo dõi tình trạng đã đóng/chưa đóng theo lớp và từng khoản phí. Thao tác "Đã đóng" chỉ ghi nhận trạng thái hoàn thành, không tạo thêm payment.'
      />
      <CardContent>
        <Stack spacing={3}>
          <Alert severity='info'>
            Dùng bộ lọc lớp và khoản phí để kiểm tra nhanh học viên còn thiếu phí 1 lần. Nếu học viên đã đóng ở ngoài hệ thống, dùng nút `Đã đóng` để chỉ đánh dấu hoàn thành.
          </Alert>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              fullWidth
              label='Lớp'
              value={classId}
              onChange={event => {
                setClassId(event.target.value)
                setPage(0)
              }}
              disabled={loadingFilters}
            >
              <MenuItem value=''>Tất cả lớp</MenuItem>
              {classes.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.code ? `${item.code} - ${item.name}` : item.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label='Khoản phí'
              value={feeCode}
              onChange={event => {
                setFeeCode(event.target.value)
                setPage(0)
              }}
              disabled={loadingFilters}
            >
              <MenuItem value=''>Tất cả khoản phí</MenuItem>
              {activeDefinitions.map(item => (
                <MenuItem key={item.feeCode} value={item.feeCode}>
                  {item.feeCode} - {item.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label='Trạng thái'
              value={statusFilter}
              onChange={event => {
                setStatusFilter(event.target.value as 'all' | 'paid' | 'unpaid')
                setPage(0)
              }}
            >
              <MenuItem value='all'>Tất cả</MenuItem>
              <MenuItem value='unpaid'>Chưa đóng</MenuItem>
              <MenuItem value='paid'>Đã đóng</MenuItem>
            </TextField>

            <TextField
              fullWidth
              label='Tìm kiếm'
              placeholder='Tên học viên, mã học viên, lớp'
              value={keyword}
              onChange={event => {
                setKeyword(event.target.value)
                setPage(0)
              }}
            />
          </Stack>

          {loadingFilters ? (
            <Box className='flex justify-center py-8'>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Học viên</TableCell>
                    <TableCell>Lớp</TableCell>
                    <TableCell>Khoản phí</TableCell>
                    <TableCell align='right'>Mức phí</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Đã ghi nhận</TableCell>
                    <TableCell>Nguồn</TableCell>
                    <TableCell>Ghi chú</TableCell>
                    <TableCell align='right'>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingTable ? (
                    <TableRow>
                      <TableCell colSpan={9} align='center'>
                        <Box className='flex justify-center py-6'>
                          <CircularProgress size={24} />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align='center'>
                        Không có dữ liệu phù hợp.
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map(row => (
                      <TableRow key={`${row.studentId}-${row.feeCode}`}>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant='body2' sx={{ fontWeight: 600 }}>
                              {row.studentName}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {row.studentCode || '-'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant='body2'>{row.className}</Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {row.classCode || '-'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant='body2'>{row.feeName}</Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {row.feeCode}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align='right'>{formatCurrency(row.amount)}</TableCell>
                        <TableCell>
                          <Chip
                            size='small'
                            color={row.isPaid ? 'success' : 'warning'}
                            variant='tonal'
                            label={row.isPaid ? 'Đã đóng' : 'Chưa đóng'}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant='body2'>{formatDateTime(row.paidAt)}</Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {row.recordedByUserName || '-'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{translatePaidSource(row.paidSource)}</Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 260 }}>
                          <Typography variant='body2'>{row.note || '-'}</Typography>
                        </TableCell>
                        <TableCell align='right'>
                          {row.isPaid ? (
                            <Chip
                              size='small'
                              variant='outlined'
                              label={row.paymentRecordId ? 'Qua payment' : 'Đã hoàn thành'}
                            />
                          ) : (
                            <Button size='small' variant='contained' onClick={() => openMarkPaidDialog(row)}>
                              Đã đóng
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            component='div'
            count={totalRecords}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={event => {
              setRowsPerPage(Number(event.target.value))
              setPage(0)
            }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage='Số dòng mỗi trang:'
          />
        </Stack>
      </CardContent>

      <Dialog open={Boolean(dialogRow)} onClose={closeDialog} maxWidth='sm' fullWidth>
        <DialogTitle>Đánh dấu đã đóng phí 1 lần</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant='body2'>
              Xác nhận ghi nhận học viên <strong>{dialogRow?.studentName}</strong> đã đóng khoản <strong>{dialogRow?.feeName}</strong>.
            </Typography>
            <Alert severity='warning'>
              Thao tác này chỉ cập nhật trạng thái đã đóng trong hệ thống, không tạo thêm bản ghi payment.
            </Alert>
            <TextField
              fullWidth
              label='Ghi chú'
              multiline
              minRows={3}
              placeholder='Ví dụ: học viên đã đóng ngoài hệ thống / đã thu trước đó'
              value={dialogNote}
              onChange={event => setDialogNote(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={handleConfirmMarkPaid} variant='contained' disabled={submitting}>
            {submitting ? 'Đang cập nhật...' : 'Xác nhận đã đóng'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default OneTimeFeeStatusAdminView
