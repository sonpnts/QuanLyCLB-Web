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
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import beltExamService from '@/services/beltExamService'
import classService from '@/services/classService'
import studentAttendanceService from '@/services/studentAttendanceService'
import studentService from '@/services/studentService'
import type { ExamRegistrationType, ExamSessionType } from '@/types/apps/beltExamTypes'
import type { ClassType } from '@/types/apps/classTypes'
import type { StudentType } from '@/types/apps/studentTypes'
import { exportToExcel } from '@/utils/exportToExcel'
import { hasPermission } from '@/utils/permissionUtils'
import { buildModulePermissionMap } from '@/utils/rbac'
import { hasAdminRole } from '@/utils/roleUtils'
import EditStudentDrawer from '@/views/apps/student/list/EditStudentDrawer'
import ViewStudentDrawer from '@/views/apps/student/list/ViewStudentDrawer'

const text = {
  title: 'Quản lý đăng ký thi cấp',
  subtitle: 'Theo dõi danh sách đăng ký, trạng thái đóng lệ phí và cấp đai dự thi của học viên',
  examSession: 'Kỳ thi',
  selectSession: 'Chọn kỳ thi để xem danh sách',
  class: 'Lớp',
  allClasses: 'Tất cả lớp',
  status: 'Trạng thái',
  all: 'Tất cả',
  pending: 'Chờ đóng lệ phí',
  approved: 'Đã đóng lệ phí',
  rejected: 'Đã loại',
  fee: 'Lệ phí',
  paid: 'Đã đóng',
  unpaid: 'Chưa đóng',
  search: 'Tìm học viên...',
  empty: 'Chưa có đăng ký thi cấp phù hợp với bộ lọc.',
  loadError: 'Không thể tải danh sách đăng ký thi cấp',
  student: 'Học viên',
  registerStatus: 'Trạng thái đăng ký',
  feePaid: 'Lệ phí thi',
  requiredFees: 'Phí bắt buộc',
  currentBelt: 'Cấp đai hiện tại',
  targetBelt: 'Cấp đai dự thi',
  registeredBy: 'Người đăng ký',
  noBelt: 'Chưa có',
  export: 'Xuất Excel',
  exportSuccess: 'Đã xuất danh sách đăng ký thi cấp.',
  selectPrompt: 'Không còn kỳ thi nào đang mở. Vui lòng chọn kỳ thi trong danh sách để xem đăng ký.',
  latestOpen: 'Đang mặc định kỳ mới nhất còn nhận đăng ký'
}

const statusLabels: Record<string, string> = {
  Pending: text.pending,
  Approved: text.approved,
  Rejected: text.rejected
}

const statusColors: Record<string, 'warning' | 'success' | 'error' | 'secondary'> = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error'
}

const hiddenDefaultStatuses = new Set(['Draft', 'Locked'])

