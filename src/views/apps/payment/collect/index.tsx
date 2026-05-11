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

import { useNotification } from '@/contexts/notificationContext'
import paymentService from '@/services/paymentService'
import type { ClassPaymentSummary, CoachPaymentSummaryType } from '@/types/apps/paymentSummaryTypes'

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

const PaymentCollectView = () => {
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

  useEffect(() => {
    loadSummary()
  }, [month, year])

  const loadSummary = async () => {
    try {
      setLoading(true)
      const result = await paymentService.getSummaryForCoach(month, year)

      if (result.success && result.data) {
        setSummary(result.data)
      } else {
        showNotification(result.message || 'KhÃƒÂ´ng thÃ¡Â»Æ’ tÃ¡ÂºÂ£i dÃ¡Â»Â¯ liÃ¡Â»â€¡u', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  // Danh sÃƒÂ¡ch chi nhÃƒÂ¡nh duy nhÃ¡ÂºÂ¥t tÃ¡Â»Â« classes (cho dropdown filter)
  const branchOptions = useMemo(() => {
    if (!summary?.classes) return [] as { id: string; name: string }[]
    const map = new Map<string, string>()
    for (const cls of summary.classes) {
      if (cls.branchId && cls.branchName) map.set(cls.branchId, cls.branchName)
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [summary])

  // ÃƒÂp dÃ¡Â»Â¥ng filter
  const filteredClasses = useMemo(() => {
    if (!summary?.classes) return [] as ClassPaymentSummary[]
    const q = searchQuery.trim().toLowerCase()

    return summary.classes.filter(cls => {
      // Search theo tÃƒÂªn lÃ¡Â»â€ºp HOÃ¡ÂºÂ¶C tÃƒÂªn chi nhÃƒÂ¡nh
      if (q) {
        const matchName = cls.className?.toLowerCase().includes(q)
        const matchBranch = cls.branchName?.toLowerCase().includes(q)
        if (!matchName && !matchBranch) return false
      }
      // Filter theo chi nhÃƒÂ¡nh
      if (branchFilter && cls.branchId !== branchFilter) return false
      // ChÃ¡Â»â€° hiÃ¡Â»â€¡n lÃ¡Â»â€ºp cÃƒÂ²n cÃƒÂ´ng nÃ¡Â»Â£
      if (unpaidOnlyFilter) {
        const totalUnpaid = cls.tuition.unpaidAmount + cls.examFees.reduce((acc, ef) => acc + ef.unpaidAmount, 0)
        if (totalUnpaid <= 0) return false
      }
      return true
    })
  }, [summary, searchQuery, branchFilter, unpaidOnlyFilter])

  // Pagination (pageSize=0 Ã¢â€ â€™ hiÃ¡Â»Æ’n thÃ¡Â»â€¹ tÃ¡ÂºÂ¥t cÃ¡ÂºÂ£)
  const effectivePageSize = pageSize === 0 ? filteredClasses.length || 1 : pageSize
  const totalPages = Math.max(1, Math.ceil(filteredClasses.length / effectivePageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedClasses = useMemo(
    () => pageSize === 0
      ? filteredClasses
      : filteredClasses.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize),
    [filteredClasses, currentPage, effectivePageSize, pageSize]
  )

  // Reset vÃ¡Â»Â trang 1 khi filter hoÃ¡ÂºÂ·c pageSize thay Ã„â€˜Ã¡Â»â€¢i
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

      {/* ChÃ¡Â»Ân thÃƒÂ¡ng/nÃ„Æ’m */}
      <Box className='flex gap-3 mb-4 flex-wrap items-center'>
        <FormControl size='small' sx={{ minWidth: 120 }}>
          <InputLabel>ThÃƒÂ¡ng</InputLabel>
          <Select value={month} label='ThÃƒÂ¡ng' onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map(m => (
              <MenuItem key={m} value={m}>
                ThÃƒÂ¡ng {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size='small' sx={{ minWidth: 100 }}>
          <InputLabel>NÃ„Æ’m</InputLabel>
          <Select value={year} label='NÃ„Æ’m' onChange={e => setYear(Number(e.target.value))}>
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
          LÃƒÂ m mÃ¡Â»â€ºi
        </Button>
      </Box>

      {loading ? (
        <Box className='flex justify-center p-8'>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* TÃ¡Â»â€¢ng tiÃ¡Â»Ân cÃ¡ÂºÂ§n thu */}
          {summary && (
            <Card className='mb-4' sx={{ bgcolor: 'primary.main' }}>
              <CardContent className='flex justify-between items-center'>
                <Box>
                  <Typography variant='h4' color='white'>
                    {summary.grandTotalUnpaid.toLocaleString('vi-VN')}Ã„â€˜
                  </Typography>
                  <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    TÃ¡Â»â€¢ng tiÃ¡Â»Ân cÃƒÂ²n phÃ¡ÂºÂ£i thu Ã¢â‚¬â€ ThÃƒÂ¡ng {month}/{year}
                  </Typography>
                </Box>
                <i className='ri-money-dollar-circle-line text-7xl' style={{ opacity: 0.15, color: 'white' }} />
              </CardContent>
            </Card>
          )}

          {/* Filter + Search bar */}
          {summary && summary.classes.length > 0 && (
            <Card className='mb-4'>
              <CardContent>
                <Box className='flex flex-wrap gap-3 items-center'>
                  <TextField
                    size='small'
                    placeholder='TÃƒÂ¬m theo tÃƒÂªn lÃ¡Â»â€ºp hoÃ¡ÂºÂ·c chi nhÃƒÂ¡nh...'
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
                    <InputLabel>Chi nhÃƒÂ¡nh</InputLabel>
                    <Select value={branchFilter} label='Chi nhÃƒÂ¡nh' onChange={e => setBranchFilter(e.target.value)}>
                      <MenuItem value=''>Ã¢â‚¬â€ TÃ¡ÂºÂ¥t cÃ¡ÂºÂ£ chi nhÃƒÂ¡nh Ã¢â‚¬â€</MenuItem>
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
                    {unpaidOnlyFilter ? 'ChÃ¡Â»â€° lÃ¡Â»â€ºp cÃƒÂ²n nÃ¡Â»Â£' : 'HiÃ¡Â»â€¡n tÃ¡ÂºÂ¥t cÃ¡ÂºÂ£'}
                  </Button>
                  <Box className='flex items-center gap-2 ml-auto'>
                    <Typography variant='body2' color='text.secondary'>
                      HiÃ¡Â»Æ’n thÃ¡Â»â€¹ {filteredClasses.length}/{summary.classes.length} lÃ¡Â»â€ºp
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {!summary || summary.classes.length === 0 ? (
            <Alert severity='success'>
              KhÃƒÂ´ng cÃƒÂ³ cÃƒÂ´ng nÃ¡Â»Â£ nÃƒÂ o trong thÃƒÂ¡ng {month}/{year}!
            </Alert>
          ) : filteredClasses.length === 0 ? (
            <Alert severity='info'>
              KhÃƒÂ´ng cÃƒÂ³ lÃ¡Â»â€ºp nÃƒÂ o khÃ¡Â»â€ºp bÃ¡Â»â„¢ lÃ¡Â»Âc. HÃƒÂ£y Ã„â€˜iÃ¡Â»Âu chÃ¡Â»â€°nh tÃƒÂ¬m kiÃ¡ÂºÂ¿m hoÃ¡ÂºÂ·c bÃ¡Â»Â lÃ¡Â»Âc.
            </Alert>
          ) : (
            pagedClasses.map((cls: ClassPaymentSummary) => {
              const totalUnpaid =
                cls.tuition.unpaidAmount + cls.examFees.reduce((acc, ef) => acc + ef.unpaidAmount, 0)

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
                    subheader={`TÃ¡Â»â€¢ng cÃƒÂ´ng nÃ¡Â»Â£: ${totalUnpaid.toLocaleString('vi-VN')}Ã„â€˜`}
                  />
                  <CardContent className='p-0'>
                    {/* HÃ¡Â»Âc phÃƒÂ­ */}
                    <Box className='px-4 py-3 border-b'>
                      <Box
                        className='flex justify-between items-center cursor-pointer select-none'
                        onClick={() => toggle(`tuition-${cls.classId}`)}
                      >
                        <Box className='flex items-center gap-2'>
                          <Typography className='font-medium'>HÃ¡Â»Âc phÃƒÂ­ thÃƒÂ¡ng {month}/{year}</Typography>
                          <Chip
                            label={`${cls.tuition.unpaidCount} chÃ†Â°a Ã„â€˜ÃƒÂ³ng`}
                            color={cls.tuition.unpaidCount > 0 ? 'warning' : 'success'}
                            size='small'
                          />
                        </Box>
                        <Box className='flex items-center gap-2'>
                          <Typography
                            variant='body2'
                            className='font-medium'
                            color={cls.tuition.unpaidCount > 0 ? 'warning.main' : 'success.main'}
                          >
                            {cls.tuition.unpaidAmount.toLocaleString('vi-VN')}Ã„â€˜
                          </Typography>
                          <i
                            className={`ri-arrow-${expanded[`tuition-${cls.classId}`] ? 'up' : 'down'}-s-line`}
                          />
                        </Box>
                      </Box>
                      <Collapse in={!!expanded[`tuition-${cls.classId}`]}>
                        <TableContainer className='mt-2'>
                          <Table size='small'>
                            <TableHead>
                              <TableRow>
                                <TableCell>HÃ¡Â»Âc viÃƒÂªn</TableCell>
                                <TableCell align='right'>SÃ¡Â»â€˜ tiÃ¡Â»Ân</TableCell>
                                <TableCell align='right'>Thu</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {cls.tuition.unpaidStudents.map(s => (
                                <TableRow key={s.studentId}>
                                  <TableCell>{s.studentName}</TableCell>
                                  <TableCell align='right'>
                                    {s.amount.toLocaleString('vi-VN')}Ã„â€˜
                                  </TableCell>
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
                                          description: `HÃ¡Â»Âc phÃƒÂ­ thÃƒÂ¡ng ${month}/${year}`
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

                    {/* LÃ¡Â»â€¡ phÃƒÂ­ thi */}
                    {cls.examFees.map(ef => (
                      <Box key={ef.sessionId} className='px-4 py-3 border-b last:border-b-0'>
                        <Box
                          className='flex justify-between items-center cursor-pointer select-none'
                          onClick={() => toggle(`exam-${cls.classId}-${ef.sessionId}`)}
                        >
                          <Box className='flex items-center gap-2 flex-wrap'>
                            <Typography className='font-medium'>LÃ¡Â»â€¡ phÃƒÂ­ thi</Typography>
                            <Typography variant='body2' color='text.secondary'>
                              {ef.sessionName}
                            </Typography>
                            <Chip
                              label={`${ef.unpaidCount} chÃ†Â°a Ã„â€˜ÃƒÂ³ng`}
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
                              {ef.unpaidAmount.toLocaleString('vi-VN')}Ã„â€˜
                            </Typography>
                            <i
                              className={`ri-arrow-${expanded[`exam-${cls.classId}-${ef.sessionId}`] ? 'up' : 'down'}-s-line`}
                            />
                          </Box>
                        </Box>
                        <Collapse in={!!expanded[`exam-${cls.classId}-${ef.sessionId}`]}>
                          <TableContainer className='mt-2'>
                            <Table size='small'>
                              <TableHead>
                                <TableRow>
                                  <TableCell>HÃ¡Â»Âc viÃƒÂªn</TableCell>
                                  <TableCell>CÃ¡ÂºÂ¥p thi</TableCell>
                                  <TableCell align='right'>LÃ¡Â»â€¡ phÃƒÂ­</TableCell>
                                  <TableCell align='right'>Thu</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {ef.unpaidStudents.map(s => (
                                  <TableRow key={s.studentId}>
                                    <TableCell>{s.studentName}</TableCell>
                                    <TableCell>{s.targetBeltLevelName ?? 'Ã¢â‚¬â€'}</TableCell>
                                    <TableCell align='right'>
                                      {s.amount.toLocaleString('vi-VN')}Ã„â€˜
                                    </TableCell>
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
                                            description: `LÃ¡Â»â€¡ phÃƒÂ­ thi ${s.targetBeltLevelName ?? ''} Ã¢â‚¬â€ ${ef.sessionName}`
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

          {/* Pagination controls Ã¢â‚¬â€ luÃƒÂ´n hiÃ¡Â»Æ’n thÃ¡Â»â€¹ khi cÃƒÂ³ lÃ¡Â»â€ºp */}
          {filteredClasses.length > 0 && (
            <Card className='mt-4'>
              <CardContent>
                <Box className='flex flex-wrap items-center justify-between gap-3'>
                  <Box className='flex items-center gap-2'>
                    <Typography variant='body2' color='text.secondary'>
                      HiÃ¡Â»Æ’n thÃ¡Â»â€¹:
                    </Typography>
                    <FormControl size='small' sx={{ minWidth: 100 }}>
                      <Select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                        {[5, 10, 20, 50].map(n => (
                          <MenuItem key={n} value={n}>
                            {n} lÃ¡Â»â€ºp
                          </MenuItem>
                        ))}
                        <MenuItem value={0}>TÃ¡ÂºÂ¥t cÃ¡ÂºÂ£</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant='body2' color='text.secondary'>
                      {pageSize === 0
                        ? `TÃ¡ÂºÂ¥t cÃ¡ÂºÂ£ ${filteredClasses.length} lÃ¡Â»â€ºp`
                        : `Trang ${currentPage}/${totalPages} Ã¢â‚¬Â¢ ${filteredClasses.length} lÃ¡Â»â€ºp`}
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


