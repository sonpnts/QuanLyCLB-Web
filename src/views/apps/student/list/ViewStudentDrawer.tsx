'use client'

// React Imports
import { logger } from '@/utils/logger'
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
  0: 'Há»c phÃ­',
  1: 'PhÃ­ thi',
  2: 'PhÃ­ Ä‘Äƒng kÃ½',
  3: 'KhÃ¡c'
}

const paymentMethodLabels: { [key: number]: string } = {
  0: 'Tiá»n máº·t',
  1: 'Chuyá»ƒn khoáº£n',
  2: 'Tháº»'
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

  // Transfer dialog state
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [transferFromClassId, setTransferFromClassId] = useState('')
  const [transferToClassId, setTransferToClassId] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)
  const [availableClasses, setAvailableClasses] = useState<ClassType[]>([])

  const { showNotification } = useNotification()

  // Track Ä‘Ã£ load data cho student nÃ o Ä‘á»ƒ trÃ¡nh load láº¡i
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

  // Reset cache khi student thay Ä‘á»•i
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

  // Load enrollments khi drawer má»Ÿ (chá»‰ load 1 láº§n cho má»—i student)
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

  // Load payments khi chuyá»ƒn sang tab payments (lazy load)
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

  // Load attendance khi chuyá»ƒn sang tab attendance (lazy load)
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

  // Load exam history khi chuyá»ƒn sang tab exam (lazy load)
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

  // Reset tab khi drawer Ä‘Ã³ng
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
    const response = await classService.getClasses({ pageSize: 200 })
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
        showNotification('YÃªu cáº§u chuyá»ƒn lá»›p Ä‘Ã£ Ä‘Æ°á»£c gá»­i thÃ nh cÃ´ng.', 'success')
        handleCloseTransferDialog()
      } else {
        showNotification(response.message || 'KhÃ´ng thá»ƒ gá»­i yÃªu cáº§u chuyá»ƒn lá»›p.', 'error')
      }
    } catch {
      showNotification('ÄÃ£ cÃ³ lá»—i khi gá»­i yÃªu cáº§u chuyá»ƒn lá»›p.', 'error')
    } finally {
      setTransferLoading(false)
    }
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)

    // Lazy load data khi chuyá»ƒn tab
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
        <Typography variant='h5'>Chi tiáº¿t há»c viÃªn</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />

      <Box className='p-5'>
        {/* Header vá»›i Avatar */}
        <Box className='flex items-center gap-4 mb-4'>
          <CustomAvatar skin='light' size={64} color='primary'>
            {getInitials(student.fullName)}
          </CustomAvatar>
          <Box>
            <Typography variant='h6'>{student.fullName}</Typography>
            <Typography variant='body2' color='text.secondary'>
              {student.email || 'ChÆ°a cÃ³ email'}
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
            <Tab label='ThÃ´ng tin' value='1' />
            <Tab label='Thanh toÃ¡n' value='2' />
            <Tab label='Äiá»ƒm danh' value='3' />
            <Tab label='Lá»‹ch sá»­ thi' value='4' />
          </TabList>

          {/* Tab 1: ThÃ´ng tin cÆ¡ báº£n */}
          <TabPanel value='1' className='px-0'>
            <Card variant='outlined' className='mb-4'>
              <CardContent>
                <Typography variant='subtitle1' className='font-medium mb-3'>
                  ThÃ´ng tin cÆ¡ báº£n
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Sá»‘ Ä‘iá»‡n thoáº¡i
                    </Typography>
                    <Typography variant='body1'>{student.phoneNumber || '-'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Giá»›i tÃ­nh
                    </Typography>
                    <Typography variant='body1'>
                      {student.gender === true ? 'Nam' : student.gender === false ? 'Ná»¯' : '-'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      NgÃ y sinh
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
                      Cáº¥p Ä‘ai hiá»‡n táº¡i
                    </Typography>
                    {student.currentBeltLevelName ? (
                      <Chip label={student.currentBeltLevelName} size='small' color='warning' variant='tonal' />
                    ) : (
                      <Typography variant='body1'>ChÆ°a cÃ³ cáº¥p Ä‘ai</Typography>
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
                      Äá»‹a chá»‰
                    </Typography>
                    <Typography variant='body1'>{student.address || '-'}</Typography>
                  </Grid>
                  {student.notes && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant='body2' color='text.secondary'>
                        Ghi chÃº
                      </Typography>
                      <Typography variant='body1'>{student.notes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Danh sÃ¡ch lá»›p Ä‘ang há»c */}
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='subtitle1' className='font-medium mb-3'>
                  Lá»›p Ä‘ang há»c
                </Typography>
                {loadingEnrollments ? (
                  <Box className='flex justify-center py-4'>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  (() => {
                    // Æ¯u tiÃªn dÃ¹ng classes tá»« student response (API má»›i)
                    const studentClasses = (student as any).classes || []
                    const displayData = studentClasses.length > 0 ? studentClasses : enrollments

                    if (displayData.length === 0) {
                      return (
                        <Typography variant='body2' color='text.secondary'>
                          ChÆ°a Ä‘Äƒng kÃ½ lá»›p nÃ o
                        </Typography>
                      )
                    }

                    return (
                      <List dense disablePadding>
                        {displayData.map((item: any) => (
                          <ListItem key={item.enrollmentId || item.id || item.classId} disablePadding className='mb-2'>
                            <ListItemText
                              primary={item.className || 'Lá»›p khÃ´ng xÃ¡c Ä‘á»‹nh'}
                              secondary={
                                <Box className='flex items-center gap-2 mt-1'>
                                  <Chip
                                    label={
                                      item.status === 0 || item.status === 'Active'
                                        ? 'Äang há»c'
                                        : item.status === 1 || item.status === 'Inactive'
                                          ? 'Táº¡m nghá»‰'
                                          : 'HoÃ n thÃ nh'
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
                                      Tá»« {new Date(item.enrollmentDate).toLocaleDateString('vi-VN')}
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
            {/* Chuyá»ƒn lá»›p button */}
            <Box className='mt-3'>
              <Button
                variant='outlined'
                color='warning'
                startIcon={<i className='ri-arrow-left-right-line' />}
                onClick={handleOpenTransferDialog}
                fullWidth
              >
                Chuyá»ƒn lá»›p
              </Button>
            </Box>
          </TabPanel>

          {/* Tab 2: Lá»‹ch sá»­ thanh toÃ¡n */}
          <TabPanel value='2' className='px-0'>
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='subtitle1' className='font-medium mb-3'>
                  Lá»‹ch sá»­ thanh toÃ¡n
                </Typography>
                {loadingPayments ? (
                  <Box className='flex justify-center py-4'>
                    <CircularProgress size={24} />
                  </Box>
                ) : payments.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    ChÆ°a cÃ³ lá»‹ch sá»­ thanh toÃ¡n
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>NgÃ y</TableCell>
                          <TableCell>Loáº¡i</TableCell>
                          <TableCell align='right'>Sá»‘ tiá»n</TableCell>
                          <TableCell>PhÆ°Æ¡ng thá»©c</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payments.map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell>{new Date(payment.paymentDate).toLocaleDateString('vi-VN')}</TableCell>
                            <TableCell>
                              <Chip
                                label={paymentTypeLabels[payment.type] || 'KhÃ¡c'}
                                size='small'
                                color={payment.type === 0 ? 'primary' : 'default'}
                                variant='tonal'
                              />
                            </TableCell>
                            <TableCell align='right'>{payment.amount.toLocaleString('vi-VN')}Ä‘</TableCell>
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

          {/* Tab 3: Lá»‹ch sá»­ Ä‘iá»ƒm danh */}
          <TabPanel value='3' className='px-0'>
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='subtitle1' className='font-medium mb-3'>
                  Lá»‹ch sá»­ Ä‘iá»ƒm danh
                </Typography>
                {loadingAttendance ? (
                  <Box className='flex justify-center py-4'>
                    <CircularProgress size={24} />
                  </Box>
                ) : attendance.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    ChÆ°a cÃ³ lá»‹ch sá»­ Ä‘iá»ƒm danh
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>NgÃ y</TableCell>
                          <TableCell>Lá»›p</TableCell>
                          <TableCell>Tráº¡ng thÃ¡i</TableCell>
                          <TableCell>Ghi chÃº</TableCell>
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
                                    ? 'CÃ³ máº·t'
                                    : record.status === 'Absent'
                                      ? 'Váº¯ng'
                                      : record.status === 'Late'
                                        ? 'Trá»…'
                                        : record.status === 'Excused'
                                          ? 'CÃ³ phÃ©p'
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

          {/* Tab 4: Lá»‹ch sá»­ thi cáº¥p */}
          <TabPanel value='4' className='px-0'>
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='subtitle1' className='font-medium mb-3'>
                  Lá»‹ch sá»­ thi cáº¥p
                </Typography>
                {loadingExamHistory ? (
                  <Box className='flex justify-center py-4'>
                    <CircularProgress size={24} />
                  </Box>
                ) : examHistory.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    ChÆ°a cÃ³ lá»‹ch sá»­ thi cáº¥p
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>NgÃ y thi</TableCell>
                          <TableCell>Ká»³ thi</TableCell>
                          <TableCell>Cáº¥p Ä‘ai</TableCell>
                          <TableCell>Káº¿t quáº£</TableCell>
                          <TableCell align='right'>Äiá»ƒm</TableCell>
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
                                label={exam.result === 1 ? 'Äáº¡t' : exam.result === 2 ? 'KhÃ´ng Ä‘áº¡t' : 'Chá» káº¿t quáº£'}
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

        {/* ThÃ´ng tin há»‡ thá»‘ng */}
        {(student.createdAt || student.updatedAt) && (
          <Box className='mt-4'>
            <Typography variant='caption' color='text.secondary'>
              {student.createdAt && `Táº¡o: ${new Date(student.createdAt).toLocaleString('vi-VN')}`}
              {student.createdAt && student.updatedAt && ' | '}
              {student.updatedAt && `Cáº­p nháº­t: ${new Date(student.updatedAt).toLocaleString('vi-VN')}`}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Transfer Class Dialog */}
      <Dialog open={transferDialogOpen} onClose={handleCloseTransferDialog} maxWidth='sm' fullWidth>
        <DialogTitle>Chuyá»ƒn lá»›p há»c viÃªn</DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-4 pt-2'>
            <FormControl fullWidth>
              <InputLabel>Tá»« lá»›p</InputLabel>
              <Select
                label='Tá»« lá»›p'
                value={transferFromClassId}
                onChange={e => setTransferFromClassId(e.target.value)}
              >
                {activeStudentClasses.length > 0
                  ? activeStudentClasses.map((c: any) => (
                      <MenuItem key={c.classId || c.id} value={c.classId || c.id}>
                        {c.className || 'Lá»›p khÃ´ng xÃ¡c Ä‘á»‹nh'}
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
              <InputLabel>Äáº¿n lá»›p</InputLabel>
              <Select
                label='Äáº¿n lá»›p'
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
              label='LÃ½ do'
              value={transferReason}
              onChange={e => setTransferReason(e.target.value)}
              multiline
              rows={3}
              required
              placeholder='Nháº­p lÃ½ do chuyá»ƒn lá»›p...'
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTransferDialog} disabled={transferLoading}>
            Há»§y
          </Button>
          <Button
            onClick={handleSubmitTransfer}
            variant='contained'
            disabled={transferLoading || !transferFromClassId || !transferToClassId || !transferReason.trim()}
          >
            {transferLoading ? 'Äang gá»­i...' : 'XÃ¡c nháº­n chuyá»ƒn lá»›p'}
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  )
}

export default ViewStudentDrawer
