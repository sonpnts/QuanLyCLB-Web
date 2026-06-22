'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import branchService from '@/services/branchService'
import classService from '@/services/classService'
import financeService from '@/services/financeService'
import userService from '@/services/userService'
import type { BranchType } from '@/types/apps/branchTypes'
import type { ClassType } from '@/types/apps/classTypes'
import type { InstructorClassCollectionType } from '@/types/apps/financeTypes'
import type { UsersType } from '@/types/apps/userTypes'
import { formatDateVN } from '@/utils/dateTime'
import { exportToExcel, formatVnCurrency, formatVnDate } from '@/utils/exportToExcel'
import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'

import tableStyles from '@core/styles/table.module.css'

type StatisticsMode = 'all' | 'class' | 'branch' | 'instructor'
type TimePreset = 'thisMonth' | 'lastMonth' | 'custom'

type SummaryCardProps = {
  title: string
  amount: number
  color?: string
  subtitle?: string
}

type SummaryTotals = {
  tuitionTotal: number
  examFeeTotal: number
  productSalesTotal: number
  coachCollectedTotal: number
  handedOverTotal: number
}

const pad2 = (value: number) => String(value).padStart(2, '0')

const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`

const getPresetRange = (preset: TimePreset) => {
  const now = new Date()

  if (preset === 'lastMonth') {
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    return {
      fromDate: toDateInputValue(firstDayLastMonth),
      toDate: toDateInputValue(lastDayLastMonth),
      asOfDate: toDateInputValue(lastDayLastMonth)
    }
  }

  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  return {
    fromDate: toDateInputValue(firstDayThisMonth),
    toDate: toDateInputValue(now),
    asOfDate: toDateInputValue(now)
  }
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const SummaryCard = ({ title, amount, color = 'success.main', subtitle }: SummaryCardProps) => (
  <Card variant='outlined' sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant='body2' color='text.secondary' gutterBottom>
        {title}
      </Typography>
      <Typography variant='h5' color={color} sx={{ mt: 1, fontWeight: 700 }}>
        {formatCurrency(amount)}
      </Typography>
      {subtitle ? (
        <Typography variant='caption' color='text.secondary'>
          {subtitle}
        </Typography>
      ) : null}
    </CardContent>
  </Card>
)

const emptyTotals = (): SummaryTotals => ({
  tuitionTotal: 0,
  examFeeTotal: 0,
  productSalesTotal: 0,
  coachCollectedTotal: 0,
  handedOverTotal: 0
})

const FinanceSummaryView = () => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()
  const router = useRouter()

  const isAdmin = hasPermission(auth?.permissions, 'Finance.View') || hasAdminRole(auth?.roles)

  const [classes, setClasses] = useState<ClassType[]>([])
  const [branches, setBranches] = useState<BranchType[]>([])
  const [instructors, setInstructors] = useState<UsersType[]>([])
  const [loading, setLoading] = useState(false)

  const [filters, setFilters] = useState({
    statisticsMode: (isAdmin ? 'all' : 'instructor') as StatisticsMode,
    timePreset: 'thisMonth' as TimePreset,
    classId: '',
    branchId: '',
    instructorId: '',
    ...getPresetRange('thisMonth')
  })

  const [totals, setTotals] = useState<SummaryTotals>(emptyTotals)
  const [collections, setCollections] = useState<InstructorClassCollectionType[]>([])

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      statisticsMode: isAdmin ? prev.statisticsMode : 'instructor'
    }))
  }, [isAdmin])

  useEffect(() => {
    if (filters.timePreset === 'custom') return

    const nextRange = getPresetRange(filters.timePreset)

    setFilters(prev => ({
      ...prev,
      ...nextRange
    }))
  }, [filters.timePreset])

  useEffect(() => {
    let mounted = true

    const loadReferences = async () => {
      try {
        const [classRes, branchRes, instructorRes] = await Promise.all([
          classService.getClasses({ isActive: true, pageSize: 1000 }),
          branchService.getBranches({ IsActive: true, PageSize: 1000 }),
          userService.getCoaches()
        ])

        if (!mounted) return

        const nextClasses = classRes.success && classRes.data ? classRes.data : []
        const nextBranches = branchRes.success && branchRes.data ? branchRes.data : []
        const nextInstructors = instructorRes.success && instructorRes.data ? instructorRes.data : []
        const currentUserInstructorId = nextInstructors.find(item => item.id === auth?.user?.id)?.id || auth?.user?.id || ''

        setClasses(nextClasses)
        setBranches(nextBranches)
        setInstructors(nextInstructors)
        setFilters(prev => ({
          ...prev,
          instructorId: prev.instructorId || currentUserInstructorId
        }))
      } catch {
        if (mounted) {
          showNotification('Không thể tải dữ liệu danh mục thống kê.', 'error')
        }
      }
    }

    loadReferences()

    return () => {
      mounted = false
    }
  }, [auth?.user?.id, showNotification])

  const classIdsByBranch = useMemo(() => {
    return classes.reduce<Record<string, string[]>>((accumulator, item) => {
      const branchId = item.branchId || item.branch?.id

      if (!branchId) return accumulator

      if (!accumulator[branchId]) {
        accumulator[branchId] = []
      }

      accumulator[branchId].push(item.id)
      
return accumulator
    }, {})
  }, [classes])

  const selectedBranchClassIds = useMemo(() => {
    if (!filters.branchId) return []
    
return classIdsByBranch[filters.branchId] || []
  }, [classIdsByBranch, filters.branchId])

  const modeRequiresSelection = useMemo(() => {
    if (filters.statisticsMode === 'class') return Boolean(filters.classId)
    if (filters.statisticsMode === 'branch') return Boolean(filters.branchId)
    if (filters.statisticsMode === 'instructor') return Boolean(filters.instructorId)
    
return true
  }, [filters.branchId, filters.classId, filters.instructorId, filters.statisticsMode])

  const getModeLabel = (mode: StatisticsMode) => {
    switch (mode) {
      case 'all':
        return 'Tất cả'
      case 'class':
        return 'Theo lớp'
      case 'branch':
        return 'Theo chi nhánh'
      case 'instructor':
        return 'Theo HLV'
      default:
        return 'Tất cả'
    }
  }

  const getTimePresetLabel = (preset: TimePreset) => {
    switch (preset) {
      case 'thisMonth':
        return 'tháng này'
      case 'lastMonth':
        return 'tháng trước'
      case 'custom':
        return 'thời gian tùy chỉnh'
      default:
        return 'tháng này'
    }
  }

  const loadCollectionsForMode = useCallback(async (): Promise<InstructorClassCollectionType[]> => {
    if (filters.statisticsMode === 'instructor') {
      if (!filters.instructorId) return []
      const response = await financeService.getClassCollectionsByInstructor(filters.instructorId, filters.asOfDate || undefined)

      
return response.success && response.data ? response.data : []
    }

    const instructorIds = instructors.map(item => item.id).filter(Boolean)

    if (instructorIds.length === 0) return []

    const responses = await Promise.all(
      instructorIds.map(instructorId => financeService.getClassCollectionsByInstructor(instructorId, filters.asOfDate || undefined))
    )

    let rows = responses.flatMap(response => (response.success && response.data ? response.data : []))

    if (filters.statisticsMode === 'class' && filters.classId) {
      rows = rows.filter(item => item.classId === filters.classId)
    }

    if (filters.statisticsMode === 'branch' && filters.branchId) {
      const classIds = new Set(selectedBranchClassIds)

      rows = rows.filter(item => classIds.has(item.classId))
    }

    return rows
  }, [filters.asOfDate, filters.branchId, filters.classId, filters.instructorId, filters.statisticsMode, instructors, selectedBranchClassIds])

  const loadSummary = useCallback(async () => {
    if (!modeRequiresSelection) {
      setTotals(emptyTotals())
      setCollections([])
      
return
    }

    try {
      setLoading(true)

      const summaryParams = {
        classId: filters.statisticsMode === 'class' ? filters.classId || undefined : undefined,
        branchId: filters.statisticsMode === 'branch' ? filters.branchId || undefined : undefined,
        instructorId: filters.statisticsMode === 'instructor' ? filters.instructorId || undefined : undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined
      }

      const [summaryRes, collectionRows] = await Promise.all([
        financeService.getTransactionSummary(summaryParams),
        loadCollectionsForMode()
      ])

      const summary = summaryRes.success && summaryRes.data ? summaryRes.data : null

      setTotals({
        tuitionTotal: summary?.tuitionTotal || 0,
        examFeeTotal: summary?.examFeeTotal || 0,
        productSalesTotal: summary?.productSalesTotal || 0,
        coachCollectedTotal: summary?.receiptTotal || 0,
        handedOverTotal: summary?.handedOverTotal || 0
      })

      setCollections(collectionRows)
    } catch {
      showNotification('Không thể tải dữ liệu thống kê tài chính.', 'error')
      setTotals(emptyTotals())
      setCollections([])
    } finally {
      setLoading(false)
    }
  }, [filters.branchId, filters.classId, filters.fromDate, filters.instructorId, filters.statisticsMode, filters.toDate, loadCollectionsForMode, modeRequiresSelection, showNotification])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const modeDescription = useMemo(() => {
    switch (filters.statisticsMode) {
      case 'class': {
        const className = classes.find(item => item.id === filters.classId)?.name

        
return className
          ? `Đang thống kê theo lớp ${className}, theo ${getTimePresetLabel(filters.timePreset)}.`
          : 'Vui lòng chọn lớp để xem thống kê.'
      }

      case 'branch': {
        const branchName = branches.find(item => item.id === filters.branchId)?.name

        
return branchName
          ? `Đang thống kê theo chi nhánh ${branchName}, theo ${getTimePresetLabel(filters.timePreset)}.`
          : 'Vui lòng chọn chi nhánh để xem thống kê.'
      }

      case 'instructor': {
        const instructorName = instructors.find(item => item.id === filters.instructorId)?.fullName

        
return instructorName
          ? `Đang thống kê theo HLV ${instructorName}, theo ${getTimePresetLabel(filters.timePreset)}.`
          : 'Vui lòng chọn HLV để xem thống kê.'
      }

      case 'all':
      default:
        return `Đang thống kê toàn bộ dữ liệu trong phạm vi bạn được phép xem, theo ${getTimePresetLabel(filters.timePreset)}.`
    }
  }, [branches, classes, filters.branchId, filters.classId, filters.instructorId, filters.statisticsMode, filters.timePreset, instructors])

  const handleModeChange = (mode: StatisticsMode) => {
    setFilters(prev => ({
      ...prev,
      statisticsMode: mode,
      classId: mode === 'class' ? prev.classId : '',
      branchId: mode === 'branch' ? prev.branchId : '',
      instructorId: mode === 'instructor' ? (prev.instructorId || auth?.user?.id || '') : prev.instructorId
    }))
  }

  const handleTimePresetChange = (preset: TimePreset) => {
    if (preset === 'custom') {
      setFilters(prev => ({
        ...prev,
        timePreset: preset
      }))
      
return
    }

    setFilters(prev => ({
      ...prev,
      timePreset: preset,
      ...getPresetRange(preset)
    }))
  }

  const exportReport = () => {
    const summaryRows = [
      { ten: 'Tổng học phí đã thu', soTien: totals.tuitionTotal },
      { ten: 'Tổng lệ phí thi cấp đã thu', soTien: totals.examFeeTotal },
      { ten: 'Tổng doanh thu bán sản phẩm', soTien: totals.productSalesTotal },
      { ten: 'Tổng tiền theo biên lai', soTien: totals.coachCollectedTotal },
      { ten: 'Tổng tiền đã bàn giao', soTien: totals.handedOverTotal }
    ]

    exportToExcel({
      filename: `thong-ke-tai-chinh_${filters.statisticsMode}`,
      rows: summaryRows,
      columns: [
        { header: 'Chỉ số', accessor: 'ten' },
        { header: 'Số tiền (VNĐ)', accessor: 'soTien', formatter: formatVnCurrency }
      ]
    })

    if (collections.length > 0) {
      exportToExcel({
        filename: `thong-ke-tai-chinh_chi-tiet_${filters.statisticsMode}`,
        rows: collections,
        columns: [
          { header: 'HLV', accessor: row => row.instructorName || row.instructorId },
          { header: 'Lớp', accessor: row => row.className || row.classId },
          { header: 'Tổng thu (final)', accessor: 'totalCollectedToDate', formatter: formatVnCurrency },
          { header: 'Giảm trừ', accessor: 'totalDiscountAmount', formatter: formatVnCurrency },
          { header: 'Giảm trừ HLV', accessor: 'totalManualDiscountAmount', formatter: formatVnCurrency },
          { header: 'Đã bàn giao', accessor: 'totalHandedOver', formatter: formatVnCurrency },
          { header: 'Còn lại', accessor: 'availableToHandover', formatter: formatVnCurrency },
          { header: 'Số biên lai', accessor: 'invoiceCount' },
          { header: 'Tính đến ngày', accessor: 'asOf', formatter: formatVnDate }
        ]
      })
    }

    showNotification('Đã xuất báo cáo tài chính ra file Excel.', 'success')
  }

  return (
    <Stack spacing={5}>
      <Card>
        <CardHeader title='Thống kê tài chính' subheader='Chọn phạm vi thống kê và mốc thời gian cần xem.' />
        <Divider />
        <CardContent>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Kiểu thống kê</InputLabel>
                <Select
                  label='Kiểu thống kê'
                  value={filters.statisticsMode}
                  onChange={event => handleModeChange(event.target.value as StatisticsMode)}
                >
                  {isAdmin ? <MenuItem value='all'>Tất cả</MenuItem> : null}
                  {isAdmin ? <MenuItem value='class'>Theo lớp</MenuItem> : null}
                  {isAdmin ? <MenuItem value='branch'>Theo chi nhánh</MenuItem> : null}
                  <MenuItem value='instructor'>Theo HLV</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Thời gian thống kê</InputLabel>
                <Select
                  label='Thời gian thống kê'
                  value={filters.timePreset}
                  onChange={event => handleTimePresetChange(event.target.value as TimePreset)}
                >
                  <MenuItem value='thisMonth'>Tháng này</MenuItem>
                  <MenuItem value='lastMonth'>Tháng trước</MenuItem>
                  <MenuItem value='custom'>Tùy chỉnh</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {filters.statisticsMode === 'class' ? (
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Lớp</InputLabel>
                  <Select
                    label='Lớp'
                    value={filters.classId}
                    onChange={event => setFilters(prev => ({ ...prev, classId: String(event.target.value) }))}
                  >
                    {classes.map(item => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ) : null}

            {filters.statisticsMode === 'branch' ? (
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Chi nhánh</InputLabel>
                  <Select
                    label='Chi nhánh'
                    value={filters.branchId}
                    onChange={event => setFilters(prev => ({ ...prev, branchId: String(event.target.value) }))}
                  >
                    {branches.map(item => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ) : null}

            {filters.statisticsMode === 'instructor' ? (
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Huấn luyện viên</InputLabel>
                  <Select
                    label='Huấn luyện viên'
                    value={filters.instructorId}
                    onChange={event => setFilters(prev => ({ ...prev, instructorId: String(event.target.value) }))}
                  >
                    {instructors.map(item => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.fullName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ) : null}

            {filters.timePreset === 'custom' ? (
              <>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type='date'
                    label='Từ ngày'
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={filters.fromDate}
                    onChange={event =>
                      setFilters(prev => ({
                        ...prev,
                        fromDate: event.target.value
                      }))
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type='date'
                    label='Đến ngày'
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={filters.toDate}
                    onChange={event =>
                      setFilters(prev => ({
                        ...prev,
                        toDate: event.target.value,
                        asOfDate: event.target.value || prev.asOfDate
                      }))
                    }
                  />
                </Grid>
              </>
            ) : (
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Khoảng thời gian áp dụng'
                  value={`${filters.fromDate || '--'} đến ${filters.toDate || '--'}`}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
            )}
          </Grid>

          <Box className='mt-4 flex gap-2 flex-wrap'>
            <Button variant='contained' onClick={loadSummary} startIcon={<i className='ri-refresh-line' />}>
              Làm mới thống kê
            </Button>
            {isAdmin ? (
              <Button
                variant='outlined'
                color='primary'
                startIcon={<i className='ri-file-list-3-line' />}
                onClick={() => router.push('/apps/finance/payments/discounts')}
              >
                Biên lai có giảm trừ
              </Button>
            ) : null}
            <Button
              variant='outlined'
              color='success'
              startIcon={<i className='ri-file-excel-2-line' />}
              disabled={loading}
              onClick={exportReport}
            >
              Xuất báo cáo Excel
            </Button>
          </Box>

          <Box className='mt-4'>
            <Alert severity={modeRequiresSelection ? 'info' : 'warning'}>{modeDescription}</Alert>
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className='flex items-center justify-center py-10'>
            <CircularProgress />
          </CardContent>
        </Card>
      ) : !modeRequiresSelection ? (
        <Alert severity='warning'>Vui lòng chọn đủ thông tin cho kiểu thống kê {getModeLabel(filters.statisticsMode).toLowerCase()}.</Alert>
      ) : (
        <>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, sm: 6, md: 4, xl: 2.4 }}>
              <SummaryCard title='Tổng học phí đã thu' amount={totals.tuitionTotal} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, xl: 2.4 }}>
              <SummaryCard title='Tổng lệ phí thi cấp đã thu' amount={totals.examFeeTotal} color='primary.main' />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, xl: 2.4 }}>
              <SummaryCard title='Tổng doanh thu bán sản phẩm' amount={totals.productSalesTotal} color='info.main' />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, xl: 2.4 }}>
              <SummaryCard title='Tổng tiền theo biên lai' amount={totals.coachCollectedTotal} color='warning.main' />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, xl: 2.4 }}>
              <SummaryCard title='Tổng tiền đã bàn giao' amount={totals.handedOverTotal} color='secondary.main' />
            </Grid>
          </Grid>

          <Card>
            <CardHeader title={`Chi tiết thống kê ${getModeLabel(filters.statisticsMode).toLowerCase()}`} />
            <Divider />
            <CardContent>
              <div className='overflow-x-auto'>
                <table className={tableStyles.table}>
                  <thead>
                    <tr>
                      <th>HLV</th>
                      <th>Lớp</th>
                      <th>Học phí thu được</th>
                      <th>Lệ phí thi</th>
                      <th>Các khoản thu khác</th>
                      <th>Bán sản phẩm</th>
                      <th>Tổng thu</th>
                      <th>Đã bàn giao</th>
                      <th>Còn lại</th>
                      <th>Tính đến</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collections.length === 0 ? (
                      <tr>
                        <td className='text-center' colSpan={10}>
                          Không có dữ liệu
                        </td>
                      </tr>
                    ) : (
                      collections.map(item => (
                        <tr key={`${item.instructorId}-${item.classId}`}>
                          <td>{item.instructorName || item.instructorId}</td>
                          <td>
                            <Typography variant='body2' className='font-medium'>
                              {item.className || item.classId}
                            </Typography>
                          </td>
                          <td>
                            <Typography variant='body2' color='success.main' className='font-medium'>
                              {formatCurrency(item.totalCollectedToDate)}
                            </Typography>
                          </td>
                          <td>{formatCurrency(item.totalDiscountAmount)}</td>
                          <td>{formatCurrency(item.totalManualDiscountAmount)}</td>
                          <td>{formatCurrency(item.totalHandedOver)}</td>
                          <td>
                            <Typography
                              variant='body2'
                              color={item.availableToHandover > 0 ? 'warning.main' : 'text.secondary'}
                            >
                              {formatCurrency(item.availableToHandover)}
                            </Typography>
                          </td>
                          <td>
                            <Typography variant='body2' color='text.secondary'>
                              {formatDateVN(item.asOf)}
                            </Typography>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </Stack>
  )
}

export default FinanceSummaryView
