'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Link from 'next/link'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import type { SelectChangeEvent } from '@mui/material/Select'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useNotification } from '@/contexts/notificationContext'
import studentAttendanceService, {
  type AttendanceSheetType,
  type CoachClassOption,
  type SaveAttendanceSheetStudentRequest
} from '@/services/studentAttendanceService'

const getTodayDateString = () => new Date().toISOString().slice(0, 10)

const AttendanceListTable = () => {
  const { showNotification } = useNotification()

  const [coachClasses, setCoachClasses] = useState<CoachClassOption[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedDate, setSelectedDate] = useState(getTodayDateString)
  const [search, setSearch] = useState('')

  const [sheet, setSheet] = useState<AttendanceSheetType | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  const loadSheet = useCallback(
    async (classId: string, date: string, keyword?: string) => {
      if (!classId || !date) return
      setLoading(true)

      const response = await studentAttendanceService.getCoachSheet(classId, date, keyword?.trim() || undefined)

      if (response.success && response.data) {
        setSheet(response.data)
        setIsEditMode(!(response.data.isSubmitted ?? false))
      } else {
        setSheet(null)
        setIsEditMode(false)
        showNotification(response.message || 'Khong tai duoc du lieu diem danh', 'error')
      }

      setLoading(false)
    },
    [showNotification]
  )

  useEffect(() => {
    const initialize = async () => {
      const today = getTodayDateString()

      setSelectedDate(today)

      const classesRes = await studentAttendanceService.getCoachClasses()
      const classes = classesRes.success && classesRes.data ? classesRes.data : []

      setCoachClasses(classes)

      if (classes.length === 0) {
        setSelectedClassId('')
        setSheet(null)
        setIsEditMode(false)
        
return
      }

      let autoClassId = ''

      for (const cls of classes) {
        const suggestedRes = await studentAttendanceService.getSuggestedDate(cls.classId)

        if (suggestedRes.success && suggestedRes.data === today) {
          autoClassId = cls.classId
          break
        }
      }

      setSelectedClassId(autoClassId)

      if (!autoClassId) {
        setSheet(null)
        setIsEditMode(false)
        
return
      }

      await loadSheet(autoClassId, today)
    }

    initialize()
  }, [loadSheet])

  const absentCount = useMemo(() => (sheet ? sheet.students.filter(s => s.isAbsent).length : 0), [sheet])
  const excusedCount = useMemo(() => (sheet ? sheet.students.filter(s => s.isAbsent && s.isExcused).length : 0), [sheet])

  const isSheetLocked = Boolean(sheet?.isSubmitted && !isEditMode)

  const updateStudentState = (
    studentId: string,
    updater: (student: AttendanceSheetType['students'][number]) => AttendanceSheetType['students'][number]
  ) => {
    setSheet(prev => {
      if (!prev) return prev

      return {
        ...prev,
        students: prev.students.map(student => (student.studentId === studentId ? updater(student) : student))
      }
    })
  }

  const handlePresentChange = (studentId: string, checked: boolean) => {
    updateStudentState(studentId, student =>
      checked
        ? { ...student, isAbsent: false, isExcused: false, reason: '' }
        : { ...student, isAbsent: true, isExcused: false, reason: '' }
    )
  }

  const handleExcusedChange = (studentId: string, checked: boolean) => {
    updateStudentState(studentId, student =>
      checked
        ? { ...student, isAbsent: true, isExcused: true }
        : { ...student, isAbsent: false, isExcused: false, reason: '' }
    )
  }

  const handleUnexcusedChange = (studentId: string, checked: boolean) => {
    updateStudentState(studentId, student =>
      checked
        ? { ...student, isAbsent: true, isExcused: false, reason: '' }
        : { ...student, isAbsent: false, isExcused: false, reason: '' }
    )
  }

  const handleReasonChange = (studentId: string, reason: string) => {
    updateStudentState(studentId, student => ({ ...student, reason }))
  }

  const handleSelectAllPresent = () => {
    setSheet(prev => {
      if (!prev) return prev

      return {
        ...prev,
        students: prev.students.map(student => ({ ...student, isAbsent: false, isExcused: false, reason: '' }))
      }
    })
  }

  const handleSearch = async () => {
    if (!selectedClassId || !selectedDate) return
    await loadSheet(selectedClassId, selectedDate, search)
  }

  const handleReloadByDate = async () => {
    if (!selectedClassId || !selectedDate) return
    await loadSheet(selectedClassId, selectedDate, search)
  }

  const handleSave = async () => {
    if (!sheet) return

    const absents: SaveAttendanceSheetStudentRequest[] = sheet.students
      .filter(student => student.isAbsent)
      .map(student => ({
        studentId: student.studentId,
        isExcused: student.isExcused,
        reason: student.reason?.trim() || undefined
      }))

    const invalidExcused = absents.find(item => item.isExcused && !item.reason)

    if (invalidExcused) {
      showNotification('Nghi co phep bat buoc nhap ly do', 'warning')
      
return
    }

    setSaving(true)

    const response = await studentAttendanceService.saveCoachSheet({
      classId: sheet.classId,
      classScheduleId: sheet.classScheduleId,
      attendanceDate: sheet.selectedDate,
      absents
    })

    if (response.success) {
      showNotification('Da luu diem danh', 'success')
      await loadSheet(sheet.classId, sheet.selectedDate, search)
    } else {
      showNotification(response.message || 'Luu diem danh that bai', 'error')
    }

    setSaving(false)
  }

  return (
    <Card>
      <CardHeader
        title='Diem danh hoc vien theo buoi hoc'
        subheader='Truong hop di hoc se khong luu. Chi luu cac truong hop vang.'
        action={
          <Button component={Link} href='/apps/attendance/history' variant='outlined' size='small'>
            Lich su diem danh
          </Button>
        }
      />
      <CardContent>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Lop duoc phan cong</InputLabel>
              <Select
                value={selectedClassId}
                label='Lop duoc phan cong'
                onChange={async (e: SelectChangeEvent) => {
                  const classId = e.target.value

                  setSelectedClassId(classId)
                  setSheet(null)
                  setIsEditMode(false)

                  if (!classId || !selectedDate) return
                  await loadSheet(classId, selectedDate, search)
                }}
              >
                {coachClasses.map(cls => (
                  <MenuItem key={cls.classId} value={cls.classId}>
                    {`${cls.classCode} - ${cls.className}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              type='date'
              label='Ngay diem danh'
              InputLabelProps={{ shrink: true }}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button variant='outlined' fullWidth onClick={handleReloadByDate} disabled={!selectedClassId || !selectedDate}>
              Tai danh sach
            </Button>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label='Tim hoc vien'
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={async e => {
                if (e.key === 'Enter') await handleSearch()
              }}
            />
          </Grid>

          <Grid size={{ xs: 12 }} className='flex flex-wrap gap-2'>
            {sheet?.isSubmitted && !isEditMode ? (
              <Button variant='outlined' color='warning' onClick={() => setIsEditMode(true)} disabled={loading || saving}>
                Chinh sua
              </Button>
            ) : null}
            <Button variant='contained' color='success' onClick={handleSelectAllPresent} disabled={!sheet || loading || saving || isSheetLocked}>
              Chon tat ca di hoc
            </Button>
            <Button variant='contained' onClick={handleSave} disabled={!sheet || loading || saving || isSheetLocked}>
              {saving ? 'Dang luu...' : 'Luu diem danh'}
            </Button>
            {sheet ? (
              <>
                <Chip color='warning' label={`Vang: ${absentCount}`} />
                <Chip color='info' label={`Co phep: ${excusedCount}`} />
              </>
            ) : null}
          </Grid>
        </Grid>

        <Box mt={6}>
          {sheet?.isSubmitted ? (
            <Alert severity='info' sx={{ mb: 3 }}>
              Da diem danh luc {new Date(sheet.submittedAt || '').toLocaleString('vi-VN')}
              {sheet.submittedByUserName ? ` - Nguoi tao: ${sheet.submittedByUserName}` : ''}
            </Alert>
          ) : null}

          {loading ? (
            <Box className='flex items-center justify-center py-8'>
              <CircularProgress size={28} />
            </Box>
          ) : null}

          {!loading && !sheet ? <Typography color='text.secondary'>Vui long chon lop de bat dau diem danh.</Typography> : null}

          {!loading && sheet ? (
            <div className='overflow-x-auto'>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Hoc vien</TableCell>
                    <TableCell>So dien thoai</TableCell>
                    <TableCell align='center'>Di hoc</TableCell>
                    <TableCell align='center'>Nghi co phep</TableCell>
                    <TableCell align='center'>Nghi khong phep</TableCell>
                    <TableCell>Ly do</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sheet.students.map(student => {
                    const isPresent = !student.isAbsent
                    const isExcused = student.isAbsent && student.isExcused
                    const isUnexcused = student.isAbsent && !student.isExcused

                    return (
                      <TableRow key={student.studentId}>
                        <TableCell>{student.studentName}</TableCell>
                        <TableCell>{student.phoneNumber || '-'}</TableCell>
                        <TableCell align='center'>
                          <Checkbox
                            checked={isPresent}
                            disabled={isSheetLocked || loading || saving}
                            onChange={e => handlePresentChange(student.studentId, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Checkbox
                            checked={isExcused}
                            disabled={isSheetLocked || loading || saving}
                            onChange={e => handleExcusedChange(student.studentId, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell align='center'>
                          <Checkbox
                            checked={isUnexcused}
                            disabled={isSheetLocked || loading || saving}
                            onChange={e => handleUnexcusedChange(student.studentId, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size='small'
                            placeholder='Ly do (bat buoc khi nghi co phep)'
                            value={student.reason || ''}
                            disabled={isSheetLocked || loading || saving}
                            onChange={e => handleReasonChange(student.studentId, e.target.value)}
                            error={isExcused && !student.reason?.trim()}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </Box>
      </CardContent>
    </Card>
  )
}

export default AttendanceListTable
