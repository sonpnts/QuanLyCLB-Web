'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Alert from '@mui/material/Alert'
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
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Button from '@mui/material/Button'

import type { StudentType, EnrollmentType, ExamHistoryType, StudentLeaveRecordType } from '@/types/apps/studentTypes'
import type { OneTimeFeeOptionType, StudentOneTimeFeeStatusType } from '@/types/apps/oneTimeFeeTypes'

import studentService from '@/services/studentService'
import type { StudentAttendanceHistoryType } from '@/services/studentService'
import oneTimeFeeService from '@/services/oneTimeFeeService'
import { useNotification } from '@/contexts/notificationContext'
import { savePaymentInvoiceDraft } from '@/utils/paymentDraft'
import { logger } from '@/utils/logger'
import { formatDateTimeVN, formatDateVN } from '@/utils/dateTime'
import { formatBeltLevelOrder } from '@/utils/beltLevel'

import CustomAvatar from '@core/components/mui/Avatar'
import TransferStudentDialog from './TransferStudentDialog'
import ZaloVerifyModal from './ZaloVerifyModal'
import { maskPersonalId } from '@/utils/string'

type Props = {
  open: boolean
  onClose: () => void
  student: StudentType | null
  onEdit?: (student: StudentType) => void
  onSuspend?: (student: StudentType) => void
  onResume?: (student: StudentType) => void
  onTransferred?: () => void
}

type PaymentHistoryType = {
  id: string
  amount: number
  paymentDate: string
  type: number
  method: number
  receiptNumber?: string
  forMonth?: number
  forYear?: number
  description?: string
  className?: string
}

const paymentTypeLabels: Record<number, string> = {
  0: 'Học phí',
  1: 'Lệ phí thi',
  2: 'Phí đăng ký',
  3: 'Sản phẩm',
  4: 'Phí CSVC',
  5: 'Phí chuyển mã / import',
  6: 'Khác'
}

