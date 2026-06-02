'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Autocomplete from '@mui/material/Autocomplete'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'

import studentService, { type TuitionDiscountRequestRow } from '@/services/studentService'
import type { StudentType } from '@/types/apps/studentTypes'
import { useNotification } from '@/contexts/notificationContext'
import { formatDateTimeVN } from '@/utils/dateTime'

const formatVnd = (n: number) => `${Math.round(n).toLocaleString('vi-VN')}đ`

const statusChip = (s: any) => {
  const v = typeof s === 'string' ? s : String(s)

  if (v.toLowerCase().includes('approved') || v === '2') return <Chip label='Đã duyệt' color='success' size='small' />
  if (v.toLowerCase().includes('rejected') || v === '3') return <Chip label='Từ chối' color='error' size='small' />
  if (v.toLowerCase().includes('pending') || v === '1') return <Chip label='Chờ duyệt' color='warning' size='small' />
  
return <Chip label='—' size='small' variant='outlined' />
}

const StudentTuitionDiscountPage = () => {
  const { showNotification } = useNotification()

  const [studentKeyword, setStudentKeyword] = useState('')
  const [studentOptions, setStudentOptions] = useState<StudentType[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)

  const [isExempt, setIsExempt] = useState(false)
  const [discountAmount, setDiscountAmount] = useState<string>('')
  const [reason, setReason] = useState<string>('')
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
      const kw = studentKeyword.trim()

      if (!kw) {
        setStudentOptions([])
        
return
      }

      const res = await studentService.getStudents({ keyword: kw, pageSize: 20 })

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
    if (isExempt) return true
    const amt = Number(discountAmount || 0)

    
return amt > 0
  }, [selectedStudent, reason, isExempt, discountAmount])

  const handleSubmit = useCallback(async () => {
    if (!selectedStudent) return

    setSubmitting(true)

    try {
      const payload = {
        discountAmount: isExempt ? 0 : Number(discountAmount || 0),
        reason: reason.trim(),
        isExempt
      }

      const res = await studentService.requestTuitionDiscount(selectedStudent.id, payload)

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
      await loadMyRows()
    } finally {
      setSubmitting(false)
    }
  }, [selectedStudent, isExempt, discountAmount, reason, showNotification, loadMyRows])

  return (
    <Box className='flex flex-col gap-6'>
      <Card>
        <CardContent>
          <Typography variant='h5' sx={{ mb: 1 }}>
            Tạo yêu cầu giảm trừ / miễn học phí
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            Yêu cầu sẽ ở trạng thái chờ duyệt cho tới khi Admin phê duyệt.
          </Typography>

          <Box className='flex flex-col gap-4'>
            <Autocomplete
              options={studentOptions}
              value={selectedStudent}
              onChange={(_e, v) => setSelectedStudent(v)}
              inputValue={studentKeyword}
              onInputChange={(_e, v) => setStudentKeyword(v)}
              getOptionLabel={o => `${o.fullName}${o.code ? ` (${o.code})` : ''}${o.phoneNumber ? ` - ${o.phoneNumber}` : ''}`}
              renderInput={params => <TextField {...params} label='Chọn học viên' placeholder='Tìm theo tên/mã/sđt...' />}
            />

            <FormControlLabel
              control={<Switch checked={isExempt} onChange={e => setIsExempt(e.target.checked)} />}
              label='Miễn học phí'
            />

            <TextField
              label='Số tiền giảm (VNĐ)'
              value={discountAmount}
              onChange={e => setDiscountAmount(e.target.value)}
              disabled={isExempt}
              placeholder='Ví dụ: 200000'
              inputMode='numeric'
            />

            <TextField
              label='Lý do'
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder='Nhập lý do giảm/miễn học phí...'
              multiline
              minRows={3}
              required
            />

            <Box className='flex items-center gap-2'>
              <Button variant='contained' onClick={handleSubmit} disabled={!canSubmit || submitting}>
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </Button>
              {selectedStudent?.tuitionDiscountStatus && (
                <Typography variant='caption' color='text.secondary'>
                  Học viên đang có cấu hình giảm trừ: {selectedStudent.tuitionDiscountAmount ? formatVnd(selectedStudent.tuitionDiscountAmount) : '—'}
                </Typography>
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
                  <TableCell>Lý do</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Thời gian</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loadingRows && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography variant='body2' color='text.secondary'>
                        Chưa có yêu cầu nào.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}

                {rows.map(r => (
                  <TableRow key={r.studentId}>
                    <TableCell>
                      <Typography variant='body2' sx={{ fontWeight: 600 }}>
                        {r.studentName}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {r.studentCode || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>{formatVnd(r.discountAmount || 0)}</TableCell>
                    <TableCell>
                      <Typography variant='body2'>{r.reason}</Typography>
                      {r.decisionNote && (
                        <Typography variant='caption' color='text.secondary'>
                          Ghi chú: {r.decisionNote}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{statusChip(r.status)}</TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {formatDateTimeVN(r.requestedAt, '—')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}

export default StudentTuitionDiscountPage
