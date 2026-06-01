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
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import Typography from '@mui/material/Typography'

import studentService from '@/services/studentService'
import classService from '@/services/classService'
import { useNotification } from '@/contexts/notificationContext'
import beltExamService from '@/services/beltExamService'
import type { AdminExamSessionViewType, AdminExamStudentRowType } from '@/types/apps/beltExamTypes'
import type { ClassType } from '@/types/apps/classTypes'
import type { StudentType } from '@/types/apps/studentTypes'
import { examSessionStatusColors, examSessionStatusLabels } from '@/types/apps/beltExamTypes'
import { exportToExcel } from '@/utils/exportToExcel'
import EditStudentDrawer from '@/views/apps/student/list/EditStudentDrawer'

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

type AdminSortField =
  | 'studentName'
  | 'studentCode'
  | 'dateOfBirth'
  | 'gender'
  | 'currentBeltLevelOrder'
  | 'targetBeltLevelOrder'
  | 'phoneNumber'
  | 'oneTimeFeesCompleted'
  | 'hasPaid'
  | 'eligible'

type SortDirection = 'asc' | 'desc'
type RegistrationBucket = 'all' | 'equal10' | 'under10'

const compareText = (left?: string | null, right?: string | null) =>
  String(left || '').localeCompare(String(right || ''), 'vi', { sensitivity: 'base' })

const compareNumber = (left?: number | null, right?: number | null) => (left ?? -1) - (right ?? -1)

const compareBoolean = (left?: boolean, right?: boolean) => Number(left ?? false) - Number(right ?? false)

const compareDate = (left?: string | null, right?: string | null) =>
  new Date(left || 0).getTime() - new Date(right || 0).getTime()

const matchesRegistrationBucket = (student: AdminExamStudentRowType, bucket: RegistrationBucket) => {
  const currentOrder = student.currentBeltLevelOrder ?? 0

  if (bucket === 'equal10') return currentOrder === 10
  if (bucket === 'under10') return currentOrder < 10

  return true
}

const isEligibleStudent = (student: AdminExamStudentRowType) => student.hasPaid && student.oneTimeFeesCompleted

const getGroupKey = (coachId: string, classId: string) => `${coachId}-${classId}`

const sortAdminStudents = (
  rows: AdminExamStudentRowType[],
  sortBy: AdminSortField,
  sortDirection: SortDirection
) => {
  const sorted = [...rows].sort((left, right) => {
    switch (sortBy) {
      case 'studentName':
        return compareText(left.studentName, right.studentName)
      case 'studentCode':
        return compareText(left.studentCode, right.studentCode)
      case 'dateOfBirth':
        return compareDate(left.dateOfBirth, right.dateOfBirth)
      case 'gender':
        return compareText(formatGender(left.gender), formatGender(right.gender))
      case 'currentBeltLevelOrder':
        return (
          compareNumber(left.currentBeltLevelOrder, right.currentBeltLevelOrder) ||
          compareText(left.studentName, right.studentName)
        )
      case 'targetBeltLevelOrder':
        return (
          compareNumber(left.targetBeltLevelOrder, right.targetBeltLevelOrder) ||
          compareText(left.studentName, right.studentName)
        )
      case 'phoneNumber':
        return compareText(left.phoneNumber, right.phoneNumber)
      case 'oneTimeFeesCompleted':
        return compareBoolean(left.oneTimeFeesCompleted, right.oneTimeFeesCompleted)
      case 'hasPaid':
        return compareBoolean(left.hasPaid, right.hasPaid)
      case 'eligible':
        return (
          compareBoolean(left.oneTimeFeesCompleted && left.hasPaid, right.oneTimeFeesCompleted && right.hasPaid) ||
          compareText(left.studentName, right.studentName)
        )
      default:
        return 0
    }
  })

  return sortDirection === 'asc' ? sorted : sorted.reverse()
}

