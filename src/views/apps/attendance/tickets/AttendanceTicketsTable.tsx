'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'


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

const DAY_OF_WEEK_NAME_MAP: Record<string, string> = {
  Sunday: 'Chủ nhật',
  Monday: 'Thứ 2',
  Tuesday: 'Thứ 3',
  Wednesday: 'Thứ 4',
  Thursday: 'Thứ 5',
  Friday: 'Thứ 6',
  Saturday: 'Thứ 7'
}

const formatDayOfWeek = (value: number | string): string => {
  if (typeof value === 'number') return DAY_OF_WEEK_MAP[value] || ''
  return DAY_OF_WEEK_NAME_MAP[value as string] || value as string
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

  const [filterStatus, setFilterStatus] = useState<AdjustmentStatus | ''>('Pending')
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1)
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [selectedAdjustment, setSelectedAdjustment] = useState<AttendanceAdjustmentType | null>(null)

  const [adjustmentType, setAdjustmentType] = useState<AttendanceType>('MakeupCheckIn')
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([])
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [approvalNotes, setApprovalNotes] = useState('')
  const reasonRef = useRef<HTMLDivElement>(null)

  const [validSessions, setValidSessions] = useState<any[]>([])
  const [missedSessions, setMissedSessions] = useState<any[]>([])
  const [existingAdjustments, setExistingAdjustments] = useState<Set<string>>(new Set())
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [createMonth, setCreateMonth] = useState<number>(new Date().getMonth() + 1)
  const [createYear, setCreateYear] = useState<number>(new Date().getFullYear())
  const [payrollPeriod, setPayrollPeriod] = useState<{ fromDate: string; toDate: string; startDay: number; endDay: number } | null>(null)
  const [filterMissedClassId, setFilterMissedClassId] = useState<string>('')

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

      const periodResponse = await attendanceService.getPayrollPeriod({ month: createMonth, year: createYear })
      if (periodResponse.success && periodResponse.data) {
        setPayrollPeriod(periodResponse.data)
        const fromDate = periodResponse.data.fromDate
        const toDate = periodResponse.data.toDate

        const [sessionRes, adjRes] = await Promise.all([
          attendanceService.getUnassignedAttendances({ fromDate, toDate }),
          attendanceAdjustmentService.getMyAdjustments({ month: createMonth, year: createYear, pageNumber: 1, pageSize: 500 })
        ])

        const existingDates = new Set<string>()
        if (adjRes.success && adjRes.data?.items) {
          for (const a of adjRes.data.items) {
            if (a.adjustmentType === 'MakeupCheckIn' && (a.status === 'Pending' || a.status === 'Approved')) {
              existingDates.add(a.adjustmentDate)
            }
          }
        }
        setExistingAdjustments(existingDates)

        if (sessionRes.success && sessionRes.data) {
          const filtered = sessionRes.data.filter((s: any) => !existingDates.has(s.sessionDate))
          setValidSessions(filtered)
        } else {
          setValidSessions([])
        }
      } else {
        setValidSessions([])
      }
    } catch (error) {
      logger.error('AttendanceTicketsTable', 'Error loading valid sessions', error)
      setValidSessions([])
    } finally {
      setLoadingOptions(false)
    }
  }, [createMonth, createYear])

  const loadMissedSessions = useCallback(async () => {
    try {
      setLoadingOptions(true)

      const [periodRes, sessionRes, adjRes] = await Promise.all([
        attendanceService.getPayrollPeriod({ month: createMonth, year: createYear }),
        attendanceService.getMissedSessions({ month: createMonth, year: createYear }),
        attendanceAdjustmentService.getMyAdjustments({ month: createMonth, year: createYear, pageNumber: 1, pageSize: 500 })
      ])

      if (periodRes.success && periodRes.data) {
        setPayrollPeriod(periodRes.data)
      }

      const existingDates = new Set<string>()
      if (adjRes.success && adjRes.data?.items) {
        for (const a of adjRes.data.items) {
          if (a.adjustmentType === 'CheckIn' && (a.status === 'Pending' || a.status === 'Approved')) {
            existingDates.add(a.adjustmentDate)
          }
        }
      }
      setExistingAdjustments(existingDates)

      if (sessionRes.success && sessionRes.data) {
        const available = sessionRes.data.filter((s: any) => {
          if (s.hasExistingAdjustment) return false
          const sessionDateStr = s.sessionDate?.split('T')[0] || s.sessionDate
          return !existingDates.has(sessionDateStr)
        })
        setMissedSessions(available)
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
      } else if (adjustmentType === 'CheckIn') {
        loadMissedSessions()
      }
      setFilterMissedClassId('')
      setSelectedSessionIds([])
      setExistingAdjustments(new Set())
    }
  }, [createDialogOpen, adjustmentType, createMonth, createYear, loadValidSessions, loadMissedSessions])

  const uniqueMissedClasses = useMemo(() => {
    const map = new Map<string, { classId: string; className: string; classCode: string }>()
    for (const s of missedSessions) {
      if (!map.has(s.classId)) map.set(s.classId, { classId: s.classId, className: s.className, classCode: s.classCode })
    }
    return Array.from(map.values())
  }, [missedSessions])

  const filteredMissedSessions = useMemo(() => {
    if (!filterMissedClassId) return missedSessions
    return missedSessions.filter(s => s.classId === filterMissedClassId)
  }, [missedSessions, filterMissedClassId])

  const handleCreateAdjustment = async () => {
    if (selectedSessionIds.length === 0) {
      showNotification('Vui lòng chọn ít nhất một buổi học.', 'error')
      return
    }

    if (adjustmentType === 'CheckIn' && !reason.trim()) {
      showNotification('Vui lòng nhập lý do.', 'warning')
      reasonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      reasonRef.current?.querySelector('textarea')?.focus()
      return
    }

    try {
      setLoading(true)

      const finalReason = adjustmentType === 'MakeupCheckIn' ? 'Dạy thay / Dạy bù' : reason
      let successCount = 0, failCount = 0
      const errors: string[] = []

      for (const sessionId of selectedSessionIds) {
        let createData: any = {
          adjustmentType,
          reason: finalReason,
          notes: notes || undefined
        }

        if (adjustmentType === 'MakeupCheckIn') {
          const session = validSessions.find(s => s.id === sessionId)
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
          const session = missedSessions.find(s => `${s.classScheduleId}_${s.sessionDate}` === sessionId)
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
          successCount++
        } else {
          failCount++
          const errorMsg = response.message || 'Lỗi không xác định'
          const sessionLabel = adjustmentType === 'MakeupCheckIn'
            ? `Buổi ${createData.adjustmentDate || ''}`
            : `Buổi ${createData.adjustmentDate || ''}`
          errors.push(`${sessionLabel}: ${errorMsg}`)
        }
      }

      if (failCount === 0) {
        showNotification(`Đã tạo thành công ${successCount} phiếu.`, 'success')
      } else if (successCount === 0) {
        showNotification(`Tạo phiếu thất bại: ${errors.join('; ')}`, 'error')
      } else {
        showNotification(`Thành công: ${successCount}, Thất bại: ${failCount}. Chi tiết: ${errors.join('; ')}`, 'warning')
      }
      setSelectedSessionIds([])
      if (adjustmentType === 'MakeupCheckIn') {
        await loadValidSessions()
      } else {
        await loadMissedSessions()
      }
      loadAdjustments()
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
    setSelectedSessionIds([])
    setReason('')
    setNotes('')
    setCreateMonth(new Date().getMonth() + 1)
    setCreateYear(new Date().getFullYear())
    setExistingAdjustments(new Set())
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
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    value={filterStatus}
                    label='Trạng thái'
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
                    value={filterMonth}
                    label='Tháng'
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
                    value={filterYear}
                    label='Năm'
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
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        {isAdmin && <TableCell>HLV</TableCell>}
                        <TableCell>Lớp</TableCell>
                        <TableCell>Thứ</TableCell>
                        <TableCell>Ngày công</TableCell>
                        <TableCell>Giờ học</TableCell>
                        <TableCell>Chi nhánh</TableCell>
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
                            {isAdmin && (
                              <TableCell>
                                <Typography variant='body2'>{adj.userFullName || adj.userName}</Typography>
                              </TableCell>
                            )}
                            <TableCell>
                              <Typography variant='body2'>{adj.className || '-'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2'>
                                {adj.dayOfWeek != null ? formatDayOfWeek(adj.dayOfWeek) : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2' className='font-medium'>
                                {formatDateVN(adj.adjustmentDate)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2'>
                                {adj.startTime && adj.endTime ? `${adj.startTime} - ${adj.endTime}` : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2'>{adj.branchName || '-'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2'>{adj.reason}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={statusInfo.label} color={statusInfo.color} variant='tonal' size='small' />
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2'>{formatDateTimeVN(adj.createdAt)}</Typography>
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

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth='lg' fullWidth>
        <DialogTitle>Tạo phiếu chấm công bù</DialogTitle>
        <DialogContent sx={{ minHeight: '50vh' }}>
          <Stack spacing={3} sx={{ mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Loại điều chỉnh</InputLabel>
                <Select
                  value={adjustmentType}
                  label='Loại điều chỉnh'
                  onChange={e => {
                    setAdjustmentType(e.target.value as AttendanceType)
                    setSelectedSessionIds([])
                  }}
                >
                  {ATTENDANCE_TYPES.map(t => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {payrollPeriod && (
                <Alert severity='info'>
                  <Typography variant='body2'>
                    <strong>Thời gian bảng lương:</strong> Từ ngày {formatDateVN(payrollPeriod.fromDate)} đến ngày {formatDateVN(payrollPeriod.toDate)}
                    {payrollPeriod.startDay !== 1 && ` (Ngày bắt đầu: ${payrollPeriod.startDay}, Ngày kết thúc: ${payrollPeriod.endDay})`}
                  </Typography>
                </Alert>
              )}

              {adjustmentType === 'CheckIn' && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <FormControl fullWidth size='small'>
                      <InputLabel>Tháng</InputLabel>
                      <Select
                        value={createMonth}
                        label='Tháng'
                        onChange={e => {
                          setCreateMonth(Number(e.target.value))
                          setSelectedSessionIds([])
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
                        value={createYear}
                        label='Năm'
                        onChange={e => {
                          setCreateYear(Number(e.target.value))
                          setSelectedSessionIds([])
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
              {selectedSessionIds.length > 0 && (
                <Chip label={`Đã chọn ${selectedSessionIds.length}`} size='small' color='primary' sx={{ ml: 1 }} />
              )}
            </Typography>

            {adjustmentType === 'CheckIn' && uniqueMissedClasses.length > 0 && (
              <FormControl fullWidth size='small'>
                <InputLabel>Lọc theo lớp</InputLabel>
                <Select
                  value={filterMissedClassId}
                  label='Lọc theo lớp'
                  onChange={e => {
                    setFilterMissedClassId(e.target.value)
                    setSelectedSessionIds([])
                  }}
                >
                  <MenuItem value=''>Tất cả lớp</MenuItem>
                  {uniqueMissedClasses.map(c => (
                    <MenuItem key={c.classId} value={c.classId}>{c.classCode} - {c.className}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {loadingOptions ? (
              <Box className='flex justify-center py-4'>
                <CircularProgress size={24} />
              </Box>
            ) : adjustmentType === 'MakeupCheckIn' ? (
              validSessions.length === 0 ? (
                <Alert severity='info'>Không có lượt chấm công hợp lệ nào trong tháng này.</Alert>
              ) : (
                <TableContainer sx={{ maxHeight: '40vh', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Table size='small' stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding='checkbox' sx={{ bgcolor: 'background.paper' }}>
                          <input
                            type='checkbox'
                            checked={selectedSessionIds.length === validSessions.length && validSessions.length > 0}
                            onChange={e => {
                              if (e.target.checked) setSelectedSessionIds(validSessions.map(s => s.id))
                              else setSelectedSessionIds([])
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ bgcolor: 'background.paper' }}>Ngày</TableCell>
                        <TableCell sx={{ bgcolor: 'background.paper' }}>Vào</TableCell>
                        <TableCell sx={{ bgcolor: 'background.paper' }}>Ra</TableCell>
                        <TableCell sx={{ bgcolor: 'background.paper' }}>Thời gian</TableCell>
                        <TableCell sx={{ bgcolor: 'background.paper' }}>Chi nhánh</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validSessions.map(session => (
                        <TableRow
                          key={session.id}
                          hover
                          selected={selectedSessionIds.includes(session.id)}
                          onClick={() => {
                            setSelectedSessionIds(prev =>
                              prev.includes(session.id) ? prev.filter(id => id !== session.id) : [...prev, session.id]
                            )
                          }}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding='checkbox'>
                            <input
                              type='checkbox'
                              checked={selectedSessionIds.includes(session.id)}
                              onChange={() => {
                                setSelectedSessionIds(prev =>
                                  prev.includes(session.id) ? prev.filter(id => id !== session.id) : [...prev, session.id]
                                )
                              }}
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
              filteredMissedSessions.length === 0 ? (
                <Alert severity='info'>Không có buổi học nào cần bổ sung chấm công{filterMissedClassId ? ' cho lớp đã chọn' : ''}.</Alert>
              ) : (
                <TableContainer sx={{ maxHeight: '40vh', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Table size='small' stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding='checkbox' sx={{ bgcolor: 'background.paper' }}>
                          <input
                            type='checkbox'
                            checked={selectedSessionIds.length === filteredMissedSessions.length && filteredMissedSessions.length > 0}
                            onChange={e => {
                              if (e.target.checked) setSelectedSessionIds(filteredMissedSessions.map(s => `${s.classScheduleId}_${s.sessionDate}`))
                              else setSelectedSessionIds([])
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ bgcolor: 'background.paper' }}>Lớp</TableCell>
                        <TableCell sx={{ bgcolor: 'background.paper' }}>Thứ</TableCell>
                        <TableCell sx={{ bgcolor: 'background.paper' }}>Giờ học</TableCell>
                        <TableCell sx={{ bgcolor: 'background.paper' }}>Ngày</TableCell>
                        <TableCell sx={{ bgcolor: 'background.paper' }}>Chi nhánh</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredMissedSessions.map(session => {
                        const sessionKey = `${session.classScheduleId}_${session.sessionDate}`
                        return (
                          <TableRow
                            key={sessionKey}
                            hover
                            selected={selectedSessionIds.includes(sessionKey)}
                            onClick={() => {
                              setSelectedSessionIds(prev =>
                                prev.includes(sessionKey) ? prev.filter(id => id !== sessionKey) : [...prev, sessionKey]
                              )
                            }}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell padding='checkbox'>
                              <input
                                type='checkbox'
                                checked={selectedSessionIds.includes(sessionKey)}
                                onChange={() => {
                                  setSelectedSessionIds(prev =>
                                    prev.includes(sessionKey) ? prev.filter(id => id !== sessionKey) : [...prev, sessionKey]
                                  )
                                }}
                              />
                            </TableCell>
                            <TableCell>{session.className}</TableCell>
                            <TableCell>{formatDayOfWeek(session.dayOfWeek)}</TableCell>
                            <TableCell>{session.startTime} - {session.endTime}</TableCell>
                            <TableCell>{formatDateVN(session.sessionDate)}</TableCell>
                            <TableCell>{session.branchName || '-'}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
            )}

            <Divider />

            {adjustmentType === 'CheckIn' && (
              <TextField
                ref={reasonRef}
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
            disabled={loading || selectedSessionIds.length === 0}
          >
            {loading ? 'Đang tạo...' : `Tạo ${selectedSessionIds.length > 0 ? selectedSessionIds.length : ''} phiếu`}
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
                    <strong>Huấn luyện viên:</strong> {selectedAdjustment.userFullName || selectedAdjustment.userName}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Lớp học:</strong> {selectedAdjustment.className || '-'}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Thứ:</strong> {selectedAdjustment.dayOfWeek != null ? formatDayOfWeek(selectedAdjustment.dayOfWeek) : '-'}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Giờ học:</strong> {selectedAdjustment.startTime && selectedAdjustment.endTime ? `${selectedAdjustment.startTime} - ${selectedAdjustment.endTime}` : '-'}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Chi nhánh:</strong> {selectedAdjustment.branchName || '-'}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Ngày công:</strong> {formatDateVN(selectedAdjustment.adjustmentDate)}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Loại:</strong> {getAdjustmentTypeLabel(selectedAdjustment.adjustmentType)}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Lý do:</strong> {selectedAdjustment.reason}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Ngày tạo yêu cầu:</strong> {formatDateTimeVN(selectedAdjustment.createdAt)}
                  </Typography>
                </Alert>

                <FormControl fullWidth>
                  <InputLabel>Ghi chú khi duyệt</InputLabel>
                  <Select
                    value={approvalNotes}
                    label='Ghi chú khi duyệt'
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
