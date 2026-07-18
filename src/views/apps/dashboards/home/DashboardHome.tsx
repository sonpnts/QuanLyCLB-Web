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
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Badge from '@mui/material/Badge'

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

const StatusSection = ({
  title,
  emptyText,
  items
}: {
  title: string
  emptyText: string
  items: NonNullable<DashboardSystemNotificationsDto['pendingItems']>
}) => (
  <Box>
    {title && (
      <Typography variant='subtitle2' className='mb-2'>
        {title}
      </Typography>
    )}
    <div className='flex flex-col gap-2'>
      {items.length === 0 && <Typography color='text.secondary' variant='body2'>{emptyText}</Typography>}
      {items.map(item => (
        <Box key={`${item.moduleKey}-${item.recordId}`} className='border rounded p-3'>
          <div className='flex justify-between items-start gap-3'>
            <div>
              <Typography variant='body2' className='font-medium'>
                {item.title}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {item.moduleLabel} - {item.statusLabel}
              </Typography>
              {item.description && (
                <Typography variant='caption' color='text.secondary' display='block'>
                  {item.description}
                </Typography>
              )}
              {item.status === 'Rejected' && item.rejectedAt && (
                <Typography variant='caption' color='error.main' display='block' sx={{ mt: 0.5, fontSize: '0.72rem' }}>
                  Từ chối ngày {formatSmallDate(item.rejectedAt)}
                </Typography>
              )}
            </div>
            <Button component={Link} href={item.detailUrl} size='small' variant='outlined' sx={{ flexShrink: 0 }}>
              Chi tiết
            </Button>
          </div>
        </Box>
      ))}
    </div>
  </Box>
)

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
  const [notificationTab, setNotificationTab] = useState(0)

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

  useEffect(() => {
    const load = async () => {
      const [yearStr, monthStr] = selectedMonth.split('-')
      const year = Number(yearStr)
      const month = Number(monthStr)

      setLoading(true)

      try {
        if (canViewAdminDashboard) {
          const [statsRes, revenueRes, studentRes, attendanceRes, notificationRes, studentMonthRes] = await Promise.all([
            dashboardService.getStatistics({ year, month }),
            dashboardService.getRevenue({ months: 6 }),
            dashboardService.getStudentStats(),
            dashboardService.getAttendanceStats(),
            canViewNotifications
              ? dashboardService.getSystemNotifications({ year, month, maxItemsPerStatus: 10 })
              : Promise.resolve({ success: true, data: null } as any),
            dashboardService.getStudentMonthStats({ year, month })
          ])

          if (statsRes.success && statsRes.data) setStats(statsRes.data)
          if (revenueRes.success && revenueRes.data) setRevenue(revenueRes.data)
          if (studentRes.success && studentRes.data) setStudentStats(studentRes.data)
          if (attendanceRes.success && attendanceRes.data) setAttendanceStats(attendanceRes.data)
          if (notificationRes.success && notificationRes.data) setSystemNotifications(notificationRes.data)
          if (studentMonthRes.success && studentMonthRes.data) setStudentMonthStats(studentMonthRes.data)
          if (!canViewNotifications) setSystemNotifications(null)
        } else {
          setStats(null)
          setRevenue([])
          setStudentStats(null)
          setAttendanceStats(null)

          if (canViewNotifications) {
            const notificationRes = await dashboardService.getSystemNotifications({ year, month, maxItemsPerStatus: 10 })

            if (notificationRes.success && notificationRes.data) setSystemNotifications(notificationRes.data)
          } else {
            setSystemNotifications(null)
          }

          const studentMonthRes = await dashboardService.getStudentMonthStats({ year, month })

          if (studentMonthRes.success && studentMonthRes.data) setStudentMonthStats(studentMonthRes.data)
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [selectedMonth, canViewAdminDashboard, canViewNotifications])

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
            title='Thông báo hệ thống'
            subheader={canViewAdminDashboard ? 'Quản lý các yêu cầu chờ xử lý' : 'Tác vụ của bạn'}
          />
          <CardContent sx={{ pt: 0 }}>
            {!canViewNotifications ? (
              <Typography color='text.secondary'>Bạn chưa được cấp quyền xem thông báo hệ thống.</Typography>
            ) : (
              <>
                <Box className='flex gap-2 flex-wrap mb-3'>
                  <Chip
                    label={`Chờ duyệt: ${systemNotifications?.totalPending ?? 0}`}
                    color='warning'
                    variant='tonal'
                    size='small'
                  />
                  <Chip
                    label={`Đã duyệt: ${systemNotifications?.totalApproved ?? 0}`}
                    color='success'
                    variant='tonal'
                    size='small'
                  />
                  <Chip
                    label={`Từ chối: ${systemNotifications?.totalRejected ?? 0}`}
                    color='error'
                    variant='tonal'
                    size='small'
                  />
                  <Chip
                    label={`Tổng: ${systemNotifications?.totalItems ?? 0}`}
                    color='primary'
                    variant='tonal'
                    size='small'
                  />
                </Box>

                <Tabs
                  value={notificationTab}
                  onChange={(_, v) => setNotificationTab(v)}
                  sx={{ minHeight: 36, mb: 2 }}
                >
                  <Tab
                    label={
                      <Badge
                        badgeContent={systemNotifications?.totalPending ?? 0}
                        color='warning'
                        max={99}
                        sx={{ '& .MuiBadge-badge': { right: -16, top: 2 } }}
                      >
                        Chờ duyệt
                      </Badge>
                    }
                    sx={{ minHeight: 36, textTransform: 'none', fontWeight: 600 }}
                  />
                  <Tab
                    label='Đã duyệt'
                    sx={{ minHeight: 36, textTransform: 'none', fontWeight: 600 }}
                  />
                  <Tab
                    label={
                      <Badge
                        badgeContent={systemNotifications?.totalRejected ?? 0}
                        color='error'
                        max={99}
                        sx={{ '& .MuiBadge-badge': { right: -16, top: 2 } }}
                      >
                        Từ chối
                      </Badge>
                    }
                    sx={{ minHeight: 36, textTransform: 'none', fontWeight: 600 }}
                  />
                </Tabs>

                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {notificationTab === 0 && (
                    <StatusSection
                      title=''
                      emptyText='Không có yêu cầu chờ duyệt'
                      items={systemNotifications?.pendingItems ?? []}
                    />
                  )}
                  {notificationTab === 1 && (
                    <StatusSection
                      title=''
                      emptyText='Không có mục đã duyệt'
                      items={systemNotifications?.approvedItems ?? []}
                    />
                  )}
                  {notificationTab === 2 && (
                    <StatusSection
                      title=''
                      emptyText='Không có mục bị từ chối'
                      items={systemNotifications?.rejectedItems ?? []}
                    />
                  )}
                </Box>
              </>
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
