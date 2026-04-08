'use client'

import { useEffect, useState } from 'react'

import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import { useNotification } from '@/contexts/notificationContext'
import beltExamService from '@/services/beltExamService'
import type { AdminExamSessionViewType } from '@/types/apps/beltExamTypes'
import { examSessionStatusColors, examSessionStatusLabels, registrationListStatusLabels } from '@/types/apps/beltExamTypes'

interface Props {
  sessionId: string
}

const BeltExamAdminView = ({ sessionId }: Props) => {
  const { showNotification } = useNotification()
  const [data, setData] = useState<AdminExamSessionViewType | null>(null)
  const [loading, setLoading] = useState(true)
  const [onlyPaid, setOnlyPaid] = useState(true)
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const [locking, setLocking] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadData()
  }, [sessionId, onlyPaid])

  const loadData = async () => {
    try {
      setLoading(true)
      const result = await beltExamService.getAdminView(sessionId, onlyPaid)

      if (result.success && result.data) {
        setData(result.data)
      } else {
        showNotification(result.message || 'Không thể tải dữ liệu kỳ thi', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLock = async () => {
    try {
      setLocking(true)
      const result = await beltExamService.lockSession(sessionId)

      if (result.success) {
        showNotification('Đã chốt danh sách kỳ thi!', 'success')
        setLockDialogOpen(false)
        await loadData()
      } else {
        showNotification(result.message || 'Chốt thất bại', 'error')
      }
    } finally {
      setLocking(false)
    }
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      setExporting(true)
      const result = await beltExamService.exportRegistrationList(sessionId, format)

      if (result.success && result.data) {
        const rows: any[] = result.data.rows || []
        const sessionName: string = result.data.sessionName || 'DanhSachThi'

        if (format === 'excel') {
          const headers = ['STT', 'Họ Tên', 'Ngày Sinh', 'Cấp Hiện Tại', 'Cấp Thi', 'SĐT', 'Lớp', 'HLV']

          const csvRows = [
            headers.join(','),
            ...rows.map((r: any) =>
              [
                r.stt,
                `"${r.hoTen}"`,
                r.ngaySinh,
                `"${r.capHienTai}"`,
                `"${r.capThi}"`,
                r.soDienThoai,
                `"${r.lopHoc}"`,
                `"${r.huanLuyenVien}"`
              ].join(',')
            )
          ]

          const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')

          a.href = url
          a.download = `DanhSachThi_${sessionName}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`
          a.click()
          URL.revokeObjectURL(url)
          showNotification('Đã xuất file Excel (CSV)', 'success')
        } else {
          showNotification('Xuất PDF đang được phát triển', 'info')
        }
      } else {
        showNotification(result.message || 'Xuất file thất bại', 'error')
      }
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <Box className='flex justify-center p-8'>
        <CircularProgress />
      </Box>
    )
  }

  if (!data) {
    return <Alert severity='error'>Không tìm thấy kỳ thi</Alert>
  }

  let stt = 0

  return (
    <Box>
      {/* Header card */}
      <Card className='mb-4'>
        <CardHeader
          title={
            <Box className='flex items-center gap-3 flex-wrap'>
              <Typography variant='h5'>{data.sessionName}</Typography>
              <Chip
                label={examSessionStatusLabels[data.status] ?? data.status}
                color={examSessionStatusColors[data.status] ?? 'default'}
              />
              {data.isLocked && (
                <Chip label='Đã chốt' color='error' icon={<i className='ri-lock-line' />} />
              )}
            </Box>
          }
          subheader={
            <Box className='flex gap-4 flex-wrap mt-1'>
              <Typography variant='body2'>
                Ngày thi: {new Date(data.examDate).toLocaleDateString('vi-VN')}
              </Typography>
              {data.registrationDeadline && (
                <Typography variant='body2'>
                  Hạn ĐK: {new Date(data.registrationDeadline).toLocaleString('vi-VN')}
                </Typography>
              )}
              {data.lockedAt && (
                <Typography variant='body2'>
                  Chốt lúc: {new Date(data.lockedAt).toLocaleString('vi-VN')}
                </Typography>
              )}
            </Box>
          }
          action={
            <Box className='flex gap-2 flex-wrap'>
              <Button
                variant='outlined'
                size='small'
                startIcon={<i className='ri-file-excel-line' />}
                onClick={() => handleExport('excel')}
                disabled={exporting || !data.isLocked}
              >
                Xuất Excel
              </Button>
              <Button
                variant='outlined'
                size='small'
                startIcon={<i className='ri-file-pdf-line' />}
                onClick={() => handleExport('pdf')}
                disabled={exporting || !data.isLocked}
              >
                Xuất PDF
              </Button>
              {!data.isLocked && (
                <Button
                  variant='contained'
                  color='error'
                  size='small'
                  startIcon={<i className='ri-lock-line' />}
                  onClick={() => setLockDialogOpen(true)}
                >
                  Chốt danh sách
                </Button>
              )}
            </Box>
          }
        />
      </Card>

      {/* Thống kê nhanh */}
      <Box className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
        {[
          { label: 'Tổng đăng ký', value: data.totalRegistered, color: 'primary.main' },
          { label: 'Đã đóng tiền', value: data.totalPaid, color: 'success.main' },
          { label: 'Chưa đóng tiền', value: data.totalUnpaid, color: 'warning.main' },
          {
            label: 'Tổng đã thu',
            value: data.totalAmountCollected.toLocaleString('vi-VN') + 'đ',
            color: 'info.main'
          }
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className='text-center py-3'>
              <Typography variant='h4' color={stat.color}>
                {stat.value}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {stat.label}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Bộ lọc */}
      <Card className='mb-4'>
        <CardContent className='py-2'>
          <FormControlLabel
            control={
              <Switch
                checked={onlyPaid}
                onChange={e => setOnlyPaid(e.target.checked)}
                color='success'
              />
            }
            label='Chỉ hiển thị học viên đã đóng tiền'
          />
        </CardContent>
      </Card>

      {/* Danh sách theo HLV */}
      {data.coachGroups.length === 0 ? (
        <Alert severity='info'>Chưa có danh sách đăng ký nào được nộp.</Alert>
      ) : (
        data.coachGroups.map(group => (
          <Accordion key={`${group.coachId}-${group.classId}`} defaultExpanded className='mb-2'>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <Box className='flex items-center gap-3 flex-wrap w-full pr-4'>
                <Typography className='font-medium'>{group.coachName}</Typography>
                <Typography color='text.secondary'>—</Typography>
                <Typography color='text.secondary'>{group.className}</Typography>
                <Chip
                  label={registrationListStatusLabels[group.listStatus]}
                  size='small'
                  color={group.listStatus === 'Submitted' ? 'success' : 'warning'}
                />
                {group.isAutoSubmitted && (
                  <Chip label='Tự động nộp' size='small' color='warning' variant='outlined' />
                )}
                <Typography variant='body2' color='text.secondary' className='ml-auto'>
                  {group.paidCount}/{group.totalStudents} đã đóng tiền
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails className='p-0'>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell width={50}>STT</TableCell>
                      <TableCell>Họ tên</TableCell>
                      <TableCell>Ngày sinh</TableCell>
                      <TableCell>Cấp hiện tại</TableCell>
                      <TableCell>Cấp thi</TableCell>
                      <TableCell>SĐT</TableCell>
                      <TableCell>Lệ phí</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.students.map(student => {
                      stt++

                      return (
                        <TableRow key={student.registrationId}>
                          <TableCell>{stt}</TableCell>
                          <TableCell>
                            <Typography variant='body2' className='font-medium'>
                              {student.studentName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {student.dateOfBirth
                              ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN')
                              : '—'}
                          </TableCell>
                          <TableCell>{student.currentBeltLevelName ?? '—'}</TableCell>
                          <TableCell>
                            <strong>{student.targetBeltLevelName}</strong>
                          </TableCell>
                          <TableCell>{student.phoneNumber ?? '—'}</TableCell>
                          <TableCell>
                            <Chip
                              label={student.hasPaid ? 'Đã đóng' : 'Chưa đóng'}
                              color={student.hasPaid ? 'success' : 'warning'}
                              size='small'
                              variant='tonal'
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* Dialog xác nhận chốt */}
      <Dialog open={lockDialogOpen} onClose={() => setLockDialogOpen(false)}>
        <DialogTitle>⚠️ Xác nhận chốt danh sách</DialogTitle>
        <DialogContent>
          <DialogContentText component='div'>
            Sau khi chốt:
            <ul className='mt-2 pl-4 list-disc'>
              <li>Không thể thu tiền thêm</li>
              <li>Học viên chưa đóng tiền sẽ bị loại khỏi danh sách</li>
              <li>Chỉ học viên đã đóng tiền mới được thi</li>
            </ul>
            Bạn có chắc chắn muốn chốt không?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLockDialogOpen(false)}>Hủy</Button>
          <Button variant='contained' color='error' onClick={handleLock} disabled={locking}>
            {locking ? <CircularProgress size={18} /> : 'Chốt danh sách'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default BeltExamAdminView
