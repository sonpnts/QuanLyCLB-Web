'use client'

import { useEffect, useMemo, useState } from 'react'

import Link from 'next/link'

import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import Paper from '@mui/material/Paper'

import dashboardService from '@/services/dashboardService'
import studentService from '@/services/studentService'
import type {
  DashboardStatisticsDto,
  DashboardSystemNotificationsDto,
  RevenueStatisticsDto,
  StudentStatisticsDto,
  AttendanceStatisticsDto,
  StudentMonthStatisticsDto,
  StudentMonthListItemDto
} from '@/services/dashboardService'
import type { StudentType } from '@/types/apps/studentTypes'

import ViewStudentDrawer from '@/views/apps/student/list/ViewStudentDrawer'

import CustomAvatar from '@core/components/mui/Avatar'
import { useAuth } from '@/contexts/authContext'
import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'
import { formatDateVN } from '@/utils/dateTime'

const formatMoney = (value: number) => new Intl.NumberFormat('vi-VN').format(value)

const formatSmallDate = (value?: string | null) => formatDateVN(value, '')

const StatCard = ({
  title,
  value,
  icon,
  color,
  subtitle
}: {
  title: string
  value: string | number
  icon: string
  color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary'
  subtitle?: string
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent className='flex items-center gap-4'>
      <CustomAvatar color={color} skin='light' size={56} variant='rounded'>
        <i className={`${icon} text-2xl`} />
      </CustomAvatar>
      <div>
        <Typography variant='h4' className='font-bold'>
          {value}
        </Typography>
        <Typography color='text.primary' className='font-medium'>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant='caption' color='text.secondary'>
            {subtitle}
          </Typography>
        )}
      </div>
    </CardContent>
  </Card>
)

const MODULE_META: Record<string, { icon: string; color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary' }> = {
  UserDocument: { icon: 'ri-file-list-3-line', color: 'info' },
  ClassTransfer: { icon: 'ri-exchange-line', color: 'primary' },
  CashHandover: { icon: 'ri-hand-coin-line', color: 'success' },
  LeaveRequest: { icon: 'ri-calendar-event-line', color: 'secondary' },
  TuitionDiscount: { icon: 'ri-money-dollar-circle-line', color: 'warning' },
  AttendanceAdjustment: { icon: 'ri-time-line', color: 'error' }
}

const PendingRequests = ({ items }: { items: NonNullable<DashboardSystemNotificationsDto['pendingItems']> }) => {
  if (items.length === 0) {
    return (
      <Box className='flex flex-col items-center justify-center gap-2 py-10'>
        <CustomAvatar color='success' skin='light' size={56} variant='rounded'>
          <i className='ri-checkbox-circle-line text-2xl' />
        </CustomAvatar>
        <Typography color='text.secondary'>Không có yêu cầu nào đang chờ duyệt.</Typography>
      </Box>
    )
  }

  return (
    <div className='flex flex-col gap-2'>
      {items.map(item => {
        const meta = MODULE_META[item.moduleKey] ?? { icon: 'ri-notification-3-line', color: 'primary' as const }

        return (
          <Box
            key={`${item.moduleKey}-${item.recordId}`}
            className='border rounded p-3 flex items-center gap-3'
            sx={{ transition: 'box-shadow .2s ease', '&:hover': { boxShadow: 3 } }}
          >
            <CustomAvatar color={meta.color} skin='light' size={42} variant='rounded'>
              <i className={`${meta.icon} text-xl`} />
            </CustomAvatar>
            <div className='flex-1' style={{ minWidth: 0 }}>
              <Typography variant='body2' className='font-medium'>
                {item.title}
              </Typography>
              <div className='flex items-center gap-2 flex-wrap'>
                <Chip label={item.moduleLabel} color={meta.color} variant='tonal' size='small' />
                <Typography variant='caption' color='text.secondary'>
                  {formatSmallDate(item.createdAt)}
                </Typography>
              </div>
              {item.description && (
                <Typography
                  variant='caption'
                  color='text.secondary'
                  display='block'
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {item.description}
                </Typography>
              )}
            </div>
            <Button
              component={Link}
              href={item.detailUrl}
              size='small'
              variant='contained'
              color='primary'
              endIcon={<i className='ri-arrow-right-line' />}
              sx={{ flexShrink: 0 }}
            >
              Xử lý
            </Button>
          </Box>
        )
      })}
    </div>
  )
}

