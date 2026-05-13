'use client'

import { useEffect, useMemo, useState } from 'react'

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
import paymentService from '@/services/paymentService'
import type { ClassPaymentSummary, CoachPaymentSummaryType } from '@/types/apps/paymentSummaryTypes'
import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'

import CollectPaymentDialog from './CollectPaymentDialog'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const YEARS = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i)

interface CollectTarget {
  studentId: string
  studentName: string
  amount: number
  type: string
  classId?: string
  forMonth?: number
  forYear?: number
  examRegistrationId?: string
  description?: string
}

const toSafeNumber = (value: unknown): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const PaymentCollectView = () => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [summary, setSummary] = useState<CoachPaymentSummaryType | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [collectTarget, setCollectTarget] = useState<CollectTarget | null>(null)

  // Filter + pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [branchFilter, setBranchFilter] = useState<string>('')
  const [unpaidOnlyFilter, setUnpaidOnlyFilter] = useState<boolean>(false)
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

  const handleCollectSuccess = () => {
    setCollectTarget(null)
    showNotification('Thu tiền thành công!', 'success')
    loadSummary()
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
                (cls.examFees ?? []).reduce((acc, ef) => acc + toSafeNumber(ef.unpaidAmount), 0)

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
                        onClick={() => toggle(`tuition-${cls.classId}`)}
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
                              {(cls.tuition?.unpaidStudents ?? []).map(s => (
                                <TableRow key={s.studentId}>
                                  <TableCell>{s.studentName}</TableCell>
                                  <TableCell align='right'>{toSafeNumber(s.amount).toLocaleString('vi-VN')}đ</TableCell>
                                  <TableCell align='right'>
                                    <Button
                                      size='small'
                                      variant='contained'
                                      onClick={() =>
                                        setCollectTarget({
                                          studentId: s.studentId,
                                          studentName: s.studentName,
                                          amount: s.amount,
                                          type: 'Tuition',
                                          classId: cls.classId,
                                          forMonth: month,
                                          forYear: year,
                                          description: `Học phí tháng ${month}/${year}`
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

                    {/* Lệ phí thi */}
                    {(cls.examFees ?? []).map(ef => (
                      <Box key={ef.sessionId} className='px-4 py-3 border-b last:border-b-0'>
                        <Box
                          className='flex justify-between items-center cursor-pointer select-none'
                          onClick={() => toggle(`exam-${cls.classId}-${ef.sessionId}`)}
                        >
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
                          <Box className='flex items-center gap-2'>
                            <Typography
                              variant='body2'
                              className='font-medium'
                              color={ef.unpaidCount > 0 ? 'warning.main' : 'success.main'}
                            >
                              {toSafeNumber(ef.unpaidAmount).toLocaleString('vi-VN')}đ
                            </Typography>
                            <i className={`ri-arrow-${expanded[`exam-${cls.classId}-${ef.sessionId}`] ? 'up' : 'down'}-s-line`} />
                          </Box>
                        </Box>
                        <Collapse in={!!expanded[`exam-${cls.classId}-${ef.sessionId}`]}>
                          <TableContainer className='mt-2'>
                            <Table size='small'>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Học viên</TableCell>
                                  <TableCell>Cấp thi</TableCell>
                                  <TableCell align='right'>Lệ phí</TableCell>
                                  <TableCell align='right'>Thu</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(ef.unpaidStudents ?? []).map(s => (
                                  <TableRow key={s.studentId}>
                                    <TableCell>{s.studentName}</TableCell>
                                    <TableCell>{s.targetBeltLevelName ?? '-'}</TableCell>
                                    <TableCell align='right'>{toSafeNumber(s.amount).toLocaleString('vi-VN')}đ</TableCell>
                                    <TableCell align='right'>
                                      <Button
                                        size='small'
                                        variant='contained'
                                        color='secondary'
                                        onClick={() =>
                                          setCollectTarget({
                                            studentId: s.studentId,
                                            studentName: s.studentName,
                                            amount: s.amount,
                                            type: 'ExamFee',
                                            classId: cls.classId,
                                            examRegistrationId: s.examRegistrationId,
                                            description: `Lệ phí thi ${s.targetBeltLevelName ?? ''} - ${ef.sessionName}`
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

      {/* Dialog thu tiền */}
      {collectTarget && (
        <CollectPaymentDialog
          open={!!collectTarget}
          studentId={collectTarget.studentId}
          studentName={collectTarget.studentName}
          amount={collectTarget.amount}
          paymentType={collectTarget.type}
          classId={collectTarget.classId}
          forMonth={collectTarget.forMonth}
          forYear={collectTarget.forYear}
          examRegistrationId={collectTarget.examRegistrationId}
          description={collectTarget.description}
          onSuccess={handleCollectSuccess}
          onClose={() => setCollectTarget(null)}
        />
      )}
    </Box>
  )
}

export default PaymentCollectView
