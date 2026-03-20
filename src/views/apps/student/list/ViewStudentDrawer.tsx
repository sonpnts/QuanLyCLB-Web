'use client'

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

// Types
import type { StudentType, EnrollmentType, ExamHistoryType } from '@/types/apps/studentTypes'

// Services
import studentService from '@/services/studentService'

// Components
import CustomAvatar from '@core/components/mui/Avatar'

type Props = {
  open: boolean
  onClose: () => void
  student: StudentType | null
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

const ViewStudentDrawer = ({ open, onClose, student }: Props) => {
  const [activeTab, setActiveTab] = useState('1')
  const [enrollments, setEnrollments] = useState<EnrollmentType[]>([])
  const [payments, setPayments] = useState<PaymentHistoryType[]>([])
  const [attendance, setAttendance] = useState<AttendanceHistoryType[]>([])
  const [examHistory, setExamHistory] = useState<ExamHistoryType[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [loadingExamHistory, setLoadingExamHistory] = useState(false)

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
        console.error('Error loading enrollments:', error)
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
      console.error('Error loading payments:', error)
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
      console.error('Error loading attendance:', error)
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
      console.error('Error loading exam history:', error)
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
          <CustomAvatar skin='light' size={64} color='primary'>
            {getInitials(student.fullName)}
          </CustomAvatar>
          <Box>
            <Typography variant='h6'>{student.fullName}</Typography>
            <Typography variant='body2' color='text.secondary'>
              {student.email || 'Chưa có email'}
            </Typography>
            {student.currentBeltLevelName && (
              <Chip
                label={student.currentBeltLevelName}
                size='small'
                color='warning'
                variant='tonal'
                className='mt-1'
              />
            )}
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
                      Cấp đai hiện tại
                    </Typography>
                    {student.currentBeltLevelName ? (
                      <Chip label={student.currentBeltLevelName} size='small' color='warning' variant='tonal' />
                    ) : (
                      <Typography variant='body1'>Chưa có cấp đai</Typography>
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
    </Drawer>
  )
}

export default ViewStudentDrawer
