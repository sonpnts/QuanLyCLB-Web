'use client'

import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import { useTheme } from '@mui/material/styles'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'

// Services
import dashboardService from '@/services/dashboardService'
import type {
  DashboardStatisticsDto,
  RevenueStatisticsDto,
  StudentStatisticsDto,
  AttendanceStatisticsDto
} from '@/services/dashboardService'

// Components
import CustomAvatar from '@core/components/mui/Avatar'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

// ─── Format helpers ───────────────────────────────────────────────────────────

const formatCurrency = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toString()
}

const MONTH_LABELS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string
  value: string | number
  icon: string
  color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary'
  subtitle?: string
}

const StatCard = ({ title, value, icon, color, subtitle }: StatCardProps) => (
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

// ─── Revenue Chart ────────────────────────────────────────────────────────────

interface RevenueChartProps {
  data: RevenueStatisticsDto[]
}

const RevenueChart = ({ data }: RevenueChartProps) => {
  const theme = useTheme()

  const sorted = [...data].sort((a, b) => a.year * 100 + a.month - (b.year * 100 + b.month))
  const labels = sorted.map(d => MONTH_LABELS[d.month - 1])
  const tuition = sorted.map(d => Math.round(d.tuitionFees / 1_000_000))
  const examFees = sorted.map(d => Math.round(d.examFees / 1_000_000))
  const other = sorted.map(d => Math.round(d.otherFees / 1_000_000))

  const series = [
    { name: 'Học phí', data: tuition },
    { name: 'Phí thi cấp', data: examFees },
    { name: 'Khác', data: other }
  ]

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
      parentHeightOffset: 0
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '55%',
        borderRadiusApplication: 'around',
        borderRadiusWhenStacked: 'all'
      }
    },
    colors: [
      'var(--mui-palette-primary-main)',
      'var(--mui-palette-warning-main)',
      'var(--mui-palette-info-main)'
    ],
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: ['transparent'] },
    legend: {
      position: 'top',
      fontSize: '13px',
      markers: { height: 10, width: 10, radius: 10, offsetX: theme.direction === 'rtl' ? 7 : -4 },
      labels: { colors: 'var(--mui-palette-text-secondary)' },
      itemMargin: { horizontal: 10 }
    },
    xaxis: {
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: 'var(--mui-palette-text-secondary)', fontSize: '13px' } }
    },
    yaxis: {
      labels: {
        formatter: val => `${val}M`,
        style: { colors: 'var(--mui-palette-text-secondary)', fontSize: '12px' }
      }
    },
    grid: {
      borderColor: 'var(--mui-palette-divider)',
      padding: { left: 0, right: 0 }
    },
    tooltip: {
      y: { formatter: val => `${val}M ₫` }
    }
  }

  return (
    <Card>
      <CardHeader title='Doanh thu theo tháng' subheader='Đơn vị: triệu đồng' />
      <CardContent sx={{ pb: '0 !important' }}>
        <AppReactApexCharts type='bar' height={270} width='100%' series={series} options={options} />
      </CardContent>
    </Card>
  )
}

// ─── Belt Level Donut Chart ───────────────────────────────────────────────────

interface BeltChartProps {
  data: Record<string, number>
  totalStudents: number
}

const BeltLevelChart = ({ data, totalStudents }: BeltChartProps) => {
  const theme = useTheme()

  const entries = Object.entries(data).filter(([, v]) => v > 0)
  const labels = entries.map(([k]) => k || 'Chưa phân cấp')
  const values = entries.map(([, v]) => v)

  const options: ApexOptions = {
    chart: {
      type: 'donut',
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    labels,
    colors: [
      'var(--mui-palette-primary-main)',
      'var(--mui-palette-success-main)',
      'var(--mui-palette-warning-main)',
      'var(--mui-palette-error-main)',
      'var(--mui-palette-info-main)',
      'var(--mui-palette-secondary-main)'
    ],
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    legend: {
      position: 'bottom',
      fontSize: '13px',
      labels: { colors: 'var(--mui-palette-text-secondary)' },
      markers: { offsetX: theme.direction === 'rtl' ? 7 : -4 },
      itemMargin: { horizontal: 6 }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Học viên',
              fontSize: '14px',
              color: 'var(--mui-palette-text-secondary)',
              formatter: () => `${totalStudents}`
            }
          }
        }
      }
    },
    tooltip: {
      y: { formatter: val => `${val} học viên` }
    },
    responsive: [
      {
        breakpoint: 500,
        options: { chart: { width: 280 } }
      }
    ]
  }

  if (entries.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title='Phân bổ cấp đai' />
        <CardContent className='flex items-center justify-center' sx={{ minHeight: 300 }}>
          <Typography color='text.secondary'>Chưa có dữ liệu</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title='Phân bổ cấp đai' subheader={`${totalStudents} học viên đang học`} />
      <CardContent sx={{ pb: '16px !important' }}>
        <AppReactApexCharts type='donut' height={300} width='100%' series={values} options={options} />
      </CardContent>
    </Card>
  )
}

