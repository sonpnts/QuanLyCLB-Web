'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import beltExamService from '@/services/beltExamService'
import classService from '@/services/classService'
import instructorService from '@/services/instructorService'
import studentAttendanceService from '@/services/studentAttendanceService'
import studentService from '@/services/studentService'
import type {
  BeltExamRegistrationListType,
  CreateRegistrationListItemRequest,
  EligibleStudentForExamType,
  ExamSessionType,
  ExamType,
  RegistrationListItemType
} from '@/types/apps/beltExamTypes'
import type { StudentType } from '@/types/apps/studentTypes'
import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'
import { buildModulePermissionMap } from '@/utils/rbac'
import { formatDateTimeVN, formatDateVN } from '@/utils/dateTime'
import EditStudentDrawer from '@/views/apps/student/list/EditStudentDrawer'
import ViewStudentDrawer from '@/views/apps/student/list/ViewStudentDrawer'

interface Props {
  session: ExamSessionType
  coachId: string
  onBack: () => void
}

interface StudentRow extends EligibleStudentForExamType {
  selected: boolean
  selectedTargetBeltId: string
  currentRegistration?: RegistrationListItemType
}

const sortEligibleStudents = (students: EligibleStudentForExamType[]) =>
  [...students].sort((a, b) => {
    const aOrder = a.currentBeltOrder ?? -1
    const bOrder = b.currentBeltOrder ?? -1

    if (bOrder !== aOrder) return bOrder - aOrder

    return (a.studentName || '').localeCompare(b.studentName || '', 'vi')
  })

const mapStudentsToRows = (
  eligibleStudents: EligibleStudentForExamType[],
  registrationList: BeltExamRegistrationListType | null
): StudentRow[] => {
  const registrationsByStudentId = new Map(
    registrationList?.registrations.map(registration => [registration.studentId, registration] as const) ?? []
  )

  return sortEligibleStudents(
    eligibleStudents.filter(
      student =>
        student.isRegistrationProfileComplete ||
        !(student.currentBeltLevelName === null || student.currentBeltLevelName === 'Unknown')
    )
  ).map(student => {
    const currentRegistration = registrationsByStudentId.get(student.studentId)

    // Học viên đã đăng ký (kể cả do HLV khác tạo) vẫn hiển thị ở trạng thái đã tích;
    // HLV có thể bỏ tích để HỦY đăng ký do HLV khác tạo (xem handler ở checkbox).
    return {
      ...student,
      currentRegistration,
      selected: Boolean(currentRegistration) || student.alreadyRegistered,
      selectedTargetBeltId: currentRegistration?.targetBeltLevelId ?? student.suggestedTargetBeltLevelId ?? ''
    }
  })
}


const isSessionReadOnly = (session: ExamSessionType) => {
  if (session.isLocked || session.status === 'Locked') return true
  if (!session.registrationDeadline) return false

  return new Date(session.registrationDeadline).getTime() <= Date.now()
}

