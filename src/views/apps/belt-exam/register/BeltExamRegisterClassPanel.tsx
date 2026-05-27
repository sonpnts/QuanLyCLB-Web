'use client'

import { useEffect, useState } from 'react'

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
import type {
  BeltExamRegistrationListType,
  CreateRegistrationListItemRequest,
  EligibleStudentForExamType,
  ExamSessionType
} from '@/types/apps/beltExamTypes'
import { registrationListStatusColors, registrationListStatusLabels } from '@/types/apps/beltExamTypes'
import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'

interface Props {
  session: ExamSessionType
  coachId: string
  onBack: () => void
}

interface StudentRow extends EligibleStudentForExamType {
  selected: boolean
  selectedTargetBeltId: string
}

const BeltExamRegisterClassPanel = ({ session, coachId, onBack }: Props) => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()
  const isAdmin = hasPermission(auth?.permissions, 'BeltExam.ManageAll') || hasAdminRole(auth?.roles)

  const [myClasses, setMyClasses] = useState<{ id: string; name: string }[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [students, setStudents] = useState<StudentRow[]>([])
  const [myList, setMyList] = useState<BeltExamRegistrationListType | null>(null)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    loadMyClasses()
  }, [isAdmin, coachId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedClassId) {
      loadEligibleStudents(selectedClassId)
      loadMyExistingList(selectedClassId)
    }
  }, [selectedClassId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!myList) return

    const registrationsByStudentId = new Map(
      myList.registrations.map(reg => [reg.studentId, reg] as const)
    )

    setStudents(prev =>
      prev.map(student => {
        const currentRegistration = registrationsByStudentId.get(student.studentId)

        if (!currentRegistration) {
          return {
            ...student,
            selected: false,
            selectedTargetBeltId: student.suggestedTargetBeltLevelId ?? ''
          }
        }

        return {
          ...student,
          selected: true,
          selectedTargetBeltId: currentRegistration.targetBeltLevelId
        }
      })
    )
  }, [myList])

  const loadMyClasses = async () => {
    try {
      if (isAdmin) {
        const lookupResult = await classService.getClassLookup({ isActive: true, pageNumber: 1, pageSize: 1000 })

        if (lookupResult.success && lookupResult.data) {
          const records = lookupResult.data
            .map(item => ({
              id: item.id,
              name: item.code ? `${item.name} (${item.code})` : item.name
            }))
            .sort((a, b) => a.name.localeCompare(b.name, 'vi'))

          setMyClasses(records)
          if (records.length > 0) setSelectedClassId(current => current || records[0].id)

          return
        }
      }

      // Ưu tiên API lớp của chính HLV (không cần quyền quản lý huấn luyện viên)
      const coachClasses = await studentAttendanceService.getCoachClasses()

      if (coachClasses.success && coachClasses.data && coachClasses.data.length > 0) {
        const records = coachClasses.data
          .map(c => ({
            id: c.classId,
            name: c.className
          }))
          .sort((a, b) => a.name.localeCompare(b.name, 'vi'))

        setMyClasses(records)
        if (records.length > 0) setSelectedClassId(current => current || records[0].id)
        
return
      }

      // Fallback cho tài khoản có quyền cao hơn (admin/staff)
      const result = await instructorService.getInstructorClasses(coachId)

      if (result.success && result.data) {
        const records: { id: string; name: string }[] = Array.isArray(result.data)
          ? result.data
          : (result.data as any)?.records || []

        const mappedRecords = records
          .map((c: any) => ({ id: c.id, name: c.name }))
          .sort((a, b) => a.name.localeCompare(b.name, 'vi'))

        setMyClasses(mappedRecords)
        if (mappedRecords.length > 0) setSelectedClassId(current => current || mappedRecords[0].id)
      }
    } catch {
      showNotification('Không thể tải danh sách lớp', 'error')
    }
  }

  const loadEligibleStudents = async (classId: string) => {
    try {
      setLoadingStudents(true)
      const result = await beltExamService.getEligibleStudents(session.id, classId)

      if (result.success && result.data) {
        const sorted = [...result.data].sort((a, b) => {
          const ao = a.currentBeltOrder ?? -1
          const bo = b.currentBeltOrder ?? -1

          if (bo !== ao) return bo - ao // desc
          
return (a.studentName || '').localeCompare(b.studentName || '', 'vi')
        })

        setStudents(
          sorted.map(s => ({
            ...s,
            selected: false,
            selectedTargetBeltId: s.suggestedTargetBeltLevelId ?? ''
          }))
        )
      } else {
        showNotification(result.message || 'Không thể tải học viên', 'error')
      }
    } finally {
      setLoadingStudents(false)
    }
  }

  const loadMyExistingList = async (classId: string) => {
    const result = await beltExamService.getMyRegistrationList(session.id, classId)

    setMyList(result.success ? (result.data ?? null) : null)
  }

  const currentRegistrationsByStudentId = new Map(myList?.registrations.map(reg => [reg.studentId, reg] as const) ?? [])

  const isStudentInCurrentList = (student: StudentRow) => currentRegistrationsByStudentId.has(student.studentId)

  const isStudentPaidInCurrentList = (student: StudentRow) =>
    Boolean(currentRegistrationsByStudentId.get(student.studentId)?.isFeePaid)

  const isStudentLockedByAnotherList = (student: StudentRow) =>
    student.alreadyRegistered && student.existingRegistrationListId !== myList?.id

  const isStudentEditable = (student: StudentRow) => !isStudentLockedByAnotherList(student) && !isStudentPaidInCurrentList(student)

  const handleSelectAll = (checked: boolean) => {
    setStudents(prev =>
      prev.map(student => {
        if (isStudentLockedByAnotherList(student)) return student
        if (isStudentPaidInCurrentList(student)) return { ...student, selected: true }

        return { ...student, selected: checked }
      })
    )
  }

  const editableStudents = students.filter(isStudentEditable)
  const editableSelectedCount = editableStudents.filter(s => s.selected).length
  const selectedCount = students.filter(s => s.selected).length
  const allSelected = editableStudents.length > 0 && editableStudents.every(s => s.selected)

  const handleSaveDraft = async () => {
    const chosen = students.filter(s => s.selected && s.selectedTargetBeltId)

    if (chosen.length === 0 && !myList) {
      showNotification('Vui lòng chọn ít nhất 1 học viên và cấp thi', 'warning')

      return
    }

    try {
      setSaving(true)

      const items: CreateRegistrationListItemRequest[] = chosen.map(s => ({
        studentId: s.studentId,
        targetBeltLevelId: s.selectedTargetBeltId
      }))

      const result = await beltExamService.createOrUpdateRegistrationList(session.id, {
        examSessionId: session.id,
        classId: selectedClassId,
        students: items
      })

      if (result.success) {
        showNotification('Đã lưu danh sách thành công', 'success')
        await Promise.all([loadMyExistingList(selectedClassId), loadEligibleStudents(selectedClassId)])
      } else {
        showNotification(result.message || 'Lưu thất bại', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!myList?.id) return

    try {
      setSubmitting(true)
      const result = await beltExamService.submitRegistrationList(myList.id)

      if (result.success) {
        showNotification('Đã nộp danh sách thành công!', 'success')
        setConfirmOpen(false)
        await Promise.all([loadMyExistingList(selectedClassId), loadEligibleStudents(selectedClassId)])
      } else {
        showNotification(result.message || 'Nộp thất bại', 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const isSubmitted = myList?.status === 'Submitted'

  return (
    <Box>
      {/* Header */}
      <Box className='flex items-center gap-2 mb-4'>
        <IconButton onClick={onBack}>
          <i className='ri-arrow-left-line' />
        </IconButton>
        <Box>
          <Typography variant='h6'>{session.name}</Typography>
          <Typography variant='body2' color='text.secondary'>
            Ngày thi: {new Date(session.examDate).toLocaleDateString('vi-VN')}
            {session.registrationDeadline && (
              <> • Hạn ĐK: {new Date(session.registrationDeadline).toLocaleDateString('vi-VN')}</>
            )}
          </Typography>
        </Box>
      </Box>

      {/* Chọn lớp */}
      <Card className='mb-4'>
        <CardContent>
          <FormControl size='small' sx={{ minWidth: 200 }}>
            <InputLabel>Chọn lớp</InputLabel>
            <Select value={selectedClassId} label='Chọn lớp' onChange={e => setSelectedClassId(e.target.value)}>
              {myClasses.map(c => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Danh sách đã nộp (read-only) */}
      {isSubmitted && myList && (
        <Card className='mb-4'>
          <CardHeader
            title={
              <Box className='flex items-center gap-2'>
                <Typography variant='h6'>Danh sách đã nộp</Typography>
                <Chip
                  label={registrationListStatusLabels[myList.status]}
                  color={registrationListStatusColors[myList.status]}
                  size='small'
                />
                {myList.isAutoSubmitted && <Chip label='Tự động nộp' color='warning' size='small' variant='outlined' />}
              </Box>
            }
            subheader={
              myList.submittedAt ? `Nộp lúc: ${new Date(myList.submittedAt).toLocaleString('vi-VN')}` : undefined
            }
          />
          <CardContent>
            <Alert severity='info' className='mb-3'>
              Danh sách đã nộp. Bạn vẫn có thể cập nhật thêm hoặc bỏ các học viên chưa đóng phí; các học viên đã đóng phí sẽ
              được giữ nguyên trong danh sách.
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
                  {myList.registrations.map((reg, idx) => (
                    <TableRow key={reg.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{reg.studentName}</TableCell>
                      <TableCell>{reg.currentBeltLevelName ?? '—'}</TableCell>
                      <TableCell>
                        <strong>{reg.targetBeltLevelName}</strong>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={reg.isFeePaid ? 'Đã đóng' : 'Chưa đóng'}
                          color={reg.isFeePaid ? 'success' : 'warning'}
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
            subheader={
              isSubmitted
                ? 'Danh sách đã nộp vẫn có thể cập nhật khi kỳ thi còn mở. Học viên đã đóng phí sẽ bị khóa.'
                : 'Chỉ hiển thị học viên đang Active, cấp 10 -> 2 (không bao gồm đẳng)'
            }
            action={
              <Box className='flex gap-2'>
                <Button
                  variant='outlined'
                  onClick={handleSaveDraft}
                  disabled={saving || (!myList && selectedCount === 0)}
                  startIcon={saving ? <CircularProgress size={16} /> : <i className='ri-save-line' />}
                >
                  {myList ? `Cập nhật danh sách (${selectedCount})` : `Lưu nháp (${selectedCount})`}
                </Button>
                {myList && myList.status === 'Draft' && (
                  <Button
                    variant='contained'
                    onClick={() => setConfirmOpen(true)}
                    startIcon={<i className='ri-send-plane-line' />}
                  >
                    Nộp danh sách
                  </Button>
                )}
              </Box>
            }
          />
          <CardContent className='p-0'>
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
                          onChange={e => handleSelectAll(e.target.checked)}
                          disabled={editableStudents.length === 0}
                        />
                      </TableCell>
                      <TableCell>Họ tên</TableCell>
                      <TableCell>Ngày sinh</TableCell>
                      <TableCell>Giới tính</TableCell>
                      <TableCell>Cấp hiện tại (chữ)</TableCell>
                      <TableCell>Cấp hiện tại (số)</TableCell>
                      <TableCell>Cấp thi(chữ)</TableCell>
                      <TableCell>Cấp thi(số)</TableCell>
                      <TableCell>Trạng thái</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map(student => {
                      const isLockedByAnotherList = isStudentLockedByAnotherList(student)
                      const isPaidInCurrentList = isStudentPaidInCurrentList(student)
                      const isCurrentListStudent = isStudentInCurrentList(student)
                      const currentRegistration = currentRegistrationsByStudentId.get(student.studentId)

                      return (
                      <TableRow
                        key={student.studentId}
                        selected={student.selected}
                        sx={{ opacity: isLockedByAnotherList ? 0.5 : 1 }}
                      >
                        <TableCell padding='checkbox'>
                          <Checkbox
                            checked={student.selected}
                            disabled={isLockedByAnotherList || isPaidInCurrentList}
                            onChange={e => {
                              setStudents(prev =>
                                prev.map(s =>
                                  s.studentId === student.studentId ? { ...s, selected: e.target.checked } : s
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
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {student.gender === true ? 'Nam' : student.gender === false ? 'Nữ' : '-'}
                        </TableCell>
                        <TableCell>{student.currentBeltLevelName}</TableCell>
                        <TableCell>{student.currentBeltOrder}</TableCell>
                        <TableCell>{currentRegistration?.targetBeltLevelName || student.suggestedTargetBeltLevelName || '—'}</TableCell>
                        <TableCell>{currentRegistration?.targetBeltLevelOrder ?? student.suggestedTargetBeltLevelOrder}</TableCell>

                        <TableCell>
                          {isLockedByAnotherList ? (
                            <Chip label='Đã ĐK' color='info' size='small' variant='tonal' />
                          ) : isPaidInCurrentList ? (
                            <Chip label='Đã đóng phí' color='success' size='small' variant='tonal' />
                          ) : isCurrentListStudent && isSubmitted ? (
                            <Chip label='Đã nộp' color='success' size='small' variant='tonal' />
                          ) : isCurrentListStudent ? (
                            <Chip label='Nháp' color='warning' size='small' variant='tonal' />
                          ) : (
                            <Chip label='Chưa ĐK' color='default' size='small' variant='outlined' />
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

      {/* Confirm submit dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Xác nhận nộp danh sách</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sau khi nộp, danh sách sẽ chuyển sang trạng thái đã nộp để bắt đầu thu phí. Bạn vẫn có thể cập nhật tiếp các
            học viên chưa đóng phí nếu kỳ thi còn mở. Tiếp tục?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Hủy</Button>
          <Button variant='contained' onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={18} /> : 'Nộp danh sách'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default BeltExamRegisterClassPanel


