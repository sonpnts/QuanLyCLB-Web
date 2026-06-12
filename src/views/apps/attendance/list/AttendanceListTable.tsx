'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import type { SelectChangeEvent } from '@mui/material/Select'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'
import classService from '@/services/classService'
import studentAttendanceService, {
  type AttendanceSheetType,
  type CoachClassOption,
  type MissingAttendanceOverviewType,
  type SaveAttendanceSheetStudentRequest
} from '@/services/studentAttendanceService'
import { hasAdminRole } from '@/utils/roleUtils'
import { formatDateTimeVN } from '@/utils/dateTime'

const WEEKDAY_LABELS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

const parseDateString = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)

  return new Date(year, month - 1, day)
}

const formatDateString = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getTodayDateString = () => formatDateString(new Date())

const ATTENDANCE_PAST_DAY_LIMIT = 30
const ATTENDANCE_FUTURE_DAY_LIMIT = 30

const buildAttendanceDateOptions = (scheduleDays: number[]) => {
  const allowedDays = new Set(scheduleDays.filter(day => day >= 0 && day <= 6))

  if (allowedDays.size === 0) return []

  const startDate = parseDateString(getTodayDateString())
  const options: string[] = []

  startDate.setDate(startDate.getDate() - ATTENDANCE_PAST_DAY_LIMIT)

  for (let offset = 0; offset <= ATTENDANCE_PAST_DAY_LIMIT + ATTENDANCE_FUTURE_DAY_LIMIT; offset++) {
    const currentDate = new Date(startDate)

    currentDate.setDate(startDate.getDate() + offset)

    if (allowedDays.has(currentDate.getDay())) {
      options.push(formatDateString(currentDate))
    }
  }

  return options.sort((left, right) => right.localeCompare(left))
}

const formatAttendanceDateLabel = (value: string) => {
  const date = parseDateString(value)

  return `${WEEKDAY_LABELS[date.getDay()]}, ${date.toLocaleDateString('vi-VN')}`
}

const pickPreferredDate = (dates: string[]) => {
  const today = getTodayDateString()
  const nearestPreviousDate = dates.find(date => date < today)
  const nearestNextDate = [...dates].reverse().find(date => date > today)

  if (dates.includes(today)) return today
  if (nearestPreviousDate) return nearestPreviousDate
  if (nearestNextDate) return nearestNextDate

  return dates[0] ?? ''
}

const isDateMatchingScheduleDay = (value: string, scheduleDays: number[]) => scheduleDays.includes(parseDateString(value).getDay())

const ensureDateOption = (dates: string[], value: string) =>
  dates.includes(value) ? dates : [...dates, value].sort((left, right) => right.localeCompare(left))

