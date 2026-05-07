'use client'

// React Imports
import { useEffect, useState, useCallback } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
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
import TableContainer from '@mui/material/TableContainer'

// Type Imports
import type { AttendanceAdminOverviewType, InstructorMonthlyStatsType, ClassAttendanceSummaryType } from '@/types/apps/attendanceTypes'
import type { UsersType } from '@/types/apps/userTypes'
import type { ClassType } from '@/types/apps/classTypes'

// Service Imports
import attendanceService from '@/services/attendanceService'
import userService from '@/services/userService'
import classService from '@/services/classService'

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i)

const AttendanceAdminStatsView = () => {
  // Filter state
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth)
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('')
  const [selectedClassId, setSelectedClassId] = useState<string>('')

  // Data state
  const [overview, setOverview] = useState<AttendanceAdminOverviewType | null>(null)
  const [instructorStats, setInstructorStats] = useState<InstructorMonthlyStatsType[]>([])
  const [classStats, setClassStats] = useState<ClassAttendanceSummaryType[]>([])
  const [instructors, setInstructors] = useState<UsersType[]>([])
  const [classes, setClasses] = useState<ClassType[]>([])

  // Loading state
  const [loadingData, setLoadingData] = useState(false)
  const [loadingFilters, setLoadingFilters] = useState(false)

  // Load instructors and classes for filters
  useEffect(() => {
    const loadFilterOptions = async () => {
      setLoadingFilters(true)
      try {
        const [instructorRes, classRes] = await Promise.all([
          userService.getCoaches(),
          classService.getClasses({ isActive: true, pageSize: 1000 })
        ])
        if (instructorRes.success && instructorRes.data) {
          setInstructors(instructorRes.data)
        }
        if (classRes.success && classRes.data) {
          setClasses(classRes.data)
        }
      } finally {
        setLoadingFilters(false)
      }
    }
    loadFilterOptions()
  }, [])

  // Load attendance data when filters change
  const loadData = useCallback(async () => {
    setLoadingData(true)
    try {
      const params = {
        month: selectedMonth,
        year: selectedYear,
        instructorId: selectedInstructorId || undefined,
        classId: selectedClassId || undefined
      }

      const [overviewRes, instructorRes, classRes] = await Promise.all([
        attendanceService.getAdminOverview(params),
        attendanceService.getInstructorAttendanceStats({
          month: selectedMonth,
          year: selectedYear,
          instructorId: selectedInstructorId || undefined
        }),
        attendanceService.getClassAttendanceSummary({
          month: selectedMonth,
          year: selectedYear,
          classId: selectedClassId || undefined
        })
      ])

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data as unknown as AttendanceAdminOverviewType)
      } else {
        setOverview(null)
      }

      if (instructorRes.success && instructorRes.data) {
        setInstructorStats(instructorRes.data)
      } else {
        setInstructorStats([])
      }

      if (classRes.success && classRes.data) {
        setClassStats(classRes.data)
      } else {
        setClassStats([])
      }
    } finally {
      setLoadingData(false)
    }
  }, [selectedMonth, selectedYear, selectedInstructorId, selectedClassId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getInstructorRateChip = (rate: number) => {
    if (rate >= 90) return <Chip label={`${rate.toFixed(1)}%`} color='success' size='small' variant='tonal' />
    if (rate >= 70) return <Chip label={`${rate.toFixed(1)}%`} color='warning' size='small' variant='tonal' />
    return <Chip label={`${rate.toFixed(1)}%`} color='error' size='small' variant='tonal' />
  }

  const getClassRateChip = (rate: number) => {
    if (rate >= 80) return <Chip label={`${rate.toFixed(1)}%`} color='success' size='small' variant='tonal' />
    if (rate >= 60) return <Chip label={`${rate.toFixed(1)}%`} color='warning' size='small' variant='tonal' />
    return <Chip label={`${rate.toFixed(1)}%`} color='error' size='small' variant='tonal' />
  }

  return (
    <Box className='flex flex-col gap-6'>
      {/* Filter Bar */}
      <Card>
        <CardHeader title='Thống kê chấm công' />
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size='small'>
                <InputLabel>Tháng</InputLabel>
                <Select
                  label='Tháng'
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                >
                  {MONTHS.map(m => (
                    <MenuItem key={m} value={m}>
                      Tháng {m}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size='small'>
                <InputLabel>Năm</InputLabel>
                <Select
                  label='Năm'
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                >
                  {YEARS.map(y => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size='small' disabled={loadingFilters}>
                <InputLabel>Huấn luyện viên</InputLabel>
                <Select
                  label='Huấn luyện viên'
                  value={selectedInstructorId}
                  onChange={e => setSelectedInstructorId(e.target.value)}
                >
                  <MenuItem value=''>Tất cả</MenuItem>
                  {instructors.map(i => (
                    <MenuItem key={i.id} value={i.id}>
                      {i.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size='small' disabled={loadingFilters}>
                <InputLabel>Lớp học</InputLabel>
                <Select
                  label='Lớp học'
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                >
                  <MenuItem value=''>Tất cả</MenuItem>
                  {classes.map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loadingData ? (
        <Box className='flex justify-center py-12'>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box className='flex items-center gap-3'>
                    <Box
                      className='flex items-center justify-center rounded-lg'
                      sx={{ width: 48, height: 48, bgcolor: 'primary.lighter' }}
                    >
                      <i className='ri-calendar-month-line text-2xl' style={{ color: 'var(--mui-palette-primary-main)' }} />
                    </Box>
                    <Box>
                      <Typography variant='h5'>{overview?.totalSessions ?? 0}</Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Tổng buổi dạy
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box className='flex items-center gap-3'>
                    <Box
                      className='flex items-center justify-center rounded-lg'
                      sx={{ width: 48, height: 48, bgcolor: 'success.lighter' }}
                    >
                      <i className='ri-checkbox-circle-line text-2xl' style={{ color: 'var(--mui-palette-success-main)' }} />
                    </Box>
                    <Box>
                      <Typography variant='h5'>
                        {overview ? `${overview.overallOnTimeRate.toFixed(1)}%` : '0%'}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Tỉ lệ đúng giờ
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box className='flex items-center gap-3'>
                    <Box
                      className='flex items-center justify-center rounded-lg'
                      sx={{ width: 48, height: 48, bgcolor: 'warning.lighter' }}
                    >
                      <i className='ri-time-line text-2xl' style={{ color: 'var(--mui-palette-warning-main)' }} />
                    </Box>
                    <Box>
                      <Typography variant='h5'>
                        {instructorStats.reduce((sum, s) => sum + s.lateCount, 0)}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Tổng trễ
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box className='flex items-center gap-3'>
                    <Box
                      className='flex items-center justify-center rounded-lg'
                      sx={{ width: 48, height: 48, bgcolor: 'error.lighter' }}
                    >
                      <i className='ri-close-circle-line text-2xl' style={{ color: 'var(--mui-palette-error-main)' }} />
                    </Box>
                    <Box>
                      <Typography variant='h5'>
                        {instructorStats.reduce((sum, s) => sum + s.absentCount, 0)}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Tổng vắng
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Instructor Stats Table */}
          <Card>
            <CardHeader title='Chấm công huấn luyện viên' />
            <CardContent>
              {instructorStats.length === 0 ? (
                <Typography variant='body2' color='text.secondary' className='text-center py-4'>
                  Không có dữ liệu chấm công huấn luyện viên
                </Typography>
              ) : (
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Huấn luyện viên</TableCell>
                        <TableCell align='center'>Tổng buổi</TableCell>
                        <TableCell align='center'>Đúng giờ</TableCell>
                        <TableCell align='center'>Trễ</TableCell>
                        <TableCell align='center'>Vắng</TableCell>
                        <TableCell align='center'>Tỉ lệ đúng giờ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {instructorStats.map(stat => (
                        <TableRow key={stat.instructorId}>
                          <TableCell>{stat.instructorName}</TableCell>
                          <TableCell align='center'>{stat.totalSessions}</TableCell>
                          <TableCell align='center'>{stat.onTimeCount}</TableCell>
                          <TableCell align='center'>{stat.lateCount}</TableCell>
                          <TableCell align='center'>{stat.absentCount}</TableCell>
                          <TableCell align='center'>{getInstructorRateChip(stat.onTimeRate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Class Attendance Table */}
          <Card>
            <CardHeader title='Điểm danh học viên theo lớp' />
            <CardContent>
              {classStats.length === 0 ? (
                <Typography variant='body2' color='text.secondary' className='text-center py-4'>
                  Không có dữ liệu điểm danh theo lớp
                </Typography>
              ) : (
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Lớp học</TableCell>
                        <TableCell align='center'>Học viên</TableCell>
                        <TableCell align='center'>Tổng buổi</TableCell>
                        <TableCell align='center'>Có mặt</TableCell>
                        <TableCell align='center'>Trễ</TableCell>
                        <TableCell align='center'>Vắng</TableCell>
                        <TableCell align='center'>Tỉ lệ điểm danh</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {classStats.map(stat => (
                        <TableRow key={stat.classId}>
                          <TableCell>{stat.className}</TableCell>
                          <TableCell align='center'>{stat.totalStudents}</TableCell>
                          <TableCell align='center'>{stat.totalSessions}</TableCell>
                          <TableCell align='center'>{stat.presentCount}</TableCell>
                          <TableCell align='center'>{stat.lateCount}</TableCell>
                          <TableCell align='center'>{stat.absentCount}</TableCell>
                          <TableCell align='center'>{getClassRateChip(stat.attendanceRate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}

export default AttendanceAdminStatsView
