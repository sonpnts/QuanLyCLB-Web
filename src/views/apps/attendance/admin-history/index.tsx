'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TablePagination from '@mui/material/TablePagination'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import attendanceService from '@/services/attendanceService'
import userService from '@/services/userService'
import classService from '@/services/classService'
import { formatDateTimeVN, toLocalDateString } from '@/utils/dateTime'
import { useNotification } from '@/contexts/notificationContext'
import { hasCoachRole } from '@/utils/roleUtils'
import { useAuth } from '@/contexts/authContext'

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i)
const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

interface PairRecord {
  id: string
  userId: string
  userName: string
  checkInAt: string
  checkOutAt: string | null
  checkInBranchName: string | null
  checkOutBranchName: string | null
  durationMinutes: number
  isValid: boolean
  invalidReason: string | null
  notes: string | null
  className: string | null
  classCode: string | null
}

interface PagedData {
  items: PairRecord[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

interface UserOption {
  id: string
  fullName: string
}

interface ClassOption {
  classId: string
  code: string
  name: string
  dayOfWeek: number
  startTime: string
  endTime: string
  branchName: string
}

interface MissingDateItem {
  date: string
  dayOfWeek: number
  classId: string
  className: string
  startTime: string
  endTime: string
  branchName: string
  checkInTime: string
  checkOutTime: string
}

const AdminAttendanceHistoryView = () => {
  const { auth } = useAuth()
  const isCoach = hasCoachRole(auth?.roles)
  const { showNotification } = useNotification()

  const [activeTab, setActiveTab] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth)
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)

  const [pairs, setPairs] = useState<PairRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const [userOptions, setUserOptions] = useState<UserOption[]>([])

  const [editOpen, setEditOpen] = useState(false)
  const [editPair, setEditPair] = useState<PairRecord | null>(null)
  const [editDateTime, setEditDateTime] = useState('')
  const [saving, setSaving] = useState(false)

