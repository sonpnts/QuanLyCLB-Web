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
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'

import attendanceService from '@/services/attendanceService'
import userService from '@/services/userService'
import classService from '@/services/classService'
import { formatDateTimeVN, toLocalDateString } from '@/utils/dateTime'
import { useNotification } from '@/contexts/notificationContext'
import { hasCoachRole } from '@/utils/roleUtils'
import { useAuth } from '@/contexts/authContext'

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const getDefaultFromDate = () => {
  const d = new Date()
  d.setMonth(d.getMonth() - 2)
  return toLocalDateString(d)
}

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
  const [fromDate, setFromDate] = useState<string>(getDefaultFromDate())
  const [toDate, setToDate] = useState<string>(toLocalDateString(new Date()))
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)

  const [pairs, setPairs] = useState<PairRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const [userOptions, setUserOptions] = useState<UserOption[]>([])

  const [editOpen, setEditOpen] = useState(false)
  const [editPair, setEditPair] = useState<PairRecord | null>(null)
  const [editCheckInAt, setEditCheckInAt] = useState('')
  const [editCheckOutAt, setEditCheckOutAt] = useState('')
  const [editCheckInBranchId, setEditCheckInBranchId] = useState('')
  const [editCheckOutBranchId, setEditCheckOutBranchId] = useState('')
  const [editCheckInClassId, setEditCheckInClassId] = useState('')
  const [editCheckOutClassId, setEditCheckOutClassId] = useState('')
  const [editClasses, setEditClasses] = useState<{ id: string; code: string; name: string; branchId: string }[]>([])
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
  const [reportExcelData, setReportExcelData] = useState<{ sheets: string[]; data: Record<string, any[][]> } | null>(null)
  const [reportActiveSheet, setReportActiveSheet] = useState(0)
  const [loadingExcel, setLoadingExcel] = useState(false)

  const [allUsers, setAllUsers] = useState<UserOption[]>([])

  const dateRangeInvalid = !fromDate || !toDate || fromDate > toDate

  const loadPairs = useCallback(async () => {
    if (!fromDate || !toDate || fromDate > toDate) {
      setPairs([])
      setTotalCount(0)
      return
    }
    setLoading(true)
    try {
      const response = await attendanceService.getAdminAllPairs({
        fromDate,
        toDate,
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
  }, [fromDate, toDate, selectedUserId, page, rowsPerPage])

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
      const response = await attendanceService.getReportHistory()
      const reports = response.success && response.data ? response.data : []
      reports.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setReportHistory(reports)
    } finally {
      setLoadingReports(false)
    }
  }, [])

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

  const handlePreviewReport = async (report: any) => {
    setSelectedReport(report)
    setReportDetailOpen(true)
    setLoadingExcel(true)
    setReportExcelData(null)
    setReportActiveSheet(0)
    try {
      const blob = await attendanceService.downloadReport(report.id)
      if (blob) {
        const XLSX = await import('xlsx')
        const arrayBuffer = await blob.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const data: Record<string, any[][]> = {}
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName]
          data[sheetName] = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
        }
        setReportExcelData({ sheets: workbook.SheetNames, data })
      }
    } catch {
      setReportExcelData(null)
    } finally {
      setLoadingExcel(false)
    }
  }

  const openEdit = async (pair: PairRecord) => {
    setEditPair(pair)

    const toLocalInput = (iso: string) => {
      const dt = new Date(iso)
      const vnTime = new Date(dt.getTime() + 7 * 60 * 60 * 1000)
      const y = vnTime.getUTCFullYear()
      const m = String(vnTime.getUTCMonth() + 1).padStart(2, '0')
      const d = String(vnTime.getUTCDate()).padStart(2, '0')
      const hh = String(vnTime.getUTCHours()).padStart(2, '0')
      const mm = String(vnTime.getUTCMinutes()).padStart(2, '0')
      return `${y}-${m}-${d}T${hh}:${mm}`
    }

    setEditCheckInAt(toLocalInput(pair.checkInAt))
    setEditCheckOutAt(pair.checkOutAt ? toLocalInput(pair.checkOutAt) : '')
    setEditCheckInBranchId('')
    setEditCheckOutBranchId('')
    setEditCheckInClassId('')
    setEditCheckOutClassId('')

    try {
      const classesRes = pair.userId
        ? await classService.getClassesByUserId(pair.userId)
        : { success: true, data: [] }

      const classList = (classesRes.data || []).map((c: any) => ({ id: c.id, code: c.code, name: c.name, branchId: c.branchId || '' }))
      setEditClasses(classList)
    } catch {
      setEditClasses([])
    }

    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editPair || !editCheckInAt) return
    setSaving(true)
    try {
      const result = await attendanceService.updateAttendanceTime({
        id: editPair.id,
        newCheckedInAt: `${editCheckInAt}:00+07:00`,
        newCheckedOutAt: editCheckOutAt ? `${editCheckOutAt}:00+07:00` : null,
        newCheckInBranchId: editCheckInBranchId || null,
        newCheckInClassId: editCheckInClassId || null,
        newCheckOutBranchId: editCheckOutBranchId || null,
        newCheckOutClassId: editCheckOutClassId || null
      })
      if (result.success) {
        showNotification('Đã cập nhật chấm công', 'success')
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
    if (!addUserId || !addSelectedClassId || !fromDate || !toDate || fromDate > toDate) { setAddMissingDates([]); return }
    const classSchedules = addClasses.filter(c => c.classId === addSelectedClassId && c.dayOfWeek >= 0)
    if (classSchedules.length === 0) { setAddMissingDates([]); return }

    const existingDates = new Set<string>()
    const attResponse = await attendanceService.getAdminAllPairs({ userId: addUserId, fromDate, toDate, pageSize: 500 })
    if (attResponse.success && attResponse.data?.items) {
      for (const p of attResponse.data.items) {
        const dt = new Date(p.checkInAt)
        const vnTime = new Date(dt.getTime() + 7 * 60 * 60 * 1000)
        existingDates.add(`${vnTime.getUTCFullYear()}-${String(vnTime.getUTCMonth() + 1).padStart(2, '0')}-${String(vnTime.getUTCDate()).padStart(2, '0')}`)
      }
    }

    const startDate = new Date(fromDate + 'T00:00:00')
    const today = new Date()
    const todayVN = new Date(today.getTime() + 7 * 60 * 60 * 1000)
    const todayDateOnly = new Date(todayVN.getUTCFullYear(), todayVN.getUTCMonth(), todayVN.getUTCDate())
    const rangeEnd = new Date(toDate + 'T00:00:00')
    const endDate = todayDateOnly <= rangeEnd ? todayDateOnly : rangeEnd
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
  }, [addUserId, addSelectedClassId, addClasses, fromDate, toDate])

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

  const loadPayrollUsers = useCallback(async (month: number, year: number) => {
    try {
      const params: { month?: number; year?: number; fromDate?: string; toDate?: string; pageNumber: number; pageSize: number } = { pageNumber: 1, pageSize: 1000 }

      // Kỳ lương có thể theo ngày tùy chỉnh (vd: 26 tháng trước - 25 tháng này) nên ưu tiên lấy theo khoảng ngày của kỳ lương
      const periodRes = await attendanceService.getPayrollPeriod({ month, year })
      const period = periodRes.success ? periodRes.data : null
      if (period?.fromDate && period?.toDate) {
        params.fromDate = String(period.fromDate).slice(0, 10)
        params.toDate = String(period.toDate).slice(0, 10)
      } else {
        params.month = month
        params.year = year
      }

      const response = await attendanceService.getAdminAllPairs(params)
      if (response.success && response.data) {
        const allPairs = response.data.items || []
        const uniqueUsers = new Map<string, string>()
        for (const p of allPairs) {
          if (!uniqueUsers.has(p.userId)) uniqueUsers.set(p.userId, p.userName)
        }
        const users = Array.from(uniqueUsers.entries()).map(([id, fullName]) => ({ id, fullName }))
        setAllUsers(users)
        setSelectedUserIds(prev => new Set([...prev].filter(id => users.some(u => u.id === id))))
      } else {
        setAllUsers([])
        setSelectedUserIds(new Set())
      }
    } catch {
      setAllUsers([])
      setSelectedUserIds(new Set())
    }
  }, [])

  const openPayrollDialog = () => {
    setDialogMonth(currentMonth)
    setDialogYear(currentYear)
    setSelectedUserIds(new Set())
    setGenerateResult(null)
    setDialogOpen(true)
  }

  useEffect(() => {
    if (dialogOpen) loadPayrollUsers(dialogMonth, dialogYear)
  }, [dialogOpen, dialogMonth, dialogYear, loadPayrollUsers])

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
                  <TextField fullWidth size='small' type='date' label='Từ ngày' value={fromDate}
                    onChange={e => { setFromDate(e.target.value); setPage(0) }}
                    InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField fullWidth size='small' type='date' label='Đến ngày' value={toDate}
                    onChange={e => { setToDate(e.target.value); setPage(0) }}
                    InputLabelProps={{ shrink: true }}
                    error={dateRangeInvalid}
                    helperText={dateRangeInvalid ? 'Khoảng ngày không hợp lệ' : ''} />
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
                        <TableRow><TableCell colSpan={11} align='center'><Typography color='text.secondary'>Không có dữ liệu chấm công trong khoảng thời gian này.</Typography></TableCell></TableRow>
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
            <CardHeader title='Lịch sử bảng lương đã tạo' subheader='Các bảng lương đã tạo trước đó, có thể xem trực tiếp hoặc tải về.'
              action={<Button variant='contained' onClick={openPayrollDialog}>Tạo bảng lương</Button>} />
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
                        <TableRow key={report.id} hover sx={{ cursor: 'pointer' }} onClick={() => handlePreviewReport(report)}>
                          <TableCell><Typography fontWeight={500}>Tháng {report.month}/{report.year}</Typography></TableCell>
                          <TableCell>{report.instructorNames || '-'}</TableCell>
                          <TableCell>{report.createdByUserName || 'Hệ thống'}</TableCell>
                          <TableCell>{formatDateTimeVN(report.createdAt)}</TableCell>
                          <TableCell align='center'>
                            <Stack direction='row' spacing={0.5} justifyContent='center'>
                              <Tooltip title='Xem bảng lương'>
                                <IconButton size='small' color='primary' onClick={(e) => { e.stopPropagation(); handlePreviewReport(report) }}>
                                  <i className='ri-eye-line' />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title='Tải về'>
                                <IconButton size='small' onClick={(e) => { e.stopPropagation(); handleDownloadReport(report.id, report.fileName) }}>
                                  <i className='ri-download-line' />
                                </IconButton>
                              </Tooltip>
                            </Stack>
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

      {/* Dialog chỉnh sửa chấm công */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Chỉnh sửa chấm công</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {editPair && (
              <>
                <Typography variant='body2'><strong>HLV:</strong> {editPair.userName}</Typography>
                <Typography variant='body2'><strong>Ngày:</strong> {new Date(editPair.checkInAt).toLocaleDateString('vi-VN')}</Typography>
              </>
            )}
            <TextField label='Giờ vào' type='datetime-local' fullWidth value={editCheckInAt}
              onChange={e => setEditCheckInAt(e.target.value)} InputLabelProps={{ shrink: true }} />
            <FormControl fullWidth size='small'>
              <InputLabel>Lớp vào</InputLabel>
              <Select value={editCheckInClassId} label='Lớp vào'
                onChange={e => {
                  const classId = e.target.value
                  setEditCheckInClassId(classId)
                  if (classId) {
                    const matched = editClasses.find(c => c.id === classId)
                    if (matched?.branchId) setEditCheckInBranchId(matched.branchId)
                  }
                }}>
                <MenuItem value=''><em>Không đổi</em></MenuItem>
                {editClasses.map(c => <MenuItem key={c.id} value={c.id}>{c.code}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField label='Giờ ra' type='datetime-local' fullWidth value={editCheckOutAt}
              onChange={e => setEditCheckOutAt(e.target.value)} InputLabelProps={{ shrink: true }}
              helperText={!editPair?.checkOutAt ? 'Chưa có giờ ra - nhập để tạo mới' : ''} />
            <FormControl fullWidth size='small'>
              <InputLabel>Lớp ra</InputLabel>
              <Select value={editCheckOutClassId} label='Lớp ra'
                onChange={e => {
                  const classId = e.target.value
                  setEditCheckOutClassId(classId)
                  if (classId) {
                    const matched = editClasses.find(c => c.id === classId)
                    if (matched?.branchId) setEditCheckOutBranchId(matched.branchId)
                  }
                }}>
                <MenuItem value=''><em>Không đổi</em></MenuItem>
                {editClasses.map(c => <MenuItem key={c.id} value={c.id}>{c.code}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Hủy</Button>
          <Button variant='contained' onClick={handleSaveEdit} disabled={saving || !editCheckInAt}
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
          <Typography variant='body2' color='text.secondary'>Chọn HLV và lớp, hiển thị các ngày đã qua trong khoảng {fromDate.split('-').reverse().join('/')} - {toDate.split('-').reverse().join('/')} chưa có chấm công.</Typography>
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
                <Alert severity='warning'>Có <strong>{addMissingDates.length}</strong> ngày chưa chấm công trong khoảng {fromDate.split('-').reverse().join('/')} - {toDate.split('-').reverse().join('/')} cho lớp <strong>{addSelectedClassName}</strong>.</Alert>
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
            {addSelectedClassId && addMissingDates.length === 0 && !addLoading && <Alert severity='success'>Tất cả các ngày trong khoảng thời gian này đã có chấm công.</Alert>}
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
            <Typography variant='subtitle2' fontWeight={600}>Chọn huấn luyện viên ({allUsers.length} có dữ liệu)</Typography>
            {allUsers.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox checked={selectedUserIds.size === allUsers.length && allUsers.length > 0}
                  onChange={e => { if (e.target.checked) setSelectedUserIds(new Set(allUsers.map(u => u.id))); else setSelectedUserIds(new Set()) }} />
                <Typography variant='body2'>Chọn tất cả ({allUsers.length})</Typography>
              </Box>
            )}
            <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              {allUsers.length === 0 ? <Alert severity='info' sx={{ m: 1 }}>Không có dữ liệu.</Alert> : (
                <Stack spacing={0}>
                  {allUsers.map(user => (
                    <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, borderBottom: 1, borderColor: 'divider' }}>
                      <Checkbox checked={selectedUserIds.has(user.id)}
                        onChange={e => { const next = new Set(selectedUserIds); if (e.target.checked) next.add(user.id); else next.delete(user.id); setSelectedUserIds(next) }} />
                      <Typography variant='body2' fontWeight={500}>{user.fullName}</Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Checkbox checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} />
              <Typography variant='body2'>Gửi email kèm file chấm công riêng cho từng huấn luyện viên</Typography>
            </Box>
            <Alert severity='info'>
              Mỗi huấn luyện viên được tạo <strong>1 file chấm công riêng</strong>và chỉ gửi tới email của chính họ.
            </Alert>
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

      {/* Dialog chi tiết báo cáo - xem trực tiếp */}
      <Dialog open={reportDetailOpen} onClose={() => setReportDetailOpen(false)} maxWidth='xl' fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='h6'>
              {selectedReport ? `Bảng lương Tháng ${selectedReport.month}/${selectedReport.year}` : 'Chi tiết bảng lương'}
            </Typography>
            {selectedReport && (
              <Button size='small' variant='outlined' startIcon={<i className='ri-download-line' />}
                onClick={() => handleDownloadReport(selectedReport.id, selectedReport.fileName)}>Tải về</Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`Tháng ${selectedReport.month}/${selectedReport.year}`} color='primary' variant='tonal' />
                <Chip label={`HLV: ${selectedReport.instructorNames || '-'}`} variant='outlined' />
                <Chip label={`Người tạo: ${selectedReport.createdByUserName || 'Hệ thống'}`} variant='outlined' />
                <Chip label={`Ngày tạo: ${formatDateTimeVN(selectedReport.createdAt)}`} variant='outlined' />
              </Box>

              <Divider />

              {loadingExcel ? (
                <Box className='flex items-center justify-center py-10'>
                  <CircularProgress size={30} />
                  <Typography variant='body2' sx={{ ml: 2 }}>Đang tải dữ liệu...</Typography>
                </Box>
              ) : reportExcelData ? (
                <>
                  {reportExcelData.sheets.length > 1 && (
                    <Tabs value={reportActiveSheet} onChange={(_, v) => setReportActiveSheet(v)}>
                      {reportExcelData.sheets.map((name, idx) => (
                        <Tab key={idx} label={name} />
                      ))}
                    </Tabs>
                  )}
                  <Box sx={{ overflow: 'auto', maxHeight: '60vh', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Table size='small' stickyHeader>
                      <TableBody>
                        {(reportExcelData.data[reportExcelData.sheets[reportActiveSheet]] || []).map((row, rowIdx) => (
                          <TableRow key={rowIdx}>
                            {row.map((cell, cellIdx) => (
                              <TableCell key={cellIdx} sx={{ minWidth: 80, whiteSpace: 'nowrap' }}
                                style={rowIdx === 0 ? { fontWeight: 600, backgroundColor: '#f5f5f5' } : undefined}>
                                {cell != null ? String(cell) : ''}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </>
              ) : (
                <Alert severity='info'>Không thể tải dữ liệu file Excel.</Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDetailOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AdminAttendanceHistoryView