const paymentMethodLabels: Record<number, string> = {
  0: 'Tiền mặt',
  1: 'Chuyển khoản',
  2: 'Thẻ'
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

const formatDate = (value?: string) => formatDateVN(value)
const formatDateTime = (value?: string) => formatDateTimeVN(value)
const formatCurrency = (value?: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

const formatEducationLevel = (value?: string) => {
  switch (value) {
    case 'Cap1':
      return 'Cấp 1'
    case 'Cap2':
      return 'Cấp 2'
    case '12/12':
      return '12/12'
    case 'ChuaDiHoc':
      return 'Chưa đi học'
    case 'TrungCap':
      return 'Trung cấp'
    case 'CaoDang':
      return 'Cao đẳng'
    case 'DaiHoc':
      return 'Đại học'
    default:
      return value || '-'
  }
}

const ViewStudentDrawer = ({ open, onClose, student, onEdit, onSuspend, onResume, onTransferred }: Props) => {
  const router = useRouter()
  const { showNotification } = useNotification()

  const [activeTab, setActiveTab] = useState('1')
  const [detailStudent, setDetailStudent] = useState<StudentType | null>(student)
  const [loadingStudent, setLoadingStudent] = useState(false)
  const [enrollments, setEnrollments] = useState<EnrollmentType[]>([])
  const [payments, setPayments] = useState<PaymentHistoryType[]>([])
  const [attendance, setAttendance] = useState<StudentAttendanceHistoryType[]>([])
  const [attendancePage, setAttendancePage] = useState(0)
  const [attendanceRowsPerPage, setAttendanceRowsPerPage] = useState(10)
  const [attendanceTotalRecords, setAttendanceTotalRecords] = useState(0)
  const [examHistory, setExamHistory] = useState<ExamHistoryType[]>([])
  const [oneTimeFeeStatuses, setOneTimeFeeStatuses] = useState<StudentOneTimeFeeStatusType[]>([])
  const [pendingOneTimeFees, setPendingOneTimeFees] = useState<OneTimeFeeOptionType[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [loadingExamHistory, setLoadingExamHistory] = useState(false)
  const [leaveRecords, setLeaveRecords] = useState<StudentLeaveRecordType[]>([])
  const [loadingLeaveRecords, setLoadingLeaveRecords] = useState(false)
  const [loadingOneTimeFees, setLoadingOneTimeFees] = useState(false)
  const [loadingPendingOneTimeFees, setLoadingPendingOneTimeFees] = useState(false)
  const [zaloModalOpen, setZaloModalOpen] = useState(false)

  const [transferDialogOpen, setTransferDialogOpen] = useState(false)

  const loadedDataRef = useRef({
    studentId: null as string | null,
    studentDetail: false,
    enrollments: false,
    payments: false,
    attendance: false,
    examHistory: false,
    leaveRecords: false,
    oneTimeFees: false
  })

  const activeStudent = detailStudent || student

  useEffect(() => {
    setDetailStudent(student)
  }, [student])

  useEffect(() => {
    if (activeStudent?.id !== loadedDataRef.current.studentId) {
      loadedDataRef.current = {
        studentId: activeStudent?.id || null,
        studentDetail: false,
        enrollments: false,
        payments: false,
        attendance: false,
        examHistory: false,
        leaveRecords: false,
        oneTimeFees: false
      }

      setEnrollments([])
      setPayments([])
      setAttendance([])
      setAttendancePage(0)
      setAttendanceRowsPerPage(10)
      setAttendanceTotalRecords(0)
      setExamHistory([])
      setLeaveRecords([])
      setOneTimeFeeStatuses([])
      setPendingOneTimeFees([])
    }
  }, [activeStudent?.id])

  useEffect(() => {
    const loadStudentDetail = async () => {
      if (!student?.id || !open || loadedDataRef.current.studentDetail) return

      try {
        setLoadingStudent(true)
        const response = await studentService.getStudentById(student.id)

        if (response.success && response.data) {
          setDetailStudent(response.data)
        }

        loadedDataRef.current.studentDetail = true
      } catch (error) {
        logger.error('ViewStudentDrawer', 'Error loading student detail', error)
      } finally {
        setLoadingStudent(false)
      }
    }

    loadStudentDetail()
  }, [open, student?.id])

  useEffect(() => {
    const loadEnrollments = async () => {
      if (!activeStudent?.id || !open || loadedDataRef.current.enrollments) return

      try {
        setLoadingEnrollments(true)
        const response = await studentService.getStudentEnrollments(activeStudent.id)

        setEnrollments(response.success && Array.isArray(response.data) ? response.data : [])
        loadedDataRef.current.enrollments = true
      } catch (error) {
        logger.error('ViewStudentDrawer', 'Error loading enrollments', error)
        setEnrollments([])
      } finally {
        setLoadingEnrollments(false)
      }
    }

    loadEnrollments()
  }, [activeStudent?.id, open])

  const loadPayments = useCallback(async () => {
    if (!activeStudent?.id || loadedDataRef.current.payments) return

    try {
      setLoadingPayments(true)
      const response = await studentService.getStudentPayments(activeStudent.id)

      setPayments(response.success && Array.isArray(response.data) ? response.data : [])
      loadedDataRef.current.payments = true
    } catch (error) {
      logger.error('ViewStudentDrawer', 'Error loading payments', error)
      setPayments([])
    } finally {
      setLoadingPayments(false)
    }
  }, [activeStudent?.id])

  const loadAttendance = useCallback(async () => {
    if (!activeStudent?.id) return

    try {
      setLoadingAttendance(true)

      const response = await studentService.getStudentAttendance(activeStudent.id, {
        pageNumber: attendancePage + 1,
        pageSize: attendanceRowsPerPage
      })

      setAttendance(response.success ? response.data?.records || [] : [])
      setAttendanceTotalRecords(response.success ? response.data?.totalRecords || 0 : 0)
      loadedDataRef.current.attendance = true
    } catch (error) {
      logger.error('ViewStudentDrawer', 'Error loading attendance', error)
      setAttendance([])
      setAttendanceTotalRecords(0)
    } finally {
      setLoadingAttendance(false)
    }
  }, [activeStudent?.id, attendancePage, attendanceRowsPerPage])

  const loadExamHistory = useCallback(async () => {
    if (!activeStudent?.id || loadedDataRef.current.examHistory) return

    try {
      setLoadingExamHistory(true)
      const response = await studentService.getExamHistory(activeStudent.id)

      setExamHistory(response.success && Array.isArray(response.data) ? response.data : [])
      loadedDataRef.current.examHistory = true
    } catch (error) {
      logger.error('ViewStudentDrawer', 'Error loading exam history', error)
      setExamHistory([])
    } finally {
      setLoadingExamHistory(false)
    }
  }, [activeStudent?.id])

  const loadLeaveRecords = useCallback(async () => {
    if (!activeStudent?.id || loadedDataRef.current.leaveRecords) return

    try {
      setLoadingLeaveRecords(true)
      const response = await studentService.getLeaveRecords(activeStudent.id)

      setLeaveRecords(response.success && Array.isArray(response.data) ? response.data : [])
      loadedDataRef.current.leaveRecords = true
    } catch (error) {
      logger.error('ViewStudentDrawer', 'Error loading leave records', error)
      setLeaveRecords([])
    } finally {
      setLoadingLeaveRecords(false)
    }
  }, [activeStudent?.id])

  useEffect(() => {
    const loadOneTimeFees = async () => {
      if (!activeStudent?.id || !open || loadedDataRef.current.oneTimeFees) return

      try {
        setLoadingOneTimeFees(true)
        const response = await oneTimeFeeService.getStudentStatuses(activeStudent.id)

        setOneTimeFeeStatuses(response.success && Array.isArray(response.data) ? response.data : [])
        loadedDataRef.current.oneTimeFees = true
      } catch (error) {
        logger.error('ViewStudentDrawer', 'Error loading one-time fees', error)
        setOneTimeFeeStatuses([])
      } finally {
        setLoadingOneTimeFees(false)
      }
    }

    loadOneTimeFees()
  }, [activeStudent?.id, open])

  useEffect(() => {
    if (!open) {
      setActiveTab('1')
    }
  }, [open])

  useEffect(() => {
    if (open && activeTab === '3') {
      loadAttendance()
    }
  }, [activeTab, loadAttendance, open])

  const studentClasses = useMemo(() => activeStudent?.classes || [], [activeStudent?.classes])

  const activeStudentClasses = useMemo(
    () => studentClasses.filter(item => item.status === 'Active' || item.status === '0'),
    [studentClasses]
  )

  const effectiveClassId = useMemo(() => {
    if (activeStudentClasses[0]?.classId) return activeStudentClasses[0].classId

    const activeEnrollment = enrollments.find(item => item.status === 'Active')

    return activeEnrollment?.classId || enrollments[0]?.classId || ''
  }, [activeStudentClasses, enrollments])

  useEffect(() => {
    const loadPendingOneTimeFees = async () => {
      if (!open || !activeStudent?.id || !effectiveClassId) {
        setPendingOneTimeFees([])

return
      }

      try {
        setLoadingPendingOneTimeFees(true)
        const response = await oneTimeFeeService.getOptions(activeStudent.id, effectiveClassId)

        setPendingOneTimeFees(response.success && Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        logger.error('ViewStudentDrawer', 'Error loading pending one-time fees', error)
        setPendingOneTimeFees([])
      } finally {
        setLoadingPendingOneTimeFees(false)
      }
    }

    loadPendingOneTimeFees()
  }, [activeStudent?.id, effectiveClassId, open])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)

    if (newValue === '2') loadPayments()
    if (newValue === '4') loadExamHistory()
    if (newValue === '5') loadLeaveRecords()
  }

  const handleAttendancePageChange = (_event: unknown, newPage: number) => {
    setAttendancePage(newPage)
  }

  const handleAttendanceRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAttendanceRowsPerPage(Number(event.target.value))
    setAttendancePage(0)
  }

  const handleOpenTransferDialog = () => {
    setTransferDialogOpen(true)
  }

  const handleCloseTransferDialog = () => {
    setTransferDialogOpen(false)
  }

  const handleOpenInvoice = () => {
    if (!activeStudent?.id) return

    const firstClass = activeStudentClasses[0] || studentClasses[0]

    const draftKey = savePaymentInvoiceDraft({
      classId: firstClass?.classId,
      className: firstClass?.className,
      studentId: activeStudent.id,
      studentName: activeStudent.fullName,
      initialMode: 'blank'
    })

    onClose()
    router.push(`/apps/invoice/add?draft=${draftKey}`)
  }

  const handleOpenOneTimeFeeInvoice = () => {
    if (!activeStudent?.id) return

    const firstClass = activeStudentClasses[0] || studentClasses[0] || enrollments[0]
    const classId = firstClass?.classId
    const className = firstClass?.className

    const draftKey = savePaymentInvoiceDraft({
      classId,
      className,
      studentId: activeStudent.id,
      studentName: activeStudent.fullName,
      initialMode: 'one-time'
    })

    onClose()
    router.push(`/apps/invoice/add?draft=${draftKey}`)
  }

  const handleConfirmZalo = async (userIdZalo: string, phoneNumber: string) => {
    if (!activeStudent?.id) return

    const response = await studentService.updateStudentZalo(activeStudent.id, userIdZalo, phoneNumber)

    if (!response.success || !response.data) {
      showNotification(response.message || 'Không thể cập nhật liên kết Zalo.', 'error')

return
    }

    setDetailStudent(response.data)
    showNotification(response.message || 'Đã cập nhật liên kết Zalo.', 'success')
  }

  if (!activeStudent) return null

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 360, sm: 520, md: 680 } } }}
    >
      <Box className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Chi tiết học viên</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </Box>
      <Divider />

      <Box className='p-5'>
        <Box className='flex items-center gap-4 mb-4'>
          <CustomAvatar skin='light' size={64} color={activeStudent.isSuspended ? 'secondary' : 'primary'}>
            {getInitials(activeStudent.fullName)}
          </CustomAvatar>

          <Box className='flex-1'>
            <Box className='flex items-center gap-2 flex-wrap'>
              <Typography variant='h6'>{activeStudent.fullName}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {activeStudent.phoneNumber || 'Chưa có số điện thoại'}
              </Typography>
              {activeStudent.isSuspended && <Chip label='Tạm nghỉ' size='small' color='warning' variant='tonal' />}
              {/*{activeStudent.code && (*/}
              {/*  <Chip label={`Mã HV: ${activeStudent.code}`} size='small' color='secondary' variant='tonal' />*/}
              {/*)}*/}
            </Box>

            <Box className='flex gap-2 mt-1 flex-wrap items-center'>
              {activeStudent.beltLevelName && (
                <Chip label={activeStudent.beltLevelName} size='small' color='warning' variant='tonal' />
              )}
              {activeStudent.beltLevelOrder != null && (
                <Chip label={formatBeltLevelOrder(activeStudent.beltLevelOrder)} size='small' color='warning' variant='outlined' />
              )}
              {/*{activeStudent.userIdZalo ? (*/}
              {/*  <Chip label='Đã liên kết Zalo' size='small' color='success' variant='tonal' />*/}
              {/*) : (*/}
              {/*  <Chip label='Chưa liên kết Zalo' size='small' color='default' variant='tonal' />*/}
              {/*)}*/}
            </Box>

            <Box className='flex gap-2 mt-2 flex-wrap'>
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

              {onEdit && (
                <Button
                  size='small'
                  variant='contained'
                  startIcon={<i className='ri-edit-box-line' />}
                  onClick={() => onEdit(activeStudent)}
                >
                  Chỉnh sửa
                </Button>
              )}

              {activeStudent.isSuspended ? (
                <Button
                  size='small'
                  variant='outlined'
                  color='success'
                  startIcon={<i className='ri-play-circle-line' />}
                  onClick={() => onResume?.(activeStudent)}
                >
                  Khôi phục
                </Button>
              ) : (
                <Button
                  size='small'
                  variant='outlined'
                  color='warning'
                  startIcon={<i className='ri-pause-circle-line' />}
                  onClick={() => onSuspend?.(activeStudent)}
                >
                  Tạm nghỉ
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        {loadingStudent && (
          <Alert severity='info' sx={{ mb: 3 }}>
            Đang tải thêm thông tin chi tiết học viên...
          </Alert>
        )}

        {!!activeStudent.tuitionDiscounts?.length && (
          <Alert severity='info' sx={{ mb: 3 }}>
            <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>
              Các cấu hình giảm trừ học phí đang có
            </Typography>
            {activeStudent.tuitionDiscounts.map(discount => (
              <Typography key={discount.id} variant='caption' color='text.secondary' display='block'>
                -{Number(discount.discountAmount || 0).toLocaleString('vi-VN')}đ | {discount.periodLabel} |{' '}
                {discount.reason}
              </Typography>
            ))}
          </Alert>
        )}

        <TabContext value={activeTab}>
          <TabList onChange={handleTabChange} variant='scrollable' scrollButtons='auto'>
            <Tab label='Thông tin' value='1' />
            <Tab label='Thanh toán' value='2' />
            <Tab label='Điểm danh' value='3' />
            <Tab label='Lịch sử thi' value='4' />
            <Tab label='Lịch sử tạm nghỉ' value='5' />
          </TabList>

          <TabPanel value='1' className='px-0'>
            <Card variant='outlined' className='mb-4'>
              <CardContent>
                <Typography variant='subtitle1' className='font-medium mb-3'>
                  Thông tin cơ bản
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Mã học viên
                    </Typography>
                    <Typography variant='body1'>{activeStudent.code || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      CCCD / Số định danh
                    </Typography>
                    <Typography variant='body1'> {maskPersonalId(activeStudent.personalIdNumber)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Giới tính
                    </Typography>
                    <Typography variant='body1'>
                      {activeStudent.gender === true ? 'Nam' : activeStudent.gender === false ? 'Nữ' : '-'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Ngày sinh
                    </Typography>
                    <Typography variant='body1'>{formatDate(activeStudent.dateOfBirth)}</Typography>
                  </Grid>
                  {/*<Grid size={{ xs: 6 }}>*/}
                  {/*  <Typography variant='body2' color='text.secondary'>*/}
                  {/*    Số điện thoại*/}
                  {/*  </Typography>*/}
                  {/*  <Typography variant='body1'>{activeStudent.phoneNumber || '-'}</Typography>*/}
                  {/*</Grid>*/}
                  <Grid size={{ xs: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Cấp đai liên đoàn
                    </Typography>
                    <Typography variant='body1'>{activeStudent.beltLevelName || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Số cấp đai
                    </Typography>
                    <Typography variant='body1'>{formatBeltLevelOrder(activeStudent.beltLevelOrder)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Địa chỉ
                    </Typography>
                    <Typography variant='body1'>{activeStudent.address || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Học vấn
                    </Typography>
                    <Typography variant='body1'>{formatEducationLevel(activeStudent.educationLevel)}</Typography>
                  </Grid>
                  {activeStudent.notes && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant='body2' color='text.secondary'>
                        Ghi chú
                      </Typography>
                      <Typography variant='body1'>{activeStudent.notes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            <Card variant='outlined' className='mb-4'>
              <CardContent>
                <Typography variant='subtitle1' className='font-medium mb-3'>
                  Lớp đang học
                </Typography>

                {loadingEnrollments ? (
                  <Box className='flex justify-center py-4'>
                    <CircularProgress size={24} />
                  </Box>
                ) : studentClasses.length === 0 && enrollments.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    Chưa đăng ký lớp nào.
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {(studentClasses.length > 0 ? studentClasses : enrollments).map((item: any) => (
                      <ListItem key={item.enrollmentId || item.id || item.classId} disablePadding className='mb-2'>
                        <ListItemText
                          primary={item.className || 'Lớp không xác định'}
                          secondary={
                            <Box className='flex items-center gap-2 mt-1 flex-wrap'>
                              {/*<Chip*/}
                              {/*  label={*/}
                              {/*    item.status === 'Active' || item.status === 0*/}
                              {/*      ? 'Đang học'*/}
                              {/*      : item.status === 'Inactive' || item.status === 1*/}
                              {/*        ? 'Tạm nghỉ'*/}
                              {/*        : 'Hoàn thành'*/}
                              {/*  }*/}
                              {/*  size='small'*/}
                              {/*  color={*/}
                              {/*    item.status === 'Active' || item.status === 0*/}
                              {/*      ? 'success'*/}
                              {/*      : item.status === 'Inactive' || item.status === 1*/}
                              {/*        ? 'warning'*/}
                              {/*        : 'info'*/}
                              {/*  }*/}
                              {/*  variant='tonal'*/}
                              {/*/>*/}
                              <Typography variant='caption' color='text.secondary'>
                                Từ {formatDate(item.enrollmentDate)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>

            <Card variant='outlined' className='mb-4'>
              <CardContent>
                <Box className='flex items-center justify-between gap-3 flex-wrap mb-3'>
                  <Typography variant='subtitle1' className='font-medium'>
                    Liên kết Zalo
                  </Typography>
                  <Button
                    variant='outlined'
                    size='small'
                    startIcon={<i className='ri-links-line' />}
                    onClick={() => setZaloModalOpen(true)}
                  >
                    Cập nhật Zalo
                  </Button>
                </Box>

                <Grid container spacing={2}>
                  {activeStudent.userIdZalo ? (
                    <Chip label='Đã liên kết Zalo' size='small' color='success' variant='tonal' />
                  ) : (
                    <Chip label='Chưa liên kết Zalo' size='small' color='default' variant='tonal' />
                  )}
                  {/*<Grid size={{ xs: 6 }}>*/}
                  {/*  <Typography variant='body2' color='text.secondary'>*/}
                  {/*    SĐT liên kết*/}
                  {/*  </Typography>*/}
                  {/*  <Typography variant='body1'>{activeStudent.phoneNumber || '-'}</Typography>*/}
                  {/*</Grid>*/}
                  {/*<Grid size={{ xs: 6 }}>*/}
                  {/*  <Typography variant='body2' color='text.secondary'>*/}
                  {/*    Trạng thái*/}
                  {/*  </Typography>*/}
                  {/*  <Typography variant='body1'>*/}
                  {/*    {activeStudent.userIdZalo ? 'Đã liên kết' : 'Chưa liên kết'}*/}
                  {/*  </Typography>*/}
                  {/*</Grid>*/}
                  {/*{activeStudent.userIdZalo && (*/}
                  {/*  <Grid size={{ xs: 12 }}>*/}
                  {/*    <Typography variant='body2' color='text.secondary'>*/}
                  {/*      Zalo User ID*/}
                  {/*    </Typography>*/}
                  {/*    <Typography variant='body1'>{activeStudent.userIdZalo}</Typography>*/}
                  {/*  </Grid>*/}
                  {/*)}*/}
                </Grid>
              </CardContent>
            </Card>

            <Card variant='outlined' className='mb-4'>
              <CardContent>
                <Typography variant='subtitle1' className='font-medium mb-3'>
                  Phí 1 lần
                </Typography>

                {loadingOneTimeFees ? (
                  <Box className='flex justify-center py-4'>
                    <CircularProgress size={24} />
                  </Box>
                ) : oneTimeFeeStatuses.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    Chưa có khoản phí 1 lần nào được ghi nhận.
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {oneTimeFeeStatuses.map(item => (
                      <ListItem
                        key={`${item.feeCode}-${item.paymentRecordId || item.paidAt}`}
                        disablePadding
                        className='mb-2'
                      >
                        <ListItemText
                          primary={
                            <Box className='flex items-center justify-between gap-2 flex-wrap'>
                              <Typography variant='body1'>{item.feeName}</Typography>
                              <Chip
                                label={formatCurrency(item.amount)}
                                size='small'
                                color='secondary'
                                variant='tonal'
                              />
                            </Box>
                          }
                          secondary={
                            <Box className='flex flex-col gap-1 mt-1'>
                              <Typography variant='caption' color='text.secondary'>
                                Đã thu: {formatDateTime(item.paidAt)}
                              </Typography>
                              {/*<Typography variant='caption' color='text.secondary'>*/}
                              {/*  Người thu: {item.recordedByUserName || '-'}*/}
                              {/*</Typography>*/}
                              {/*{item.note && (*/}
                              {/*  <Typography variant='caption' color='text.secondary'>*/}
                              {/*    Ghi chú: {item.note}*/}
                              {/*  </Typography>*/}
                              {/*)}*/}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value='2' className='px-0'>
            <Card variant='outlined'>
              <CardContent>
                <Box className='flex items-center justify-between gap-3 flex-wrap mb-3'>
                  <Typography variant='subtitle1' className='font-medium'>
                    Lịch sử thanh toán
                  </Typography>
                  <Button
                    variant='contained'
                    size='small'
                    startIcon={<i className='ri-bank-card-line' />}
                    onClick={handleOpenInvoice}
                  >
                    Thêm thanh toán
                  </Button>
                </Box>

                {/*<Card variant='outlined' className='mb-4'>*/}
                {/*  <CardContent>*/}
                {/*    <Box className='flex items-center justify-between gap-3 flex-wrap mb-3'>*/}
                {/*      <Typography variant='subtitle2' className='font-medium'>*/}
                {/*        Phí 1 lần chưa thu*/}
                {/*      </Typography>*/}
                {/*      <Button*/}
                {/*        variant='outlined'*/}
                {/*        size='small'*/}
                {/*        startIcon={<i className='ri-price-tag-3-line' />}*/}
                {/*        onClick={handleOpenOneTimeFeeInvoice}*/}
                {/*        disabled={!effectiveClassId || pendingOneTimeFees.length === 0}*/}
                {/*      >*/}
                {/*        Thu phí 1 lần*/}
                {/*      </Button>*/}
                {/*    </Box>*/}

                {/*    /!*{!effectiveClassId ? (*!/*/}
                {/*    /!*  <Alert severity='info'>Học viên chưa có lớp hiện tại để kiểm tra phí 1 lần cần thu.</Alert>*!/*/}
                {/*    /!*) : loadingPendingOneTimeFees ? (*!/*/}
                {/*    /!*  <Box className='flex justify-center py-4'>*!/*/}
                {/*    /!*    <CircularProgress size={24} />*!/*/}
                {/*    /!*  </Box>*!/*/}
                {/*    /!*) : pendingOneTimeFees.length === 0 ? (*!/*/}
                {/*    /!*  <Typography variant='body2' color='text.secondary'>*!/*/}
                {/*    /!*    Không còn khoản phí 1 lần nào cần thu.*!/*/}
                {/*    /!*  </Typography>*!/*/}
                {/*    /!*) : (*!/*/}
                {/*    /!*  <List dense disablePadding>*!/*/}
                {/*    /!*    {pendingOneTimeFees.map(item => (*!/*/}
                {/*    /!*      <ListItem key={item.feeCode} disablePadding className='mb-2'>*!/*/}
                {/*    /!*        <ListItemText*!/*/}
                {/*    /!*          primary={*!/*/}
                {/*    /!*            <Box className='flex items-center justify-between gap-2 flex-wrap'>*!/*/}
                {/*    /!*              <Typography variant='body1'>{item.feeName}</Typography>*!/*/}
                {/*    /!*              <Chip*!/*/}
                {/*    /!*                label={formatCurrency(item.amount)}*!/*/}
                {/*    /!*                size='small'*!/*/}
                {/*    /!*                color='warning'*!/*/}
                {/*    /!*                variant='tonal'*!/*/}
                {/*    /!*              />*!/*/}
                {/*    /!*            </Box>*!/*/}
                {/*    /!*          }*!/*/}
                {/*    /!*          secondary={*!/*/}
                {/*    /!*            <Typography variant='caption' color='text.secondary'>*!/*/}
                {/*    /!*              {item.isRequiredForExam*!/*/}
                {/*    /!*                ? 'Khoản phí bắt buộc trước khi thi.'*!/*/}
                {/*    /!*                : 'Khoản phí 1 lần đang chờ thu.'}*!/*/}
                {/*    /!*            </Typography>*!/*/}
                {/*    /!*          }*!/*/}
                {/*    /!*        />*!/*/}
                {/*    /!*      </ListItem>*!/*/}
                {/*    /!*    ))}*!/*/}
                {/*    /!*  </List>*!/*/}
                {/*    /!*)}*!/*/}
                {/*  </CardContent>*/}
                {/*</Card>*/}

                {loadingPayments ? (
                  <Box className='flex justify-center py-4'>
                    <CircularProgress size={24} />
                  </Box>
                ) : payments.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    Chưa có lịch sử thanh toán.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Ngày</TableCell>
                          <TableCell>Loại</TableCell>
                          <TableCell>Mô tả</TableCell>
                          <TableCell align='right'>Số tiền</TableCell>
                          <TableCell>Phương thức</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payments.map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                            <TableCell>
                              <Chip label={paymentTypeLabels[payment.type] || 'Khác'} size='small' variant='tonal' />
                            </TableCell>
                            <TableCell>{payment.description || payment.className || '-'}</TableCell>
                            <TableCell align='right'>{formatCurrency(payment.amount)}</TableCell>
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

          <TabPanel value='3' className='px-0'>
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='subtitle1' className='font-medium mb-3'>
                  Lịch sử nghỉ học
                </Typography>

                {loadingAttendance ? (
                  <Box className='flex justify-center py-4'>
                    <CircularProgress size={24} />
                  </Box>
                ) : attendance.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    Chưa có record nghỉ học nào.
                  </Typography>
                ) : (
                  <>
                    <TableContainer>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            <TableCell>Ngày nghỉ</TableCell>
                            <TableCell>Lớp</TableCell>
                            <TableCell>Loại nghỉ</TableCell>
                            <TableCell>Lý do</TableCell>
                            <TableCell>Người ghi nhận</TableCell>
                            <TableCell>Ghi nhận lúc</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {attendance.map(record => (
                            <TableRow key={record.id}>
                              <TableCell>{formatDate(record.attendanceDate)}</TableCell>
                              <TableCell>{record.className || '-'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={record.isExcused ? 'Nghỉ có phép' : 'Nghỉ không phép'}
                                  size='small'
                                  color={record.isExcused ? 'info' : 'warning'}
                                  variant='tonal'
                                />
                              </TableCell>
                              <TableCell>{record.reason || '-'}</TableCell>
                              <TableCell>{record.markedByUserName || '-'}</TableCell>
                              <TableCell>{formatDateTime(record.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 20]}
                      component='div'
                      count={attendanceTotalRecords}
                      rowsPerPage={attendanceRowsPerPage}
                      page={attendancePage}
                      onPageChange={handleAttendancePageChange}
                      onRowsPerPageChange={handleAttendanceRowsPerPageChange}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabPanel>

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
                    Chưa có lịch sử thi cấp.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Ngày thi</TableCell>
                          <TableCell>Kỳ thi</TableCell>
                          <TableCell>Cấp đai</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {examHistory.map(exam => (
                          <TableRow key={exam.id}>
                            <TableCell>{formatDate(exam.examDate)}</TableCell>
                            <TableCell>{exam.examName}</TableCell>
                            <TableCell>{exam.beltLevelName}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value='5' className='px-0'>
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='subtitle1' className='font-medium mb-3'>
                  Lịch sử tạm nghỉ
                </Typography>

                {loadingLeaveRecords ? (
                  <Box className='flex justify-center py-4'>
                    <CircularProgress size={24} />
                  </Box>
                ) : leaveRecords.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    Chưa có lịch sử tạm nghỉ.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Ngày bắt đầu</TableCell>
                          <TableCell>Ngày kết thúc</TableCell>
                          <TableCell>Trạng thái</TableCell>
                          <TableCell>Lý do</TableCell>
                          <TableCell>Người ghi nhận</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {leaveRecords.map(record => (
                          <TableRow key={record.id}>
                            <TableCell>{formatDateTime(record.startDate)}</TableCell>
                            <TableCell>{record.endDate ? formatDateTime(record.endDate) : '-'}</TableCell>
                            <TableCell>
                              <Chip
                                label={record.endDate ? 'Đã kết thúc' : 'Đang tạm nghỉ'}
                                size='small'
                                color={record.endDate ? 'success' : 'warning'}
                                variant='tonal'
                              />
                            </TableCell>
                            <TableCell>{record.reason || '-'}</TableCell>
                            <TableCell>{record.createdByUserName || '-'}</TableCell>
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

        {(activeStudent.createdAt || activeStudent.updatedAt) && (
          <Box className='mt-4'>
            <Typography variant='caption' color='text.secondary'>
              {activeStudent.createdAt && `Tạo: ${formatDateTime(activeStudent.createdAt)}`}
              {activeStudent.createdAt && activeStudent.updatedAt && ' | '}
              {activeStudent.updatedAt && `Cập nhật: ${formatDateTime(activeStudent.updatedAt)}`}
            </Typography>
          </Box>
        )}
      </Box>

      <TransferStudentDialog
        open={transferDialogOpen}
        onClose={handleCloseTransferDialog}
        student={activeStudent}
        onTransferred={onTransferred}
      />

      <ZaloVerifyModal
        open={zaloModalOpen}
        onClose={() => setZaloModalOpen(false)}
        defaultPhone={activeStudent.phoneNumber || ''}
        onConfirm={handleConfirmZalo}
      />
    </Drawer>
  )
}

export default ViewStudentDrawer
