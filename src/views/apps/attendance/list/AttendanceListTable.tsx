'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid2'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableBody from '@mui/material/TableBody'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import type { SelectChangeEvent } from '@mui/material/Select'

import studentAttendanceService, {
  type CoachClassOption,
  type AttendanceSheetType,
  type SaveAttendanceSheetStudentRequest
} from '@/services/studentAttendanceService'
import { useNotification } from '@/contexts/notificationContext'

const AttendanceListTable = () => {
  const { showNotification } = useNotification()

  const [coachClasses, setCoachClasses] = useState<CoachClassOption[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [search, setSearch] = useState('')

  const [sheet, setSheet] = useState<AttendanceSheetType | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadClasses = useCallback(async () => {
    const response = await studentAttendanceService.getCoachClasses()
    if (response.success && response.data) setCoachClasses(response.data)
  }, [])

  const loadSuggestedDate = useCallback(async (classId: string) => {
    const response = await studentAttendanceService.getSuggestedDate(classId)
    if (response.success && response.data) {
      setSelectedDate(response.data)
      return response.data
    }

    const fallback = new Date().toISOString().slice(0, 10)
    setSelectedDate(fallback)
    return fallback
  }, [])

  const loadSheet = useCallback(
    async (classId: string, date: string, keyword?: string) => {
      if (!classId || !date) return
      setLoading(true)

      const response = await studentAttendanceService.getCoachSheet(classId, date, keyword?.trim() || undefined)

      if (response.success && response.data) {
        setSheet(response.data)
      } else {
        setSheet(null)
        showNotification(response.message || 'Cannot load attendance data', 'error')
      }

      setLoading(false)
    },
    [showNotification]
  )

  useEffect(() => {
    loadClasses()
  }, [loadClasses])

  useEffect(() => {
    if (!selectedClassId) {
      setSheet(null)
      setSelectedDate('')
      return
    }

    ;(async () => {
      const suggestedDate = await loadSuggestedDate(selectedClassId)
      await loadSheet(selectedClassId, suggestedDate)
    })()
  }, [selectedClassId, loadSuggestedDate, loadSheet])

  const absentCount = useMemo(() => {
    if (!sheet) return 0
    return sheet.students.filter(s => s.isAbsent).length
  }, [sheet])

  const excusedCount = useMemo(() => {
    if (!sheet) return 0
    return sheet.students.filter(s => s.isAbsent && s.isExcused).length
  }, [sheet])

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
    updateStudentState(studentId, student => {
      if (!checked) return { ...student, isAbsent: true, isExcused: false, reason: '' }
      return { ...student, isAbsent: false, isExcused: false, reason: '' }
    })
  }

  const handleExcusedChange = (studentId: string, checked: boolean) => {
    updateStudentState(studentId, student => {
      if (!checked) return { ...student, isAbsent: false, isExcused: false, reason: '' }
      return { ...student, isAbsent: true, isExcused: true }
    })
  }

  const handleUnexcusedChange = (studentId: string, checked: boolean) => {
    updateStudentState(studentId, student => {
      if (!checked) return { ...student, isAbsent: false, isExcused: false, reason: '' }
      return { ...student, isAbsent: true, isExcused: false, reason: '' }
    })
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
      showNotification('Excused absence must have reason', 'warning')
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
      showNotification('Attendance saved', 'success')
      await loadSheet(sheet.classId, sheet.selectedDate, search)
    } else {
      showNotification(response.message || 'Save attendance failed', 'error')
    }

    setSaving(false)
  }

  return (
    <Card>
      <CardHeader title='Student attendance by session' subheader='Present students are not stored. Only absences are stored.' />
      <CardContent>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Assigned class</InputLabel>
              <Select
                value={selectedClassId}
                label='Assigned class'
                onChange={(e: SelectChangeEvent) => setSelectedClassId(e.target.value)}
              >
                {coachClasses.map(cls => (
                  <MenuItem key={cls.classId} value={cls.classId}>{`${cls.classCode} - ${cls.className}`}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              type='date'
              label='Attendance date'
              InputLabelProps={{ shrink: true }}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button variant='outlined' fullWidth onClick={handleReloadByDate} disabled={!selectedClassId || !selectedDate}>
              Load list
            </Button>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label='Search student'
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={async e => {
                if (e.key === 'Enter') await handleSearch()
              }}
            />
          </Grid>

          <Grid size={{ xs: 12 }} className='flex flex-wrap gap-2'>
            <Button variant='contained' color='success' onClick={handleSelectAllPresent} disabled={!sheet || loading || saving}>
              Mark all present
            </Button>
            <Button variant='contained' onClick={handleSave} disabled={!sheet || loading || saving}>
              {saving ? 'Saving...' : 'Save attendance'}
            </Button>
            {sheet ? (
              <>
                <Chip color='warning' label={`Absent: ${absentCount}`} />
                <Chip color='info' label={`Excused: ${excusedCount}`} />
              </>
            ) : null}
          </Grid>
        </Grid>

        <Box mt={6}>
          {loading ? (
            <Box className='flex items-center justify-center py-8'>
              <CircularProgress size={28} />
            </Box>
          ) : null}

          {!loading && !sheet ? <Typography color='text.secondary'>Select class to start attendance.</Typography> : null}

          {!loading && sheet ? (
            <div className='overflow-x-auto'>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell align='center'>Present</TableCell>
                    <TableCell align='center'>Excused absence</TableCell>
                    <TableCell align='center'>Unexcused absence</TableCell>
                    <TableCell>Reason</TableCell>
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
                          <Checkbox checked={isPresent} onChange={e => handlePresentChange(student.studentId, e.target.checked)} />
                        </TableCell>
                        <TableCell align='center'>
                          <Checkbox checked={isExcused} onChange={e => handleExcusedChange(student.studentId, e.target.checked)} />
                        </TableCell>
                        <TableCell align='center'>
                          <Checkbox
                            checked={isUnexcused}
                            onChange={e => handleUnexcusedChange(student.studentId, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size='small'
                            placeholder='Reason (required for excused)'
                            value={student.reason || ''}
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