const DashboardHome = () => {
  const [stats, setStats] = useState<DashboardStatisticsDto | null>(null)
  const [revenue, setRevenue] = useState<RevenueStatisticsDto[]>([])
  const [studentStats, setStudentStats] = useState<StudentStatisticsDto | null>(null)
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStatisticsDto | null>(null)
  const [systemNotifications, setSystemNotifications] = useState<DashboardSystemNotificationsDto | null>(null)
  const [studentMonthStats, setStudentMonthStats] = useState<StudentMonthStatisticsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [studentListDialog, setStudentListDialog] = useState<{
    open: boolean
    title: string
    list: StudentMonthListItemDto[]
  }>({ open: false, title: '', list: [] })
  const [sortConfig, setSortConfig] = useState<{ key: 'code' | 'fullName' | 'className'; direction: 'asc' | 'desc' }>({
    key: 'fullName',
    direction: 'asc'
  })
  const [viewStudentOpen, setViewStudentOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date()

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const { auth } = useAuth()

  const canViewAdminDashboard = useMemo(
    () => hasPermission(auth?.permissions, 'Dashboard.Admin.View') || hasAdminRole(auth?.roles),
    [auth?.permissions, auth?.roles]
  )

  const canViewNotifications = useMemo(
    () =>
      hasPermission(auth?.permissions, 'Dashboard.Notification.View') ||
      hasPermission(auth?.permissions, 'Dashboard.Admin.View') ||
      hasAdminRole(auth?.roles),
    [auth?.permissions, auth?.roles]
  )

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, idx) => {
        const d = new Date()

        d.setDate(1)
        d.setMonth(d.getMonth() - idx)
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

        return { value, label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}` }
      }),
    []
  )

  const sortedStudentList = useMemo(() => {
    const list = [...studentListDialog.list]
    const { key, direction } = sortConfig
    const multiplier = direction === 'asc' ? 1 : -1

    list.sort((a, b) => {
      const aVal = (a[key] ?? '').toString()
      const bVal = (b[key] ?? '').toString()

      return aVal.localeCompare(bVal, 'vi') * multiplier
    })

    return list
  }, [studentListDialog.list, sortConfig])

  const handleSort = (key: 'code' | 'fullName' | 'className') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleViewStudent = async (studentId: string) => {
    setStudentListDialog(prev => ({ ...prev, open: false }))
    const res = await studentService.getStudentById(studentId)

    if (res.success && res.data) {
      setSelectedStudent(res.data)
      setViewStudentOpen(true)
    }
  }

  // Yêu cầu chờ duyệt: tải 1 lần, hiển thị toàn bộ, không phụ thuộc tháng đã chọn
  useEffect(() => {
    if (!canViewNotifications) {
      setSystemNotifications(null)
      return
    }

    const loadNotifications = async () => {
      const res = await dashboardService.getSystemNotifications({ maxItemsPerStatus: 100 })

      if (res.success && res.data) setSystemNotifications(res.data)
    }

    loadNotifications()
  }, [canViewNotifications])

  useEffect(() => {
    const load = async () => {
      const [yearStr, monthStr] = selectedMonth.split('-')
      const year = Number(yearStr)
      const month = Number(monthStr)

      setLoading(true)

      try {
        if (canViewAdminDashboard) {
          const [statsRes, revenueRes, studentRes, attendanceRes, studentMonthRes] = await Promise.all([
            dashboardService.getStatistics({ year, month }),
            dashboardService.getRevenue({ months: 6 }),
            dashboardService.getStudentStats(),
            dashboardService.getAttendanceStats(),
            dashboardService.getStudentMonthStats({ year, month })
          ])

          if (statsRes.success && statsRes.data) setStats(statsRes.data)
          if (revenueRes.success && revenueRes.data) setRevenue(revenueRes.data)
          if (studentRes.success && studentRes.data) setStudentStats(studentRes.data)
          if (attendanceRes.success && attendanceRes.data) setAttendanceStats(attendanceRes.data)
          if (studentMonthRes.success && studentMonthRes.data) setStudentMonthStats(studentMonthRes.data)
        } else {
          setStats(null)
          setRevenue([])
          setStudentStats(null)
          setAttendanceStats(null)

          const studentMonthRes = await dashboardService.getStudentMonthStats({ year, month })

          if (studentMonthRes.success && studentMonthRes.data) setStudentMonthStats(studentMonthRes.data)
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [selectedMonth, canViewAdminDashboard])

  if (loading) {
    return (
      <Box className='flex items-center justify-center' sx={{ minHeight: 420 }}>
        <CircularProgress size={48} />
      </Box>
    )
  }

  const [yearText, monthText] = selectedMonth.split('-')
  const monthlyRevenue = stats?.monthlyRevenue ?? 0

  return (
    <Grid container spacing={6}>
      {canViewAdminDashboard && (
        <>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent className='flex items-center justify-between flex-wrap gap-3'>
                <Typography variant='h6'>Dashboard tổng quan</Typography>
                <FormControl size='small' sx={{ minWidth: 230 }}>
                  <InputLabel>Chọn tháng</InputLabel>
                  <Select label='Chọn tháng' value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                    {monthOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <StatCard
              title='Tổng học viên'
              value={`${stats?.activeStudents ?? 0}/${stats?.totalStudents ?? 0}`}
              icon='ri-graduation-cap-line'
              color='primary'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: '16px !important', display: 'flex', flexDirection: 'column', gap: 2, height: '100%', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant='caption' color='text.secondary'>HV mới tháng {monthText}/{yearText}</Typography>
                  <Box className='flex items-center justify-between'>
                    <Typography variant='h5' fontWeight={700}>{studentMonthStats?.newStudentsCount ?? 0}</Typography>
                    <Button size='small' variant='outlined' disabled={!studentMonthStats?.newStudentsCount}
                      onClick={() => setStudentListDialog({ open: true, title: `HV mới tháng ${monthText}/${yearText}`, list: studentMonthStats?.newStudentsList ?? [] })}>
                      Xem
                    </Button>
                  </Box>
                </Box>
                <Box>
                  <Typography variant='caption' color='text.secondary'>HV tạm nghỉ tháng {monthText}/{yearText}</Typography>
                  <Box className='flex items-center justify-between'>
                    <Typography variant='h5' fontWeight={700}>{studentMonthStats?.suspendedStudentsCount ?? 0}</Typography>
                    <Button size='small' variant='outlined' color='warning' disabled={!studentMonthStats?.suspendedStudentsCount}
                      onClick={() => setStudentListDialog({ open: true, title: `HV tạm nghỉ tháng ${monthText}/${yearText}`, list: studentMonthStats?.suspendedStudentsList ?? [] })}>
                      Xem
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}

      {!canViewAdminDashboard && (
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent className='flex items-center justify-between flex-wrap gap-3'>
              <Typography variant='h6'>Dashboard</Typography>
              <FormControl size='small' sx={{ minWidth: 230 }}>
                <InputLabel>Chọn tháng</InputLabel>
                <Select label='Chọn tháng' value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                  {monthOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title={
              <div className='flex items-center gap-2'>
                <span>Yêu cầu chờ duyệt</span>
                {(systemNotifications?.totalPending ?? 0) > 0 && (
                  <Chip
                    label={systemNotifications?.totalPending}
                    color='warning'
                    size='small'
                    sx={{ fontWeight: 700 }}
                  />
                )}
              </div>
            }
            subheader={canViewAdminDashboard ? 'Tất cả yêu cầu đang chờ bạn xử lý' : 'Tác vụ đang chờ xử lý của bạn'}
          />
          <CardContent sx={{ pt: 0 }}>
            {!canViewNotifications ? (
              <Typography color='text.secondary'>Bạn chưa được cấp quyền xem thông báo hệ thống.</Typography>
            ) : (
              <Box sx={{ maxHeight: 480, overflowY: 'auto', pr: 1 }}>
                <PendingRequests items={systemNotifications?.pendingItems ?? []} />
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Dialog
        open={studentListDialog.open}
        onClose={() => setStudentListDialog(prev => ({ ...prev, open: false }))}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>{studentListDialog.title}</DialogTitle>
        <DialogContent dividers>
          {studentListDialog.list.length === 0 ? (
            <Typography color='text.secondary'>Không có học viên.</Typography>
          ) : (
            <TableContainer component={Paper} variant='outlined'>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === 'code'}
                        direction={sortConfig.key === 'code' ? sortConfig.direction : 'asc'}
                        onClick={() => handleSort('code')}
                      >
                        Mã HV
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === 'fullName'}
                        direction={sortConfig.key === 'fullName' ? sortConfig.direction : 'asc'}
                        onClick={() => handleSort('fullName')}
                      >
                        Họ tên
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === 'className'}
                        direction={sortConfig.key === 'className' ? sortConfig.direction : 'asc'}
                        onClick={() => handleSort('className')}
                      >
                        Lớp
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedStudentList.map(student => (
                    <TableRow
                      key={student.studentId}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleViewStudent(student.studentId)}
                    >
                      <TableCell>{student.code || '-'}</TableCell>
                      <TableCell>{student.fullName}</TableCell>
                      <TableCell>{student.className}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentListDialog(prev => ({ ...prev, open: false }))}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <ViewStudentDrawer
        open={viewStudentOpen}
        onClose={() => {
          setViewStudentOpen(false)
          setSelectedStudent(null)
        }}
        student={selectedStudent}
      />
    </Grid>
  )
}

export default DashboardHome
