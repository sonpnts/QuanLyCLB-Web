'use client'

import { useEffect, useMemo, useState } from 'react'

import Link from 'next/link'

import { toLocalDateString } from '@/utils/dateTime'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useAuth } from '@/contexts/authContext'
import classService from '@/services/classService'
import studentAttendanceService, {
  type AttendanceSheetStudentType,
  type AttendanceSheetType,
  type CoachClassOption,
  type MissingAttendanceOverviewType,
  type StudentAttendanceSessionLogType
} from '@/services/studentAttendanceService'
import { formatDateTimeVN } from '@/utils/dateTime'
import { hasAdminRole } from '@/utils/roleUtils'
import useStudentViewDrawer from '@/views/apps/student/list/useStudentViewDrawer'

type FilterClass = {
  id: string
  name: string
}

type DailyLogGroup = {
  date: string
  totalSessions: number
  totalStudents: number
  totalPresent: number
  totalExcused: number
  totalUnexcused: number
  logs: StudentAttendanceSessionLogType[]
}

const WEEKDAY_LABELS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

const today = toLocalDateString()

const oneMonthAgo = (() => {
  const date = new Date()

  date.setMonth(date.getMonth() - 1)

  return toLocalDateString(date)
})()

const parseDateString = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)

  return new Date(year, month - 1, day)
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

const formatAttendanceDateLabel = (value: string) => {
  const date = parseDateString(value)

  return `${WEEKDAY_LABELS[date.getDay()]}, ${date.toLocaleDateString('vi-VN')}`
}

const formatDateTime = (value?: string | null) => formatDateTimeVN(value)

const getStudentStatus = (student: AttendanceSheetStudentType) => {
  if (!student.isAbsent) {
    return {
      label: 'Đi học',
      color: 'success' as const
    }
  }

  if (student.isExcused) {
    return {
      label: 'Vắng có phép',
      color: 'warning' as const
    }
  }

  return {
    label: 'Vắng không phép',
    color: 'error' as const
  }
}