const formatDateTime = (value?: string | null) => {
  if (!value) return ''

  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

type RegistrationSortField =
  | 'studentName'
  | 'examSessionName'
  | 'className'
  | 'status'
  | 'isFeePaid'
  | 'oneTimeFeesCompleted'
  | 'currentBeltLevelOrder'
  | 'targetBeltLevelOrder'
  | 'registeredByUserName'
  | 'createdAt'

type SortDirection = 'asc' | 'desc'

const compareText = (left?: string | null, right?: string | null) =>
  String(left || '').localeCompare(String(right || ''), 'vi', { sensitivity: 'base' })

const compareNumber = (left?: number | null, right?: number | null) => (left ?? -1) - (right ?? -1)

const compareBoolean = (left?: boolean, right?: boolean) => Number(left ?? false) - Number(right ?? false)

const compareDate = (left?: string | null, right?: string | null) =>
  new Date(left || 0).getTime() - new Date(right || 0).getTime()

const sortRegistrations = (
  rows: ExamRegistrationType[],
  sortBy: RegistrationSortField,
  sortDirection: SortDirection
) => {
  const sorted = [...rows].sort((left, right) => {
    switch (sortBy) {
      case 'studentName':
        return compareText(left.studentName, right.studentName)
      case 'examSessionName':
        return compareText(left.examSessionName, right.examSessionName)
      case 'className':
        return compareText(left.className, right.className)
      case 'status':
        return compareText(left.status, right.status)
      case 'isFeePaid':
        return compareBoolean(left.isFeePaid, right.isFeePaid) || compareDate(left.paidAt, right.paidAt)
      case 'oneTimeFeesCompleted':
        return compareBoolean(left.oneTimeFeesCompleted, right.oneTimeFeesCompleted)
      case 'currentBeltLevelOrder':
        return (
          compareNumber(left.currentBeltLevelOrder, right.currentBeltLevelOrder) ||
          compareText(left.currentBeltLevelName, right.currentBeltLevelName) ||
          compareText(left.studentName, right.studentName)
        )
      case 'targetBeltLevelOrder':
        return (
          compareNumber(left.targetBeltLevelOrder, right.targetBeltLevelOrder) ||
          compareText(left.targetBeltLevelName, right.targetBeltLevelName) ||
          compareText(left.studentName, right.studentName)
        )
      case 'registeredByUserName':
        return compareText(left.registeredByUserName, right.registeredByUserName)
      case 'createdAt':
        return compareDate(left.createdAt, right.createdAt)
      default:
        return 0
    }
  })

  return sortDirection === 'asc' ? sorted : sorted.reverse()
}

const getSessionSortTime = (session: ExamSessionType) =>
  new Date(session.registrationDeadline || session.examDate || session.createdAt).getTime()

const isSessionAvailableForDefault = (session: ExamSessionType) => {
  if (session.status !== 'Open') return false
  if (hiddenDefaultStatuses.has(session.status)) return false
  if (!session.registrationDeadline) return true

  return new Date(session.registrationDeadline).getTime() >= Date.now()
}

const BeltExamRegistrationsView = () => {
  const { showNotification } = useNotification()
  const { auth } = useAuth()
  const isAdmin = hasPermission(auth?.permissions, 'BeltExam.ManageAll') || hasAdminRole(auth?.roles)

  const studentPermissions = useMemo(
    () => buildModulePermissionMap(auth?.permissions, auth?.roles, 'Student'),
    [auth?.permissions, auth?.roles]
  )

  const [registrations, setRegistrations] = useState<ExamRegistrationType[]>([])
  const [sessions, setSessions] = useState<ExamSessionType[]>([])
  const [classes, setClasses] = useState<ClassType[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [examSessionId, setExamSessionId] = useState('')
  const [classId, setClassId] = useState('')
  const [status, setStatus] = useState('')
  const [feePaid, setFeePaid] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)
  const [viewStudentOpen, setViewStudentOpen] = useState(false)
  const [editStudentOpen, setEditStudentOpen] = useState(false)
  const [loadingStudent, setLoadingStudent] = useState(false)
  const [sortBy, setSortBy] = useState<RegistrationSortField>('currentBeltLevelOrder')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const openStudentDrawer = async (studentId: string) => {
    try {
      setLoadingStudent(true)
      const result = await studentService.getStudentById(studentId)

      if (result.success && result.data) {
        setSelectedStudent(result.data)

        if (studentPermissions.canUpdate) {
          setEditStudentOpen(true)
        } else {
          setViewStudentOpen(true)
        }
      } else {
        showNotification(result.message || 'Không thể tải thông tin học viên', 'error')
      }
    } finally {
      setLoadingStudent(false)
    }
  }

  const loadFilters = useCallback(async () => {
    const [sessionRes, classRes] = await Promise.all([
      beltExamService.getExamSessions(),
      isAdmin
        ? classService.getClasses({ isActive: true, pageSize: 1000 })
        : studentAttendanceService.getCoachClasses()
    ])

    if (sessionRes.success && sessionRes.data) {
      const sortedSessions = [...sessionRes.data].sort((a, b) => getSessionSortTime(b) - getSessionSortTime(a))

      setSessions(sortedSessions)
    }

    if (classRes.success && classRes.data) {
      const normalized = (classRes.data as any[]).map(item => ({
        id: item.id || item.classId,
        name: item.name || item.className
      }))

      setClasses(normalized as ClassType[])
    }
  }, [isAdmin])

  const loadRegistrations = useCallback(async () => {
    try {
      setLoading(true)

      if (!examSessionId) {
        setRegistrations([])

        return
      }

      const params: Record<string, any> = {
        pageSize: 1000,
        examSessionId
      }

      if (classId) params.classId = classId
      if (status) params.status = status
      if (feePaid) params.isFeePaid = feePaid === 'paid'
      if (keyword.trim()) params.keyword = keyword.trim()

      const result = await beltExamService.getExamRegistrations(params)

      if (result.success && result.data) {
        setRegistrations(result.data)
      } else {
        setRegistrations([])
        showNotification(result.message || text.loadError, 'error')
      }
    } finally {
      setLoading(false)
    }
  }, [classId, examSessionId, feePaid, keyword, showNotification, status])

  const handleStudentUpdated = (updated: StudentType) => {
    setSelectedStudent(updated)
  }

  useEffect(() => {
    loadFilters()
  }, [loadFilters])

  useEffect(() => {
    if (sessions.length === 0 || examSessionId) return

    const latestOpenSession = sessions.find(isSessionAvailableForDefault)

    if (latestOpenSession) {
      setExamSessionId(latestOpenSession.id)
    }
  }, [sessions, examSessionId])

  useEffect(() => {
    loadRegistrations()
  }, [loadRegistrations])

  useEffect(() => {
    setPage(0)
  }, [examSessionId, classId, status, feePaid, keyword])

  const handleSort = (field: RegistrationSortField) => {
    if (sortBy === field) {
      setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'))

      return
    }

    setSortBy(field)
    setSortDirection(field === 'currentBeltLevelOrder' ? 'desc' : 'asc')
  }

  const renderSortHeader = (label: string, field: RegistrationSortField) => (
    <TableSortLabel active={sortBy === field} direction={sortBy === field ? sortDirection : 'asc'} onClick={() => handleSort(field)}>
      {label}
    </TableSortLabel>
  )

  const sortedRegistrations = useMemo(
    () => sortRegistrations(registrations, sortBy, sortDirection),
    [registrations, sortBy, sortDirection]
  )

  const pagedRows = useMemo(
    () => sortedRegistrations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedRegistrations, page, rowsPerPage]
  )

  const latestOpenSession = useMemo(() => sessions.find(isSessionAvailableForDefault) || null, [sessions])

  const selectedSession = useMemo(
    () => sessions.find(session => session.id === examSessionId) || null,
    [sessions, examSessionId]
  )

  const handleExport = async () => {
    try {
      setExporting(true)

      exportToExcel({
        filename: `Dang-ky-thi-cap-${selectedSession?.name || 'Danh-sach'}`,
        sheetName: 'DangKyThiCap',
        columns: [
          { header: 'STT', accessor: 'stt', width: 8 },
          { header: 'Học viên', accessor: 'studentName', width: 28 },
          { header: 'Kỳ thi', accessor: 'examSessionName', width: 24 },
          { header: 'Lớp', accessor: 'className', width: 18 },
          { header: 'Trạng thái đăng ký', accessor: 'status', width: 18 },
          { header: 'Lệ phí thi', accessor: 'feePaid', width: 14 },
          { header: 'Phí bắt buộc', accessor: 'requiredFees', width: 18 },
          { header: 'Cấp đai hiện tại', accessor: 'currentBelt', width: 18 },
          { header: 'Số cấp đai hiện tại', accessor: 'currentBeltOrder', width: 18 },
          { header: 'Cấp đai dự thi', accessor: 'targetBelt', width: 18 },
          { header: 'Số cấp đai dự thi', accessor: 'targetBeltOrder', width: 18 },
          { header: 'Người đăng ký', accessor: 'registeredBy', width: 22 },
          { header: 'Thời gian đăng ký', accessor: 'createdAt', width: 20 }
        ],
        rows: sortedRegistrations.map((row, index) => ({
          stt: index + 1,
          studentName: row.studentName,
          examSessionName: row.examSessionName,
          className: row.className,
          status: statusLabels[row.status] || row.status,
          feePaid: row.isFeePaid ? text.paid : text.unpaid,
          requiredFees: row.oneTimeFeesCompleted ? 'Đã hoàn thành' : 'Chưa hoàn thành',
          currentBelt: row.currentBeltLevelName || text.noBelt,
          currentBeltOrder: row.currentBeltLevelOrder ?? '',
          targetBelt: row.targetBeltLevelName,
          targetBeltOrder: row.targetBeltLevelOrder ?? '',
          registeredBy: row.registeredByUserName || '-',
          createdAt: formatDateTime(row.createdAt)
        }))
      })

      showNotification(text.exportSuccess, 'success')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title={text.title}
        subheader={text.subtitle}
        action={
          <Button
            variant='outlined'
            size='small'
            startIcon={<i className='ri-file-excel-line' />}
            onClick={handleExport}
            disabled={!sortedRegistrations.length || exporting || !examSessionId}
          >
            {text.export}
          </Button>
        }
      />
      <CardContent>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>{text.examSession}</InputLabel>
              <Select value={examSessionId} label={text.examSession} onChange={e => setExamSessionId(e.target.value)}>
                <MenuItem value=''>{text.selectSession}</MenuItem>
                {sessions.map(session => (
                  <MenuItem key={session.id} value={session.id}>
                    {session.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>{text.class}</InputLabel>
              <Select value={classId} label={text.class} onChange={e => setClassId(e.target.value)}>
                <MenuItem value=''>{text.allClasses}</MenuItem>
                {classes.map(item => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>{text.status}</InputLabel>
              <Select value={status} label={text.status} onChange={e => setStatus(e.target.value)}>
                <MenuItem value=''>{text.all}</MenuItem>
                <MenuItem value='Pending'>{text.pending}</MenuItem>
                <MenuItem value='Approved'>{text.approved}</MenuItem>
                <MenuItem value='Rejected'>{text.rejected}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>{text.fee}</InputLabel>
              <Select value={feePaid} label={text.fee} onChange={e => setFeePaid(e.target.value)}>
                <MenuItem value=''>{text.all}</MenuItem>
                <MenuItem value='paid'>{text.paid}</MenuItem>
                <MenuItem value='unpaid'>{text.unpaid}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              fullWidth
              size='small'
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder={text.search}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='ri-search-line' />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>

        {!latestOpenSession && !examSessionId && (
          <Alert severity='info' sx={{ mt: 4 }}>
            {text.selectPrompt}
          </Alert>
        )}
        {latestOpenSession && examSessionId === latestOpenSession.id && (
          <Alert severity='success' sx={{ mt: 4 }}>
            {text.latestOpen}: <strong>{latestOpenSession.name}</strong>
          </Alert>
        )}
      </CardContent>

      {loading ? (
        <Box className='flex justify-center p-8'>
          <CircularProgress />
        </Box>
      ) : !examSessionId ? (
        <CardContent>
          <Alert severity='info'>{text.selectPrompt}</Alert>
        </CardContent>
      ) : sortedRegistrations.length === 0 ? (
        <CardContent>
          <Alert severity='info'>{text.empty}</Alert>
        </CardContent>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{renderSortHeader(text.student, 'studentName')}</TableCell>
                  {/*<TableCell>{renderSortHeader(text.examSession, 'examSessionName')}</TableCell>*/}
                  <TableCell>{renderSortHeader(text.class, 'className')}</TableCell>
                  <TableCell>{renderSortHeader(text.registerStatus, 'status')}</TableCell>
                  <TableCell>{renderSortHeader(text.feePaid, 'isFeePaid')}</TableCell>
                  <TableCell>{renderSortHeader(text.requiredFees, 'oneTimeFeesCompleted')}</TableCell>
                  <TableCell>{renderSortHeader(text.currentBelt, 'currentBeltLevelOrder')}</TableCell>
                  <TableCell>{renderSortHeader(text.targetBelt, 'targetBeltLevelOrder')}</TableCell>
                  <TableCell>{renderSortHeader(text.registeredBy, 'registeredByUserName')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedRows.map(row => (
                  <TableRow key={row.id} hover onClick={() => openStudentDrawer(row.studentId)} sx={{ cursor: 'pointer' }}>
                    <TableCell>
                      <Typography color='text.primary' fontWeight={600}>
                        {row.studentName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {formatDateTime(row.createdAt)}
                      </Typography>
                    </TableCell>
                    {/*<TableCell>{row.examSessionName}</TableCell>*/}
                    <TableCell>{row.className}</TableCell>
                    <TableCell>
                      <Tooltip title={row.rejectionReason || ''}>
                        <Chip
                          label={statusLabels[row.status] || row.status}
                          color={statusColors[row.status] || 'secondary'}
                          size='small'
                          variant='tonal'
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box className='flex flex-col items-start gap-1'>
                        <Chip
                          label={row.isFeePaid ? text.paid : text.unpaid}
                          color={row.isFeePaid ? 'success' : 'warning'}
                          size='small'
                          variant='tonal'
                        />
                        {row.isFeePaid && row.paidAt && (
                          <Typography variant='caption' color='text.secondary'>
                            {formatDateTime(row.paidAt)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.oneTimeFeesCompleted ? 'Hoàn thành' : 'Chưa'}
                        color={row.oneTimeFeesCompleted ? 'success' : 'warning'}
                        size='small'
                        variant='tonal'
                      />
                    </TableCell>
                    <TableCell>{row.currentBeltLevelName || text.noBelt}</TableCell>
                    <TableCell>
                      <Typography color='primary.main' fontWeight={600}>
                        {row.targetBeltLevelName}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.registeredByUserName || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component='div'
            count={sortedRegistrations.length}
            page={page}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={event => {
              setRowsPerPage(Number(event.target.value))
              setPage(0)
            }}
          />
        </>
      )}

      {loadingStudent && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: theme => theme.zIndex.modal + 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,0.45)'
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <ViewStudentDrawer
        open={viewStudentOpen}
        onClose={() => {
          setViewStudentOpen(false)
          setSelectedStudent(null)
        }}
        student={selectedStudent}
        onEdit={
          studentPermissions.canUpdate
            ? student => {
                setViewStudentOpen(false)
                setSelectedStudent(student)
                setEditStudentOpen(true)
              }
            : undefined
        }
      />
      <EditStudentDrawer
        open={editStudentOpen}
        onClose={() => {
          setEditStudentOpen(false)
        }}
        student={selectedStudent}
        onSaved={handleStudentUpdated}
      />
    </Card>
  )
}

export default BeltExamRegistrationsView