const BeltExamAdminView = ({ sessionId }: Props) => {
  const { showNotification } = useNotification()
  const [data, setData] = useState<AdminExamSessionViewType | null>(null)
  const [loading, setLoading] = useState(true)
  const [onlyPaid, setOnlyPaid] = useState(false)
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const [locking, setLocking] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [registrationBucket, setRegistrationBucket] = useState<RegistrationBucket>('all')
  const [sortBy, setSortBy] = useState<AdminSortField>('currentBeltLevelOrder')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)
  const [editStudentOpen, setEditStudentOpen] = useState(false)
  const [loadingStudent, setLoadingStudent] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const [classes, setClasses] = useState<ClassType[]>([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [unregisteredClassesOpen, setUnregisteredClassesOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const result = await beltExamService.getAdminView(sessionId, false)

        if (result.success && result.data) {
          setData(result.data)
          setExpandedGroups([])
        } else {
          showNotification(result.message || 'Không thể tải dữ liệu kỳ thi.', 'error')
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [sessionId, showNotification])

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoadingClasses(true)
        const result = await classService.getClasses({ isActive: true, pageSize: 1000, pageNumber: 1 })

        if (result.success) {
          setClasses(result.data || [])
        }
      } finally {
        setLoadingClasses(false)
      }
    }

    loadClasses()
  }, [])

  const handleSort = (field: AdminSortField) => {
    if (sortBy === field) {
      setSortDirection(current => (current === 'asc' ? 'desc' : 'asc'))

      return
    }

    setSortBy(field)
    setSortDirection(field === 'currentBeltLevelOrder' ? 'desc' : 'asc')
  }

  const renderSortHeader = (label: string, field: AdminSortField) => (
    <TableSortLabel active={sortBy === field} direction={sortBy === field ? sortDirection : 'asc'} onClick={() => handleSort(field)}>
      {label}
    </TableSortLabel>
  )

  const allGroups = useMemo(() => {
    if (!data) return []

    return [...data.coachGroups]
      .sort((left, right) => compareText(left.className, right.className) || compareText(left.coachName, right.coachName))
  }, [data])

  const visibleGroups = useMemo(() => {
    return allGroups
      .map(group => {
        const students = sortAdminStudents(
          group.students.filter(
            student => matchesRegistrationBucket(student, registrationBucket) && (!onlyPaid || student.hasPaid)
          ),
          sortBy,
          sortDirection
        )

        return {
          ...group,
          groupKey: getGroupKey(group.coachId, group.classId),
          students,
          visiblePaidCount: students.filter(student => student.hasPaid).length,
          visibleEligibleCount: students.filter(isEligibleStudent).length
        }
      })
      .filter(group => group.students.length > 0)
  }, [allGroups, onlyPaid, registrationBucket, sortBy, sortDirection])

  const flattenedStudents = useMemo(() => visibleGroups.flatMap(group => group.students), [visibleGroups])

  const eligibleStudents = useMemo(() => {
    const seen = new Set<string>()

    return allGroups
      .flatMap(group => group.students)
      .filter(student => {
        if (seen.has(student.registrationId)) return false
        seen.add(student.registrationId)

        return isEligibleStudent(student)
      })
  }, [allGroups])

  const unregisteredClasses = useMemo(() => {
    const registeredClassIds = new Set(
      allGroups.filter(group => group.students.length > 0).map(group => group.classId)
    )

    return classes
      .filter(item => item.isActive && (item.currentStudents ?? 0) > 0 && !registeredClassIds.has(item.id))
      .sort((left, right) => compareText(left.name, right.name))
  }, [allGroups, classes])

  const targetBeltStats = useMemo(
    () =>
      eligibleStudents
        .reduce<Array<{ label: string; order: number; count: number }>>((acc, student) => {
          const order = student.targetBeltLevelOrder ?? 0
          const label = student.targetBeltLevelName || `Cấp ${formatBeltOrder(student.targetBeltLevelOrder, '')}`
          const existing = acc.find(item => item.label === label && item.order === order)

          if (existing) {
            existing.count += 1
          } else {
            acc.push({ label, order, count: 1 })
          }

          return acc
        }, [])
        .sort((left, right) => left.order - right.order || compareText(left.label, right.label)),
    [eligibleStudents]
  )

  const coachStats = useMemo(
    () =>
      allGroups
        .reduce<Array<{ id: string; label: string; count: number }>>((acc, group) => {
          const count = group.students.filter(isEligibleStudent).length
          const label = group.coachName || 'Chưa xác định'
          const existing = acc.find(item => item.id === group.coachId)

          if (count === 0) return acc

          if (existing) {
            existing.count += count
          } else {
            acc.push({ id: group.coachId, label, count })
          }

          return acc
        }, [])
        .sort((left, right) => right.count - left.count || compareText(left.label, right.label)),
    [allGroups]
  )

  const classStats = useMemo(
    () =>
      allGroups
        .reduce<Array<{ id: string; label: string; count: number }>>((acc, group) => {
          const count = group.students.filter(isEligibleStudent).length
          const label = group.className || 'Chưa xác định'
          const existing = acc.find(item => item.id === group.classId)

          if (count === 0) return acc

          if (existing) {
            existing.count += count
          } else {
            acc.push({ id: group.classId, label, count })
          }

          return acc
        }, [])
        .sort((left, right) => right.count - left.count || compareText(left.label, right.label)),
    [allGroups]
  )

  const openStudentEditor = async (studentId: string) => {
    try {
      setLoadingStudent(true)
      const result = await studentService.getStudentById(studentId)

      if (result.success && result.data) {
        setSelectedStudent(result.data)
        setEditStudentOpen(true)
      } else {
        showNotification(result.message || 'Không thể tải thông tin học viên.', 'error')
      }
    } finally {
      setLoadingStudent(false)
    }
  }

  const handleStudentUpdated = (updated: StudentType) => {
    setSelectedStudent(updated)
  }

  const fetchFullAdminView = async () => {
    if (data) return data

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
      studentCode: student.studentCode || '—',
      dateOfBirth: formatDate(student.dateOfBirth),
      gender: formatGender(student.gender),
      phoneNumber: student.phoneNumber || '—',
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
        const refreshed = await beltExamService.getAdminView(sessionId, false)

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
        studentCode: student.studentCode || '—',
        dateOfBirth: formatDate(student.dateOfBirth),
        gender: formatGender(student.gender),
        phoneNumber: student.phoneNumber || '—',
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
        .filter(student => !String(student.studentCode || '—').trim())

      if (missingCodeStudents.length === 0) {
        showNotification('Không có học viên nào thiếu mã HV để xuất file import.', 'info')

return
      }

      const rows = missingCodeStudents.map(student => ({
        fullName: student.studentName,
        dateOfBirth: formatDate(student.dateOfBirth),
        gender: formatGender(student.gender),
        phoneNumber: student.phoneNumber || '—',
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

      showNotification('Đã xuất file dữ liệu học viên import cho học viên đủ điều kiện.', 'success')
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

  const toggleGroup = (groupKey: string, expanded: boolean) => {
    setExpandedGroups(current =>
      expanded ? [...new Set([...current, groupKey])] : current.filter(item => item !== groupKey)
    )
  }

  const handleExpandAll = () => {
    setExpandedGroups(visibleGroups.map(group => group.groupKey))
  }

  const handleCollapseAll = () => {
    setExpandedGroups([])
  }

  const hasExpandedGroups = expandedGroups.length > 0

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
              {/*<Chip*/}
              {/*  label={examSessionStatusLabels[data.status] ?? data.status}*/}
              {/*  color={examSessionStatusColors[data.status] ?? 'default'}*/}
              {/*/>*/}
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

      <Box className='grid grid-cols-2 md:grid-cols-5 gap-4 mb-4'>
        {[
          { label: 'Tổng đăng ký', value: data.totalRegistered, color: 'primary.main' },
          { label: 'Đã đóng tiền', value: data.totalPaid, color: 'success.main' },
          { label: 'Chưa đóng tiền', value: data.totalUnpaid, color: 'warning.main' },
          { label: 'Đủ điều kiện thi', value: eligibleStudents.length, color: 'secondary.main' },
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

      <Box className='grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4'>
        <Card>
          <CardHeader
            title='Thống kê cấp đai dự thi'
            subheader='Chỉ tính học viên đã đóng lệ phí và hoàn thành điều kiện'
          />
          <CardContent sx={{ pt: 0 }}>
            {targetBeltStats.length === 0 ? (
              <Typography variant='body2' color='text.secondary'>
                Chưa có học viên đủ điều kiện để thống kê.
              </Typography>
            ) : (
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cấp đai dự thi(chữ)</TableCell>
                      <TableCell>Cấp đai dự thi(số)</TableCell>
                      <TableCell align='right'>Số lượng</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {targetBeltStats.map(item => (
                      <TableRow key={`${item.order}-${item.label}`}>
                        <TableCell>{item.label}</TableCell>
                        <TableCell align={'center'}>{item.order || '-'}</TableCell>
                        <TableCell align='center'>{item.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title='Thống kê theo HLV' subheader='Chỉ tính học viên đủ điều kiện thi' />
          <CardContent sx={{ pt: 0 }}>
            {coachStats.length === 0 ? (
              <Typography variant='body2' color='text.secondary'>
                Chưa có dữ liệu.
              </Typography>
            ) : (
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>HLV</TableCell>
                      <TableCell align='right'>Số lượng</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {coachStats.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.label}</TableCell>
                        <TableCell align='right'>{item.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title='Thống kê theo lớp' subheader='Chỉ tính học viên đủ điều kiện thi' />
          <CardContent sx={{ pt: 0 }}>
            {classStats.length === 0 ? (
              <Typography variant='body2' color='text.secondary'>
                Chưa có dữ liệu.
              </Typography>
            ) : (
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Lớp</TableCell>
                      <TableCell align='right'>Số lượng</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {classStats.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.label}</TableCell>
                        <TableCell align='right'>{item.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      <Box className='mb-4'>
        <Button
          variant='outlined'
          onClick={() => setUnregisteredClassesOpen(true)}
          disabled={loadingClasses}
          startIcon={loadingClasses ? <CircularProgress size={16} /> : <i className='ri-list-check-3' />}
        >
          {`Xem các lớp chưa đăng ký thi (${unregisteredClasses.length})`}
        </Button>
      </Box>

      <Card className='mb-4'>
        <CardContent className='py-2'>
          <Box className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <Box>
              <FormControlLabel
                control={
                  <Switch checked={onlyPaid} onChange={event => setOnlyPaid(event.target.checked)} color='success' />
                }
                label='Chỉ hiển thị học viên đã đóng lệ phí thi'
              />
              {/*<Typography variant='body2' color='text.secondary'>*/}
              {/*  Khi tắt bộ lọc này, màn hình sẽ hiển thị toàn bộ học viên đã đăng ký cùng trạng thái các khoản phí.*/}
              {/*</Typography>*/}
            </Box>
            <FormControl size='small' sx={{ minWidth: 220 }}>
              <InputLabel>Nhóm danh sách</InputLabel>
              <Select
                label='Nhóm danh sách'
                value={registrationBucket}
                onChange={event => setRegistrationBucket(event.target.value as RegistrationBucket)}
              >
                <MenuItem value='all'>Tất cả</MenuItem>
                <MenuItem value='equal10'>Chưa có mã = 10</MenuItem>
                <MenuItem value='under10'>Đã có mã &lt; 10</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {flattenedStudents.length === 0 ? (
        <Alert severity='info'>Chưa có danh sách đăng ký nào phù hợp bộ lọc.</Alert>
      ) : (
        <>
          <Box className='flex justify-end gap-2 mb-3'>
            {hasExpandedGroups ? (
              <Button variant='outlined' size='small' onClick={handleCollapseAll}>
                Thu gọn toàn bộ
              </Button>
            ) : (
              <Button variant='outlined' size='small' onClick={handleExpandAll}>
                Mở rộng toàn bộ
              </Button>
            )}
          </Box>

          {visibleGroups.map(group => (
            <Accordion
              key={group.groupKey}
              expanded={expandedGroups.includes(group.groupKey)}
              onChange={(_, expanded) => toggleGroup(group.groupKey, expanded)}
              className='mb-2'
            >
              <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
                <Box className='flex items-center gap-3 flex-wrap w-full pr-4'>
                  <Typography className='font-medium'>{group.coachName}</Typography>
                  <Typography color='text.secondary'>-</Typography>
                  <Typography color='text.secondary'>{group.className}</Typography>
                  <Typography variant='body2' color='text.secondary' className='ml-auto'>
                    {group.visibleEligibleCount}/{group.students.length} đủ điều kiện
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails className='p-0'>
                <TableContainer>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell width={50}>STT</TableCell>
                        <TableCell>{renderSortHeader('Họ tên', 'studentName')}</TableCell>
                        <TableCell>{renderSortHeader('Mã HV', 'studentCode')}</TableCell>
                        <TableCell>{renderSortHeader('Ngày sinh', 'dateOfBirth')}</TableCell>
                        <TableCell>{renderSortHeader('Giới tính', 'gender')}</TableCell>
                        <TableCell>{renderSortHeader('Cấp hiện tại', 'currentBeltLevelOrder')}</TableCell>
                        <TableCell>{renderSortHeader('Cấp thi', 'targetBeltLevelOrder')}</TableCell>
                        <TableCell>{renderSortHeader('SDT', 'phoneNumber')}</TableCell>
                        <TableCell>{renderSortHeader('Phí 1 lần', 'oneTimeFeesCompleted')}</TableCell>
                        <TableCell>{renderSortHeader('Lệ phí', 'hasPaid')}</TableCell>
                        <TableCell>{renderSortHeader('Điều kiện thi', 'eligible')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.students.map(student => {
                        stt += 1

                        return (
                          <TableRow
                            key={student.registrationId}
                            hover
                            onClick={() => openStudentEditor(student.studentId)}
                            sx={{ cursor: 'pointer' }}
                          >
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
          ))}
        </>
      )}

      {loadingStudent && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: theme => theme.zIndex.modal + 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,0.45)'
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <EditStudentDrawer
        open={editStudentOpen}
        onClose={() => setEditStudentOpen(false)}
        student={selectedStudent}
        onSaved={handleStudentUpdated}
      />

      <Dialog open={lockDialogOpen} onClose={() => setLockDialogOpen(false)}>
        <DialogTitle>Xác nhận chốt danh sách</DialogTitle>
        <DialogContent>
          <DialogContentText component='div'>
            Sau khi chốt:
            <ul className='mt-2 pl-4 list-disc'>
              <li>Không thể đăng ký thêm hoặc chỉnh sửa danh sách</li>
              <li>Không thể thu thêm lệ phí thi</li>
              <li>Danh sách chuyển sang trạng thái chỉ xem</li>
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

      <Dialog open={unregisteredClassesOpen} onClose={() => setUnregisteredClassesOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>{`Các lớp chưa đăng ký thi (${unregisteredClasses.length})`}</DialogTitle>
        <DialogContent>
          {loadingClasses ? (
            <Box className='flex justify-center py-6'>
              <CircularProgress size={24} />
            </Box>
          ) : unregisteredClasses.length === 0 ? (
            <Typography variant='body2' color='text.secondary'>
              Không còn lớp nào chưa đăng ký thi trong kỳ này.
            </Typography>
          ) : (
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell width={50}>STT</TableCell>
                    <TableCell>Mã lớp</TableCell>
                    <TableCell>Tên lớp</TableCell>
                    <TableCell>HLV chính</TableCell>
                    <TableCell align='right'>Sĩ số hiện tại</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {unregisteredClasses.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.coaches?.find(coach => coach.isLeadInstructor)?.fullName || '—'}</TableCell>
                      <TableCell align='right'>{item.currentStudents ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnregisteredClassesOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default BeltExamAdminView
