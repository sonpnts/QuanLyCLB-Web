'use client'

import { useEffect, useMemo, useState } from 'react'

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
import type { AdminExamSessionViewType, AdminExamStudentRowType } from '@/types/apps/beltExamTypes'
import { examSessionStatusColors, examSessionStatusLabels, registrationListStatusLabels } from '@/types/apps/beltExamTypes'
import { exportToExcel } from '@/utils/exportToExcel'

interface Props {
  sessionId: string
}

const formatDate = (value?: string) => {
  if (!value) return ''

  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatGender = (value?: boolean) => {
  if (value === true) return 'Nam'
  if (value === false) return 'Nữ'

  return ''
}

const formatBeltOrder = (value?: number, fallback = '10') => String(value ?? fallback)

const formatEducationLevel = (value?: string) => {
  switch (value) {
    case 'THCS':
      return 'THCS'
    case 'THPT':
      return 'THPT'
    case 'TieuHoc':
      return 'Tiểu học'
    case 'ChuaDiHoc':
      return 'Chưa đi học'
    case 'DaiHoc':
      return 'Đại học'
    case 'ThacSi':
      return 'Thạc sĩ'
    case 'TienSi':
      return 'Tiến sĩ'
    case 'CaoDang':
      return 'Cao đẳng'
    case 'TrungCap':
      return 'Trung cấp'
    default:
      return value || ''
  }
}

const BeltExamAdminView = ({ sessionId }: Props) => {
  const { showNotification } = useNotification()
  const [data, setData] = useState<AdminExamSessionViewType | null>(null)
  const [loading, setLoading] = useState(true)
  const [onlyPaid, setOnlyPaid] = useState(false)
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const [locking, setLocking] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const result = await beltExamService.getAdminView(sessionId, onlyPaid)

        if (result.success && result.data) {
          setData(result.data)
        } else {
          showNotification(result.message || 'Không thể tải dữ liệu kỳ thi.', 'error')
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [sessionId, onlyPaid, showNotification])

  const flattenedStudents = useMemo(() => {
    if (!data) return []

    return data.coachGroups.flatMap(group => group.students)
  }, [data])

  const fetchFullAdminView = async () => {
    const response = await beltExamService.getAdminView(sessionId, false)

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể tải danh sách đầy đủ để xuất file.')
    }

    return response.data
  }

  const buildFullRegistrationRows = (students: AdminExamStudentRowType[]) =>
    students.map((student, index) => ({
      stt: index + 1,
      studentName: student.studentName,
      studentCode: student.studentCode || '',
      dateOfBirth: formatDate(student.dateOfBirth),
      gender: formatGender(student.gender),
      phoneNumber: student.phoneNumber || '',
      currentBeltLevelOrder: formatBeltOrder(student.currentBeltLevelOrder),
      targetBeltLevelOrder: formatBeltOrder(student.targetBeltLevelOrder, ''),
      className: student.className,
      coachName: student.coachName,
      oneTimeFeesCompleted: student.oneTimeFeesCompleted ? 'Đã hoàn thành' : 'Chưa hoàn thành',
      examFeePaid: student.hasPaid ? 'Đã đóng' : 'Chưa đóng',
      eligible: student.oneTimeFeesCompleted && student.hasPaid ? 'Đủ điều kiện' : 'Chưa đủ điều kiện'
    }))

  const handleLock = async () => {
    try {
      setLocking(true)
      const result = await beltExamService.lockSession(sessionId)

      if (result.success) {
        showNotification('Đã chốt danh sách kỳ thi.', 'success')
        setLockDialogOpen(false)
        const refreshed = await beltExamService.getAdminView(sessionId, onlyPaid)

        if (refreshed.success && refreshed.data) setData(refreshed.data)
      } else {
        showNotification(result.message || 'Chốt danh sách thất bại.', 'error')
      }
    } finally {
      setLocking(false)
    }
  }

  const handleExportEligibleRegistrations = async () => {
    try {
      setExporting(true)
      const fullData = await fetchFullAdminView()

      const exportStudents = fullData.coachGroups
        .flatMap(group => group.students)
        .filter(student => student.hasPaid && student.oneTimeFeesCompleted)

      const rows = exportStudents.map((student, index) => ({
        stt: index + 1,
        studentName: student.studentName,
        studentCode: student.studentCode || '',
        dateOfBirth: formatDate(student.dateOfBirth),
        gender: formatGender(student.gender),
        phoneNumber: student.phoneNumber || '',
        currentBeltLevelOrder: formatBeltOrder(student.currentBeltLevelOrder),
        targetBeltLevelOrder: formatBeltOrder(student.targetBeltLevelOrder, ''),
        className: student.className
      }))

      exportToExcel({
        filename: `Danh-sach-thi-du-phi-${fullData.sessionName}`,
        sheetName: 'DanhSachThiDuPhi',
        columns: [
          { header: 'STT', accessor: 'stt', width: 8 },
          { header: 'Tên', accessor: 'studentName', width: 28 },
          { header: 'Mã HV', accessor: 'studentCode', width: 16 },
          { header: 'Ngày sinh', accessor: 'dateOfBirth', width: 16 },
          { header: 'Giới tính', accessor: 'gender', width: 12 },
          { header: 'SĐT', accessor: 'phoneNumber', width: 16 },
          { header: 'Cấp đai hiện tại', accessor: 'currentBeltLevelOrder', width: 20 },
          { header: 'Cấp đai dự thi', accessor: 'targetBeltLevelOrder', width: 20 },
          { header: 'Lớp', accessor: 'className', width: 18 }
        ],
        rows
      })

      showNotification('Đã xuất danh sách thi của các học viên đủ phí.', 'success')
    } catch (error: any) {
      showNotification(error?.message || 'Không thể xuất danh sách đăng ký thi.', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleExportAllRegistrations = async () => {
    try {
      setExporting(true)
      const fullData = await fetchFullAdminView()
      const rows = buildFullRegistrationRows(fullData.coachGroups.flatMap(group => group.students))

      exportToExcel({
        filename: `Toan-bo-danh-sach-da-dang-ky-${fullData.sessionName}`,
        sheetName: 'ToanBoDangKy',
        columns: [
          { header: 'STT', accessor: 'stt', width: 8 },
          { header: 'Họ tên', accessor: 'studentName', width: 28 },
          { header: 'Mã HV', accessor: 'studentCode', width: 16 },
          { header: 'Ngày sinh', accessor: 'dateOfBirth', width: 16 },
          { header: 'Giới tính', accessor: 'gender', width: 12 },
          { header: 'SĐT', accessor: 'phoneNumber', width: 16 },
          { header: 'Cấp hiện tại', accessor: 'currentBeltLevelOrder', width: 16 },
          { header: 'Cấp dự thi', accessor: 'targetBeltLevelOrder', width: 16 },
          { header: 'Lớp', accessor: 'className', width: 18 },
          { header: 'HLV', accessor: 'coachName', width: 20 },
          { header: 'Phí 1 lần', accessor: 'oneTimeFeesCompleted', width: 18 },
          { header: 'Lệ phí thi', accessor: 'examFeePaid', width: 16 },
          { header: 'Điều kiện thi', accessor: 'eligible', width: 18 }
        ],
        rows
      })

      showNotification('Đã xuất toàn bộ danh sách đã đăng ký.', 'success')
    } catch (error: any) {
      showNotification(error?.message || 'Không thể xuất toàn bộ danh sách đã đăng ký.', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleExportStudentImportData = async () => {
    try {
      setExporting(true)
      const fullData = await fetchFullAdminView()

      const missingCodeStudents = fullData.coachGroups
        .flatMap(group => group.students)
        .filter(student => student.hasPaid && student.oneTimeFeesCompleted)
        .filter(student => !String(student.studentCode || '').trim())

      if (missingCodeStudents.length === 0) {
        showNotification('Không có học viên nào thiếu mã HV để xuất file import.', 'info')
        
return
      }

      const rows = missingCodeStudents.map(student => ({
        fullName: student.studentName,
        dateOfBirth: formatDate(student.dateOfBirth),
        gender: formatGender(student.gender),
        phoneNumber: student.phoneNumber || '',
        personalIdNumber: student.personalIdNumber || '',
        educationLevel: formatEducationLevel(student.educationLevel)
      }))

      exportToExcel({
        filename: 'Du-lieu-hoc-vien-import',
        sheetName: 'DuLieuHocVienImport',
        columns: [
          { header: 'Họ và tên (bắt buộc)', accessor: 'fullName', width: 28 },
          { header: 'Ngày tháng năm sinh (bắt buộc) dd/mm/yyyy', accessor: 'dateOfBirth', width: 24 },
          { header: 'Giới tính (Nam/Nữ)', accessor: 'gender', width: 18 },
          { header: 'Số điện thoại', accessor: 'phoneNumber', width: 18 },
          { header: 'CMND/CCCD', accessor: 'personalIdNumber', width: 18 },
          { header: 'Trình độ văn hóa', accessor: 'educationLevel', width: 18 }
        ],
        rows
      })

      showNotification('Đã xuất file Dữ liệu học viên import cho học viên đủ điều kiện.', 'success')
    } catch (error: any) {
      showNotification(error?.message || 'Không thể xuất file dữ liệu học viên import.', 'error')
    } finally {
      setExporting(false)
    }
  }

  const renderPaidBadge = (student: AdminExamStudentRowType) => (
    <Chip
      label={student.hasPaid ? 'Đã đóng' : 'Chưa đóng'}
      color={student.hasPaid ? 'success' : 'warning'}
      size='small'
      variant='tonal'
    />
  )

  const renderOneTimeFeeBadge = (student: AdminExamStudentRowType) => (
    <Chip
      label={student.oneTimeFeesCompleted ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
      color={student.oneTimeFeesCompleted ? 'success' : 'warning'}
      size='small'
      variant='tonal'
    />
  )

  const renderEligibleBadge = (student: AdminExamStudentRowType) => (
    <Chip
      label={student.oneTimeFeesCompleted && student.hasPaid ? 'Đủ điều kiện' : 'Chưa đủ'}
      color={student.oneTimeFeesCompleted && student.hasPaid ? 'success' : 'default'}
      size='small'
      variant='tonal'
    />
  )

  if (loading) {
    return (
      <Box className='flex justify-center p-8'>
        <CircularProgress />
      </Box>
    )
  }

  if (!data) {
    return <Alert severity='error'>Không tìm thấy kỳ thi.</Alert>
  }

  let stt = 0

  return (
    <Box>
      <Card className='mb-4'>
        <CardHeader
          title={
            <Box className='flex items-center gap-3 flex-wrap'>
              <Typography variant='h5'>{data.sessionName}</Typography>
              <Chip
                label={examSessionStatusLabels[data.status] ?? data.status}
                color={examSessionStatusColors[data.status] ?? 'default'}
              />
              {data.isLocked && <Chip label='Đã chốt' color='error' icon={<i className='ri-lock-line' />} />}
            </Box>
          }
          subheader={
            <Box className='flex gap-4 flex-wrap mt-1'>
              <Typography variant='body2'>Ngày thi: {new Date(data.examDate).toLocaleDateString('vi-VN')}</Typography>
              {data.registrationDeadline && (
                <Typography variant='body2'>
                  Hạn đăng ký: {new Date(data.registrationDeadline).toLocaleString('vi-VN')}
                </Typography>
              )}
              {data.lockedAt && (
                <Typography variant='body2'>Chốt lúc: {new Date(data.lockedAt).toLocaleString('vi-VN')}</Typography>
              )}
            </Box>
          }
          action={
            <Box className='flex gap-2 flex-wrap'>
              <Button
                variant='outlined'
                size='small'
                startIcon={<i className='ri-file-excel-line' />}
                onClick={handleExportEligibleRegistrations}
                disabled={exporting}
              >
                Xuất danh sách đủ phí
              </Button>
              <Button
                variant='outlined'
                size='small'
                startIcon={<i className='ri-file-list-3-line' />}
                onClick={handleExportAllRegistrations}
                disabled={exporting}
              >
                Xuất toàn bộ đăng ký
              </Button>
              <Button
                variant='outlined'
                size='small'
                startIcon={<i className='ri-download-2-line' />}
                onClick={handleExportStudentImportData}
                disabled={exporting}
              >
                Dữ liệu học viên import
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

      <Box className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
        {[
          { label: 'Tổng đăng ký', value: data.totalRegistered, color: 'primary.main' },
          { label: 'Đã đóng tiền', value: data.totalPaid, color: 'success.main' },
          { label: 'Chưa đóng tiền', value: data.totalUnpaid, color: 'warning.main' },
          {
            label: 'Tổng đã thu',
            value: `${data.totalAmountCollected.toLocaleString('vi-VN')} đ`,
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

      <Card className='mb-4'>
        <CardContent className='py-2'>
          <FormControlLabel
            control={<Switch checked={onlyPaid} onChange={event => setOnlyPaid(event.target.checked)} color='success' />}
            label='Chỉ hiển thị học viên đã đóng lệ phí thi'
          />
          <Typography variant='body2' color='text.secondary'>
            Khi tắt bộ lọc này, màn hình sẽ hiển thị toàn bộ học viên đã đăng ký cùng trạng thái các khoản phí.
          </Typography>
        </CardContent>
      </Card>

      {flattenedStudents.length === 0 ? (
        <Alert severity='info'>Chưa có danh sách đăng ký nào được nộp.</Alert>
      ) : (
        data.coachGroups.map(group => (
          <Accordion key={`${group.coachId}-${group.classId}`} defaultExpanded className='mb-2'>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <Box className='flex items-center gap-3 flex-wrap w-full pr-4'>
                <Typography className='font-medium'>{group.coachName}</Typography>
                <Typography color='text.secondary'>-</Typography>
                <Typography color='text.secondary'>{group.className}</Typography>
                <Chip
                  label={registrationListStatusLabels[group.listStatus]}
                  size='small'
                  color={group.listStatus === 'Submitted' ? 'success' : 'warning'}
                />
                {group.isAutoSubmitted && <Chip label='Tự động nộp' size='small' color='warning' variant='outlined' />}
                <Typography variant='body2' color='text.secondary' className='ml-auto'>
                  {group.paidCount}/{group.totalStudents} đã đóng lệ phí
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
                      <TableCell>Mã HV</TableCell>
                      <TableCell>Ngày sinh</TableCell>
                      <TableCell>Giới tính</TableCell>
                      <TableCell>Cấp hiện tại</TableCell>
                      <TableCell>Cấp thi</TableCell>
                      <TableCell>SĐT</TableCell>
                      <TableCell>Phí 1 lần</TableCell>
                      <TableCell>Lệ phí</TableCell>
                      <TableCell>Điều kiện thi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.students.map(student => {
                      stt += 1

                      return (
                        <TableRow key={student.registrationId}>
                          <TableCell>{stt}</TableCell>
                          <TableCell>
                            <Typography variant='body2' className='font-medium'>
                              {student.studentName}
                            </Typography>
                          </TableCell>
                          <TableCell>{student.studentCode || '—'}</TableCell>
                          <TableCell>{student.dateOfBirth ? formatDate(student.dateOfBirth) : '—'}</TableCell>
                          <TableCell>{student.gender === undefined ? '—' : formatGender(student.gender)}</TableCell>
                          <TableCell>{formatBeltOrder(student.currentBeltLevelOrder)}</TableCell>
                          <TableCell>
                            <strong>{formatBeltOrder(student.targetBeltLevelOrder, '')}</strong>
                          </TableCell>
                          <TableCell>{student.phoneNumber || '—'}</TableCell>
                          <TableCell>{renderOneTimeFeeBadge(student)}</TableCell>
                          <TableCell>{renderPaidBadge(student)}</TableCell>
                          <TableCell>{renderEligibleBadge(student)}</TableCell>
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

      <Dialog open={lockDialogOpen} onClose={() => setLockDialogOpen(false)}>
        <DialogTitle>Xác nhận chốt danh sách</DialogTitle>
        <DialogContent>
          <DialogContentText component='div'>
            Sau khi chốt:
            <ul className='mt-2 pl-4 list-disc'>
              <li>Không thể thu tiền thêm</li>
              <li>Học viên chưa đóng lệ phí sẽ bị loại khỏi danh sách</li>
              <li>Chỉ học viên đã đóng lệ phí mới được thi</li>
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
