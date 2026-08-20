'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useNotification } from '@/contexts/notificationContext'
import studentService, { type TuitionDiscountRequestRow } from '@/services/studentService'
import type { StudentType } from '@/types/apps/studentTypes'
import { formatDateTimeVN } from '@/utils/dateTime'
import useStudentViewDrawer from '@/views/apps/student/list/useStudentViewDrawer'

const formatVnd = (value: number) => `${Math.round(value || 0).toLocaleString('vi-VN')}đ`
const toMonthValue = (month?: number | null, year?: number | null) => (month && year ? `${year}-${String(month).padStart(2, '0')}` : '')

const parseMonthValue = (value: string) => {
  if (!value) return {}

  const [year, month] = value.split('-').map(Number)

  if (!year || !month) return {}

  return { year, month }
}

const statusChip = (status: string | number) => {
  const value = typeof status === 'string' ? status.toLowerCase() : String(status)

  if (value.includes('approved') || value === '2') return <Chip label='Đã duyệt' color='success' size='small' />
  if (value.includes('rejected') || value === '3') return <Chip label='Từ chối' color='error' size='small' />
  if (value.includes('pending') || value === '1') return <Chip label='Chờ duyệt' color='warning' size='small' />

  return <Chip label='-' size='small' variant='outlined' />
}

