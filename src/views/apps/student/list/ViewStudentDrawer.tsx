'use client'
import { logger } from '@/utils/logger'

// React Imports
import { useEffect, useState, useRef, useCallback } from 'react'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import CircularProgress from '@mui/material/CircularProgress'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'

// Types
import type { StudentType, EnrollmentType, ExamHistoryType } from '@/types/apps/studentTypes'
import type { ClassType } from '@/types/apps/classTypes'

// Services
import studentService from '@/services/studentService'
import classService from '@/services/classService'
import classTransferService from '@/services/classTransferService'

// Context
import { useNotification } from '@/contexts/notificationContext'

// Components
import CustomAvatar from '@core/components/mui/Avatar'

type Props = {
  open: boolean
  onClose: () => void
  student: StudentType | null
  onSuspend?: (student: StudentType) => void
  onResume?: (student: StudentType) => void
}

type PaymentHistoryType = {
  id: string
  amount: number
  paymentDate: string
  type: number
  method: number
  forMonth?: number
  forYear?: number
  description?: string
  className?: string
}

type AttendanceHistoryType = {
  id: string
  date: string
  status: string
  className?: string
  checkInTime?: string
  checkOutTime?: string
  notes?: string
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const paymentTypeLabels: { [key: number]: string } = {
  0: 'Học phí',
  1: 'Phí thi',
  2: 'Phí đăng ký',
  3: 'Khác'
}

const paymentMethodLabels: { [key: number]: string } = {
  0: 'Tiền mặt',
  1: 'Chuyển khoản',
  2: 'Thẻ'
}

const ViewStudentDrawer = ({ open, onClose, student, onSuspend, onResume }: Props) => {
  const [activeTab, setActiveTab] = useState('1')
  const [enrollments, setEnrollments] = useState<EnrollmentType[]>([])
  const [payments, setPayments] = useState<PaymentHistoryType[]>([])
  const [attendance, setAttendance] = useState<AttendanceHistoryType[]>([])
  const [examHistory, setExamHistory] = useState<ExamHistoryType[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [loadingExamHistory, setLoadingExamHistory] = useState(false)

  // Transfer dialog state
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [transferFromClassId, setTransferFromClassId] = useState('')
  const [transferToClassId, setTransferToClassId] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)
  const [availableClasses, setAvailableClasses] = useState<ClassType[]>([])

  const { showNotification } = useNotification()

  // Track đã load data cho student nào để tránh load lại
  const loadedDataRef = useRef<{
    studentId: string | null
    enrollments: boolean
    payments: boolean
    attendance: boolean
    examHistory: boolean
  }>({
    studentId: null,
    enrollments: false,
    payments: false,
    attendance: false,
    examHistory: false
  })

  // Reset cache khi student thay đổi
  useEffect(() => {
    if (student?.id !== loadedDataRef.current.studentId) {
      loadedDataRef.current = {
        studentId: student?.id || null,
        enrollments: false,
        payments: false,
        attendance: false,
        examHistory: false
      }
      // Reset data
      setEnrollments([])
      setPayments([])
      setAttendance([])
      setExamHistory([])
    }
  }, [student?.id])

  // Load enrollments khi drawer mở (chỉ load 1 lần cho mỗi student)
  useEffect(() => {
    const loadEnrollments = async () => {
      if (!student?.id || !open || loadedDataRef.current.enrollments) return

      try {
        setLoadingEnrollments(true)
        const response = await studentService.getStudentEnrollments(student.id)

        if (response.success && Array.isArray(response.data)) {
          setEnrollments(response.data)
        } else {
          setEnrollments([])
        }
        loadedDataRef.current.enrollments = true
      } catch (error) {
        logger.error('ViewStudentDrawer', 'Error loading enrollments', error)
        setEnrollments([])
      } finally {
        setLoadingEnrollments(false)
      }
    }

    loadEnrollments()
  }, [student?.id, open])

  // Load payments khi chuyển sang tab payments (lazy load)
  const loadPayments = useCallback(async () => {
    if (!student?.id || loadedDataRef.current.payments) return

    try {
      setLoadingPayments(true)
      const response = await studentService.getStudentPayments(student.id)

      if (response.success && Array.isArray(response.data)) {
        setPayments(response.data)
      } else {
        setPayments([])
      }
      loadedDataRef.current.payments = true
    } catch (error) {
      logger.error('ViewStudentDrawer', 'Error loading payments', error)
      setPayments([])
    } finally {
      setLoadingPayments(false)
    }
  }, [student?.id])

  // Load attendance khi chuyển sang tab attendance (lazy load)
  const loadAttendance = useCallback(async () => {
    if (!student?.id || loadedDataRef.current.attendance) return

    try {
      setLoadingAttendance(true)
      const response = await studentService.getStudentAttendance(student.id)

      if (response.success && Array.isArray(response.data)) {
        setAttendance(response.data)
      } else {
        setAttendance([])
      }
      loadedDataRef.current.attendance = true
    } catch (error) {
      logger.error('ViewStudentDrawer', 'Error loading attendance', error)
      setAttendance([])
    } finally {
      setLoadingAttendance(false)
    }
  }, [student?.id])

  // Load exam history khi chuyển sang tab exam (lazy load)
  const loadExamHistory = useCallback(async () => {
    if (!student?.id || loadedDataRef.current.examHistory) return

    try {
      setLoadingExamHistory(true)
      const response = await studentService.getExamHistory(student.id)

      if (response.success && Array.isArray(response.data)) {
        setExamHistory(response.data)
      } else {
        setExamHistory([])
      }
      loadedDataRef.current.examHistory = true
    } catch (error) {
      logger.error('ViewStudentDrawer', 'Error loading exam history', error)
      setExamHistory([])
    } finally {
      setLoadingExamHistory(false)
    }
  }, [student?.id])

  // Reset tab khi drawer đóng
  useEffect(() => {
    if (!open) {
      setActiveTab('1')
    }
  }, [open])

  if (!student) return null

  // Derive current active class IDs from student data
  const studentClasses: any[] = (student as any).classes || []
  const activeStudentClasses = studentClasses.filter(
    (c: any) => c.status === 0 || c.status === 'Active'
  )
  const currentClassIds = activeStudentClasses.map((c: any) => c.classId || c.id)

  const handleOpenTransferDialog = async () => {
    // Pre-fill fromClassId with first active class
    const firstActiveClass = activeStudentClasses[0]
    setTransferFromClassId(firstActiveClass?.classId || firstActiveClass?.id || '')
    setTransferToClassId('')
    setTransferReason('')

    // Load all classes
    const response = await classService.getClasses({ isActive: true, pageSize: 1000 })
    if (response.success && response.data) {
      setAvailableClasses(response.data)
    }
    setTransferDialogOpen(true)
  }

  const handleCloseTransferDialog = () => {
    setTransferDialogOpen(false)
    setTransferFromClassId('')
    setTransferToClassId('')
    setTransferReason('')
  }

  const handleSubmitTransfer = async () => {
    if (!student?.id || !transferFromClassId || !transferToClassId || !transferReason.trim()) return
    try {
      setTransferLoading(true)
      const response = await classTransferService.createClassTransfer({
        studentId: student.id,
        fromClassId: transferFromClassId,
        toClassId: transferToClassId,
        reason: transferReason.trim()
      })
      if (response.success) {
        showNotification('Yêu cầu chuyển lớp đã được gửi thành công.', 'success')
        handleCloseTransferDialog()
      } else {
        showNotification(response.message || 'Không thể gửi yêu cầu chuyển lớp.', 'error')
      }
    } catch {
      showNotification('Đã có lỗi khi gửi yêu cầu chuyển lớp.', 'error')
    } finally {
      setTransferLoading(false)
    }
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)

    // Lazy load data khi chuyển tab
    if (newValue === '2' && !loadedDataRef.current.payments) {
      loadPayments()
    } else if (newValue === '3' && !loadedDataRef.current.attendance) {
      loadAttendance()
    } else if (newValue === '4' && !loadedDataRef.current.examHistory) {
      loadExamHistory()
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 360, sm: 500, md: 600 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Chi tiết học viên</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />

      <Box className='p-5'>
        {/* Header với Avatar */}
        <Box className='flex items-center gap-4 mb-4'>
          <CustomAvatar skin='light' size={64} color={student.isSuspended ? 'secondary' : 'primary'}>
            {getInitials(student.fullName)}
          </CustomAvatar>
          <Box className='flex-1'>
            <div className='flex items-center gap-2 flex-wrap'>
              <Typography variant='h6'>{student.fullName}</Typography>
              {student.isSuspended && (
                <Chip label='Tạm nghỉ' size='small' color='warning' variant='tonal' />
              )}
            </div>
            <Typography variant='body2' color='text.secondary'>
              {student.email || 'Chưa có email'}
            </Typography>
            <div className='flex gap-2 mt-1 flex-wrap items-center'>
              {student.currentBeltLevelName && (
                <Chip label={student.currentBeltLevelName} size='small' color='warning' variant='tonal' />
              )}
              {student.isSuspended && student.suspendReason && (
                <Typography variant='caption' color='text.secondary'>Lý do: {student.suspendReason}</Typography>
              )}
            </div>
            <div className='flex gap-2 mt-2'>
              {student.isSuspended ? (
                <Button
                  size='small'
                  variant='outlined'
                  color='success'
                  startIcon={<i className='ri-play-circle-line' />}
                  onClick={() => onResume?.(student)}
                >
                  Khôi phục
                </Button>
              ) : (
                <Button
                  size='small'
                  variant='outlined'
                  color='warning'
                  startIcon={<i className='ri-pause-circle-line' />}
                  onClick={() => onSuspend?.(student)}
                >
                  Tạm nghỉ
                </Button>
              )}
            </div>
          </Box>
        </Box>

        {/* Tabs */}
        <TabContext value={activeTab}>
          <TabList onChange={handleTabChange} variant='scrollable' scrollButtons='auto'>
            <Tab label='Thông tin' value='1' />
            <Tab label='Thanh toán' value='2' />
            <Tab label='Điểm danh' value='3' />
            <Tab label='Lịch sử thi' value='4' />
          </TabList>

          {/* Tab 1: Thông tin cơ bản */}
          <TabPanel value='1' className='px-0'>
            <Card variant='outlined' className='mb-4'>
              <CardContent>
                <Typography variant='subtitle1' className='font-medium mb-3'>
                  Thông tin cơ bản
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Số điện thoại
                    </Typography>
                    <Typography variant='body1'>{student.phoneNumber || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Giới tính
                    </Typography>
                    <Typography variant='body1'>
                      {student.gender === true ? 'Nam' : student.gender === false ? 'Nữ' : '-'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Ngày sinh
                    </Typography>
                    <Typography variant='body1'>
                      {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : '-'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      CMND/CCCD
                    </Typography>
                    <Typography variant='body1'>{student.identityNumber || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Cấp đai liên đoàn
                    </Typography>
                    {student.currentBeltLevelName ? (
                      <Chip label={student.currentBeltLevelName} size='small' color='warning' variant='tonal' />
                    ) : (
                      <Typography variant='body1' color='text.disabled'>Chưa có / chưa đồng bộ</Typography>
                    )}
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Email
                    </Typography>
                    <Typography variant='body1'>{student.email || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Địa chỉ
                    </Typography>
                    <Typography variant='body1'>{student.address || '-'}</Typography>
                  </Grid>
                  {student.notes && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant='body2' color='text.secondary'>
                        Ghi chú
                      </Typography>
                      <Typography variant='body1'>{student.notes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Danh sách lớp đang học */}
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='subtitle1' className='font-medium mb-3'>
                  Lớp đang học
                </Typography>
                {loadingEnrollments ? (
                  <Box className='flex justify-center py-4'>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  (() => {
                    // Ưu tiên dùng classes từ student response (API mới)
                    const studentClasses = (student as any).classes || []
                    const displayData = studentClasses.length > 0 ? studentClasses : enrollments

                    if (displayData.length === 0) {
                      return (
                        <Typography variant='body2' color='text.secondary'>
                          Chưa đăng ký lớp nào
                        </Typography>
                      )
                    }

                    return (
                      <List dense disablePadding>
                        {displayData.map((item: any) => (
                          <ListItem key={item.enrollmentId || item.id || item.classId} disablePadding className='mb-2'>
                            <ListItemText
                              primary={item.className || 'Lớp không xác định'}
                              secondary={
                                <Box className='flex items-center gap-2 mt-1'>
                                  <Chip
                                    label={
                                      item.status === 0 || item.status === 'Active'
                                        ? 'Đang học'
                                        : item.status === 1 || item.status === 'Inactive'
                                          ? 'Tạm nghỉ'
                                          : 'Hoàn thành'
                                    }
                                    size='small'
                                    color={
                                      item.status === 0 || item.status === 'Active'
                                        ? 'success'
                                        : item.status === 1 || item.status === 'Inactive'
                                          ? 'warning'
                                          : 'info'
                                    }
                                    variant='tonal'
                                  />
                                  {(item.enrollmentDate || item.enrollmentDate) && (
                                    <Typography variant='caption' color='text.secondary'>
                                      Từ {new Date(item.enrollmentDate).toLocaleDateString('vi-VN')}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )
                  })()
                )}
              </CardContent>
            </Card>
            {/* Chuyển lớp button */}
            <Box className='mt-3'>
              <Button
                variant='outlined'
                color='warning'
                startIcon={<i className='ri-arrow-left-right-line' />}
                onClick={handleOpenTransferDialog}
                fullWidth
              >
                Chuyển lớp
              </Button>
            </Box>
          </TabPanel>

          {/* Tab 2: Lịch sử thanh toán */}
          <TabPanel value='2' className='px-0'>
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='subtitle1' className='font-medium mb-3'>
                  Lịch sử thanh toán
                </Typography>
                {loadingPayments ? (
                  <Box className='flex justify-center py-4'>
                    <CircularProgress size={24} />
                  </Box>
                ) : payments.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    Chưa có lịch sử thanh toán
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Ngày</TableCell>
                          <TableCell>Loại</TableCell>
                          <TableCell align='right'>Số tiền</TableCell>
                          <TableCell>Phương thức</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payments.map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell>{new Date(payment.paymentDate).toLocaleDateString('vi-VN')}</TableCell>
                            <TableCell>
                              <Chip
                                label={paymentTypeLabels[payment.type] || 'Khác'}
                                size='small'
                                color={payment.type === 0 ? 'primary' : 'default'}
                                variant='tonal'
                              />
                            </TableCell>
                            <TableCell align='right'>{payment.amount.toLocaleString('vi-VN')}đ</TableCell>
                            <TableCell>{paymentMethodLabels[payment.method] || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 3: Lịch sử điểm danh */}
          <TabPanel value='3' className='px-0'>
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='subtitle1' className='font-medium mb-3'>
                  Lịch sử điểm danh
                </Typography>
                {loadingAttendance ? (
                  <Box className='flex justify-center py-4'>
                    <CircularProgress size={24} />
                  </Box>
                ) : attendance.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    Chưa có lịch sử điểm danh
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Ngày</TableCell>
                          <TableCell>Lớp</TableCell>
                          <TableCell>Trạng thái</TableCell>
                          <TableCell>Ghi chú</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {attendance.map(record => (
                          <TableRow key={record.id}>
                            <TableCell>{new Date(record.date).toLocaleDateString('vi-VN')}</TableCell>
                            <TableCell>{record.className || '-'}</TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  record.status === 'Present'
                                    ? 'Có mặt'
                                    : record.status === 'Absent'
                                      ? 'Vắng'
                                      : record.status === 'Late'
                                        ? 'Trễ'
                                        : record.status === 'Excused'
                                          ? 'Có phép'
                                          : record.status
                                }
                                size='small'
                                color={
                                  record.status === 'Present'
                                    ? 'success'
                                    : record.status === 'Absent'
                                      ? 'error'
                                      : record.status === 'Late'
                                        ? 'warning'
                                        : 'info'
                                }
                                variant='tonal'
                              />
                            </TableCell>
                            <TableCell>{record.notes || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 4: Lịch sử thi cấp */}
          <TabPanel value='4' className='px-0'>
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='subtitle1' className='font-medium mb-3'>
                  Lịch sử thi cấp
                </Typography>
                {loadingExamHistory ? (
                  <Box className='flex justify-center py-4'>
                    <CircularProgress size={24} />
                  </Box>
                ) : examHistory.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    Chưa có lịch sử thi cấp
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Ngày thi</TableCell>
                          <TableCell>Kỳ thi</TableCell>
                          <TableCell>Cấp đai</TableCell>
                          <TableCell>Kết quả</TableCell>
                          <TableCell align='right'>Điểm</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {examHistory.map(exam => (
                          <TableRow key={exam.id}>
                            <TableCell>{new Date(exam.examDate).toLocaleDateString('vi-VN')}</TableCell>
                            <TableCell>{exam.examSessionName}</TableCell>
                            <TableCell>{exam.beltLevelName}</TableCell>
                            <TableCell>
                              <Chip
                                label={exam.result === 1 ? 'Đạt' : exam.result === 2 ? 'Không đạt' : 'Chờ kết quả'}
                                size='small'
                                color={exam.result === 1 ? 'success' : exam.result === 2 ? 'error' : 'warning'}
                                variant='tonal'
                              />
                            </TableCell>
                            <TableCell align='right'>{exam.score ?? '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </TabPanel>
        </TabContext>

        {/* Thông tin hệ thống */}
        {(student.createdAt || student.updatedAt) && (
          <Box className='mt-4'>
            <Typography variant='caption' color='text.secondary'>
              {student.createdAt && `Tạo: ${new Date(student.createdAt).toLocaleString('vi-VN')}`}
              {student.createdAt && student.updatedAt && ' | '}
              {student.updatedAt && `Cập nhật: ${new Date(student.updatedAt).toLocaleString('vi-VN')}`}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Transfer Class Dialog */}
      <Dialog open={transferDialogOpen} onClose={handleCloseTransferDialog} maxWidth='sm' fullWidth>
        <DialogTitle>Chuyển lớp học viên</DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-4 pt-2'>
            <FormControl fullWidth>
              <InputLabel>Từ lớp</InputLabel>
              <Select
                label='Từ lớp'
                value={transferFromClassId}
                onChange={e => setTransferFromClassId(e.target.value)}
              >
                {activeStudentClasses.length > 0
                  ? activeStudentClasses.map((c: any) => (
                      <MenuItem key={c.classId || c.id} value={c.classId || c.id}>
                        {c.className || 'Lớp không xác định'}
                      </MenuItem>
                    ))
                  : availableClasses.map(c => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Đến lớp</InputLabel>
              <Select
                label='Đến lớp'
                value={transferToClassId}
                onChange={e => setTransferToClassId(e.target.value)}
              >
                {availableClasses
                  .filter(c => !currentClassIds.includes(c.id))
                  .map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label='Lý do'
              value={transferReason}
              onChange={e => setTransferReason(e.target.value)}
              multiline
              rows={3}
              required
              placeholder='Nhập lý do chuyển lớp...'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTransferDialog} disabled={transferLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmitTransfer}
            variant='contained'
            disabled={transferLoading || !transferFromClassId || !transferToClassId || !transferReason.trim()}
          >
            {transferLoading ? 'Đang gửi...' : 'Xác nhận chuyển lớp'}
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  )
}

export default ViewStudentDrawer
