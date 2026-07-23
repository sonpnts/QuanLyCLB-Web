'use client'

import { useEffect, useState, useRef } from 'react'

import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import IconButton from '@mui/material/IconButton'

import type {BranchType} from '@/types/apps/branchTypes'

// Types
import type { ClassType } from '@/types/apps/classTypes'
import type { StudentType } from '@/types/apps/studentTypes'

// Services
import classService from '@/services/classService'
import studentService from '@/services/studentService'

// Utils
import { formatDateVN } from '@/utils/dateTime'
import { formatBeltLevelOrder } from '@/utils/beltLevel'
import { getDayName } from '@/utils/constants'

// Components
import AddStudentsToClassDrawer from '../list/AddStudentsToClassDrawer'
import EditStudentDrawer from '@/views/apps/student/list/EditStudentDrawer'
import ViewStudentDrawer from '@/views/apps/student/list/ViewStudentDrawer'
import TransferStudentDialog from '@/views/apps/student/list/TransferStudentDialog'

// Context
import { useNotification } from '@/contexts/notificationContext'

import { logger } from '@/utils/logger'


type Props = {
  classId: string
}

type ScheduleType = {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  branchName?: string
  branch: BranchType
}

const ClassViewPage = ({ classId }: Props) => {
  const router = useRouter()
  const { showNotification } = useNotification()

  const [classData, setClassData] = useState<ClassType | null>(null)
  const [students, setStudents] = useState<StudentType[]>([])
  const [studentsTotalRecords, setStudentsTotalRecords] = useState<number>(0)
  const [schedules, setSchedules] = useState<ScheduleType[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingSchedules, setLoadingSchedules] = useState(false)
  const [studentsPage, setStudentsPage] = useState(0)
  const [studentsPageSize, setStudentsPageSize] = useState(10)
  const [activeTab, setActiveTab] = useState('1')
  const [addStudentsOpen, setAddStudentsOpen] = useState(false)
  const [editStudentOpen, setEditStudentOpen] = useState(false)
  const [viewStudentOpen, setViewStudentOpen] = useState(false)
  const [transferStudentOpen, setTransferStudentOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)

  // Refs
  const showNotificationRef = useRef(showNotification)

  showNotificationRef.current = showNotification
  const studentsLoadedRef = useRef(false)
  const schedulesLoadedRef = useRef(false)

  // Load class data
  useEffect(() => {
    const loadClassData = async () => {
      try {
        setLoading(true)
        const response = await classService.getClassById(classId)

        if (response.success && response.data) {
          setClassData(response.data)
        } else {
          showNotificationRef.current(response.message || 'Không thể tải thông tin lớp học.', 'error')
          router.push('/apps/class/list')
        }
      } catch (error) {
        logger.error('index', 'Error loading class', error)
        showNotificationRef.current('Đã có lỗi khi tải thông tin lớp học.', 'error')
        router.push('/apps/class/list')
      } finally {
        setLoading(false)
      }
    }

    loadClassData()
  }, [classId, router])

  // Load students when tab changes
  const loadStudents = async () => {
    if (studentsLoadedRef.current) return

    try {
      setLoadingStudents(true)
      studentsLoadedRef.current = true

      const response = await classService.getClassStudents(classId, {
        pageNumber: studentsPage + 1,
        pageSize: studentsPageSize
      })

      if (response.success && response.data) {
        setStudents(response.data.records || [])
        setStudentsTotalRecords(response.data.totalRecords || 0)
      }
    } catch (error) {
      logger.error('index', 'Error loading students', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  // Reload students sau khi thêm
  const handleStudentsAdded = () => {
    studentsLoadedRef.current = false
    setStudentsPage(0)

    loadStudents()
  }

  const handleViewStudent = (student: StudentType) => {
    setSelectedStudent(student)
    setViewStudentOpen(true)
  }

  const handleEditStudent = (student: StudentType) => {
    setSelectedStudent(student)
    setEditStudentOpen(true)
  }

  const handleTransferStudent = (student: StudentType) => {
    setSelectedStudent(student)
    setTransferStudentOpen(true)
  }

  const handleStudentUpdated = (updated: StudentType) => {
    setStudents(prev => prev.map(student => (student.id === updated.id ? { ...student, ...updated } : student)))
    studentsLoadedRef.current = false
    loadStudents()
  }

  const handleSuspendStudent = async (student: StudentType) => {
    const response = await studentService.suspendStudent(student.id)

    if (response.success) {
      showNotificationRef.current('Đã chuyển học viên sang trạng thái tạm nghỉ.', 'success')
      handleStudentUpdated({ ...student, isSuspended: true })
    } else {
      showNotificationRef.current(response.message || 'Không thể tạm nghỉ học viên.', 'error')
    }
  }

  const handleResumeStudent = async (student: StudentType) => {
    const response = await studentService.resumeStudent(student.id)

    if (response.success) {
      showNotificationRef.current('Đã khôi phục học viên.', 'success')
      handleStudentUpdated({ ...student, isSuspended: false })
    } else {
      showNotificationRef.current(response.message || 'Không thể khôi phục học viên.', 'error')
    }
  }

  // Load schedules when tab changes
  const loadSchedules = async () => {
    if (schedulesLoadedRef.current) return

    try {
      setLoadingSchedules(true)
      schedulesLoadedRef.current = true
      const response = await classService.getClassSchedules(classId)

      if (response.success && Array.isArray(response.data)) {
        setSchedules(response.data)
      }
    } catch (error) {
      logger.error('index', 'Error loading schedules', error)
    } finally {
      setLoadingSchedules(false)
    }
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)

    if (newValue === '2' && !studentsLoadedRef.current) {
      loadStudents()
    } else if (newValue === '3' && !schedulesLoadedRef.current) {
      loadSchedules()
    }
  }

  if (loading) {
    return (
      <Box className='flex justify-center items-center min-h-[400px]'>
        <CircularProgress />
      </Box>
    )
  }

  if (!classData) {
    return (
      <Card>
        <CardContent>
          <Typography>Không tìm thấy thông tin lớp học.</Typography>
          <Button variant='contained' onClick={() => router.push('/apps/class/list')} className='mt-4'>
            Quay lại danh sách
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Grid container spacing={6}>
        {/* Header */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader
              title={
                <Box className='flex items-center gap-4'>
                  <Typography variant='h5'>{classData.name}</Typography>
                  <Chip label={classData.code} color='primary' variant='tonal' />
                  <Chip
                    label={classData.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    color={classData.isActive ? 'success' : 'error'}
                    variant='tonal'
                  />
                </Box>
              }
              action={
                <Button variant='outlined' onClick={() => router.push('/apps/class/list')}>
                  Quay lại
                </Button>
              }
            />
          </Card>
        </Grid>

        {/* Content */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <TabContext value={activeTab}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 5 }}>
                <TabList onChange={handleTabChange}>
                  <Tab label='Thông tin' value='1' />
                  <Tab label='Học viên' value='2' />
                  <Tab label='Lịch học' value='3' />
                </TabList>
              </Box>

              {/* Tab 1: Thông tin */}
              <TabPanel value='1' sx={{ p: 5 }}>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Mã lớp
                    </Typography>
                    <Typography variant='body1' className='font-medium'>
                      {classData.code}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Tên lớp
                    </Typography>
                    <Typography variant='body1' className='font-medium'>
                      {classData.name}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Số học viên hiện tại
                    </Typography>
                    <Typography variant='body1' className='font-medium'>
                      {classData.currentStudents || 0} học viên
                    </Typography>
                  </Grid>
                  {classData.description && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant='body2' color='text.secondary'>
                        Mô tả
                      </Typography>
                      <Typography variant='body1'>{classData.description}</Typography>
                    </Grid>
                  )}
                </Grid>
              </TabPanel>

              {/* Tab 2: Học viên */}
              <TabPanel value='2' sx={{ p: 5 }}>
                <Box className='flex justify-between items-center mb-4'>
                  <Typography variant='subtitle1'>Danh sách học viên ({studentsTotalRecords})</Typography>
                  <Button
                    variant='contained'
                    startIcon={<i className='ri-user-add-line' />}
                    onClick={() => setAddStudentsOpen(true)}
                  >
                    Thêm học viên
                  </Button>
                </Box>
                {loadingStudents ? (
                  <Box className='flex justify-center py-8'>
                    <CircularProgress size={32} />
                  </Box>
                ) : students.length === 0 ? (
                  <Typography color='text.secondary'>Chưa có học viên trong lớp này.</Typography>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Họ tên</TableCell>
                          <TableCell>Ngày sinh</TableCell>
                          <TableCell>Giới tính</TableCell>
                          <TableCell>Cấp đai hiện tại</TableCell>
                          <TableCell>Số cấp đai</TableCell>
                          {/*<TableCell>Trạng thái</TableCell>*/}
                          <TableCell>Thao tác</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {students.map(student => (
                          <TableRow
                            key={student.id}
                            hover
                            onClick={() => handleViewStudent(student)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>{student.fullName}</TableCell>
                            <TableCell>
                              {formatDateVN(student.dateOfBirth)}
                            </TableCell>
                            <TableCell>
                              {student.gender === true ? 'Nam' : student.gender === false ? 'Nữ' : '-'}
                            </TableCell>
                            <TableCell>
                              <Chip label={student.beltLevelName || 'Chưa có'} size='small' color='warning' variant='tonal' />
                            </TableCell>
                            <TableCell>
                              {formatBeltLevelOrder(student.beltLevelOrder)}
                            </TableCell>
                            {/*<TableCell>*/}
                            {/*  <Chip*/}
                            {/*    label={*/}
                            {/*      (student as any).status === 'Active' && !student.isSuspended*/}
                            {/*        ? 'Đang học'*/}
                            {/*        : (student as any).status === 'Inactive' || student.isSuspended*/}
                            {/*          ? 'Tạm nghỉ'*/}
                            {/*          : 'Hoàn thành'*/}
                            {/*    }*/}
                            {/*    size='small'*/}
                            {/*    color={*/}
                            {/*      (student as any).status === 'Active' && !student.isSuspended*/}
                            {/*        ? 'success'*/}
                            {/*        : (student as any).status === 'Inactive' || student.isSuspended*/}
                            {/*          ? 'warning'*/}
                            {/*          : 'info'*/}
                            {/*    }*/}
                            {/*    variant='tonal'*/}
                            {/*  />*/}
                            {/*</TableCell>*/}
                            <TableCell onClick={event => event.stopPropagation()}>
                              <Box className='flex items-center'>
                                {student.isSuspended ? (
                                  <IconButton onClick={() => handleResumeStudent(student)} title='Khôi phục' color='success'>
                                    <i className='ri-play-circle-line' />
                                  </IconButton>
                                ) : (
                                  <>
                                    <IconButton onClick={() => handleTransferStudent(student)} title='Yêu cầu chuyển lớp' color='warning'>
                                      <i className='ri-arrow-left-right-line' />
                                    </IconButton>
                                    <IconButton onClick={() => handleSuspendStudent(student)} title='Tạm nghỉ' color='warning'>
                                      <i className='ri-pause-circle-line' />
                                    </IconButton>
                                    {/*<IconButton onClick={() => handleDeleteStudent(student)} title='Xóa học viên' color='error'>*/}
                                    {/*  <i className='ri-delete-bin-7-line' />*/}
                                    {/*</IconButton>*/}
                                  </>
                                )}
                                <IconButton title='Xem chi tiết' onClick={() => handleViewStudent(student)}>
                                  <i className='ri-eye-line text-textSecondary' />
                                </IconButton>
                                <IconButton title='Chỉnh sửa' onClick={() => handleEditStudent(student)} color='primary'>
                                  <i className='ri-edit-box-line' />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                <TablePagination
                  className='border-bs'
                  component='div'
                  count={studentsTotalRecords}
                  page={studentsPage}
                  rowsPerPage={studentsPageSize}
                  rowsPerPageOptions={[10, 25, 50]}
                  onPageChange={(_, page) => {
                    setStudentsPage(page)
                    studentsLoadedRef.current = false
                    loadStudents()
                  }}
                  onRowsPerPageChange={e => {
                    setStudentsPageSize(Number(e.target.value))
                    setStudentsPage(0)
                    studentsLoadedRef.current = false
                    loadStudents()
                  }}
                />
              </TabPanel>

              {/* Tab 3: Lịch học */}
              <TabPanel value='3' sx={{ p: 5 }}>
                {loadingSchedules ? (
                  <Box className='flex justify-center py-8'>
                    <CircularProgress size={32} />
                  </Box>
                ) : schedules.length === 0 ? (
                  <Typography color='text.secondary'>Chưa có lịch học cho lớp này.</Typography>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Ngày trong tuần</TableCell>
                          <TableCell>Giờ bắt đầu</TableCell>
                          <TableCell>Giờ kết thúc</TableCell>
                          <TableCell>Chi nhánh</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {schedules.map(schedule => (
                          <TableRow key={schedule.id}>
                            <TableCell>
                              <Chip
                                label={getDayName(schedule.dayOfWeek)}
                                size='small'
                                color='primary'
                                variant='tonal'
                              />
                            </TableCell>
                            <TableCell>{schedule.startTime}</TableCell>
                            <TableCell>{schedule.endTime}</TableCell>
                            <TableCell>{schedule.branch.name || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>
            </TabContext>
          </Card>
        </Grid>
      </Grid>

      {/* Add Students Drawer */}
      <AddStudentsToClassDrawer
        open={addStudentsOpen}
        onClose={() => setAddStudentsOpen(false)}
        classData={classData}
        onStudentsAdded={handleStudentsAdded}
      />
      <EditStudentDrawer
        open={editStudentOpen}
        onClose={() => {
          setEditStudentOpen(false)
          setSelectedStudent(null)
        }}
        student={selectedStudent}
        onSaved={handleStudentUpdated}
      />
      <ViewStudentDrawer
        open={viewStudentOpen}
        onClose={() => {
          setViewStudentOpen(false)
          setSelectedStudent(null)
        }}
        student={selectedStudent}
        onEdit={student => {
          setViewStudentOpen(false)
          handleEditStudent(student)
        }}
        onSuspend={handleSuspendStudent}
        onResume={handleResumeStudent}
      />
      <TransferStudentDialog
        open={transferStudentOpen}
        onClose={() => {
          setTransferStudentOpen(false)
          setSelectedStudent(null)
        }}
        student={selectedStudent}
        onTransferred={handleStudentsAdded}
      />
    </>
  )
}

export default ClassViewPage