  const [cancelTarget, setCancelTarget] = useState<PairRecord | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [addUserId, setAddUserId] = useState('')
  const [addClasses, setAddClasses] = useState<ClassOption[]>([])
  const [addSelectedClassId, setAddSelectedClassId] = useState('')
  const [addMissingDates, setAddMissingDates] = useState<MissingDateItem[]>([])
  const [addSelectedDates, setAddSelectedDates] = useState<Set<string>>(new Set())
  const [addLoading, setAddLoading] = useState(false)
  const [addSaving, setAddSaving] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMonth, setDialogMonth] = useState<number>(currentMonth)
  const [dialogYear, setDialogYear] = useState<number>(currentYear)
  const [sendEmail, setSendEmail] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<any>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())

  const [reportHistory, setReportHistory] = useState<any[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [reportPage, setReportPage] = useState(0)
  const [reportRowsPerPage, setReportRowsPerPage] = useState(10)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [reportDetailOpen, setReportDetailOpen] = useState(false)

  const loadPairs = useCallback(async () => {
    setLoading(true)
    try {
      const response = await attendanceService.getAdminAllPairs({
        month: selectedMonth,
        year: selectedYear,
        userId: selectedUserId || undefined,
        pageNumber: page + 1,
        pageSize: rowsPerPage
      })
      if (response.success && response.data) {
        const paged = response.data as PagedData
        setPairs(paged.items || [])
        setTotalCount(paged.totalCount || 0)
      } else {
        setPairs([])
        setTotalCount(0)
      }
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear, selectedUserId, page, rowsPerPage])

  useEffect(() => { loadPairs() }, [loadPairs])

  const loadUsers = useCallback(async () => {
    const response = await userService.getUsers({ Role: 'Coach', IsActive: true, PageSize: 500 })
    if (response.success && response.data) {
      setUserOptions(response.data.map((u: any) => ({ id: u.id || u.userId, fullName: u.fullName || u.userName })))
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const loadReportHistory = useCallback(async () => {
    setLoadingReports(true)
    try {
      const response = await attendanceService.getReportHistory(selectedMonth, selectedYear)
      setReportHistory(response.success && response.data ? response.data : [])
    } finally {
      setLoadingReports(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => { if (activeTab === 1) loadReportHistory() }, [activeTab, loadReportHistory])

  const handleDownloadReport = async (reportId: string, fileName: string) => {
    const blob = await attendanceService.downloadReport(reportId)
    if (blob) {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }
  }

  const openEdit = (pair: PairRecord) => {
    setEditPair(pair)
    const dt = new Date(pair.checkInAt)
    const vnTime = new Date(dt.getTime() + 7 * 60 * 60 * 1000)
    const y = vnTime.getUTCFullYear()
    const m = String(vnTime.getUTCMonth() + 1).padStart(2, '0')
    const d = String(vnTime.getUTCDate()).padStart(2, '0')
    const hh = String(vnTime.getUTCHours()).padStart(2, '0')
    const mm = String(vnTime.getUTCMinutes()).padStart(2, '0')
    setEditDateTime(`${y}-${m}-${d}T${hh}:${mm}`)
    setEditOpen(true)
  }

  const toVNIso = (localDatetime: string) => `${localDatetime}:00+07:00`

  const handleSaveEdit = async () => {
    if (!editPair || !editDateTime) return
    setSaving(true)
    try {
      const result = await attendanceService.updateAttendanceTime({
        id: editPair.id,
        newCheckedInAt: toVNIso(editDateTime)
      })
      if (result.success) {
        showNotification('Đã cập nhật thời gian chấm công', 'success')
        setEditOpen(false)
        loadPairs()
      } else {
        showNotification(result.message || 'Lỗi cập nhật', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const confirmCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      const result = await attendanceService.cancelAttendanceRecord(cancelTarget.id)
      if (result.success) {
        showNotification('Đã hủy lượt chấm công', 'success')
        setCancelTarget(null)
        loadPairs()
      } else {
        showNotification(result.message || 'Lỗi hủy', 'error')
      }
    } finally {
      setCancelling(false)
    }
  }

  const openAdd = () => {
    setAddUserId('')
    setAddClasses([])
    setAddSelectedClassId('')
    setAddMissingDates([])
    setAddSelectedDates(new Set())
    setAddOpen(true)
  }

  const loadAddClasses = useCallback(async (userId: string) => {
    if (!userId) { setAddClasses([]); return }
    setAddLoading(true)
    try {
      const response = await classService.getClassesByUserId(userId)
      const classes = (response.data || []).flatMap((c: any) => {
        const items: ClassOption[] = []
        const schedules = c.schedules || []
        if (schedules.length === 0) {
          items.push({ classId: c.id, code: c.code || '', name: c.name || '', dayOfWeek: -1, startTime: '', endTime: '', branchName: c.branchName || '' })
        } else {
          for (const s of schedules) {
            items.push({ classId: c.id, code: c.code || '', name: c.name || '', dayOfWeek: Number(s.dayOfWeek), startTime: s.startTime || '', endTime: s.endTime || '', branchName: s.branch?.name || c.branchName || '' })
          }
        }
        return items
      })
      setAddClasses(classes)
    } finally {
      setAddLoading(false)
    }
  }, [])

  useEffect(() => { if (addUserId) loadAddClasses(addUserId) }, [addUserId, loadAddClasses])

  const loadMissingDates = useCallback(async () => {
    if (!addUserId || !addSelectedClassId) { setAddMissingDates([]); return }
    const classSchedules = addClasses.filter(c => c.classId === addSelectedClassId && c.dayOfWeek >= 0)
    if (classSchedules.length === 0) { setAddMissingDates([]); return }

    const existingDates = new Set<string>()
    const attResponse = await attendanceService.getAdminAllPairs({ userId: addUserId, month: selectedMonth, year: selectedYear, pageSize: 500 })
    if (attResponse.success && attResponse.data?.items) {
      for (const p of attResponse.data.items) {
        const dt = new Date(p.checkInAt)
        const vnTime = new Date(dt.getTime() + 7 * 60 * 60 * 1000)
        existingDates.add(`${vnTime.getUTCFullYear()}-${String(vnTime.getUTCMonth() + 1).padStart(2, '0')}-${String(vnTime.getUTCDate()).padStart(2, '0')}`)
      }
    }

    const startDate = new Date(selectedYear, selectedMonth - 1, 1)
    const today = new Date()
    const todayVN = new Date(today.getTime() + 7 * 60 * 60 * 1000)
    const todayDateOnly = new Date(todayVN.getUTCFullYear(), todayVN.getUTCMonth(), todayVN.getUTCDate())
    const monthEnd = new Date(selectedYear, selectedMonth, 0)
    const endDate = todayDateOnly <= monthEnd ? todayDateOnly : monthEnd
    const missing: MissingDateItem[] = []

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay()
      const matched = classSchedules.find(c => c.dayOfWeek === dow)
      if (!matched) continue
      const dateStr = toLocalDateString(d)
      if (existingDates.has(dateStr)) continue
      missing.push({ date: dateStr, dayOfWeek: dow, classId: matched.classId, className: matched.name, startTime: matched.startTime, endTime: matched.endTime, branchName: matched.branchName, checkInTime: matched.startTime || '08:00', checkOutTime: matched.endTime || '10:00' })
    }
    setAddMissingDates(missing)
    setAddSelectedDates(new Set(missing.map(m => m.date)))
  }, [addUserId, addSelectedClassId, addClasses, selectedMonth, selectedYear])

  useEffect(() => { if (addUserId && addSelectedClassId) loadMissingDates() }, [addUserId, addSelectedClassId, loadMissingDates])

  const toggleAddDate = (date: string) => {
    setAddSelectedDates(prev => { const next = new Set(prev); if (next.has(date)) next.delete(date); else next.add(date); return next })
  }

  const toggleAddAll = () => {
    if (addSelectedDates.size === addMissingDates.length) setAddSelectedDates(new Set())
    else setAddSelectedDates(new Set(addMissingDates.map(m => m.date)))
  }

  const handleSaveAdd = async () => {
    if (!addUserId || addSelectedDates.size === 0) return
    setAddSaving(true)
    try {
      const items: { classId?: string; userId: string; occurredAt: string; attendanceType: number; status: number; notes: string }[] = []
      for (const item of addMissingDates.filter(m => addSelectedDates.has(m.date))) {
        const ciTime = item.checkInTime.length > 5 ? item.checkInTime.slice(0, 5) : item.checkInTime
        const coTime = item.checkOutTime.length > 5 ? item.checkOutTime.slice(0, 5) : item.checkOutTime
        items.push({ classId: item.classId, userId: addUserId, occurredAt: `${item.date}T${ciTime}:00+07:00`, attendanceType: 0, status: 0, notes: `Thêm bởi Admin - ${item.className}` })
        items.push({ classId: item.classId, userId: addUserId, occurredAt: `${item.date}T${coTime}:00+07:00`, attendanceType: 1, status: 0, notes: `Thêm bởi Admin - ${item.className}` })
      }
      const result = await attendanceService.createBulkManualAttendance({ items })
      if (result.success) {
        showNotification(result.message || `Đã thêm thành công`, 'success')
      } else {
        showNotification(result.message || 'Thất bại', 'error')
      }
      setAddOpen(false)
      loadPairs()
    } finally {
      setAddSaving(false)
    }
  }

  const handleSelectAllPayrollUsers = (checked: boolean) => {
    if (checked) setSelectedUserIds(new Set(pairs.map(p => p.userId)))
    else setSelectedUserIds(new Set())
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setGenerateResult(null)
    try {
      const userIds = selectedUserIds.size > 0 ? Array.from(selectedUserIds) : undefined
      const response = await attendanceService.generateAttendanceReport({ userIds, month: dialogMonth, year: dialogYear, sendEmail })
      setGenerateResult(response)
      if (response.success) loadReportHistory()
    } finally {
      setGenerating(false)
    }
  }

  const validPairs = pairs.filter(p => p.isValid)
  const invalidPairs = pairs.filter(p => !p.isValid)
  const totalDuration = validPairs.reduce((sum, p) => sum + p.durationMinutes, 0)

  const addSelectedClassName = useMemo(() => {
    if (!addSelectedClassId) return ''
    const cls = addClasses.find(c => c.classId === addSelectedClassId)
    return cls ? cls.code : ''
  }, [addSelectedClassId, addClasses])

  const uniqueAddClasses = useMemo(() => {
    const map = new Map<string, ClassOption>()
    for (const c of addClasses) { if (c.dayOfWeek >= 0 && !map.has(c.classId)) map.set(c.classId, c) }
    return Array.from(map.values())
  }, [addClasses])

  return (
    <>
      <Box className='flex flex-col gap-6'>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label='Dữ liệu chấm công' />
          <Tab label='Lịch sử bảng lương' />
        </Tabs>

        {activeTab === 0 && (
          <Card>
            <CardHeader
              title={isCoach ? 'Lịch sử chấm công của tôi' : 'Quản lý chấm công'}
              subheader={isCoach ? 'Xem lịch sử chấm công cá nhân.' : 'Danh sách lượt chấm công ghép cặp (vào/ra) của huấn luyện viên.'}
              action={!isCoach && (
                <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={openAdd}>Thêm lượt chấm công</Button>
              )}
            />
            <CardContent>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Tháng</InputLabel>
                    <Select value={selectedMonth} label='Tháng' onChange={e => { setSelectedMonth(Number(e.target.value)); setPage(0) }}>
                      {MONTHS.map(m => <MenuItem key={m} value={m}>Tháng {m}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Năm</InputLabel>
                    <Select value={selectedYear} label='Năm' onChange={e => { setSelectedYear(Number(e.target.value)); setPage(0) }}>
                      {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                {!isCoach && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth size='small'>
                      <InputLabel>Huấn luyện viên</InputLabel>
                      <Select value={selectedUserId} label='Huấn luyện viên' onChange={e => { setSelectedUserId(e.target.value); setPage(0) }}>
                        <MenuItem value=''>Tất cả</MenuItem>
                        {userOptions.map(u => <MenuItem key={u.id} value={u.id}>{u.fullName}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </Grid>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Card variant='outlined'>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant='caption' color='text.secondary'>Tổng lượt</Typography>
                      <Typography variant='h5'>{totalCount}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Card variant='outlined'>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant='caption' color='text.secondary'>Hợp lệ</Typography>
                      <Typography variant='h5' color='success.main'>{validPairs.length}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Card variant='outlined'>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant='caption' color='text.secondary'>Không hợp lệ</Typography>
                      <Typography variant='h5' color='error.main'>{invalidPairs.length}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Card variant='outlined'>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant='caption' color='text.secondary'>Tổng giờ (phút)</Typography>
                      <Typography variant='h5' color='info.main'>{totalDuration}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {loading ? (
                <Box className='flex items-center justify-center py-10'><CircularProgress size={30} /></Box>
              ) : (
                <div className='overflow-x-auto'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>STT</TableCell>
                        <TableCell>Huấn luyện viên</TableCell>
                        <TableCell>Ngày</TableCell>
                        <TableCell>Lớp</TableCell>
                        <TableCell>Vào</TableCell>
                        <TableCell>Cơ sở vào</TableCell>
                        <TableCell>Ra</TableCell>
                        <TableCell>Cơ sở ra</TableCell>
                        <TableCell align='center'>Thời gian</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell align='center'>Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pairs.map((pair, index) => (
                        <TableRow key={pair.id} hover>
                          <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                          <TableCell><Typography fontWeight={500}>{pair.userName}</Typography></TableCell>
                          <TableCell>
                            <Typography variant='body2'>
                              {new Date(pair.checkInAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][new Date(pair.checkInAt).getDay()]}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {pair.classCode ? (
                              <Chip label={`${pair.classCode}`} size='small' variant='tonal' color='primary' />
                            ) : (
                              <Typography variant='body2' color='text.secondary'>-</Typography>
                            )}
                          </TableCell>
                          <TableCell>{formatDateTimeVN(pair.checkInAt)}</TableCell>
                          <TableCell><Typography variant='body2' color='text.secondary'>{pair.checkInBranchName || '-'}</Typography></TableCell>
                          <TableCell>
                            {pair.checkOutAt ? formatDateTimeVN(pair.checkOutAt) : <Typography variant='body2' color='error'>Chưa ra</Typography>}
                          </TableCell>
                          <TableCell><Typography variant='body2' color='text.secondary'>{pair.checkOutBranchName || '-'}</Typography></TableCell>
                          <TableCell align='center'>
                            {pair.checkOutAt ? (
                              <Chip label={`${pair.durationMinutes} phút`} size='small' variant='tonal'
                                color={pair.durationMinutes >= 30 ? 'success' : 'warning'} />
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip label={pair.isValid ? 'Hợp lệ' : 'Không hợp lệ'} color={pair.isValid ? 'success' : 'error'} size='small' variant='tonal' />
                            {!pair.isValid && pair.invalidReason && (
                              <Tooltip title={pair.invalidReason}>
                                <IconButton size='small'><i className='ri-error-warning-line' style={{ color: 'var(--mui-palette-error-main)' }} /></IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell align='center'>
                            <Stack direction='row' spacing={0.5} justifyContent='center'>
                              <Tooltip title='Chỉnh sửa giờ vào'>
                                <IconButton size='small' color='primary' onClick={() => openEdit(pair)}><i className='ri-edit-line' /></IconButton>
                              </Tooltip>
                              <Tooltip title='Hủy lượt chấm công'>
                                <IconButton size='small' color='error' onClick={() => setCancelTarget(pair)}><i className='ri-delete-bin-line' /></IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {pairs.length === 0 && (
                        <TableRow><TableCell colSpan={11} align='center'><Typography color='text.secondary'>Không có dữ liệu chấm công trong tháng này.</Typography></TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <TablePagination component='div' count={totalCount} page={page} onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage} onRowsPerPageChange={e => { setRowsPerPage(Number(e.target.value)); setPage(0) }}
                    rowsPerPageOptions={[10, 20, 50, 100]} labelRowsPerPage='Dòng/trang' labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 1 && (
          <Card>
            <CardHeader title='Lịch sử bảng lương đã tạo' subheader='Các bảng lương đã tạo trước đó, có thể tải về để xem chi tiết.'
              action={<Button variant='contained' onClick={() => setDialogOpen(true)}>Tạo bảng lương</Button>} />
            <CardContent>
              {loadingReports ? (
                <Box className='flex items-center justify-center py-10'><CircularProgress size={30} /></Box>
              ) : reportHistory.length === 0 ? (
                <Alert severity='info'>Chưa có bảng lương nào được tạo.</Alert>
              ) : (
                <div className='overflow-x-auto'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tháng/Năm</TableCell>
                        <TableCell>HLV</TableCell>
                        <TableCell>Người tạo</TableCell>
                        <TableCell>Ngày tạo</TableCell>
                        <TableCell align='center'>Tải về</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportHistory.slice(reportPage * reportRowsPerPage, (reportPage + 1) * reportRowsPerPage).map((report: any) => (
                        <TableRow key={report.id} hover sx={{ cursor: 'pointer' }} onClick={() => { setSelectedReport(report); setReportDetailOpen(true) }}>
                          <TableCell><Typography fontWeight={500}>Tháng {report.month}/{report.year}</Typography></TableCell>
                          <TableCell>{report.instructorNames || '-'}</TableCell>
                          <TableCell>{report.createdByUserName || 'Hệ thống'}</TableCell>
                          <TableCell>{formatDateTimeVN(report.createdAt)}</TableCell>
                          <TableCell align='center'>
                            <Button size='small' variant='outlined' startIcon={<i className='ri-download-line' />}
                              onClick={(e) => { e.stopPropagation(); handleDownloadReport(report.id, report.fileName) }}>Tải về</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination component='div' count={reportHistory.length} page={reportPage} onPageChange={(_, newPage) => setReportPage(newPage)}
                    rowsPerPage={reportRowsPerPage} onRowsPerPageChange={e => { setReportRowsPerPage(Number(e.target.value)); setReportPage(0) }}
                    rowsPerPageOptions={[5, 10, 25, 50]} labelRowsPerPage='Dòng/trang' labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`} />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Dialog chỉnh sửa giờ vào */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Chỉnh sửa thời gian chấm công</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {editPair && (
              <>
                <Typography variant='body2'><strong>HLV:</strong> {editPair.userName}</Typography>
                <Typography variant='body2'><strong>Ngày:</strong> {new Date(editPair.checkInAt).toLocaleDateString('vi-VN')}</Typography>
              </>
            )}
            <TextField label='Thời gian vào mới' type='datetime-local' fullWidth value={editDateTime}
              onChange={e => setEditDateTime(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Hủy</Button>
          <Button variant='contained' onClick={handleSaveEdit} disabled={saving || !editDateTime}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xác nhận hủy */}
      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Hủy lượt chấm công</DialogTitle>
        <DialogContent>
          {cancelTarget && (
            <Typography>Bạn có chắc muốn hủy lượt chấm công vào lúc <strong>{formatDateTimeVN(cancelTarget.checkInAt)}</strong> của <strong>{cancelTarget.userName}</strong>?</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelTarget(null)} disabled={cancelling}>Không</Button>
          <Button variant='contained' color='error' onClick={confirmCancel} disabled={cancelling}
            startIcon={cancelling ? <CircularProgress size={16} /> : undefined}>{cancelling ? 'Đang hủy...' : 'Hủy'}</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog thêm lượt chấm công */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>
          <Typography variant='h6'>Thêm lượt chấm công</Typography>
          <Typography variant='body2' color='text.secondary'>Chọn HLV và lớp, hiển thị các ngày đã qua trong tháng {selectedMonth}/{selectedYear} chưa có chấm công.</Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Huấn luyện viên</InputLabel>
                  <Select value={addUserId} label='Huấn luyện viên'
                    onChange={e => { setAddUserId(e.target.value); setAddSelectedClassId(''); setAddMissingDates([]); setAddSelectedDates(new Set()) }}>
                    {userOptions.map(u => <MenuItem key={u.id} value={u.id}>{u.fullName}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size='small' disabled={!addUserId || addLoading}>
                  <InputLabel>Lớp học</InputLabel>
                  <Select value={addSelectedClassId} label='Lớp học'
                    onChange={e => { setAddSelectedClassId(e.target.value); setAddMissingDates([]); setAddSelectedDates(new Set()) }}>
                    {uniqueAddClasses.map(c => <MenuItem key={c.classId} value={c.classId}>{c.code}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            {addLoading && <Box className='flex items-center justify-center py-4'><CircularProgress size={24} /><Typography variant='body2' sx={{ ml: 1 }}>Đang tải phân công lớp...</Typography></Box>}
            {!addLoading && addUserId && addClasses.length === 0 && <Alert severity='info'>HLV này chưa được phân công lớp nào.</Alert>}
            {!addLoading && addUserId && addClasses.length > 0 && !addSelectedClassId && <Alert severity='info'>Vui lòng chọn lớp để xem ngày chưa chấm công.</Alert>}
            {addSelectedClassId && addMissingDates.length > 0 && (
              <>
                <Alert severity='warning'>Có <strong>{addMissingDates.length}</strong> ngày chưa chấm công trong tháng {selectedMonth}/{selectedYear} cho lớp <strong>{addSelectedClassName}</strong>.</Alert>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant='subtitle2' fontWeight={600}>Chọn ngày ({addSelectedDates.size}/{addMissingDates.length})</Typography>
                  <Button size='small' onClick={toggleAddAll}>{addSelectedDates.size === addMissingDates.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</Button>
                </Box>
                <Box sx={{ maxHeight: 400, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell padding='checkbox'><input type='checkbox' checked={addSelectedDates.size === addMissingDates.length && addMissingDates.length > 0} onChange={toggleAddAll} /></TableCell>
                        <TableCell>Ngày</TableCell><TableCell>Thứ</TableCell><TableCell>Giờ vào</TableCell><TableCell>Giờ ra</TableCell><TableCell>Cơ sở</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {addMissingDates.map(item => (
                        <TableRow key={item.date} hover>
                          <TableCell padding='checkbox'><input type='checkbox' checked={addSelectedDates.has(item.date)} onChange={() => toggleAddDate(item.date)} /></TableCell>
                          <TableCell><Typography fontWeight={500}>{new Date(item.date + 'T00:00:00').toLocaleDateString('vi-VN')}</Typography></TableCell>
                          <TableCell><Chip label={WEEKDAY_LABELS[item.dayOfWeek]} size='small' variant='tonal' /></TableCell>
                          <TableCell>{item.checkInTime}</TableCell><TableCell>{item.checkOutTime}</TableCell>
                          <TableCell><Typography variant='body2' color='text.secondary'>{item.branchName || '-'}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </>
            )}
            {addSelectedClassId && addMissingDates.length === 0 && !addLoading && <Alert severity='success'>Tất cả các ngày trong tháng đã có chấm công.</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)} disabled={addSaving}>Đóng</Button>
          <Button variant='contained' onClick={handleSaveAdd} disabled={addSaving || addSelectedDates.size === 0}
            startIcon={addSaving ? <CircularProgress size={16} /> : undefined}>{addSaving ? 'Đang thêm...' : `Thêm ${addSelectedDates.size} lượt chấm công`}</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog tạo bảng lương */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Tạo bảng lương</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth><InputLabel>Tháng</InputLabel>
                  <Select value={dialogMonth} label='Tháng' onChange={e => setDialogMonth(Number(e.target.value))}>{MONTHS.map(m => <MenuItem key={m} value={m}>Tháng {m}</MenuItem>)}</Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth><InputLabel>Năm</InputLabel>
                  <Select value={dialogYear} label='Năm' onChange={e => setDialogYear(Number(e.target.value))}>{YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}</Select>
                </FormControl>
              </Grid>
            </Grid>
            <Typography variant='subtitle2' fontWeight={600}>Chọn huấn luyện viên ({pairs.length} có dữ liệu trên trang)</Typography>
            {pairs.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input type='checkbox' checked={selectedUserIds.size === pairs.length} onChange={e => handleSelectAllPayrollUsers(e.target.checked)} />
                <Typography variant='body2'>Chọn tất cả ({pairs.length})</Typography>
              </Box>
            )}
            <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              {pairs.length === 0 ? <Alert severity='info' sx={{ m: 1 }}>Không có dữ liệu.</Alert> : (
                <Stack spacing={0}>
                  {pairs.filter((p, i, arr) => arr.findIndex(x => x.userId === p.userId) === i).map(pair => (
                    <Box key={pair.userId} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, borderBottom: 1, borderColor: 'divider' }}>
                      <input type='checkbox' checked={selectedUserIds.has(pair.userId)}
                        onChange={e => { const next = new Set(selectedUserIds); if (e.target.checked) next.add(pair.userId); else next.delete(pair.userId); setSelectedUserIds(next) }} />
                      <Typography variant='body2' fontWeight={500}>{pair.userName}</Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input type='checkbox' checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />
              <Typography variant='body2'>Gửi email báo cáo cho huấn luyện viên được chọn</Typography>
            </Box>
            {generateResult && (
              <Alert severity={generateResult.success ? 'success' : 'error'}>{generateResult.message}
                {generateResult.data?.items && <Box sx={{ mt: 1 }}>{generateResult.data.items.map((item: any) => <Typography key={item.userId} variant='body2'>{item.userName}: {item.emailSent ? 'Đã gửi email' : 'Không gửi email'}{item.emailError && ` (${item.emailError})`}</Typography>)}</Box>}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={generating}>Đóng</Button>
          <Button variant='contained' onClick={handleGenerate} disabled={generating} startIcon={generating ? <CircularProgress size={16} /> : undefined}>{generating ? 'Đang tạo...' : 'Tạo bảng lương'}</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog chi tiết báo cáo */}
      <Dialog open={reportDetailOpen} onClose={() => setReportDetailOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Chi tiết bảng lương</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 1 }}>
                <Typography variant='body2' color='text.secondary'>Tháng/Năm:</Typography>
                <Typography variant='body2' fontWeight={500}>Tháng {selectedReport.month}/{selectedReport.year}</Typography>
                <Typography variant='body2' color='text.secondary'>HLV:</Typography>
                <Typography variant='body2' fontWeight={500}>{selectedReport.instructorNames || '-'}</Typography>
                <Typography variant='body2' color='text.secondary'>Người tạo:</Typography>
                <Typography variant='body2' fontWeight={500}>{selectedReport.createdByUserName || 'Hệ thống'}</Typography>
                <Typography variant='body2' color='text.secondary'>Ngày tạo:</Typography>
                <Typography variant='body2' fontWeight={500}>{formatDateTimeVN(selectedReport.createdAt)}</Typography>
                <Typography variant='body2' color='text.secondary'>File:</Typography>
                <Typography variant='body2' fontWeight={500}>{selectedReport.fileName}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDetailOpen(false)}>Đóng</Button>
          {selectedReport && <Button variant='contained' startIcon={<i className='ri-download-line' />}
            onClick={() => handleDownloadReport(selectedReport.id, selectedReport.fileName)}>Tải về</Button>}
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AdminAttendanceHistoryView