// ─── Attendance Chart ─────────────────────────────────────────────────────────

interface AttendanceChartProps {
  data: AttendanceStatisticsDto
}

const AttendanceChart = ({ data }: AttendanceChartProps) => {
  const theme = useTheme()

  const dayEntries = Object.entries(data.attendanceByDay || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)

  const labels = dayEntries.map(([k]) => {
    const d = new Date(k)
    return `${d.getDate()}/${d.getMonth() + 1}`
  })
  const values = dayEntries.map(([, v]) => v)

  const series = [{ name: 'Điểm danh', data: values }]

  const options: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      parentHeightOffset: 0,
      sparkline: { enabled: false }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0.8,
        opacityFrom: 0.6,
        opacityTo: 0.1
      }
    },
    stroke: { width: 2, curve: 'smooth' },
    colors: ['var(--mui-palette-success-main)'],
    dataLabels: { enabled: false },
    xaxis: {
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: 'var(--mui-palette-text-secondary)', fontSize: '12px' } }
    },
    yaxis: {
      labels: {
        style: { colors: 'var(--mui-palette-text-secondary)', fontSize: '12px' }
      }
    },
    grid: {
      borderColor: 'var(--mui-palette-divider)',
      padding: { left: 0, right: 0 }
    },
    tooltip: { y: { formatter: val => `${val} lượt` } }
  }

  return (
    <Card>
      <CardHeader
        title='Điểm danh 14 ngày gần nhất'
        subheader={
          <Typography variant='body2' color='text.secondary'>
            Tỉ lệ chuyên cần:{' '}
            <strong style={{ color: 'var(--mui-palette-success-main)' }}>
              {(data.attendanceRate * 100).toFixed(1)}%
            </strong>
          </Typography>
        }
      />
      <CardContent sx={{ pb: '0 !important' }}>
        {values.length > 0 ? (
          <AppReactApexCharts type='area' height={200} width='100%' series={series} options={options} />
        ) : (
          <Box className='flex items-center justify-center' sx={{ height: 200 }}>
            <Typography color='text.secondary'>Chưa có dữ liệu điểm danh</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Quick Info Cards ─────────────────────────────────────────────────────────

interface QuickInfoProps {
  stats: DashboardStatisticsDto
  studentStats: StudentStatisticsDto | null
}

const QuickInfo = ({ stats, studentStats }: QuickInfoProps) => {
  const items = [
    {
      label: 'Chờ chuyển lớp',
      value: stats.pendingTransfers,
      icon: 'ri-arrow-left-right-line',
      color: 'warning' as const
    },
    {
      label: 'Kỳ thi sắp tới',
      value: stats.upcomingExams,
      icon: 'ri-medal-line',
      color: 'info' as const
    },
    {
      label: 'Học viên tạm nghỉ',
      value: studentStats ? studentStats.totalStudents - studentStats.activeStudents : 0,
      icon: 'ri-pause-circle-line',
      color: 'secondary' as const
    },
    {
      label: 'Học viên mới tháng này',
      value: studentStats?.newStudentsThisMonth ?? 0,
      icon: 'ri-user-add-line',
      color: 'success' as const
    }
  ]

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title='Thông tin nhanh' />
      <CardContent className='flex flex-col gap-4'>
        {items.map(item => (
          <Box key={item.label} className='flex items-center justify-between'>
            <Box className='flex items-center gap-3'>
              <CustomAvatar color={item.color} skin='light' size={40} variant='rounded'>
                <i className={`${item.icon} text-lg`} />
              </CustomAvatar>
              <Typography color='text.primary'>{item.label}</Typography>
            </Box>
            <Chip
              label={item.value}
              color={item.value > 0 ? item.color : 'default'}
              size='small'
              variant='tonal'
            />
          </Box>
        ))}
      </CardContent>
    </Card>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DashboardHome = () => {
  const [stats, setStats] = useState<DashboardStatisticsDto | null>(null)
  const [revenue, setRevenue] = useState<RevenueStatisticsDto[]>([])
  const [studentStats, setStudentStats] = useState<StudentStatisticsDto | null>(null)
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStatisticsDto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [statsRes, revenueRes, studentRes, attendanceRes] = await Promise.all([
          dashboardService.getStatistics(),
          dashboardService.getRevenue({ months: 6 }),
          dashboardService.getStudentStats(),
          dashboardService.getAttendanceStats()
        ])

        if (statsRes.success && statsRes.data) setStats(statsRes.data)
        if (revenueRes.success && revenueRes.data) setRevenue(revenueRes.data)
        if (studentRes.success && studentRes.data) setStudentStats(studentRes.data)
        if (attendanceRes.success && attendanceRes.data) setAttendanceStats(attendanceRes.data)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [])

  if (loading) {
    return (
      <Box className='flex items-center justify-center' sx={{ minHeight: 400 }}>
        <CircularProgress size={48} />
      </Box>
    )
  }

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  return (
    <Grid container spacing={6}>
      {/* ── Stat Cards ── */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title='Tổng học viên'
          value={stats?.totalStudents ?? 0}
          icon='ri-graduation-cap-line'
          color='primary'
          subtitle={`${stats?.activeStudents ?? 0} đang học`}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title='Lớp học hoạt động'
          value={stats?.activeClasses ?? 0}
          icon='ri-community-line'
          color='success'
          subtitle={`Tổng ${stats?.totalClasses ?? 0} lớp`}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title={`Doanh thu tháng ${currentMonth}/${currentYear}`}
          value={stats ? formatCurrency(stats.monthlyRevenue) + ' ₫' : '0 ₫'}
          icon='ri-money-dollar-circle-line'
          color='warning'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title='Huấn luyện viên'
          value={stats?.totalInstructors ?? 0}
          icon='ri-user-star-line'
          color='info'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title='Chi nhánh'
          value={stats?.totalBranches ?? 0}
          icon='ri-map-pin-line'
          color='secondary'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <StatCard
          title='Điểm danh hôm nay'
          value={stats?.todayAttendance ?? 0}
          icon='ri-calendar-check-line'
          color='error'
          subtitle='lượt điểm danh'
        />
      </Grid>

      {/* ── Revenue Chart ── */}
      <Grid size={{ xs: 12, md: 8 }}>
        {revenue.length > 0 ? (
          <RevenueChart data={revenue} />
        ) : (
          <Card>
            <CardHeader title='Doanh thu theo tháng' />
            <CardContent className='flex items-center justify-center' sx={{ minHeight: 300 }}>
              <Typography color='text.secondary'>Chưa có dữ liệu doanh thu</Typography>
            </CardContent>
          </Card>
        )}
      </Grid>

      {/* ── Quick Info ── */}
      <Grid size={{ xs: 12, md: 4 }}>
        {stats && <QuickInfo stats={stats} studentStats={studentStats} />}
      </Grid>

      {/* ── Belt Level Chart ── */}
      <Grid size={{ xs: 12, md: 5 }}>
        <BeltLevelChart
          data={studentStats?.studentsByBeltLevel ?? {}}
          totalStudents={studentStats?.activeStudents ?? 0}
        />
      </Grid>

      {/* ── Attendance Chart ── */}
      <Grid size={{ xs: 12, md: 7 }}>
        {attendanceStats ? (
          <AttendanceChart data={attendanceStats} />
        ) : (
          <Card>
            <CardHeader title='Điểm danh 14 ngày gần nhất' />
            <CardContent className='flex items-center justify-center' sx={{ minHeight: 230 }}>
              <Typography color='text.secondary'>Chưa có dữ liệu điểm danh</Typography>
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  )
}

export default DashboardHome
