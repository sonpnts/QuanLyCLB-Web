'use client'

import { useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
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
        showNotification(result.message || 'Không thể tải dữ liệu', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))

  const handleCollectSuccess = () => {
    setCollectTarget(null)
    showNotification('Thu tiền thành công!', 'success')
    loadSummary()
  }

  return (
    <Box>
      <Typography variant='h5' className='mb-4'>
        Thu Tiền — Tổng Hợp Công Nợ
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
                    {summary.grandTotalUnpaid.toLocaleString('vi-VN')}đ
                  </Typography>
                  <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Tổng tiền còn phải thu — Tháng {month}/{year}
                  </Typography>
                </Box>
                <i className='ri-money-dollar-circle-line text-7xl' style={{ opacity: 0.15, color: 'white' }} />
              </CardContent>
            </Card>
          )}

          {!summary || summary.classes.length === 0 ? (
            <Alert severity='success'>
              Không có công nợ nào trong tháng {month}/{year}!
            </Alert>
          ) : (
            summary.classes.map((cls: ClassPaymentSummary) => {
              const totalUnpaid =
                cls.tuition.unpaidAmount + cls.examFees.reduce((acc, ef) => acc + ef.unpaidAmount, 0)

              return (
                <Card key={cls.classId} className='mb-4'>
                  <CardHeader
                    title={cls.className}
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
                            label={`${cls.tuition.unpaidCount} chưa đóng`}
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
                            {cls.tuition.unpaidAmount.toLocaleString('vi-VN')}đ
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
                                <TableCell>Học viên</TableCell>
                                <TableCell align='right'>Số tiền</TableCell>
                                <TableCell align='right'>Thu</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {cls.tuition.unpaidStudents.map(s => (
                                <TableRow key={s.studentId}>
                                  <TableCell>{s.studentName}</TableCell>
                                  <TableCell align='right'>
                                    {s.amount.toLocaleString('vi-VN')}đ
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
                    {cls.examFees.map(ef => (
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
                              {ef.unpaidAmount.toLocaleString('vi-VN')}đ
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
                                  <TableCell>Học viên</TableCell>
                                  <TableCell>Cấp thi</TableCell>
                                  <TableCell align='right'>Lệ phí</TableCell>
                                  <TableCell align='right'>Thu</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {ef.unpaidStudents.map(s => (
                                  <TableRow key={s.studentId}>
                                    <TableCell>{s.studentName}</TableCell>
                                    <TableCell>{s.targetBeltLevelName ?? '—'}</TableCell>
                                    <TableCell align='right'>
                                      {s.amount.toLocaleString('vi-VN')}đ
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
                                            examRegistrationId: s.examRegistrationId,
                                            description: `Lệ phí thi ${s.targetBeltLevelName ?? ''} — ${ef.sessionName}`
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
