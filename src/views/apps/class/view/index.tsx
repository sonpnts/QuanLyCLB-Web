'use client'

import { logger } from '@/utils/logger'
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
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'

// Types
import type { ClassType } from '@/types/apps/classTypes'

// Services
import classService from '@/services/classService'

// Components
import AddStudentsToClassDrawer from '../list/AddStudentsToClassDrawer'

// Context
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  classId: string
}

type StudentType = {
  id: string
  fullName: string
  phoneNumber?: string
  email?: string
  enrollmentDate?: string
  status?: string
}

type ScheduleType = {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  branchName?: string
}

const dayOfWeekLabels: { [key: number]: string } = {
  0: 'Chá»§ nháº­t',
  1: 'Thá»© 2',
  2: 'Thá»© 3',
  3: 'Thá»© 4',
  4: 'Thá»© 5',
  5: 'Thá»© 6',
  6: 'Thá»© 7'
}

const ClassViewPage = ({ classId }: Props) => {
  const router = useRouter()
  const { showNotification } = useNotification()

  const [classData, setClassData] = useState<ClassType | null>(null)
  const [students, setStudents] = useState<StudentType[]>([])
  const [schedules, setSchedules] = useState<ScheduleType[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingSchedules, setLoadingSchedules] = useState(false)
  const [activeTab, setActiveTab] = useState('1')
  const [addStudentsOpen, setAddStudentsOpen] = useState(false)

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
          showNotificationRef.current(response.message || 'KhÃ´ng thá»ƒ táº£i thÃ´ng tin lá»›p há»c.', 'error')
          router.push('/apps/class/list')
        }
      } catch (error) {
        logger.error('index', 'Error loading class', error)
        showNotificationRef.current('ÄÃ£ cÃ³ lá»—i khi táº£i thÃ´ng tin lá»›p há»c.', 'error')
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
      const response = await classService.getClassStudents(classId)

      if (response.success && Array.isArray(response.data)) {
        setStudents(response.data)
      }
    } catch (error) {
      logger.error('index', 'Error loading students', error)
    } finally {
      setLoadingStudents(false)
    }
  }

  // Reload students sau khi thÃªm
  const handleStudentsAdded = () => {
    studentsLoadedRef.current = false
    loadStudents()
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
          <Typography>KhÃ´ng tÃ¬m tháº¥y thÃ´ng tin lá»›p há»c.</Typography>
          <Button variant='contained' onClick={() => router.push('/apps/class/list')} className='mt-4'>
            Quay láº¡i danh sÃ¡ch
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
                    label={classData.isActive !== false ? 'Hoáº¡t Ä‘á»™ng' : 'KhÃ´ng hoáº¡t Ä‘á»™ng'}
                    color={classData.isActive !== false ? 'success' : 'error'}
                    variant='tonal'
                  />
                </Box>
              }
              action={
                <Button variant='outlined' onClick={() => router.push('/apps/class/list')}>
                  Quay láº¡i
                </Button>
              }
            />
          </Card>
        </Grid>

        {/* Content */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <TabContext value={activeTab}>
              <TabList onChange={handleTabChange}>
                <Tab label='ThÃ´ng tin' value='1' />
                <Tab label='Há»c viÃªn' value='2' />
                <Tab label='Lá»‹ch há»c' value='3' />
              </TabList>

              {/* Tab 1: ThÃ´ng tin */}
              <TabPanel value='1'>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      MÃ£ lá»›p
                    </Typography>
                    <Typography variant='body1' className='font-medium'>
                      {classData.code}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      TÃªn lá»›p
                    </Typography>
                    <Typography variant='body1' className='font-medium'>
                      {classData.name}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      SÄ© sá»‘ tá»‘i Ä‘a
                    </Typography>
                    <Typography variant='body1' className='font-medium'>
                      {classData.maxStudents} há»c viÃªn
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant='body2' color='text.secondary'>
                      Sá»‘ há»c viÃªn hiá»‡n táº¡i
                    </Typography>
                    <Typography variant='body1' className='font-medium'>
                      {classData.currentStudents || 0} há»c viÃªn
                    </Typography>
                  </Grid>
                  {classData.description && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant='body2' color='text.secondary'>
                        MÃ´ táº£
                      </Typography>
                      <Typography variant='body1'>{classData.description}</Typography>
                    </Grid>
                  )}
                </Grid>
              </TabPanel>

              {/* Tab 2: Há»c viÃªn */}
              <TabPanel value='2'>
                <Box className='flex justify-between items-center mb-4'>
                  <Typography variant='subtitle1'>Danh sÃ¡ch há»c viÃªn ({students.length})</Typography>
                  <Button
                    variant='contained'
                    startIcon={<i className='ri-user-add-line' />}
                    onClick={() => setAddStudentsOpen(true)}
                  >
                    ThÃªm há»c viÃªn
                  </Button>
                </Box>
                {loadingStudents ? (
                  <Box className='flex justify-center py-8'>
                    <CircularProgress size={32} />
                  </Box>
                ) : students.length === 0 ? (
                  <Typography color='text.secondary'>ChÆ°a cÃ³ há»c viÃªn trong lá»›p nÃ y.</Typography>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Há» tÃªn</TableCell>
                          <TableCell>Sá»‘ Ä‘iá»‡n thoáº¡i</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>NgÃ y Ä‘Äƒng kÃ½</TableCell>
                          <TableCell>Tráº¡ng thÃ¡i</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {students.map(student => (
                          <TableRow key={student.id}>
                            <TableCell>{student.fullName}</TableCell>
                            <TableCell>{student.phoneNumber || '-'}</TableCell>
                            <TableCell>{student.email || '-'}</TableCell>
                            <TableCell>
                              {student.enrollmentDate
                                ? new Date(student.enrollmentDate).toLocaleDateString('vi-VN')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  student.status === 'Active'
                                    ? 'Äang há»c'
                                    : student.status === 'Inactive'
                                      ? 'Táº¡m nghá»‰'
                                      : 'HoÃ n thÃ nh'
                                }
                                size='small'
                                color={
                                  student.status === 'Active'
                                    ? 'success'
                                    : student.status === 'Inactive'
                                      ? 'warning'
                                      : 'info'
                                }
                                variant='tonal'
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </TabPanel>

              {/* Tab 3: Lá»‹ch há»c */}
              <TabPanel value='3'>
                {loadingSchedules ? (
                  <Box className='flex justify-center py-8'>
                    <CircularProgress size={32} />
                  </Box>
                ) : schedules.length === 0 ? (
                  <Typography color='text.secondary'>ChÆ°a cÃ³ lá»‹ch há»c cho lá»›p nÃ y.</Typography>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>NgÃ y trong tuáº§n</TableCell>
                          <TableCell>Giá» báº¯t Ä‘áº§u</TableCell>
                          <TableCell>Giá» káº¿t thÃºc</TableCell>
                          <TableCell>Chi nhÃ¡nh</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {schedules.map(schedule => (
                          <TableRow key={schedule.id}>
                            <TableCell>
                              <Chip
                                label={dayOfWeekLabels[schedule.dayOfWeek] || schedule.dayOfWeek}
                                size='small'
                                color='primary'
                                variant='tonal'
                              />
                            </TableCell>
                            <TableCell>{schedule.startTime}</TableCell>
                            <TableCell>{schedule.endTime}</TableCell>
                            <TableCell>{schedule.branchName || '-'}</TableCell>
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
    </>
  )
}

export default ClassViewPage
