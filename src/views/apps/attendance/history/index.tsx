'use client'

import { useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useAuth } from '@/contexts/authContext'
import classService from '@/services/classService'
import studentAttendanceService, { type CoachClassOption, type StudentAttendanceSessionLogType } from '@/services/studentAttendanceService'
import { hasAdminRole } from '@/utils/roleUtils'

type FilterClass = {
  id: string
  name: string
}

const today = new Date().toISOString().slice(0, 10)

const AttendanceHistoryView = () => {
  const { auth } = useAuth()
  const isAdmin = hasAdminRole(auth?.roles)

  const [loading, setLoading] = useState(false)
  const [classOptions, setClassOptions] = useState<FilterClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [logs, setLogs] = useState<StudentAttendanceSessionLogType[]>([])

  useEffect(() => {
    const loadOptions = async () => {
      if (isAdmin) {
        const classRes = await classService.getClasses({ isActive: true, pageSize: 1000 })
        const classes = classRes.success && classRes.data ? classRes.data : []

        setClassOptions(classes.map(c => ({ id: c.id || '', name: `${c.code || ''} - ${c.name}` })))
        
return
      }

      const coachRes = await studentAttendanceService.getCoachClasses()
      const coachClasses = coachRes.success && coachRes.data ? coachRes.data : []

      setClassOptions(coachClasses.map((c: CoachClassOption) => ({ id: c.classId, name: `${c.classCode} - ${c.className}` })))
    }

    loadOptions()
  }, [isAdmin])

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true)

      const response = await studentAttendanceService.getSessionLogs({
        pageSize: 1000,
        classId: selectedClassId || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      })

      setLogs(response.success && response.data ? response.data : [])
      setLoading(false)
    }

    loadLogs()
  }, [selectedClassId, fromDate, toDate])

  const groupedLogs = useMemo(() => {
    const map = new Map<string, StudentAttendanceSessionLogType[]>()

    for (const row of logs) {
      const key = row.attendanceDate
      const existing = map.get(key) || []

      existing.push(row)
      map.set(key, existing)
    }

    return Array.from(map.entries()).sort((a, b) => (a[0] > b[0] ? -1 : 1))
  }, [logs])

  return (
    <Card>
      <CardHeader title='Lich su diem danh' subheader='Xem theo ngay, co the loc theo lop' />
      <CardContent>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Lop hoc</InputLabel>
              <Select value={selectedClassId} label='Lop hoc' onChange={e => setSelectedClassId(e.target.value)}>
                <MenuItem value=''>Tat ca</MenuItem>
                {classOptions.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth type='date' label='Tu ngay' value={fromDate} onChange={e => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth type='date' label='Den ngay' value={toDate} onChange={e => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
        </Grid>

        {loading ? (
          <Box className='flex items-center justify-center py-8'>
            <CircularProgress size={28} />
          </Box>
        ) : null}

        {!loading && groupedLogs.length === 0 ? <Typography color='text.secondary'>Khong co du lieu lich su diem danh.</Typography> : null}

        {!loading &&
          groupedLogs.map(([date, rows]) => (
            <Box key={date} sx={{ mb: 4 }}>
              <Typography variant='h6' sx={{ mb: 1.5 }}>
                Ngay {new Date(date).toLocaleDateString('vi-VN')}
              </Typography>
              <div className='overflow-x-auto'>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Lop</TableCell>
                      <TableCell align='center'>Tong hoc vien</TableCell>
                      <TableCell align='center'>Vang</TableCell>
                      <TableCell align='center'>Co phep</TableCell>
                      <TableCell align='center'>Khong phep</TableCell>
                      <TableCell>Nguoi diem danh</TableCell>
                      <TableCell>Thoi gian tao</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map(row => (
                      <TableRow key={row.id}>
                        <TableCell>{row.className}</TableCell>
                        <TableCell align='center'>{row.totalStudents}</TableCell>
                        <TableCell align='center'>{row.absentCount}</TableCell>
                        <TableCell align='center'>{row.excusedAbsentCount}</TableCell>
                        <TableCell align='center'>{row.unexcusedAbsentCount}</TableCell>
                        <TableCell>{row.markedByUserName || '-'}</TableCell>
                        <TableCell>{new Date(row.createdAt).toLocaleString('vi-VN')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Box>
          ))}
      </CardContent>
    </Card>
  )
}

export default AttendanceHistoryView
