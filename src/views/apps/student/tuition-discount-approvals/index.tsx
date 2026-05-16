'use client'

import { useCallback, useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

import studentService, { type TuitionDiscountRequestRow } from '@/services/studentService'
import { useNotification } from '@/contexts/notificationContext'

const formatVnd = (n: number) => `${Math.round(n).toLocaleString('vi-VN')}đ`

const StudentTuitionDiscountApprovalsPage = () => {
  const { showNotification } = useNotification()

  const [rows, setRows] = useState<TuitionDiscountRequestRow[]>([])
  const [loading, setLoading] = useState(false)

  const [decideOpen, setDecideOpen] = useState(false)
  const [decideStudentId, setDecideStudentId] = useState<string | null>(null)
  const [decideApprove, setDecideApprove] = useState(true)
  const [decideNote, setDecideNote] = useState('')
  const [deciding, setDeciding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await studentService.getPendingTuitionDiscountRequests({ pageSize: 100 })
      setRows(res.data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openDecide = (studentId: string, approve: boolean) => {
    setDecideStudentId(studentId)
    setDecideApprove(approve)
    setDecideNote('')
    setDecideOpen(true)
  }

  const submitDecide = async () => {
    if (!decideStudentId) return
    setDeciding(true)
    try {
      const res = await studentService.decideTuitionDiscount(decideStudentId, { approve: decideApprove, note: decideNote.trim() || undefined })
      if (!res.success) {
        showNotification(res.message || 'Không cập nhật được', 'error')
        return
      }
      showNotification(res.message || 'Đã cập nhật', 'success')
      setDecideOpen(false)
      await load()
    } finally {
      setDeciding(false)
    }
  }

  return (
    <Box className='flex flex-col gap-6'>
      <Card>
        <CardContent>
          <Typography variant='h5' sx={{ mb: 1 }}>
            Duyệt giảm trừ / miễn học phí
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Danh sách các yêu cầu đang chờ duyệt.
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Yêu cầu chờ duyệt
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Học viên</TableCell>
                  <TableCell align='right'>Giảm</TableCell>
                  <TableCell>Lý do</TableCell>
                  <TableCell>Người tạo</TableCell>
                  <TableCell>Thời gian</TableCell>
                  <TableCell align='right'>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant='body2' color='text.secondary'>
                        Không có yêu cầu nào.
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
                    <TableCell>{r.reason}</TableCell>
                    <TableCell>{r.requestedByName || '—'}</TableCell>
                    <TableCell>{r.requestedAt ? new Date(r.requestedAt).toLocaleString('vi-VN') : '—'}</TableCell>
                    <TableCell align='right'>
                      <Box className='flex items-center justify-end gap-2'>
                        <Button size='small' variant='contained' color='success' onClick={() => openDecide(r.studentId, true)}>
                          Duyệt
                        </Button>
                        <Button size='small' variant='outlined' color='error' onClick={() => openDecide(r.studentId, false)}>
                          Từ chối
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={decideOpen} onClose={() => setDecideOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{decideApprove ? 'Duyệt giảm học phí' : 'Từ chối giảm học phí'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label='Ghi chú (tuỳ chọn)'
            value={decideNote}
            onChange={e => setDecideNote(e.target.value)}
            multiline
            minRows={3}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecideOpen(false)} disabled={deciding}>
            Hủy
          </Button>
          <Button variant='contained' onClick={submitDecide} disabled={deciding}>
            {deciding ? 'Đang lưu...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default StudentTuitionDiscountApprovalsPage