const AttendanceListTable = () => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()
  const searchParams = useSearchParams()
  const isAdmin = useMemo(() => hasAdminRole(auth?.roles), [auth?.roles])
  const preselectedClassId = searchParams.get('classId') || ''
  const preselectedDate = searchParams.get('date') || ''

  const [coachClasses, setCoachClasses] = useState<CoachClassOption[]>([])
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [search, setSearch] = useState('')
  const [missingOverview, setMissingOverview] = useState<MissingAttendanceOverviewType | null>(null)

  const [sheet, setSheet] = useState<AttendanceSheetType | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingDates, setLoadingDates] = useState(false)
  const [loadingMissingSessions, setLoadingMissingSessions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  const loadSheet = useCallback(
    async (classId: string, date: string, keyword?: string) => {
      if (!classId || !date) return

      setLoading(true)

      const response = await studentAttendanceService.getCoachSheet(classId, date, keyword?.trim() || undefined)

      if (response.success && response.data) {
        setSheet(response.data)
        setIsEditMode(!(response.data.isSubmitted ?? false))
      } else {
        setSheet(null)
        setIsEditMode(false)
        showNotification(response.message || 'Không tải được danh sách điểm danh', 'error')
      }

      setLoading(false)
    },
    [showNotification]
  )

  const loadClassAttendanceContext = useCallback(
    async (classId: string, keyword?: string, preferredDateOverride?: string) => {
      setSelectedClassId(classId)
      setSheet(null)
      setIsEditMode(false)
      setAvailableDates([])
      setSelectedDate('')

      if (!classId) return

      setLoadingDates(true)

      try {
        const schedulesRes = await classService.getClassSchedules(classId)

        const scheduleDays = Array.from(
          new Set(
            (schedulesRes.data || [])
              .map(schedule => Number(schedule?.dayOfWeek))
              .filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
          )
        ).sort((left, right) => left - right)

        if (scheduleDays.length === 0) {
          showNotification('Lớp này chưa có lịch học để chọn ngày điểm danh', 'warning')
          
return
        }

        const nextAvailableDates = buildAttendanceDateOptions(scheduleDays)
        const preferredDate =
          preferredDateOverride && isDateMatchingScheduleDay(preferredDateOverride, scheduleDays)
            ? preferredDateOverride
            : pickPreferredDate(nextAvailableDates)
        const resolvedDates = preferredDate ? ensureDateOption(nextAvailableDates, preferredDate) : nextAvailableDates

        setAvailableDates(resolvedDates)
        setSelectedDate(preferredDate)

        if (!preferredDate) {
          showNotification('Không tìm thấy buổi học phù hợp để điểm danh', 'warning')
          
return
        }

        await loadSheet(classId, preferredDate, keyword)
      } finally {
        setLoadingDates(false)
      }
    },
    [loadSheet, showNotification]
  )

  const loadMissingSessions = useCallback(async () => {
    setLoadingMissingSessions(true)

    const response = await studentAttendanceService.getMissingSessions()

    if (response.success && response.data) {
      setMissingOverview(response.data)
    } else {
      setMissingOverview(null)

      if (response.message) {
        showNotification(response.message, 'error')
      }
    }

    setLoadingMissingSessions(false)
  }, [showNotification])

  useEffect(() => {
    const initialize = async () => {
      const classesRes = await studentAttendanceService.getCoachClasses()
      const rawClasses = classesRes.success && classesRes.data ? classesRes.data : []
      const classes = rawClasses

      setCoachClasses(classes)

      if (classes.length === 0) {
        setSelectedClassId('')
        setAvailableDates([])
        setSelectedDate('')
        setSheet(null)
        setIsEditMode(false)

        return
      }

      if (preselectedClassId && classes.some(cls => cls.classId === preselectedClassId)) {
        await loadClassAttendanceContext(preselectedClassId, undefined, preselectedDate || undefined)
        return
      }

      const today = getTodayDateString()
      let initialClassId = classes[0].classId

      for (const cls of classes) {
        const suggestedRes = await studentAttendanceService.getSuggestedDate(cls.classId)

        if (suggestedRes.success && suggestedRes.data === today) {
          initialClassId = cls.classId
          break
        }
      }

      await loadClassAttendanceContext(initialClassId)
    }

    if (auth?.user?.id) {
      initialize()
    }
  }, [auth?.user?.id, loadClassAttendanceContext, preselectedClassId, preselectedDate])

  useEffect(() => {
    if (auth?.user?.id) {
      loadMissingSessions()
    }
  }, [auth?.user?.id, loadMissingSessions])

  const absentCount = useMemo(() => (sheet ? sheet.students.filter(student => student.isAbsent).length : 0), [sheet])

  const excusedCount = useMemo(
    () => (sheet ? sheet.students.filter(student => student.isAbsent && student.isExcused).length : 0),
    [sheet]
  )

  const isSheetLocked = Boolean(sheet?.isSubmitted && !isEditMode)

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

  const updateStudentState = (
    studentId: string,
    updater: (student: AttendanceSheetType['students'][number]) => AttendanceSheetType['students'][number]
  ) => {
    setSheet(prev => {
      if (!prev) return prev

      return {
        ...prev,
        students: prev.students.map(student => (student.studentId === studentId ? updater(student) : student))
      }
    })
  }

  const handlePresentChange = (studentId: string, checked: boolean) => {
    updateStudentState(studentId, student =>
      checked
        ? { ...student, isAbsent: false, isExcused: false, reason: '' }
        : { ...student, isAbsent: true, isExcused: false, reason: '' }
    )
  }

  const handleExcusedChange = (studentId: string, checked: boolean) => {
    updateStudentState(studentId, student =>
      checked ? { ...student, isAbsent: true, isExcused: true } : { ...student, isAbsent: false, isExcused: false, reason: '' }
    )
  }

  const handleUnexcusedChange = (studentId: string, checked: boolean) => {
    updateStudentState(studentId, student =>
      checked
        ? { ...student, isAbsent: true, isExcused: false, reason: '' }
        : { ...student, isAbsent: false, isExcused: false, reason: '' }
    )
  }

  const handleReasonChange = (studentId: string, reason: string) => {
    updateStudentState(studentId, student => ({ ...student, reason }))
  }

  const handleSelectAllPresent = () => {
    setSheet(prev => {
      if (!prev) return prev

      return {
        ...prev,
        students: prev.students.map(student => ({ ...student, isAbsent: false, isExcused: false, reason: '' }))
      }
    })
  }

  const handleSearch = async () => {
    if (!selectedClassId || !selectedDate) return
    await loadSheet(selectedClassId, selectedDate, search)
  }

  const handleSave = async () => {
    if (!sheet) return

    const absents: SaveAttendanceSheetStudentRequest[] = sheet.students
      .filter(student => student.isAbsent)
      .map(student => ({
        studentId: student.studentId,
        isExcused: student.isExcused,
        reason: student.reason?.trim() || undefined
      }))

    const invalidExcused = absents.find(item => item.isExcused && !item.reason)

    if (invalidExcused) {
      showNotification('Nghỉ có phép bắt buộc nhập lý do', 'warning')
      
return
    }

    setSaving(true)

    const response = await studentAttendanceService.saveCoachSheet({
      classId: sheet.classId,
      classScheduleId: sheet.classScheduleId,
      attendanceDate: sheet.selectedDate,
      absents
    })

    if (response.success) {
      showNotification('Đã lưu điểm danh', 'success')
      await Promise.all([loadSheet(sheet.classId, sheet.selectedDate, search), loadMissingSessions()])
    } else {
      showNotification(response.message || 'Lưu điểm danh thất bại', 'error')
    }

    setSaving(false)
  }

  return (
    <Card>
      <CardHeader
        title='Điểm danh'

        // subheader=''
        action={
          <Button component={Link} href='/apps/attendance/history' variant='outlined' size='small'>
            Lịch sử điểm danh
          </Button>
        }
      />
      <CardContent>
        <Box mb={4}>
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
                      {`${group.classCode} - ${group.className} (${group.sessions.length} buổi thiếu)`}
                    </Typography>
                    <Box className='flex flex-wrap gap-2'>
                      {group.sessions.map(session => (
                        <Button
                          key={`${session.classId}-${session.attendanceDate}`}
                          size='small'
                          variant='outlined'
                          color='warning'
                          onClick={async () => {
                            setSearch('')
                            await loadClassAttendanceContext(session.classId, undefined, session.attendanceDate)
                          }}
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
          coachClasses.length > 0 &&
          (missingOverview?.totalMissingSessions ?? 0) === 0 &&
          missingOverview ? (
            <Alert severity='success'>Không có buổi điểm danh nào còn thiếu đến hết ngày hôm qua.</Alert>
          ) : null}
        </Box>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Lớp điểm danh</InputLabel>
              <Select
                value={selectedClassId}
                label='Lớp điểm danh'
                onChange={async (event: SelectChangeEvent) => {
                  await loadClassAttendanceContext(event.target.value, search)
                }}
              >
                {coachClasses.map(cls => (
                  <MenuItem key={cls.classId} value={cls.classId}>
                    {`${cls.classCode} - ${cls.className}`}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{isAdmin ? 'Admin xem toàn bộ lớp đang hoạt động.' : 'HLV và trợ giảng chỉ xem các lớp được phân công.'}</FormHelperText>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth disabled={!selectedClassId || loadingDates}>
              <InputLabel>Ngày điểm danh</InputLabel>
              <Select
                value={selectedDate}
                label='Ngày điểm danh'
                onChange={async (event: SelectChangeEvent) => {
                  const nextDate = event.target.value

                  setSelectedDate(nextDate)

                  if (!selectedClassId || !nextDate) return
                  await loadSheet(selectedClassId, nextDate, search)
                }}
              >
                {availableDates.length > 0 ? (
                  availableDates.map(date => (
                    <MenuItem key={date} value={date}>
                      {formatAttendanceDateLabel(date)}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value='' disabled>
                    Không có buổi học khả dụng
                  </MenuItem>
                )}
              </Select>
              <FormHelperText>Chỉ hiển thị các ngày học trong phạm vi 30 ngày quá khứ và 30 ngày tương lai.</FormHelperText>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label='Tìm học viên'
              value={search}
              onChange={event => setSearch(event.target.value)}
              onKeyDown={async event => {
                if (event.key === 'Enter') await handleSearch()
              }}
            />
          </Grid>

          <Grid size={{ xs: 12 }} className='flex flex-wrap gap-2'>
            {sheet?.isSubmitted && !isEditMode ? (
              <Button variant='outlined' color='warning' onClick={() => setIsEditMode(true)} disabled={loading || saving}>
                Chỉnh sửa
              </Button>
            ) : null}
            <Button variant='contained' color='success' onClick={handleSelectAllPresent} disabled={!sheet || loading || saving || isSheetLocked}>
              Chọn tất cả đi học
            </Button>
            <Button variant='contained' onClick={handleSave} disabled={!sheet || loading || saving || isSheetLocked}>
              {saving ? 'Đang lưu...' : 'Lưu điểm danh'}
            </Button>
            {sheet ? (
              <>
                <Chip color='warning' label={`Vắng: ${absentCount}`} />
                <Chip color='info' label={`Có phép: ${excusedCount}`} />
              </>
            ) : null}
          </Grid>
        </Grid>

        <Box mt={6}>
          {sheet?.isSubmitted ? (
            <Alert severity='info' sx={{ mb: 3 }}>
              Đã điểm danh lúc {formatDateTimeVN(sheet.submittedAt)}
              {sheet.submittedByUserName ? ` - Người tạo: ${sheet.submittedByUserName}` : ''}
            </Alert>
          ) : null}

          {loading || loadingDates ? (
            <Box className='flex items-center justify-center py-8'>
              <CircularProgress size={28} />
            </Box>
          ) : null}

          {!loading && !loadingDates && !selectedClassId ? (
            <Typography color='text.secondary'>Vui lòng chọn lớp để bắt đầu điểm danh.</Typography>
          ) : null}

          {!loading && !loadingDates && coachClasses.length === 0 ? (
            <Typography color='text.secondary'>
              {isAdmin ? 'Hiện chưa có lớp nào để điểm danh.' : 'Hiện bạn chưa được phân công lớp nào để điểm danh.'}
            </Typography>
          ) : null}

          {!loading && !loadingDates && selectedClassId && availableDates.length === 0 ? (
            <Typography color='text.secondary'>Lớp này chưa có lịch học để chọn ngày điểm danh.</Typography>
          ) : null}

          {!loading && !loadingDates && selectedClassId && availableDates.length > 0 && !sheet ? (
            <Typography color='text.secondary'>Không tải được danh sách điểm danh cho buổi học đã chọn.</Typography>
          ) : null}

          {!loading && !loadingDates && sheet ? (
            <div className='overflow-x-auto'>
              <Table size='small' sx={{ minWidth: { xs: 760, sm: 0 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Học viên</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Số điện thoại</TableCell>
                    <TableCell align='center'>Đi học</TableCell>
                    <TableCell align='center'>Nghỉ có phép</TableCell>
                    <TableCell align='center'>Nghỉ không phép</TableCell>
                    <TableCell sx={{ minWidth: { xs: 280, sm: 320 } }}>Lý do</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sheet.students.map(student => {
                    const isPresent = !student.isAbsent
                    const isExcused = student.isAbsent && student.isExcused
                    const isUnexcused = student.isAbsent && !student.isExcused

                    return (
                      <TableRow key={student.studentId}>
                        <TableCell>{student.studentName}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{student.phoneNumber || '-'}</TableCell>
                        <TableCell align='center'>
                          <Checkbox
                            checked={isPresent}
                            disabled={isSheetLocked || loading || saving}
                            onChange={event => handlePresentChange(student.studentId, event.target.checked)}
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Checkbox
                            checked={isExcused}
                            disabled={isSheetLocked || loading || saving}
                            onChange={event => handleExcusedChange(student.studentId, event.target.checked)}
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Checkbox
                            checked={isUnexcused}
                            disabled={isSheetLocked || loading || saving}
                            onChange={event => handleUnexcusedChange(student.studentId, event.target.checked)}
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: { xs: 280, sm: 320 } }}>
                          <TextField
                            fullWidth
                            size='small'
                            placeholder='Lý do (bắt buộc khi nghỉ có phép)'
                            value={student.reason || ''}
                            disabled={isSheetLocked || loading || saving}
                            onChange={event => handleReasonChange(student.studentId, event.target.value)}
                            error={isExcused && !student.reason?.trim()}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </Box>
      </CardContent>
    </Card>
  )
}

export default AttendanceListTable
