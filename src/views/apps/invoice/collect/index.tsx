'use client'

import { useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Select from '@mui/material/Select'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import paymentService from '@/services/paymentService'
import type { AdminPaymentSummaryType, ClassPaymentSummary, CoachPaymentSummaryType } from '@/types/apps/paymentSummaryTypes'
import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'
import { savePaymentInvoiceDraft } from '@/utils/paymentDraft'
import { exportToExcel, formatVnCurrency } from '@/utils/exportToExcel'
import useStudentViewDrawer from '@/views/apps/student/list/useStudentViewDrawer'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const YEARS = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i)

const toSafeNumber = (value: unknown): number => {
  const num = Number(value)

  return Number.isFinite(num) ? num : 0
}

const SummaryStatCard = ({
  title,
  value,
  subtitle,
  color = 'primary.main'
}: {
  title: string
  value: string
  subtitle?: string
  color?: string
}) => (
  <Card variant='outlined' sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant='body2' color='text.secondary' gutterBottom>
        {title}
      </Typography>
      <Typography variant='h5' sx={{ color, fontWeight: 700 }}>
        {value}
      </Typography>
      {subtitle ? (
        <Typography variant='caption' color='text.secondary'>
          {subtitle}
        </Typography>
      ) : null}
    </CardContent>
  </Card>
)

