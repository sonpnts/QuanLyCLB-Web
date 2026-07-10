'use client'

import { useCallback, useEffect, useState } from 'react'

import { toLocalDateString } from '@/utils/dateTime'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TablePagination from '@mui/material/TablePagination'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'

import attendanceAdjustmentService from '@/services/attendanceAdjustmentService'
import attendanceService from '@/services/attendanceService'
import type { AttendanceAdjustmentType, AdjustmentStatus, AttendanceType } from '@/services/attendanceAdjustmentService'
import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import { hasAdminRole } from '@/utils/roleUtils'
import { formatDateVN, formatDateTimeVN } from '@/utils/dateTime'
import { logger } from '@/utils/logger'

const ATTENDANCE_TYPES: { value: AttendanceType; label: string }[] = [
  { value: 'MakeupCheckIn', label: 'Dạy thay / Dạy bù' },
  { value: 'CheckIn', label: 'Thiếu chấm công' }
]

const DAY_OF_WEEK_MAP: Record<number, string> = {
  0: 'Chủ nhật',
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7'
}

const AttendanceTicketsTable = () => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()
  const isAdmin = hasAdminRole(auth?.roles)

  const [adjustments, setAdjustments] = useState<AttendanceAdjustmentType[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  const [filterStatus, setFilterStatus] = useState<AdjustmentStatus | ''>('')
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1)
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [selectedAdjustment, setSelectedAdjustment] = useState<AttendanceAdjustmentType | null>(null)

  const [adjustmentType, setAdjustmentType] = useState<AttendanceType>('MakeupCheckIn')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [approvalNotes, setApprovalNotes] = useState('')

  const [validSessions, setValidSessions] = useState<any[]>([])
  const [missedSessions, setMissedSessions] = useState<any[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [createMonth, setCreateMonth] = useState<number>(new Date().getMonth() + 1)
  const [createYear, setCreateYear] = useState<number>(new Date().getFullYear())

  const loadAdjustments = useCallback(async () => {
    try {
      setLoading(true)

      const params: any = {
        pageNumber: page + 1,
        pageSize: rowsPerPage,
        month: filterMonth,
        year: filterYear
      }

      if (filterStatus) params.status = filterStatus

      let response
      if (isAdmin) {
        response = await attendanceAdjustmentService.getAllAdjustments(params)
      } else {
        response = await attendanceAdjustmentService.getMyAdjustments(params)
      }

      if (response.success && response.data) {
        setAdjustments(response.data.items || [])
        setTotalCount(response.data.totalCount || 0)
      } else {
        setAdjustments([])
        setTotalCount(0)
      }
    } catch (error) {
      logger.error('AttendanceTicketsTable', 'Error loading adjustments', error)
      showNotification('Đã có lỗi khi tải phiếu chấm công bù.', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, filterStatus, filterMonth, filterYear, isAdmin, showNotification])

  useEffect(() => {
    loadAdjustments()
  }, [loadAdjustments])

  const loadValidSessions = useCallback(async () => {
    try {
      setLoadingOptions(true)
      const now = new Date()
      const fromDate = toLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1))
      const toDate = toLocalDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0))

      const response = await attendanceService.getUnassignedAttendances({ fromDate, toDate })
      if (response.success && response.data) {
        setValidSessions(response.data)
      } else {
        setValidSessions([])
      }
    } catch (error) {
      logger.error('AttendanceTicketsTable', 'Error loading valid sessions', error)
      setValidSessions([])
    } finally {
      setLoadingOptions(false)
    }
  }, [])

  const loadMissedSessions = useCallback(async () => {
    try {
      setLoadingOptions(true)

      const response = await attendanceService.getMissedSessions({
        month: createMonth,
        year: createYear
      })
      if (response.success && response.data) {
        setMissedSessions(response.data)
      } else {
        setMissedSessions([])
      }
    } catch (error) {
      logger.error('AttendanceTicketsTable', 'Error loading missed sessions', error)
      setMissedSessions([])
    } finally {
      setLoadingOptions(false)
    }
  }, [createMonth, createYear])

  useEffect(() => {
    if (createDialogOpen) {
      if (adjustmentType === 'MakeupCheckIn') {
        loadValidSessions()
      } else {
        loadMissedSessions()
      }
    }
  }, [createDialogOpen, adjustmentType, loadValidSessions, loadMissedSessions])

  useEffect(() => {
    if (createDialogOpen && adjustmentType === 'CheckIn') {
      loadMissedSessions()
    }
  }, [createMonth, createYear, createDialogOpen, adjustmentType, loadMissedSessions])

  const handleCreateAdjustment = async () => {
    if (!selectedSessionId) {
      showNotification('Vui lòng chọn buổi học.', 'error')
      return
    }

    if (adjustmentType === 'CheckIn' && !reason) {
      showNotification('Vui lòng chọn lý do.', 'error')
      return
    }

    try {
      setLoading(true)

      const finalReason = adjustmentType === 'MakeupCheckIn' ? 'Dạy thay / Dạy bù' : reason

      let createData: any = {
        adjustmentType,
        reason: finalReason,
        notes: notes || undefined
      }

      if (adjustmentType === 'MakeupCheckIn') {
        const session = validSessions.find(s => s.id === selectedSessionId)
        if (session) {
          createData = {
            ...createData,
            adjustmentDate: session.sessionDate,
            attendanceRecordId: session.id,
            requestedCheckInAt: session.checkInAt,
            requestedCheckOutAt: session.checkOutAt
          }
        }
      } else {
        const session = missedSessions.find(s => s.classScheduleId === selectedSessionId)
        if (session) {
          createData = {
            ...createData,
            adjustmentDate: session.sessionDate.split('T')[0],
            classId: session.classId,
            classScheduleId: session.classScheduleId
          }
        }
      }

      const response = await attendanceAdjustmentService.create(createData)

      if (response.success) {
        showNotification('Tạo phiếu chấm công bù thành công.', 'success')
        setCreateDialogOpen(false)
        resetCreateForm()
        loadAdjustments()
      } else {
        showNotification(response.message || 'Không thể tạo phiếu chấm công bù.', 'error')
      }
    } catch (error) {
      logger.error('AttendanceTicketsTable', 'Error creating adjustment', error)
      showNotification('Đã có lỗi khi tạo phiếu chấm công bù.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveAdjustment = async () => {
    if (!selectedAdjustment) return

    try {
      setLoading(true)

      const response = await attendanceAdjustmentService.approve(selectedAdjustment.id, {
        approve: true,
        approvalNotes: approvalNotes || undefined
      })

      if (response.success) {
        showNotification('Duyệt phiếu chấm công bù thành công.', 'success')
        setApproveDialogOpen(false)
        setSelectedAdjustment(null)
        setApprovalNotes('')
        loadAdjustments()
      } else {
        showNotification(response.message || 'Không thể xử lý phiếu chấm công bù.', 'error')
      }
    } catch (error) {
      logger.error('AttendanceTicketsTable', 'Error approving adjustment', error)
      showNotification('Đã có lỗi khi xử lý phiếu chấm công bù.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectAdjustment = async () => {
    if (!selectedAdjustment) return

    try {
      setLoading(true)

      const response = await attendanceAdjustmentService.reject(selectedAdjustment.id, {
        approve: false,
        approvalNotes: approvalNotes || undefined
      })

      if (response.success) {
        showNotification('Từ chối phiếu chấm công bù thành công.', 'success')
        setApproveDialogOpen(false)
        setSelectedAdjustment(null)
        setApprovalNotes('')
        loadAdjustments()
      } else {
        showNotification(response.message || 'Không thể xử lý phiếu chấm công bù.', 'error')
      }
    } catch (error) {
      logger.error('AttendanceTicketsTable', 'Error rejecting adjustment', error)
      showNotification('Đã có lỗi khi xử lý phiếu chấm công bù.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const resetCreateForm = () => {
    setAdjustmentType('MakeupCheckIn')
    setSelectedSessionId('')
    setReason('')
    setNotes('')
    setCreateMonth(new Date().getMonth() + 1)
    setCreateYear(new Date().getFullYear())
  }

  const getStatusLabel = (status: AdjustmentStatus) => {
    const statusMap: Record<AdjustmentStatus, { label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }> = {
      Pending: { label: 'Chờ duyệt', color: 'warning' },
      Approved: { label: 'Đã duyệt', color: 'success' },
      Rejected: { label: 'Từ chối', color: 'error' },
      Cancelled: { label: 'Đã hủy', color: 'default' }
    }
    return statusMap[status] || { label: 'Không xác định', color: 'default' }
  }

  const getAdjustmentTypeLabel = (type: AttendanceType) => {
    const typeMap: Record<AttendanceType, string> = {
      CheckIn: 'Thiếu chấm công (Vào)',
      CheckOut: 'Thiếu chấm công (Ra)',
      MakeupCheckIn: 'Dạy thay / Dạy bù (Vào)',
      MakeupCheckOut: 'Dạy thay / Dạy bù (Ra)'
    }
    return typeMap[type] || type
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const currentYear = new Date().getFullYear()
  const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <>
      <Box className='flex flex-col gap-6'>
        <Card>
          <CardHeader
            title='Phiếu chấm công bù'
            subheader={isAdmin ? 'Quản lý và duyệt phiếu chấm công bù cho huấn luyện viên.' : 'Xem lại các đơn phiếu chấm công bù đã nộp.'}
            action={
              !isAdmin && (
                <Button variant='contained' onClick={() => setCreateDialogOpen(true)}>
                  Tạo phiếu chấm công bù
                </Button>
              )
            }
          />
          <CardContent>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    label='Trạng thái'
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value as AdjustmentStatus | '')}
                  >
                    <MenuItem value=''>Tất cả</MenuItem>
                    <MenuItem value='Pending'>Chờ duyệt</MenuItem>
                    <MenuItem value='Approved'>Đã duyệt</MenuItem>
                    <MenuItem value='Rejected'>Từ chối</MenuItem>
                    <MenuItem value='Cancelled'>Đã hủy</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Tháng</InputLabel>
                  <Select
                    label='Tháng'
                    value={filterMonth}
                    onChange={e => setFilterMonth(Number(e.target.value))}
                  >
                    {MONTHS.map(m => (
                      <MenuItem key={m} value={m}>Tháng {m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Năm</InputLabel>
                  <Select
                    label='Năm'
                    value={filterYear}
                    onChange={e => setFilterYear(Number(e.target.value))}
                  >
                    {YEARS.map(y => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {loading ? (
              <Box className='flex justify-center py-12'>
                <CircularProgress />
              </Box>
            ) : adjustments.length === 0 ? (
              <Box className='text-center py-8'>
                <Typography variant='body1' color='text.secondary'>
                  Chưa có phiếu chấm công bù nào.
                </Typography>
              </Box>
            ) : (
              <>
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Ngày điều chỉnh</TableCell>
                        <TableCell>Lớp học</TableCell>
                        {isAdmin && <TableCell>Huấn luyện viên</TableCell>}
                        <TableCell>Loại</TableCell>
                        <TableCell>Lý do</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell>Ngày tạo</TableCell>
                        {isAdmin && <TableCell align='center'>Thao tác</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {adjustments.map(adj => {
                        const statusInfo = getStatusLabel(adj.status)

                        return (
                          <TableRow key={adj.id} hover>
                            <TableCell>
                              <Typography variant='body2' className='font-medium'>
                                {formatDateVN(adj.adjustmentDate)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2'>{adj.className || '-'}</Typography>
                            </TableCell>
                            {isAdmin && (
                              <TableCell>
                                <Typography variant='body2'>{adj.userName}</Typography>
                              </TableCell>
                            )}
                            <TableCell>
                              <Chip label={getAdjustmentTypeLabel(adj.adjustmentType)} size='small' variant='tonal' />
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2'>{adj.reason}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={statusInfo.label} color={statusInfo.color} variant='tonal' size='small' />
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2'>{formatDateVN(adj.createdAt)}</Typography>
                            </TableCell>
                            {isAdmin && (
                              <TableCell align='center'>
                                {adj.status === 'Pending' && (
                                  <IconButton
                                    size='small'
                                    onClick={() => {
                                      setSelectedAdjustment(adj)
                                      setApproveDialogOpen(true)
                                    }}
                                    color='primary'
                                  >
                                    <i className='ri-check-double-line text-xl' />
                                  </IconButton>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination
                  component='div'
                  count={totalCount}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage='Dòng mỗi trang:'
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                />
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Tạo phiếu chấm công bù</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Loại điều chỉnh</InputLabel>
              <Select
                label='Loại điều chỉnh'
                value={adjustmentType}
                onChange={e => {
                  setAdjustmentType(e.target.value as AttendanceType)
                  setSelectedSessionId('')
                }}
              >
                {ATTENDANCE_TYPES.map(t => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {adjustmentType === 'CheckIn' && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Tháng</InputLabel>
                    <Select
                      label='Tháng'
                      value={createMonth}
                      onChange={e => {
                        setCreateMonth(Number(e.target.value))
                        setSelectedSessionId('')
                      }}
                    >
                      {MONTHS.map(m => (
                        <MenuItem key={m} value={m}>Tháng {m}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Năm</InputLabel>
                    <Select
                      label='Năm'
                      value={createYear}
                      onChange={e => {
                        setCreateYear(Number(e.target.value))
                        setSelectedSessionId('')
                      }}
                    >
                      {YEARS.map(y => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}

            <Divider />

            <Typography variant='subtitle2' fontWeight={600}>
              {adjustmentType === 'MakeupCheckIn'
                ? 'Chọn lượt chấm công chưa gắn với lớp (Dạy thay / Dạy bù)'
                : 'Chọn buổi học chưa có chấm công (Thiếu chấm công)'}
            </Typography>

            {loadingOptions ? (
              <Box className='flex justify-center py-4'>
                <CircularProgress size={24} />
              </Box>
            ) : adjustmentType === 'MakeupCheckIn' ? (
              validSessions.length === 0 ? (
                <Alert severity='info'>Không có lượt chấm công hợp lệ nào trong tháng này.</Alert>
              ) : (
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell padding='checkbox'>Chọn</TableCell>
                        <TableCell>Ngày</TableCell>
                        <TableCell>Vào</TableCell>
                        <TableCell>Ra</TableCell>
                        <TableCell>Thời gian</TableCell>
                        <TableCell>Chi nhánh</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validSessions.map(session => (
                        <TableRow
                          key={session.id}
                          hover
                          selected={selectedSessionId === session.id}
                          onClick={() => setSelectedSessionId(session.id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding='checkbox'>
                            <input
                              type='radio'
                              checked={selectedSessionId === session.id}
                              onChange={() => setSelectedSessionId(session.id)}
                            />
                          </TableCell>
                          <TableCell>{formatDateVN(session.sessionDate)}</TableCell>
                          <TableCell>{formatDateTimeVN(session.checkInAt)}</TableCell>
                          <TableCell>{session.checkOutAt ? formatDateTimeVN(session.checkOutAt) : '-'}</TableCell>
                          <TableCell>
                            <Chip label={`${session.durationMinutes} phút`} size='small' color='primary' variant='tonal' />
                          </TableCell>
                          <TableCell>{session.branchName || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
            ) : (
              missedSessions.length === 0 ? (
                <Alert severity='info'>Không có buổi học nào cần bổ sung chấm công.</Alert>
              ) : (
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell padding='checkbox'>Chọn</TableCell>
                        <TableCell>Lớp</TableCell>
                        <TableCell>Thứ</TableCell>
                        <TableCell>Giờ học</TableCell>
                        <TableCell>Ngày</TableCell>
                        <TableCell>Chi nhánh</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {missedSessions.map(session => (
                        <TableRow
                          key={session.classScheduleId}
                          hover
                          selected={selectedSessionId === session.classScheduleId}
                          onClick={() => setSelectedSessionId(session.classScheduleId)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding='checkbox'>
                            <input
                              type='radio'
                              checked={selectedSessionId === session.classScheduleId}
                              onChange={() => setSelectedSessionId(session.classScheduleId)}
                            />
                          </TableCell>
                          <TableCell>{session.className}</TableCell>
                          <TableCell>{DAY_OF_WEEK_MAP[session.dayOfWeek] || ''}</TableCell>
                          <TableCell>{session.startTime} - {session.endTime}</TableCell>
                          <TableCell>{formatDateVN(session.sessionDate)}</TableCell>
                          <TableCell>{session.branchName || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
            )}

            <Divider />

            {adjustmentType === 'CheckIn' && (
              <TextField
                fullWidth
                label='Lý do'
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder='Nhập lý do thiếu chấm công'
                required
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Hủy</Button>
          <Button
            onClick={handleCreateAdjustment}
            variant='contained'
            disabled={loading || !selectedSessionId || (adjustmentType === 'CheckIn' && !reason)}
          >
            {loading ? 'Đang tạo...' : 'Tạo phiếu'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Duyệt phiếu chấm công bù</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {selectedAdjustment && (
              <>
                <Alert severity='info'>
                  <Typography variant='body2'>
                    <strong>Huấn luyện viên:</strong> {selectedAdjustment.userName}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Ngày điều chỉnh:</strong> {formatDateVN(selectedAdjustment.adjustmentDate)}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Loại:</strong> {getAdjustmentTypeLabel(selectedAdjustment.adjustmentType)}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Lý do:</strong> {selectedAdjustment.reason}
                  </Typography>
                </Alert>

                <FormControl fullWidth>
                  <InputLabel>Ghi chú khi duyệt</InputLabel>
                  <Select
                    label='Ghi chú khi duyệt'
                    value={approvalNotes}
                    onChange={e => setApprovalNotes(e.target.value)}
                  >
                    <MenuItem value=''>Không có ghi chú</MenuItem>
                    <MenuItem value='Đồng ý'>Đồng ý</MenuItem>
                    <MenuItem value='Cần bổ sung thông tin'>Cần bổ sung thông tin</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)}>Hủy</Button>
          <Button
            onClick={handleRejectAdjustment}
            variant='outlined'
            color='error'
            disabled={loading}
          >
            Từ chối
          </Button>
          <Button
            onClick={handleApproveAdjustment}
            variant='contained'
            color='success'
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Duyệt'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AttendanceTicketsTable