const AttendanceHistoryView = () => {
  const { auth } = useAuth()
  const isAdmin = hasAdminRole(auth?.roles)

  const { openStudentDrawer, studentDrawerElement } = useStudentViewDrawer()

  const [loading, setLoading] = useState(false)
  const [loadingMissingSessions, setLoadingMissingSessions] = useState(false)
  const [classOptions, setClassOptions] = useState<FilterClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [fromDate, setFromDate] = useState(oneMonthAgo)
  const [toDate, setToDate] = useState(today)
  const [logs, setLogs] = useState<StudentAttendanceSessionLogType[]>([])
  const [missingOverview, setMissingOverview] = useState<MissingAttendanceOverviewType | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<StudentAttendanceSessionLogType | null>(null)
  const [selectedSheet, setSelectedSheet] = useState<AttendanceSheetType | null>(null)

  useEffect(() => {
    const loadOptions = async () => {
      if (isAdmin) {
        const classRes = await classService.getClasses({ isActive: true, pageSize: 1000 })
        const classes = classRes.success && classRes.data ? classRes.data : []

        setClassOptions(classes.map(c => ({ id: c.id || '', name: `${c.code || ''} - ${c.name}` })))

        return
      }

      const coachRes = await studentAttendanceService.getCoachClasses()
      const coachClasses = coachRes.success && coachRes.data ? coachRes.data : []

      setClassOptions(
        coachClasses.map((c: CoachClassOption) => ({
          id: c.classId,
          name: `${c.classCode}`
        }))
      )
    }

    loadOptions()
  }, [isAdmin])

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true)

      const response = await studentAttendanceService.getSessionLogs({
        pageSize: 1000,
        classId: selectedClassId || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      })

      const rows = response.success && response.data ? response.data : []

      setLogs(
        [...rows].sort((a, b) => {
          const dateCompare = b.attendanceDate.localeCompare(a.attendanceDate)

          if (dateCompare !== 0) return dateCompare

          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
      )
      setLoading(false)
    }

    loadLogs()
  }, [selectedClassId, fromDate, toDate])

  useEffect(() => {
    const loadMissingSessions = async () => {
      setLoadingMissingSessions(true)

      const response = await studentAttendanceService.getMissingSessions()

      if (response.success && response.data) {
        setMissingOverview(response.data)
      } else {
        setMissingOverview(null)
      }

      setLoadingMissingSessions(false)
    }

    if (auth?.user?.id) {
      loadMissingSessions()
    }
  }, [auth?.user?.id])

  const summary = useMemo(() => {
    const totalSessions = logs.length
    const totalStudents = logs.reduce((sum, row) => sum + row.totalStudents, 0)
    const totalExcused = logs.reduce((sum, row) => sum + row.excusedAbsentCount, 0)
    const totalUnexcused = logs.reduce((sum, row) => sum + row.unexcusedAbsentCount, 0)
    const totalPresent = logs.reduce((sum, row) => sum + Math.max(0, row.totalStudents - row.absentCount), 0)
    const totalClasses = new Set(logs.map(row => row.classId)).size

    return {
      totalSessions,
      totalClasses,
      totalStudents,
      totalPresent,
      totalExcused,
      totalUnexcused
    }
  }, [logs])

  const groupedLogs = useMemo<DailyLogGroup[]>(() => {
    const map = new Map<string, StudentAttendanceSessionLogType[]>()

    for (const row of logs) {
      const existing = map.get(row.attendanceDate) || []

      existing.push(row)
      map.set(row.attendanceDate, existing)
    }

    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, rows]) => ({
        date,
        totalSessions: rows.length,
        totalStudents: rows.reduce((sum, row) => sum + row.totalStudents, 0),
        totalPresent: rows.reduce((sum, row) => sum + Math.max(0, row.totalStudents - row.absentCount), 0),
        totalExcused: rows.reduce((sum, row) => sum + row.excusedAbsentCount, 0),
        totalUnexcused: rows.reduce((sum, row) => sum + row.unexcusedAbsentCount, 0),
        logs: rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }))
  }, [logs])

  const missingSessionGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        classId: string
        classCode: string
        className: string
        sessions: MissingAttendanceOverviewType['sessions']
      }
    >()

    for (const session of missingOverview?.sessions ?? []) {
      const existing = groups.get(session.classId)

      if (existing) {
        existing.sessions.push(session)
        continue
      }

      groups.set(session.classId, {
        classId: session.classId,
        classCode: session.classCode,
        className: session.className,
        sessions: [session]
      })
    }

    return Array.from(groups.values())
  }, [missingOverview])

  const detailRows = useMemo(() => {
    if (!selectedSheet?.students) return []

    return [...selectedSheet.students].sort((a, b) => {
      if (a.isAbsent !== b.isAbsent) return a.isAbsent ? 1 : -1

      if (a.isExcused !== b.isExcused) return a.isExcused ? -1 : 1

      return a.studentName.localeCompare(b.studentName, 'vi')
    })
  }, [selectedSheet])

  const openDetail = async (row: StudentAttendanceSessionLogType) => {
    setSelectedLog(row)
    setSelectedSheet(null)
    setDetailError(null)
    setDetailLoading(true)
    setDetailOpen(true)

    const response = await studentAttendanceService.getCoachSheet(row.classId, row.attendanceDate)

    if (!response.success || !response.data) {
      setDetailError(response.message || 'Không tải được chi tiết điểm danh.')
      setDetailLoading(false)

      return
    }

    setSelectedSheet(response.data)
    setDetailLoading(false)
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setSelectedLog(null)
    setSelectedSheet(null)
    setDetailError(null)
    setDetailLoading(false)
  }

  const handleExportExcel = async () => {
    try {
      await studentAttendanceService.exportSessionLogs({
        classId: selectedClassId || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      })
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  return (
    <>
      <Box className='flex flex-col gap-6'>
        <Card>
          <CardHeader
            title='Lịch sử điểm danh'
            subheader='Theo dõi lịch sử điểm danh theo ngày, lớp và xem lại chi tiết từng buổi.'
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Lớp học</InputLabel>
                  <Select value={selectedClassId} label='Lớp học' onChange={e => setSelectedClassId(e.target.value)}>
                    <MenuItem value=''>Tất cả</MenuItem>
                    {classOptions.map(option => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type='date'
                  label='Từ ngày'
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type='date'
                  label='Đến ngày'
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }} className='flex items-end'>
                <Button
                  variant='outlined'
                  color='primary'
                  fullWidth
                  onClick={handleExportExcel}
                  startIcon={<i className='ri-download-line' />}
                >
                  Xuất Excel
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title='Buổi điểm danh còn thiếu' />
          <CardContent>
            {loadingMissingSessions ? (
              <Alert severity='info'>Đang kiểm tra các buổi điểm danh còn thiếu...</Alert>
            ) : null}

            {!loadingMissingSessions && (missingOverview?.totalMissingSessions ?? 0) > 0 ? (
              <Alert severity='warning' sx={{ alignItems: 'flex-start' }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 1 }}>
                  {isAdmin
                    ? `Hiện có ${missingOverview?.totalMissingSessions} buổi điểm danh còn thiếu ở ${missingOverview?.totalClassesWithMissing} lớp.`
                    : `Bạn đang thiếu ${missingOverview?.totalMissingSessions} buổi điểm danh ở ${missingOverview?.totalClassesWithMissing} lớp được phân công.`}
                </Typography>
                <Typography variant='body2' sx={{ mb: 2 }}>
                  Chọn một buổi bên dưới để mở nhanh đúng lớp và ngày cần điểm danh.
                </Typography>
                <Box className='flex flex-col gap-3'>
                  {missingSessionGroups.map(group => (
                    <Box
                      key={group.classId}
                      sx={{
                        p: 2,
                        border: theme => `1px dashed ${theme.palette.warning.light}`,
                        borderRadius: 2,
                        bgcolor: 'background.paper'
                      }}
                    >
                      <Typography variant='subtitle2' sx={{ mb: 1 }}>
                        {`${group.classCode} (${group.sessions.length} buổi thiếu)`}
                      </Typography>
                      <Box className='flex flex-wrap gap-2'>
                        {group.sessions.map(session => (
                          <Button
                            key={`${session.classId}-${session.attendanceDate}`}
                            component={Link}
                            href={`/apps/attendance/list?classId=${session.classId}&date=${session.attendanceDate}`}
                            size='small'
                            variant='outlined'
                            color='warning'
                          >
                            {formatAttendanceDateLabel(session.attendanceDate)}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Alert>
            ) : null}

            {!loadingMissingSessions &&
            classOptions.length > 0 &&
            (missingOverview?.totalMissingSessions ?? 0) === 0 &&
            missingOverview ? (
              <Alert severity='success'>Không có buổi điểm danh nào còn thiếu đến hết ngày hôm qua.</Alert>
            ) : null}
          </CardContent>
        </Card>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card>
              <CardContent>
                <Typography variant='body2' color='text.secondary'>
                  Buổi đã điểm danh
                </Typography>
                <Typography variant='h4'>{summary.totalSessions}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card>
              <CardContent>
                <Typography variant='body2' color='text.secondary'>
                  Lớp đã điểm danh
                </Typography>
                <Typography variant='h4'>{summary.totalClasses}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card>
              <CardContent>
                <Typography variant='body2' color='text.secondary'>
                  Học viên đi học
                </Typography>
                <Typography variant='h4' color='success.main'>
                  {summary.totalPresent}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card>
              <CardContent>
                <Typography variant='body2' color='text.secondary'>
                  Vắng có phép
                </Typography>
                <Typography variant='h4' color='warning.main'>
                  {summary.totalExcused}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card>
              <CardContent>
                <Typography variant='body2' color='text.secondary'>
                  Vắng không phép
                </Typography>
                <Typography variant='h4' color='error.main'>
                  {summary.totalUnexcused}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardHeader title='Lịch sử điểm danh theo ngày' />
          <CardContent>
            {loading ? (
              <Box className='flex items-center justify-center py-10'>
                <CircularProgress size={30} />
              </Box>
            ) : null}

            {!loading && groupedLogs.length === 0 ? (
              <Typography color='text.secondary'>Không có dữ liệu điểm danh trong khoảng thời gian đã chọn.</Typography>
            ) : null}

            {!loading &&
              groupedLogs.map(group => (
                <Box key={group.date} sx={{ mb: 5 }}>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    sx={{ mb: 2, alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}
                  >
                    <Box>
                      <Typography variant='h6'>{formatDate(group.date)}</Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {group.totalSessions} buổi điểm danh
                      </Typography>
                    </Box>
                    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                      <Chip label={`Đi học: ${group.totalPresent}`} color='success' variant='tonal' size='small' />
                      <Chip label={`Có phép: ${group.totalExcused}`} color='warning' variant='tonal' size='small' />
                      <Chip label={`Không phép: ${group.totalUnexcused}`} color='error' variant='tonal' size='small' />
                    </Stack>
                  </Stack>

                  <div className='overflow-x-auto'>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Lớp điểm danh</TableCell>
                          <TableCell align='center'>Thời gian</TableCell>
                          <TableCell align='center'>Tổng HV</TableCell>
                          <TableCell align='center'>Đi học</TableCell>
                          <TableCell align='center'>Vắng có phép</TableCell>
                          <TableCell align='center'>Vắng không phép</TableCell>
                          <TableCell>Người điểm danh</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {group.logs.map(row => {
                          const presentCount = Math.max(0, row.totalStudents - row.absentCount)

                          return (
                            <TableRow hover key={row.id} onClick={() => openDetail(row)} sx={{ cursor: 'pointer' }}>
                              <TableCell>
                                <Stack spacing={0.5}>
                                  <Typography color='primary.main' fontWeight={600}>
                                    {row.className}
                                  </Typography>
                                  <Typography variant='caption' color='text.secondary'>
                                    Bấm để xem chi tiết
                                  </Typography>
                                </Stack>
                              </TableCell>
                              <TableCell align='center'>{formatDateTime(row.createdAt)}</TableCell>
                              <TableCell align='center'>{row.totalStudents}</TableCell>
                              <TableCell align='center'>
                                <Typography color='success.main' fontWeight={600}>
                                  {presentCount}
                                </Typography>
                              </TableCell>
                              <TableCell align='center'>
                                <Typography color='warning.main' fontWeight={600}>
                                  {row.excusedAbsentCount}
                                </Typography>
                              </TableCell>
                              <TableCell align='center'>
                                <Typography color='error.main' fontWeight={600}>
                                  {row.unexcusedAbsentCount}
                                </Typography>
                              </TableCell>
                              <TableCell>{row.markedByUserName || '-'}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </Box>
              ))}
          </CardContent>
        </Card>
      </Box>

      <Dialog open={detailOpen} onClose={closeDetail} maxWidth='md' fullWidth>
        <DialogTitle>
          <Stack spacing={0.5}>
            <Typography variant='h5'>Chi tiết buổi điểm danh</Typography>
            <Typography variant='body2' color='text.secondary'>
              {selectedLog ? `${selectedLog.className} - ${formatDate(selectedLog.attendanceDate)}` : ''}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box className='flex items-center justify-center py-10'>
              <CircularProgress size={30} />
            </Box>
          ) : null}

          {!detailLoading && detailError ? <Alert severity='error'>{detailError}</Alert> : null}

          {!detailLoading && !detailError && selectedLog && selectedSheet ? (
            <Stack spacing={3}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='body2' color='text.secondary'>
                        Người điểm danh
                      </Typography>
                      <Typography variant='h6'>{selectedLog.markedByUserName || '-'}</Typography>
                      <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                        Thời gian ghi nhận: {formatDateTime(selectedLog.createdAt)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Typography variant='body2' color='text.secondary'>
                        Tình hình buổi học
                      </Typography>
                      <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap sx={{ mt: 1 }}>
                        <Chip
                          label={`Đi học: ${Math.max(0, selectedLog.totalStudents - selectedLog.absentCount)}`}
                          color='success'
                          variant='tonal'
                          size='small'
                        />
                        <Chip
                          label={`Có phép: ${selectedLog.excusedAbsentCount}`}
                          color='warning'
                          variant='tonal'
                          size='small'
                        />
                        <Chip
                          label={`Không phép: ${selectedLog.unexcusedAbsentCount}`}
                          color='error'
                          variant='tonal'
                          size='small'
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <div className='overflow-x-auto'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell width={70}>STT</TableCell>
                      <TableCell>Học viên</TableCell>
                      <TableCell>Số điện thoại</TableCell>
                      <TableCell align='center'>Trạng thái</TableCell>
                      <TableCell>Lý do / ghi chú</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailRows.map((student, index) => {
                      const status = getStudentStatus(student)

                      return (
                        <TableRow key={student.studentId}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Typography
                              color='primary'
                              sx={{ cursor: 'pointer' }}
                              onClick={() => openStudentDrawer(student.studentId)}
                            >
                              {student.studentName}
                            </Typography>
                          </TableCell>
                          <TableCell>{student.phoneNumber || '-'}</TableCell>
                          <TableCell align='center'>
                            <Chip label={status.label} color={status.color} variant='tonal' size='small' />
                          </TableCell>
                          <TableCell>{student.reason || '-'}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>

      {studentDrawerElement}
    </>
  )
}

export default AttendanceHistoryView