const PaymentCollectView = () => {
  const router = useRouter()
  const { auth } = useAuth()
  const { showNotification } = useNotification()
  const { openStudentDrawer, studentDrawerElement } = useStudentViewDrawer()
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [summary, setSummary] = useState<CoachPaymentSummaryType | AdminPaymentSummaryType | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Filter + pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [branchFilter, setBranchFilter] = useState<string>('')

  // Default: only show classes that still have unpaid items
  const [unpaidOnlyFilter, setUnpaidOnlyFilter] = useState<boolean>(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const isAdmin = hasPermission(auth?.permissions, 'Payment.Collect.ManageAll') || hasAdminRole(auth?.roles)

  useEffect(() => {
    loadSummary()
  }, [month, year, isAdmin])

  const loadSummary = async () => {
    try {
      setLoading(true)

      const result = isAdmin
        ? await paymentService.getSummaryForAdmin(month, year)
        : await paymentService.getSummaryForCoach(month, year)

      if (result.success && result.data) {
        setSummary(result.data)
      } else {
        showNotification(result.message || 'Không thể tải dữ liệu', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const isAdminSummary = (value: CoachPaymentSummaryType | AdminPaymentSummaryType | null): value is AdminPaymentSummaryType =>
    Boolean(value && 'overallTuition' in value && 'totalExpectedAmount' in value)

  const toggleTuitionSection = (cls: ClassPaymentSummary) => {
    const key = `tuition-${cls.classId}`
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Danh sách chi nhánh duy nhất từ classes (cho dropdown filter)
  const branchOptions = useMemo(() => {
    if (!summary?.classes) return [] as { id: string; name: string }[]
    const map = new Map<string, string>()

    for (const cls of summary.classes) {
      if (cls.branchId && cls.branchName) map.set(cls.branchId, cls.branchName)
    }

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [summary])

  // Áp dụng filter
  const filteredClasses = useMemo(() => {
    if (!summary?.classes) return [] as ClassPaymentSummary[]
    const q = searchQuery.trim().toLowerCase()

    return summary.classes.filter(cls => {
      // Search theo tên lớp HOẶC tên chi nhánh
      if (q) {
        const matchName = cls.className?.toLowerCase().includes(q)
        const matchBranch = cls.branchName?.toLowerCase().includes(q)

        if (!matchName && !matchBranch) return false
      }
      // Filter theo chi nhánh
      if (branchFilter && cls.branchId !== branchFilter) return false

      // Chỉ hiển thị lớp còn công nợ
      if (unpaidOnlyFilter) {
        const totalUnpaid =
          toSafeNumber(cls.tuition?.unpaidAmount) +
          (cls.examFees ?? []).reduce((acc, ef) => acc + toSafeNumber(ef.unpaidAmount), 0)

        if (totalUnpaid <= 0) return false
      }
      return true
    })
  }, [summary, searchQuery, branchFilter, unpaidOnlyFilter])

  const totalUnpaidAmount = useMemo(() => {
    if (!summary) return 0

    return isAdminSummary(summary) ? toSafeNumber(summary.totalUnpaid) : toSafeNumber(summary.grandTotalUnpaid)
  }, [summary])

  // Pagination (pageSize=0 -> hiển thị tất cả)
  const effectivePageSize = pageSize === 0 ? filteredClasses.length || 1 : pageSize
  const totalPages = Math.max(1, Math.ceil(filteredClasses.length / effectivePageSize))
  const currentPage = Math.min(page, totalPages)

  const pagedClasses = useMemo(
    () =>
      pageSize === 0
        ? filteredClasses
        : filteredClasses.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize),
    [filteredClasses, currentPage, effectivePageSize, pageSize]
  )

  // Reset về trang 1 khi filter hoặc pageSize thay đổi
  useEffect(() => {
    setPage(1)
  }, [searchQuery, branchFilter, unpaidOnlyFilter, pageSize, month, year])

  const handleOpenCreateInvoice = (payload: {
    classId: string
    className: string
    studentId: string
    studentName: string
    tuitionAmount: number
    examFeeAmount: number
  }) => {
    const draftKey = savePaymentInvoiceDraft({
      classId: payload.classId,
      className: payload.className,
      studentId: payload.studentId,
      studentName: payload.studentName,
      forMonth: month,
      forYear: year,
      initialMode: payload.tuitionAmount > 0 ? 'tuition' : payload.examFeeAmount > 0 ? 'exam' : 'blank'
    })

    router.push(`/apps/invoice/add?draft=${encodeURIComponent(draftKey)}`)
  }

  const handleExportUnpaidStudents = () => {
    if (!summary) return

    const exportRows: {
      className: string
      branchName: string
      studentName: string
      tuitionAmount: number
      examFeeAmount: number
      totalUnpaid: number
    }[] = []

    for (const cls of filteredClasses) {
      const tuitionAmountByStudentId = new Map(
        (cls.tuition?.unpaidStudents ?? []).map(student => [student.studentId, Number(student.amount || 0)])
      )

      const examFeeSummaryByStudentId = (cls.examFees ?? [])
        .filter(ef => Boolean(ef.isCollectable))
        .flatMap(ef => ef.unpaidStudents ?? [])
        .reduce(
          (acc, student) => {
            const current = acc.get(student.studentId) ?? {
              studentId: student.studentId,
              studentName: student.studentName,
              examFeeAmount: 0
            }

            current.examFeeAmount += Number(student.amount || 0)
            acc.set(student.studentId, current)

            return acc
          },
          new Map<string, { studentId: string; studentName: string; examFeeAmount: number }>()
        )

      const mergedStudents = Array.from(
        new Set([...tuitionAmountByStudentId.keys(), ...examFeeSummaryByStudentId.keys()])
      )
        .map(studentId => {
          const tuitionAmount = tuitionAmountByStudentId.get(studentId) ?? 0
          const examFeeSummary = examFeeSummaryByStudentId.get(studentId)

          return {
            className: cls.className || '',
            branchName: cls.branchName || '',
            studentName:
              cls.tuition?.unpaidStudents?.find(student => student.studentId === studentId)?.studentName ||
              examFeeSummary?.studentName ||
              'Học viên',
            tuitionAmount,
            examFeeAmount: examFeeSummary?.examFeeAmount ?? 0,
            totalUnpaid: tuitionAmount + (examFeeSummary?.examFeeAmount ?? 0)
          }
        })
        .filter(student => student.tuitionAmount > 0 || student.examFeeAmount > 0)

      exportRows.push(...mergedStudents)
    }

    if (exportRows.length === 0) {
      showNotification('Không có dữ liệu để xuất', 'info')

      return
    }

    exportRows.sort((a, b) => a.className.localeCompare(b.className, 'vi') || a.studentName.localeCompare(b.studentName, 'vi'))

    exportToExcel({
      filename: `CongNo_HocPhi_${month}_${year}`,
      sheetName: 'Công nợ học phí',
      columns: [
        { header: 'Lớp', accessor: 'className', width: 25 },
        { header: 'Chi nhánh', accessor: 'branchName', width: 20 },
        { header: 'Học viên', accessor: 'studentName', width: 25 },
        { header: 'Học phí nợ', accessor: 'tuitionAmount', formatter: v => formatVnCurrency(Number(v || 0)), width: 18 },
        { header: 'Lệ phí nợ', accessor: 'examFeeAmount', formatter: v => formatVnCurrency(Number(v || 0)), width: 18 },
        { header: 'Tổng nợ', accessor: 'totalUnpaid', formatter: v => formatVnCurrency(Number(v || 0)), width: 18 }
      ],
      rows: exportRows
    })

    showNotification(`Đã xuất ${exportRows.length} học viên nợ học phí`, 'success')
  }

  return (
    <Box>
      <Typography variant='h5' className='mb-4'>
        Thu tiền - Tổng hợp công nợ
      </Typography>

      {/* Chọn tháng/năm */}
      <Box className='flex gap-3 mb-4 flex-wrap items-center'>
        <FormControl size='small' sx={{ minWidth: 120 }}>
          <InputLabel>Tháng</InputLabel>
          <Select value={month} label='Tháng' onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map(m => (
              <MenuItem key={m} value={m}>
                Tháng {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size='small' sx={{ minWidth: 100 }}>
          <InputLabel>Năm</InputLabel>
          <Select value={year} label='Năm' onChange={e => setYear(Number(e.target.value))}>
            {YEARS.map(y => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant='outlined'
          onClick={loadSummary}
          startIcon={loading ? <CircularProgress size={16} /> : <i className='ri-refresh-line' />}
          disabled={loading}
        >
          Làm mới
        </Button>
      </Box>

      {loading ? (
        <Box className='flex justify-center p-8'>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {summary && isAdmin && isAdminSummary(summary) ? (
            <Grid container spacing={4} className='mb-4'>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <SummaryStatCard
                  title='Tổng tiền dự kiến'
                  value={`${toSafeNumber(summary.totalExpectedAmount).toLocaleString('vi-VN')}đ`}
                  subtitle={`Học phí dự kiến tháng ${month}/${year}`}
                  color='primary.main'
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <SummaryStatCard
                  title='Tổng tiền HLV đã thu'
                  value={`${toSafeNumber(summary.totalCollectedByCoaches).toLocaleString('vi-VN')}đ`}
                  subtitle='Bao gồm thu học phí, lệ phí và bán sản phẩm'
                  color='success.main'
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <SummaryStatCard
                  title='Tổng tiền đã bàn giao'
                  value={`${toSafeNumber(summary.totalHandedOver).toLocaleString('vi-VN')}đ`}
                  subtitle={`Phiếu bàn giao trong tháng ${month}/${year}`}
                  color='info.main'
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <SummaryStatCard
                  title='Số học viên chưa nộp học phí'
                  value={toSafeNumber(summary.unpaidTuitionStudentCount).toLocaleString('vi-VN')}
                  subtitle='Đếm theo công nợ học phí tháng'
                  color='warning.main'
                />
              </Grid>
            </Grid>
          ) : null}

          {/* Tổng tiền cần thu */}
          {summary && (
            <Card className='mb-4' sx={{ bgcolor: 'primary.main' }}>
              <CardContent className='flex justify-between items-center'>
                <Box>
                  <Typography variant='h4' color='white'>
                    {totalUnpaidAmount.toLocaleString('vi-VN')}đ
                  </Typography>
                  <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Tổng tiền còn phải thu - Tháng {month}/{year}
                  </Typography>
                </Box>
                <i className='ri-money-dollar-circle-line text-7xl' style={{ opacity: 0.15, color: 'white' }} />
              </CardContent>
            </Card>
          )}

          {/* Filter + Search bar */}
          {summary && (summary.classes ?? []).length > 0 && (
            <Card className='mb-4'>
              <CardContent>
                <Box className='flex flex-wrap gap-3 items-center'>
                  <TextField
                    size='small'
                    placeholder='Tìm theo tên lớp hoặc chi nhánh...'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    sx={{ minWidth: 280, flex: 1 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <i className='ri-search-line text-textSecondary' />
                        </InputAdornment>
                      ),
                      endAdornment: searchQuery ? (
                        <InputAdornment position='end'>
                          <i
                            className='ri-close-circle-line cursor-pointer text-textSecondary'
                            onClick={() => setSearchQuery('')}
                          />
                        </InputAdornment>
                      ) : null
                    }}
                  />
                  <FormControl size='small' sx={{ minWidth: 200 }}>
                    <InputLabel>Chi nhánh</InputLabel>
                    <Select value={branchFilter} label='Chi nhánh' onChange={e => setBranchFilter(e.target.value)}>
                      <MenuItem value=''>- Tất cả chi nhánh -</MenuItem>
                      {branchOptions.map(b => (
                        <MenuItem key={b.id} value={b.id}>
                          {b.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant={unpaidOnlyFilter ? 'contained' : 'outlined'}
                    color='warning'
                    size='small'
                    onClick={() => setUnpaidOnlyFilter(v => !v)}
                    startIcon={<i className='ri-money-dollar-circle-line' />}
                  >
                    {unpaidOnlyFilter ? 'Chỉ lớp còn nợ' : 'Hiện tất cả'}
                  </Button>
                  <Button
                    variant='outlined'
                    color='info'
                    size='small'
                    onClick={handleExportUnpaidStudents}
                    startIcon={<i className='ri-download-line' />}
                  >
                    Xuất Excel
                  </Button>
                  <Box className='flex items-center gap-2 ml-auto'>
                    <Typography variant='body2' color='text.secondary'>
                      Hiển thị {filteredClasses.length}/{(summary.classes ?? []).length} lớp
                    </Typography>
                  </Box>
                </Box>
                {/*<Alert severity='info' className='mt-4'>*/}
                {/*  Công nợ ở màn này chỉ tải học phí và lệ phí thi theo lớp. Phí 1 lần sẽ được kiểm tra riêng khi bấm <strong>Thu</strong>{' '}*/}
                {/*  cho từng học viên để giảm tải cho server.*/}
                {/*</Alert>*/}
              </CardContent>
            </Card>
          )}

          {!summary || (summary.classes ?? []).length === 0 ? (
            <Alert severity='success'>Không có công nợ nào trong tháng {month}/{year}!</Alert>
          ) : filteredClasses.length === 0 ? (
            <Alert severity='info'>Không có lớp nào khớp bộ lọc. Hãy điều chỉnh tìm kiếm hoặc bỏ lọc.</Alert>
          ) : (
            pagedClasses.map((cls: ClassPaymentSummary) => {
              const totalUnpaid =
                toSafeNumber(cls.tuition?.unpaidAmount) +
                (cls.examFees ?? []).reduce((acc, ef) => acc + toSafeNumber(ef.unpaidAmount), 0)

              const tuitionAmountByStudentId = new Map(
                (cls.tuition?.unpaidStudents ?? []).map(student => [student.studentId, Number(student.amount || 0)])
              )

              const examFeeSummaryByStudentId = (cls.examFees ?? [])
                .filter(ef => Boolean(ef.isCollectable))
                .flatMap(ef => ef.unpaidStudents ?? [])
                .reduce(
                  (acc, student) => {
                    const current = acc.get(student.studentId) ?? {
                      studentId: student.studentId,
                      studentName: student.studentName,
                      examFeeAmount: 0,
                      examFeeCount: 0
                    }

                    current.examFeeAmount += Number(student.amount || 0)
                    current.examFeeCount += 1
                    acc.set(student.studentId, current)

                    return acc
                  },
                  new Map<
                    string,
                    {
                      studentId: string
                      studentName: string
                      examFeeAmount: number
                      examFeeCount: number
                    }
                  >()
                )

              const mergedCollectRows = Array.from(
                new Set([...tuitionAmountByStudentId.keys(), ...examFeeSummaryByStudentId.keys()])
              )
                .map(studentId => {
                  const tuitionAmount = tuitionAmountByStudentId.get(studentId) ?? 0
                  const examFeeSummary = examFeeSummaryByStudentId.get(studentId)

                  return {
                    studentId,
                    studentName:
                      cls.tuition?.unpaidStudents?.find(student => student.studentId === studentId)?.studentName ||
                      examFeeSummary?.studentName ||
                      'Học viên',
                    tuitionAmount,
                    examFeeAmount: examFeeSummary?.examFeeAmount ?? 0,
                    examFeeCount: examFeeSummary?.examFeeCount ?? 0
                  }
                })
                .filter(student => student.tuitionAmount > 0 || student.examFeeAmount > 0)
                .sort((left, right) => left.studentName.localeCompare(right.studentName, 'vi'))

              return (
                <Card key={cls.classId} className='mb-4'>
                  <CardHeader
                    title={
                      <Box className='flex items-center gap-2 flex-wrap'>
                        <Typography variant='h6'>{cls.className}</Typography>
                        {cls.branchName && (
                          <Chip
                            label={cls.branchName}
                            size='small'
                            color='info'
                            variant='tonal'
                            icon={<i className='ri-building-line' />}
                          />
                        )}
                      </Box>
                    }
                    subheader={`Tổng công nợ: ${totalUnpaid.toLocaleString('vi-VN')}đ`}
                  />
                  <CardContent className='p-0'>
                    {/* Học phí */}
                    <Box className='px-4 py-3 border-b'>
                      <Box
                        className='flex justify-between items-center cursor-pointer select-none'
                        onClick={() => toggleTuitionSection(cls)}
                      >
                        <Box className='flex items-center gap-2'>
                          <Typography className='font-medium'>Học phí tháng {month}/{year}</Typography>
                          <Chip
                            label={`${toSafeNumber(cls.tuition?.unpaidCount)} chưa đóng`}
                            color={toSafeNumber(cls.tuition?.unpaidCount) > 0 ? 'warning' : 'success'}
                            size='small'
                          />
                        </Box>
                        <Box className='flex items-center gap-2'>
                          <Typography
                            variant='body2'
                            className='font-medium'
                            color={toSafeNumber(cls.tuition?.unpaidCount) > 0 ? 'warning.main' : 'success.main'}
                          >
                            {toSafeNumber(cls.tuition?.unpaidAmount).toLocaleString('vi-VN')}đ
                          </Typography>
                          <i className={`ri-arrow-${expanded[`tuition-${cls.classId}`] ? 'up' : 'down'}-s-line`} />
                        </Box>
                      </Box>
                      <Collapse in={!!expanded[`tuition-${cls.classId}`]}>
                        <TableContainer className='mt-2'>
                          <Table size='small'>
                            <TableHead>
                              <TableRow>
                                <TableCell>Học viên</TableCell>
                                <TableCell align='right'>Số tiền</TableCell>
                                <TableCell align='right'>Thu</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {mergedCollectRows.map(student => (
                                <TableRow key={student.studentId}>
                                  <TableCell>
                                    <Box className='flex items-center gap-2 flex-wrap'>
                                      <Typography
                                        color='primary'
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => openStudentDrawer(student.studentId)}
                                      >
                                        {student.studentName}
                                      </Typography>
                                      {student.examFeeAmount > 0 ? (
                                        <Chip
                                          label={`${student.examFeeCount} lệ phí thi chưa đóng`}
                                          size='small'
                                          color='warning'
                                          variant='tonal'
                                        />
                                      ) : null}
                                    </Box>
                                  </TableCell>
                                  <TableCell align='right'>
                                    <Box className='flex flex-col items-end gap-1'>
                                      {student.tuitionAmount > 0 ? (
                                        <Typography variant='body2'>
                                          {toSafeNumber(student.tuitionAmount).toLocaleString('vi-VN')}đ học phí
                                        </Typography>
                                      ) : null}
                                      {student.examFeeAmount > 0 ? (
                                        <Typography variant='caption' color='secondary.main'>
                                          {toSafeNumber(student.examFeeAmount).toLocaleString('vi-VN')}đ lệ phí thi
                                        </Typography>
                                      ) : null}
                                      {student.tuitionAmount <= 0 && student.examFeeAmount <= 0 ? <Typography variant='body2'>-</Typography> : null}
                                    </Box>
                                  </TableCell>
                                  <TableCell align='right'>
                                    <Button
                                      size='small'
                                      variant='contained'
                                      onClick={() =>
                                        handleOpenCreateInvoice({
                                          classId: cls.classId,
                                          className: cls.className,
                                          studentId: student.studentId,
                                          studentName: student.studentName,
                                          tuitionAmount: student.tuitionAmount,
                                          examFeeAmount: student.examFeeAmount
                                        })
                                      }
                                    >
                                      Thu
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Collapse>
                    </Box>

                    {/* Lệ phí thi: chỉ hiển thị thông báo nếu đang có kỳ thi còn hạn thu.
                        Việc thu sẽ thực hiện trong dialog "Thu" của học phí (include exam fee). */}
                    {(cls.examFees ?? [])
                      .filter(ef => Boolean(ef.isCollectable))
                      .map(ef => (
                        <Box key={ef.sessionId} className='px-4 py-3 border-b last:border-b-0'>
                          <Box className='flex items-center justify-between gap-3 flex-wrap'>
                            <Box className='flex items-center gap-2 flex-wrap'>
                              <Typography className='font-medium'>Lệ phí thi</Typography>
                              <Typography variant='body2' color='text.secondary'>
                                {ef.sessionName}
                              </Typography>
                              <Chip
                                label={`${ef.unpaidCount} chưa đóng`}
                                color={ef.unpaidCount > 0 ? 'warning' : 'success'}
                                size='small'
                              />
                            </Box>
                            <Typography variant='body2' color={ef.unpaidCount > 0 ? 'warning.main' : 'success.main'}>
                              {toSafeNumber(ef.unpaidAmount).toLocaleString('vi-VN')}đ
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                  </CardContent>
                </Card>
              )
            })
          )}

          {/* Pagination controls */}
          {filteredClasses.length > 0 && (
            <Card className='mt-4'>
              <CardContent>
                <Box className='flex flex-wrap items-center justify-between gap-3'>
                  <Box className='flex items-center gap-2'>
                    <Typography variant='body2' color='text.secondary'>
                      Hiển thị:
                    </Typography>
                    <FormControl size='small' sx={{ minWidth: 100 }}>
                      <Select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                        {[5, 10, 20, 50].map(n => (
                          <MenuItem key={n} value={n}>
                            {n} lớp
                          </MenuItem>
                        ))}
                        <MenuItem value={0}>Tất cả</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant='body2' color='text.secondary'>
                      {pageSize === 0
                        ? `Tất cả ${filteredClasses.length} lớp`
                        : `Trang ${currentPage}/${totalPages} • ${filteredClasses.length} lớp`}
                    </Typography>
                  </Box>
                  {pageSize !== 0 && totalPages > 1 && (
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(_, p) => setPage(p)}
                      color='primary'
                      shape='rounded'
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {studentDrawerElement}
    </Box>
  )
}

export default PaymentCollectView
