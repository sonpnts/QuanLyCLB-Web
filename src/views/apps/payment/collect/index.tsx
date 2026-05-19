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
import oneTimeFeeService from '@/services/oneTimeFeeService'
import paymentService from '@/services/paymentService'
import studentService from '@/services/studentService'
import type { ClassPaymentSummary, CoachPaymentSummaryType } from '@/types/apps/paymentSummaryTypes'
import type { OneTimeFeeOptionType } from '@/types/apps/oneTimeFeeTypes'
import type { StudentType } from '@/types/apps/studentTypes'
import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'
import { savePaymentInvoiceDraft } from '@/utils/paymentDraft'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const YEARS = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i)

type ClassStudentOption = Pick<StudentType, 'id' | 'fullName' | 'phoneNumber'>

const toSafeNumber = (value: unknown): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const PaymentCollectView = () => {
  const router = useRouter()
  const { auth } = useAuth()
  const { showNotification } = useNotification()
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [summary, setSummary] = useState<CoachPaymentSummaryType | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [classStudents, setClassStudents] = useState<Record<string, ClassStudentOption[]>>({})
  const [oneTimeFeeMap, setOneTimeFeeMap] = useState<Record<string, Record<string, OneTimeFeeOptionType[]>>>({})
  const [loadingOneTimeFees, setLoadingOneTimeFees] = useState<Record<string, boolean>>({})

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

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  const loadOneTimeFeesForClass = async (cls: ClassPaymentSummary) => {
    if ((oneTimeFeeMap[cls.classId] && classStudents[cls.classId]) || loadingOneTimeFees[cls.classId]) return

    try {
      setLoadingOneTimeFees(prev => ({ ...prev, [cls.classId]: true }))
      const studentResponse = await studentService.getStudents({ classId: cls.classId, pageSize: 1000 })
      const students = studentResponse.success && studentResponse.data ? studentResponse.data : []
      const sortedStudents = [...students].sort((left, right) => left.fullName.localeCompare(right.fullName, 'vi'))

      setClassStudents(prev => ({ ...prev, [cls.classId]: sortedStudents }))

      const results = await Promise.all(
        sortedStudents.map(async student => {
          const response = await oneTimeFeeService.getOptions(student.id, cls.classId)
          const options = response.success && response.data ? response.data.filter(item => !item.isPaid) : []

          return [student.id, options] as const
        })
      )

      setOneTimeFeeMap(prev => ({
        ...prev,
        [cls.classId]: Object.fromEntries(results)
      }))
    } finally {
      setLoadingOneTimeFees(prev => ({ ...prev, [cls.classId]: false }))
    }
  }

  const toggleTuitionSection = (cls: ClassPaymentSummary) => {
    const key = `tuition-${cls.classId}`
    const nextOpen = !expanded[key]

    setExpanded(prev => ({ ...prev, [key]: nextOpen }))

    if (nextOpen) {
      loadOneTimeFeesForClass(cls)
    }
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

  const classOneTimeOutstandingAmountMap = useMemo(() => {
    const result: Record<string, number> = {}

    for (const [classId, studentFees] of Object.entries(oneTimeFeeMap)) {
      result[classId] = Object.values(studentFees).reduce(
        (classSum, items) => classSum + items.reduce((feeSum, item) => feeSum + Number(item.amount || 0), 0),
        0
      )
    }

    return result
  }, [oneTimeFeeMap])

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
          (cls.examFees ?? []).reduce((acc, ef) => acc + toSafeNumber(ef.unpaidAmount), 0) +
          toSafeNumber(classOneTimeOutstandingAmountMap[cls.classId])
        if (totalUnpaid <= 0) return false
      }
      return true
    })
  }, [summary, searchQuery, branchFilter, unpaidOnlyFilter, classOneTimeOutstandingAmountMap])

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

  useEffect(() => {
    if (!summary?.classes?.length) return

    summary.classes.forEach(cls => {
      if (!oneTimeFeeMap[cls.classId] && !loadingOneTimeFees[cls.classId]) {
        loadOneTimeFeesForClass(cls)
      }
    })
  }, [summary, oneTimeFeeMap, loadingOneTimeFees])

  const handleOpenCreateInvoice = (payload: {
    classId: string
    className: string
    studentId: string
    studentName: string
    tuitionAmount: number
    hasOneTimeFees: boolean
  }) => {
    const draftKey = savePaymentInvoiceDraft({
      classId: payload.classId,
      className: payload.className,
      studentId: payload.studentId,
      studentName: payload.studentName,
      forMonth: month,
      forYear: year,
      initialMode: payload.tuitionAmount > 0 ? 'tuition' : payload.hasOneTimeFees ? 'one-time' : 'blank'
    })

    router.push(`/apps/invoice/add?draft=${encodeURIComponent(draftKey)}`)
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
          {/* Tổng tiền cần thu */}
          {summary && (
            <Card className='mb-4' sx={{ bgcolor: 'primary.main' }}>
              <CardContent className='flex justify-between items-center'>
                <Box>
                  <Typography variant='h4' color='white'>
                    {toSafeNumber(summary.grandTotalUnpaid).toLocaleString('vi-VN')}đ
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
                  <Box className='flex items-center gap-2 ml-auto'>
                    <Typography variant='body2' color='text.secondary'>
                      Hiển thị {filteredClasses.length}/{(summary.classes ?? []).length} lớp
                    </Typography>
                  </Box>
                </Box>
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
                (cls.examFees ?? []).reduce((acc, ef) => acc + toSafeNumber(ef.unpaidAmount), 0) +
                toSafeNumber(classOneTimeOutstandingAmountMap[cls.classId])
              const classOneTimeOutstanding = toSafeNumber(classOneTimeOutstandingAmountMap[cls.classId])

              const tuitionAmountByStudentId = new Map(
                (cls.tuition?.unpaidStudents ?? []).map(student => [student.studentId, Number(student.amount || 0)])
              )

              const mergedCollectRows = (classStudents[cls.classId] ?? [])
                .map(student => {
                  const oneTimeItems = oneTimeFeeMap[cls.classId]?.[student.id] ?? []
                  const tuitionAmount = tuitionAmountByStudentId.get(student.id) ?? 0

                  if (tuitionAmount <= 0 && oneTimeItems.length === 0) {
                    return null
                  }

                  return {
                    studentId: student.id,
                    studentName: student.fullName,
                    phoneNumber: student.phoneNumber,
                    tuitionAmount,
                    oneTimeItems
                  }
                })
                .filter(Boolean) as Array<{
                studentId: string
                studentName: string
                phoneNumber?: string
                tuitionAmount: number
                oneTimeItems: OneTimeFeeOptionType[]
              }>

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
                          {classOneTimeOutstanding > 0 && (
                            <Chip
                              label={`Phí 1 lần còn ${classOneTimeOutstanding.toLocaleString('vi-VN')}đ`}
                              color='secondary'
                              size='small'
                              variant='tonal'
                            />
                          )}
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
                                      <Typography>{student.studentName}</Typography>
                                      {loadingOneTimeFees[cls.classId] ? (
                                        <Chip label='Đang kiểm tra phí 1 lần...' size='small' variant='outlined' />
                                      ) : student.oneTimeItems.length > 0 ? (
                                        <Chip
                                          label={`${student.oneTimeItems.length} phí 1 lần chưa đóng`}
                                          size='small'
                                          color='secondary'
                                          variant='tonal'
                                        />
                                      ) : null}
                                    </Box>
                                  </TableCell>
                                  <TableCell align='right'>
                                    <Box className='flex flex-col items-end gap-1'>
                                      <Typography variant='body2'>
                                        {student.tuitionAmount > 0
                                          ? `${toSafeNumber(student.tuitionAmount).toLocaleString('vi-VN')}đ`
                                          : '-'}
                                      </Typography>
                                      {student.oneTimeItems.length > 0 && (
                                        <Typography variant='caption' color='secondary.main'>
                                          {student.oneTimeItems
                                            .reduce((sum, item) => sum + Number(item.amount || 0), 0)
                                            .toLocaleString('vi-VN')}
                                          đ phí 1 lần
                                        </Typography>
                                      )}
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
                                          hasOneTimeFees: student.oneTimeItems.length > 0
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
    </Box>
  )
}

export default PaymentCollectView