const StudentTuitionDiscountPage = () => {
  const { showNotification } = useNotification()
  const { openStudentDrawer, studentDrawerElement } = useStudentViewDrawer()

  const [studentKeyword, setStudentKeyword] = useState('')
  const [studentOptions, setStudentOptions] = useState<StudentType[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)
  const [isExempt, setIsExempt] = useState(false)
  const [discountAmount, setDiscountAmount] = useState('')
  const [reason, setReason] = useState('')
  const [applyForever, setApplyForever] = useState(true)
  const [applyFrom, setApplyFrom] = useState('')
  const [applyTo, setApplyTo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [rows, setRows] = useState<TuitionDiscountRequestRow[]>([])
  const [loadingRows, setLoadingRows] = useState(false)

  const loadMyRows = useCallback(async () => {
    setLoadingRows(true)

    try {
      const res = await studentService.getMyTuitionDiscountRequests({ pageSize: 50 })
      setRows(res.data || [])
    } finally {
      setLoadingRows(false)
    }
  }, [])

  useEffect(() => {
    loadMyRows()
  }, [loadMyRows])

  useEffect(() => {
    let active = true

    const run = async () => {
      const keyword = studentKeyword.trim()

      if (!keyword) {
        setStudentOptions([])
        return
      }

      const res = await studentService.getStudents({ keyword, isSuspended: false, pageSize: 20 })

      if (!active) return
      setStudentOptions(res.data || [])
    }

    run()

    return () => {
      active = false
    }
  }, [studentKeyword])

  const canSubmit = useMemo(() => {
    if (!selectedStudent) return false
    if (!reason.trim()) return false
    if (!applyForever && (!applyFrom || !applyTo)) return false
    if (isExempt) return true

    return Number(discountAmount || 0) > 0
  }, [applyForever, applyFrom, applyTo, discountAmount, isExempt, reason, selectedStudent])

  const handleSubmit = useCallback(async () => {
    if (!selectedStudent) return

    const fromValue = parseMonthValue(applyFrom)
    const toValue = parseMonthValue(applyTo)

    setSubmitting(true)

    try {
      const res = await studentService.requestTuitionDiscount(selectedStudent.id, {
        discountAmount: isExempt ? 0 : Number(discountAmount || 0),
        reason: reason.trim(),
        isExempt,
        applyFromMonth: applyForever ? undefined : fromValue.month,
        applyFromYear: applyForever ? undefined : fromValue.year,
        applyToMonth: applyForever ? undefined : toValue.month,
        applyToYear: applyForever ? undefined : toValue.year
      })

      if (!res.success) {
        showNotification(res.message || 'Không gửi được yêu cầu', 'error')
        return
      }

      showNotification(res.message || 'Đã gửi yêu cầu', 'success')
      setSelectedStudent(null)
      setStudentKeyword('')
      setDiscountAmount('')
      setReason('')
      setIsExempt(false)
      setApplyForever(true)
      setApplyFrom('')
      setApplyTo('')
      await loadMyRows()
    } finally {
      setSubmitting(false)
    }
  }, [applyForever, applyFrom, applyTo, discountAmount, isExempt, loadMyRows, reason, selectedStudent, showNotification])

  return (
    <Box className='flex flex-col gap-6'>
      <Card>
        <CardContent>
          <Typography variant='h5' sx={{ mb: 1 }}>
            Tạo yêu cầu giảm trừ / miễn học phí
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            Có thể chọn áp dụng vĩnh viễn hoặc theo kỳ tháng/năm cụ thể.
          </Typography>

          <Box className='flex flex-col gap-4'>
            <Autocomplete
              options={studentOptions}
              value={selectedStudent}
              onChange={(_event, value) => setSelectedStudent(value)}
              inputValue={studentKeyword}
              onInputChange={(_event, value) => setStudentKeyword(value)}
              getOptionLabel={option => `${option.fullName}${option.code ? ` (${option.code})` : ''}${option.phoneNumber ? ` - ${option.phoneNumber}` : ''}`}
              renderInput={params => <TextField {...params} label='Chọn học viên' placeholder='Tìm theo tên / mã / SĐT' />}
            />

            <FormControlLabel
              control={<Switch checked={isExempt} onChange={event => setIsExempt(event.target.checked)} />}
              label='Miễn học phí'
            />

            <TextField
              label='Số tiền giảm (VNĐ)'
              value={discountAmount}
              onChange={event => setDiscountAmount(event.target.value)}
              disabled={isExempt}
              placeholder='Ví dụ: 200000'
              inputMode='numeric'
            />

            <TextField
              label='Lý do'
              value={reason}
              onChange={event => setReason(event.target.value)}
              placeholder='Nhập lý do giảm / miễn học phí...'
              multiline
              minRows={3}
              required
            />

            <FormControlLabel
              control={<Switch checked={applyForever} onChange={event => setApplyForever(event.target.checked)} />}
              label='Áp dụng vĩnh viễn'
            />

            {!applyForever && (
              <Box className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <TextField label='Từ kỳ' type='month' value={applyFrom} onChange={event => setApplyFrom(event.target.value)} InputLabelProps={{ shrink: true }} />
                <TextField label='Đến kỳ' type='month' value={applyTo} onChange={event => setApplyTo(event.target.value)} InputLabelProps={{ shrink: true }} />
              </Box>
            )}

            <Box className='flex flex-col gap-2'>
              <Button variant='contained' onClick={handleSubmit} disabled={!canSubmit || submitting} sx={{ alignSelf: 'flex-start' }}>
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </Button>

              {!!selectedStudent?.tuitionDiscounts?.length && (
                <Box className='flex flex-col gap-1'>
                  <Typography variant='caption' color='text.secondary'>
                    Học viên đang có các cấu hình giảm trừ:
                  </Typography>
                  {selectedStudent.tuitionDiscounts.map(discount => (
                    <Typography key={discount.id} variant='caption' color='text.secondary'>
                      {formatVnd(discount.discountAmount)} - {discount.periodLabel} - {discount.reason}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Yêu cầu của tôi
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Học viên</TableCell>
                  <TableCell align='right'>Giảm</TableCell>
                  <TableCell>Kỳ áp dụng</TableCell>
                  <TableCell>Lý do</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Thời gian</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loadingRows && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Chưa có yêu cầu nào.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}

                {rows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Typography
                        variant='body2'
                        sx={{ fontWeight: 600, cursor: 'pointer' }}
                        color='primary'
                        onClick={() => openStudentDrawer(row.studentId)}
                      >
                        {row.studentName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {row.studentCode || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>{formatVnd(row.discountAmount || 0)}</TableCell>
                    <TableCell>{row.periodLabel}</TableCell>
                    <TableCell>
                      <Typography variant='body2'>{row.reason}</Typography>
                      {row.decisionNote && (
                        <Typography variant='caption' color='text.secondary'>
                          Ghi chú: {row.decisionNote}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{statusChip(row.status)}</TableCell>
                    <TableCell>{formatDateTimeVN(row.requestedAt, '-')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {studentDrawerElement}
    </Box>
  )
}

export default StudentTuitionDiscountPage