const BeltExamRegisterClassPanel = ({ session, coachId, onBack }: Props) => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()

  const isAdmin =
    hasPermission(auth?.permissions, 'BeltExam.Admin.View') ||
    hasPermission(auth?.permissions, 'BeltExam.Admin.Create') ||
    hasPermission(auth?.permissions, 'BeltExam.Admin.Update') ||
    hasPermission(auth?.permissions, 'BeltExam.Admin.Approve') ||
    hasAdminRole(auth?.roles)

  const studentPermissions = useMemo(
    () => buildModulePermissionMap(auth?.permissions, auth?.roles, 'Student'),
    [auth?.permissions, auth?.roles]
  )

  const [myClasses, setMyClasses] = useState<{ id: string; name: string }[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [students, setStudents] = useState<StudentRow[]>([])
  const [myList, setMyList] = useState<BeltExamRegistrationListType | null>(null)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)
  const [viewStudentOpen, setViewStudentOpen] = useState(false)
  const [editStudentOpen, setEditStudentOpen] = useState(false)
  const [loadingStudent, setLoadingStudent] = useState(false)
  const readOnly = isSessionReadOnly(session)

  const loadMyClasses = useCallback(async () => {
    try {
      if (isAdmin) {
        const lookupResult = await classService.getClassLookup({ isActive: true, pageNumber: 1, pageSize: 1000 })

        if (lookupResult.success && lookupResult.data) {
          const records = lookupResult.data
            .map(item => ({
              id: item.id,
              name: item.code ? `${item.name}` : item.name
            }))
            .sort((a, b) => a.name.localeCompare(b.name, 'vi'))

          setMyClasses(records)
          if (records.length > 0) setSelectedClassId(current => current || records[0].id)

          return
        }
      }

      const coachClasses = await studentAttendanceService.getCoachClasses()

      if (coachClasses.success && coachClasses.data && coachClasses.data.length > 0) {
        const records = coachClasses.data
          .map(item => ({
            id: item.classId,
            name: item.className
          }))
          .sort((a, b) => a.name.localeCompare(b.name, 'vi'))

        setMyClasses(records)
        if (records.length > 0) setSelectedClassId(current => current || records[0].id)

        return
      }

      const result = await instructorService.getInstructorClasses(coachId)

      if (result.success && result.data) {
        const records: { id: string; name: string }[] = Array.isArray(result.data)
          ? result.data
          : (result.data as { records?: { id: string; name: string }[] })?.records || []

        const mappedRecords = records
          .map(item => ({ id: item.id, name: item.name }))
          .sort((a, b) => a.name.localeCompare(b.name, 'vi'))

        setMyClasses(mappedRecords)
        if (mappedRecords.length > 0) setSelectedClassId(current => current || mappedRecords[0].id)
      }
    } catch {
      showNotification('Không thể tải danh sách lớp', 'error')
    }
  }, [coachId, isAdmin, showNotification])

  const reloadClassData = useCallback(
    async (classId: string, preferredList?: BeltExamRegistrationListType | null) => {
      try {
        setLoadingStudents(true)

        const [eligibleResult, listResult] = await Promise.all([
          beltExamService.getEligibleStudents(session.id, classId),
          preferredList === undefined
            ? beltExamService.getMyRegistrationList(session.id, classId)
            : Promise.resolve({ success: Boolean(preferredList), data: preferredList } as const)
        ])

        const nextList = preferredList === undefined ? (listResult.success ? (listResult.data ?? null) : null) : preferredList

        setMyList(nextList)

        if (eligibleResult.success && eligibleResult.data) {
          setStudents(mapStudentsToRows(eligibleResult.data, nextList))
        } else {
          setStudents([])
          showNotification(eligibleResult.message || 'Không thể tải học viên', 'error')
        }
      } finally {
        setLoadingStudents(false)
      }
    },
    [session.id, showNotification]
  )

  useEffect(() => {
    loadMyClasses()
  }, [loadMyClasses])

  useEffect(() => {
    if (!selectedClassId) return

    reloadClassData(selectedClassId)
  }, [reloadClassData, selectedClassId])

  const openStudentDrawer = async (studentId: string) => {
    try {
      setLoadingStudent(true)
      const result = await studentService.getStudentById(studentId)

      if (result.success && result.data) {
        setSelectedStudent(result.data)
        setViewStudentOpen(true)
      } else {
        showNotification(result.message || 'Không thể tải thông tin học viên', 'error')
      }
    } finally {
      setLoadingStudent(false)
    }
  }

  const handleStudentUpdated = (updated: StudentType) => {
    setSelectedStudent(updated)
  }

  const [cancelOtherTarget, setCancelOtherTarget] = useState<StudentRow | null>(null)
  const [cancelingOtherListRegistration, setCancelingOtherListRegistration] = useState(false)

  // Bỏ tích học viên do HLV khác đăng ký => hủy đăng ký đó (xóa mềm).
  // Sau khi hủy, hệ thống sẽ cho phép đăng ký lại (chạy lại quy trình đăng ký, cấp đai theo mã mới nhất).
  const handleCancelOtherListRegistration = async () => {
    if (!cancelOtherTarget?.existingRegistrationId) return

    try {
      setCancelingOtherListRegistration(true)
      const result = await beltExamService.deleteRegistration(cancelOtherTarget.existingRegistrationId)

      if (result.success) {
        showNotification(`Đã hủy đăng ký của học viên ${cancelOtherTarget.studentName}.`, 'success')
        setCancelOtherTarget(null)
        await reloadClassData(selectedClassId)
      } else {
        showNotification(result.message || 'Không thể hủy đăng ký này.', 'error')
      }
    } finally {
      setCancelingOtherListRegistration(false)
    }
  }

  const currentRegistrationsByStudentId = new Map(
    myList?.registrations.map(registration => [registration.studentId, registration] as const) ?? []
  )

  const isStudentInCurrentList = (student: StudentRow) => currentRegistrationsByStudentId.has(student.studentId)

  const isStudentPaidInCurrentList = (student: StudentRow) => {
    // Nếu lệ phí thi = 0 thì coi như đã đóng
    if (session.examFee != null && session.examFee <= 0) return true
    return Boolean(currentRegistrationsByStudentId.get(student.studentId)?.isFeePaid)
  }

  // Học viên đang nằm trong danh sách do HLV khác tạo (đã đăng ký nhưng không thuộc danh sách của mình)
  const isStudentRegisteredByOtherCoach = (student: StudentRow) =>
    student.alreadyRegistered && student.existingRegistrationListId !== myList?.id

  // Chỉ khóa khi học viên đang ở danh sách HLV khác VÀ đã đóng lệ phí (chỉ admin xóa được);
  // chưa đóng lệ phí thì HLV khác vẫn được hủy (bỏ tích) rồi đăng ký lại.
  const isStudentLockedByAnotherList = (student: StudentRow) =>
    isStudentRegisteredByOtherCoach(student) && Boolean(student.alreadyRegisteredIsFeePaid)

  const hasStudentProfileIssue = (student: StudentRow) => !student.isRegistrationProfileComplete

  const isStudentSelectable = (student: StudentRow) =>
    !isStudentRegisteredByOtherCoach(student) && !isStudentPaidInCurrentList(student) && !hasStudentProfileIssue(student)

  const isStudentEditable = (student: StudentRow) => !readOnly && isStudentSelectable(student)

  // Học viên thuộc danh sách HLV khác: chỉ học viên của danh sách mình/chưa đăng ký thực sự đưa vào payload lưu
  const isStudentSavableForOwnList = (student: StudentRow) =>
    student.selected && student.selectedTargetBeltId && !isStudentRegisteredByOtherCoach(student)

  const handleSelectAll = (checked: boolean) => {
    if (readOnly) return

    setStudents(prev =>
      prev.map(student => {
        // Đăng ký do HLV khác tạo không bị ảnh hưởng bởi chọn tất cả/bỏ tất cả
        if (isStudentRegisteredByOtherCoach(student)) return student
        if (isStudentPaidInCurrentList(student)) return { ...student, selected: true }
        if (!checked) return { ...student, selected: false }
        if (hasStudentProfileIssue(student)) return student

        return { ...student, selected: checked }
      })
    )
  }

  const editableStudents = students.filter(isStudentEditable)
  const studentsWithProfileIssues = students.filter(hasStudentProfileIssue)
  const editableSelectedCount = editableStudents.filter(student => student.selected).length
  const selectedCount = students.filter(student => student.selected).length
  const allSelected = editableStudents.length > 0 && editableStudents.every(student => student.selected)

  const handleSaveList = async () => {
    if (readOnly) {
      showNotification('Danh sách đã khóa, không thể cập nhật', 'warning')

      return
    }

    const selectedStudents = students.filter(isStudentSavableForOwnList)

    if (selectedStudents.length === 0 && !myList) {
      showNotification('Vui lòng chọn ít nhất 1 học viên và cấp thi', 'warning')

      return
    }

    try {
      setSaving(true)

      const items: CreateRegistrationListItemRequest[] = selectedStudents.map(student => ({
        studentId: student.studentId,
        targetBeltLevelId: student.selectedTargetBeltId
      }))

      const result = await beltExamService.createOrUpdateRegistrationList(session.id, {
        examSessionId: session.id,
        classId: selectedClassId,
        students: items
      })

      if (result.success && result.data) {
        showNotification(result.message || 'Đã lưu danh sách thành công', 'success')
        await reloadClassData(selectedClassId, result.data)
      } else {
        showNotification(result.message || 'Lưu thất bại', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box>
      <Box className='mb-4 flex items-center gap-2'>
        <IconButton onClick={onBack}>
          <i className='ri-arrow-left-line' />
        </IconButton>
        <Box>
          <Typography variant='h6'>{session.name}</Typography>
          <Typography variant='body2' color='text.secondary'>
            Ngày thi: {formatDateVN(session.examDate)}
            {session.registrationDeadline && (
              <> • Hạn đăng ký: {formatDateVN(session.registrationDeadline)}</>
            )}
          </Typography>
        </Box>
      </Box>

      <Card className='mb-4'>
        <CardContent>
          <FormControl size='small' sx={{ minWidth: 240 }}>
            <InputLabel>Chọn lớp</InputLabel>
            <Select value={selectedClassId} label='Chọn lớp' onChange={event => setSelectedClassId(event.target.value)}>
              {myClasses.map(classItem => (
                <MenuItem key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {myList && (
        <Card className='mb-4'>
          <CardHeader
            title={
              <Box className='flex items-center gap-2'>
                <Typography variant='h6'>Danh sách đã đăng ký</Typography>
                <Chip label={`${myList.paidCount}/${myList.totalStudents} đã đóng lệ phí`} color='primary' size='small' variant='tonal' />
              </Box>
            }
            subheader={`Tạo lúc: ${formatDateTimeVN(myList.createdAt)}`}
          />
          <CardContent>
            <Alert severity='info' className='mb-3'>
              Danh sách này chỉ tổng hợp học viên đã đăng ký. Bạn có thể bấm vào từng dòng để sửa hồ sơ học viên.
            </Alert>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>STT</TableCell>
                    <TableCell>Học viên</TableCell>
                    <TableCell>Cấp hiện tại</TableCell>
                    <TableCell>Cấp thi</TableCell>
                    <TableCell>Lệ phí</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {myList.registrations.map((registration, index) => (
                    <TableRow key={registration.id} hover onClick={() => openStudentDrawer(registration.studentId)} sx={{ cursor: 'pointer' }}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{registration.studentName}</TableCell>
                      <TableCell>{registration.currentBeltLevelName ?? '—'}</TableCell>
                      <TableCell>
                        <strong>{registration.targetBeltLevelName}</strong>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={(session.examFee != null && session.examFee <= 0) || registration.isFeePaid ? 'Đã đóng' : 'Chưa đóng'}
                          color={(session.examFee != null && session.examFee <= 0) || registration.isFeePaid ? 'success' : 'warning'}
                          size='small'
                          variant='tonal'
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader
          title='Chọn học viên đăng ký thi'
          subheader={readOnly
            ? 'Danh sách chỉ còn để xem. Không thể chỉnh sửa hoặc thu thêm lệ phí thi.'
            : session.examType === 'ThangDang'
              ? 'Chỉ hiển thị học viên đang active, cấp 1 hoặc cấp 11 trở lên (thi thăng đẳng).'
              : 'Chỉ hiển thị học viên đang active, cấp 10 đến cấp 2 (không bao gồm đẳng).'}
          action={
            <Box className='flex gap-2'>
              <Button
                variant='outlined'
                onClick={handleSaveList}
                disabled={readOnly || saving || (!myList && selectedCount === 0)}
                startIcon={saving ? <CircularProgress size={16} /> : <i className='ri-save-line' />}
              >
                {myList ? `Cập nhật danh sách (${selectedCount})` : `Lưu danh sách (${selectedCount})`}
              </Button>

            </Box>
          }
        />
        <CardContent className='p-0'>
          {studentsWithProfileIssues.length > 0 && (
            <Box className='p-4 pb-0'>
              <Alert severity='warning'>
                Có {studentsWithProfileIssues.length} học viên chưa có mã và còn thiếu CCCD hoặc trình độ học vấn. HLV có thể xem trực tiếp ở
                cột hồ sơ trước khi lưu danh sách.
              </Alert>
            </Box>
          )}
          {loadingStudents ? (
            <Box className='flex justify-center p-8'>
              <CircularProgress />
            </Box>
          ) : students.length === 0 ? (
            <Box className='p-4'>
              <Alert severity='info'>Không có học viên đủ điều kiện trong lớp này.</Alert>
            </Box>
          ) : (
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell padding='checkbox'>
                      <Checkbox
                        indeterminate={editableSelectedCount > 0 && !allSelected}
                        checked={allSelected}
                        onChange={event => handleSelectAll(event.target.checked)}
                        disabled={editableStudents.length === 0}
                      />
                    </TableCell>
                    <TableCell>Họ tên</TableCell>
                    <TableCell>Ngày sinh</TableCell>
                    <TableCell>Giới tính</TableCell>
                    <TableCell>Cấp hiện tại (chữ)</TableCell>
                    <TableCell>Cấp hiện tại (số)</TableCell>
                    <TableCell>Cấp thi (chữ)</TableCell>
                    <TableCell>Cấp thi (số)</TableCell>
                    <TableCell>Hồ sơ đăng ký</TableCell>
                    <TableCell>Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map(student => {
                    const isRegisteredByOtherCoach = isStudentRegisteredByOtherCoach(student)
                    const isLockedByAnotherList = isStudentLockedByAnotherList(student)
                    const isPaidInCurrentList = isStudentPaidInCurrentList(student)
                    const isCurrentListStudent = isStudentInCurrentList(student)
                    const currentRegistration = currentRegistrationsByStudentId.get(student.studentId)
                    const hasProfileIssue = hasStudentProfileIssue(student)

                    return (
                      <TableRow
                        key={student.studentId}
                        hover
                        onClick={() => openStudentDrawer(student.studentId)}
                        selected={student.selected}
                        sx={{ opacity: isLockedByAnotherList ? 0.5 : 1, cursor: 'pointer' }}
                      >
                        <TableCell padding='checkbox' onClick={event => event.stopPropagation()}>
                          <Checkbox
                            checked={isRegisteredByOtherCoach ? true : student.selected}
                            disabled={
                              readOnly ||
                              isLockedByAnotherList ||
                              isPaidInCurrentList ||
                              (hasProfileIssue && !student.selected && !isRegisteredByOtherCoach)
                            }
                            onChange={event => {
                              // Đăng ký do HLV khác tạo: bỏ tích => mở xác nhận HỦY đăng ký đó.
                              // (Tích lại sau khi đã hủy sẽ đăng ký bình thường với dữ liệu mới nhất.)
                              if (isRegisteredByOtherCoach) {
                                if (!event.target.checked) setCancelOtherTarget(student)

                                return
                              }

                              setStudents(prev =>
                                prev.map(item =>
                                  item.studentId === student.studentId ? { ...item, selected: event.target.checked } : item
                                )
                              )
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' className='font-medium'>
                            {student.studentName}
                          </Typography>
                          {student.studentCode && (
                            <Typography variant='caption' color='text.secondary'>
                              {student.studentCode}
                            </Typography>
                          )}
                          {student.registrationProfileNote && (
                            <Typography variant='caption' sx={{ color: 'warning.main', display: 'block' }}>
                              {student.registrationProfileNote}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {formatDateVN(student.dateOfBirth, '—')}
                          </Typography>
                        </TableCell>
                        <TableCell>{student.gender === true ? 'Nam' : student.gender === false ? 'Nữ' : '—'}</TableCell>
                        <TableCell>{student.currentBeltLevelName ?? '—'}</TableCell>
                        <TableCell>{student.currentBeltOrder ?? '—'}</TableCell>
                        <TableCell>{currentRegistration?.targetBeltLevelName || student.suggestedTargetBeltLevelName || '—'}</TableCell>
                        <TableCell>{currentRegistration?.targetBeltLevelOrder ?? student.suggestedTargetBeltLevelOrder ?? '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={student.isRegistrationProfileComplete ? 'Đủ hồ sơ' : 'Thiếu hồ sơ'}
                            color={student.isRegistrationProfileComplete ? 'success' : 'warning'}
                            size='small'
                            variant='tonal'
                          />
                        </TableCell>
                        <TableCell>
                          {isLockedByAnotherList ? (
                            <Chip label='Đã đăng ký' color='info' size='small' variant='tonal' />
                          ) : isRegisteredByOtherCoach ? (
                            <Chip label='HLV khác' color='secondary' size='small' variant='tonal' />
                          ) : isPaidInCurrentList ? (
                            <Chip label='Đã đóng phí' color='success' size='small' variant='tonal' />
                          ) : isCurrentListStudent ? (
                            <Chip label='Nháp' color='warning' size='small' variant='tonal' />
                          ) : (
                            <Chip label='Chưa đăng ký' color='default' size='small' variant='outlined' />
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

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
      <ViewStudentDrawer
        open={viewStudentOpen}
        onClose={() => {
          setViewStudentOpen(false)
          setSelectedStudent(null)
        }}
        student={selectedStudent}
        onEdit={
          studentPermissions.canUpdate
            ? student => {
                setViewStudentOpen(false)
                setSelectedStudent(student)
                setEditStudentOpen(true)
              }
            : undefined
        }
      />
      <EditStudentDrawer
        open={editStudentOpen}
        onClose={() => setEditStudentOpen(false)}
        student={selectedStudent}
        onSaved={handleStudentUpdated}
      />

      <Dialog open={Boolean(cancelOtherTarget)} onClose={() => (cancelingOtherListRegistration ? null : setCancelOtherTarget(null))}>
        <DialogTitle>Xác nhận hủy đăng ký</DialogTitle>
        <DialogContent>
          <DialogContentText component='div'>
            Học viên <strong>{cancelOtherTarget?.studentName}</strong> đang nằm trong danh sách đăng ký của HLV khác.
            <br />
            Hủy đăng ký này? Sau khi hủy, học viên có thể được đăng ký lại (hệ thống sẽ tính lại cấp đai theo mã mới nhất);
            dữ liệu đóng phí (nếu có) không bị ảnh hưởng.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOtherTarget(null)} disabled={cancelingOtherListRegistration}>
            Không
          </Button>
          <Button variant='contained' color='error' onClick={handleCancelOtherListRegistration} disabled={cancelingOtherListRegistration}>
            {cancelingOtherListRegistration ? <CircularProgress size={18} /> : 'Hủy đăng ký'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default BeltExamRegisterClassPanel
