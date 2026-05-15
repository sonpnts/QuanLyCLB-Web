"use client"

import { useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import beltExamService from '@/services/beltExamService'
import classService from '@/services/classService'
import studentAttendanceService from '@/services/studentAttendanceService'
import type { ExamRegistrationType, ExamSessionType } from '@/types/apps/beltExamTypes'
import type { ClassType } from '@/types/apps/classTypes'
import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'
import { hasAdminRole } from '@/utils/roleUtils'
import { hasPermission } from '@/utils/permissionUtils'

const text = {
  title: '\u0051u\u1ea3n l\u00fd \u0111\u0103ng k\u00fd thi c\u1ea5p',
  subtitle: 'Theo d\u00f5i tr\u1ea1ng th\u00e1i \u0111\u0103ng k\u00fd, l\u1ec7 ph\u00ed thi, c\u1ea5p \u0111ai hi\u1ec7n t\u1ea1i v\u00e0 c\u1ea5p \u0111ai d\u1ef1 thi c\u1ee7a h\u1ecdc vi\u00ean',
  examSession: 'K\u1ef3 thi',
  allSessions: 'T\u1ea5t c\u1ea3 k\u1ef3 thi',
  class: 'L\u1edbp',
  allClasses: 'T\u1ea5t c\u1ea3 l\u1edbp',
  status: 'Tr\u1ea1ng th\u00e1i',
  all: 'T\u1ea5t c\u1ea3',
  pending: 'Ch\u1edd duy\u1ec7t',
  approved: '\u0110\u00e3 duy\u1ec7t',
  rejected: 'T\u1eeb ch\u1ed1i',
  fee: 'L\u1ec7 ph\u00ed',
  paid: '\u0110\u00e3 \u0111\u00f3ng',
  unpaid: 'Ch\u01b0a \u0111\u00f3ng',
  search: 'T\u00ecm h\u1ecdc vi\u00ean...',
  empty: 'Ch\u01b0a c\u00f3 \u0111\u0103ng k\u00fd thi c\u1ea5p ph\u00f9 h\u1ee3p v\u1edbi b\u1ed9 l\u1ecdc.',
  loadError: 'Kh\u00f4ng th\u1ec3 t\u1ea3i danh s\u00e1ch \u0111\u0103ng k\u00fd thi c\u1ea5p',
  student: 'H\u1ecdc vi\u00ean',
  registerStatus: 'Tr\u1ea1ng th\u00e1i \u0111\u0103ng k\u00fd',
  feePaid: '\u0110\u00e3 \u0111\u00f3ng ti\u1ec1n',
  currentBelt: 'C\u1ea5p \u0111ai hi\u1ec7n t\u1ea1i',
  targetBelt: 'C\u1ea5p \u0111ai d\u1ef1 thi',
  registeredBy: 'Ng\u01b0\u1eddi \u0111\u0103ng k\u00fd',
  noBelt: 'Ch\u01b0a c\u00f3'
}

const statusLabels: Record<string, string> = {
  Pending: text.pending,
  Approved: text.approved,
  Rejected: text.rejected
}

const statusColors: Record<string, 'warning' | 'success' | 'error' | 'secondary'> = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error'
}

const formatDateTime = (value?: string | null) => {
  if (!value) return ''

  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const BeltExamRegistrationsView = () => {
  const { showNotification } = useNotification()
  const { auth } = useAuth()
  const isAdmin = hasPermission(auth?.permissions, 'BeltExam.ManageAll') || hasAdminRole(auth?.roles)
  const [registrations, setRegistrations] = useState<ExamRegistrationType[]>([])
  const [sessions, setSessions] = useState<ExamSessionType[]>([])
  const [classes, setClasses] = useState<ClassType[]>([])
  const [loading, setLoading] = useState(true)

  const [examSessionId, setExamSessionId] = useState('')
  const [classId, setClassId] = useState('')
  const [status, setStatus] = useState('')
  const [feePaid, setFeePaid] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const loadFilters = async () => {
    const [sessionRes, classRes] = await Promise.all([
      beltExamService.getExamSessions(),
      isAdmin
        ? classService.getClasses({ isActive: true, pageSize: 1000 })
        : studentAttendanceService.getCoachClasses()
    ])

    if (sessionRes.success && sessionRes.data) setSessions(sessionRes.data)
    if (classRes.success && classRes.data) {
      const normalized = (classRes.data as any[]).map(item => ({
        id: item.id || item.classId,
        name: item.name || item.className
      }))
      setClasses(normalized as ClassType[])
    }
  }

  const loadRegistrations = async () => {
    try {
      setLoading(true)
      const params: Record<string, any> = { pageSize: 1000 }

      if (examSessionId) params.examSessionId = examSessionId
      if (classId) params.classId = classId
      if (status) params.status = status
      if (feePaid) params.isFeePaid = feePaid === 'paid'
      if (keyword.trim()) params.keyword = keyword.trim()

      const result = await beltExamService.getExamRegistrations(params)

      if (result.success && result.data) {
        setRegistrations(result.data)
      } else {
        setRegistrations([])
        showNotification(result.message || text.loadError, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFilters()
  }, [])

  useEffect(() => {
    loadRegistrations()
  }, [examSessionId, classId, status, feePaid, keyword])

  useEffect(() => {
    setPage(0)
  }, [examSessionId, classId, status, feePaid, keyword])

  const sortedRegistrations = useMemo(() => {
    return [...registrations].sort((a, b) => {
      const ao = a.currentBeltLevelOrder ?? -1
      const bo = b.currentBeltLevelOrder ?? -1
      if (bo !== ao) return bo - ao // desc by current belt order

      const at = new Date(a.createdAt || 0).getTime()
      const bt = new Date(b.createdAt || 0).getTime()
      return bt - at
    })
  }, [registrations])

  const pagedRows = useMemo(
    () => sortedRegistrations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedRegistrations, page, rowsPerPage]
  )

  return (
    <Card>
      <CardHeader title={text.title} subheader={text.subtitle} />
      <CardContent>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>{text.examSession}</InputLabel>
              <Select value={examSessionId} label={text.examSession} onChange={e => setExamSessionId(e.target.value)}>
                <MenuItem value=''>{text.allSessions}</MenuItem>
                {sessions.map(session => <MenuItem key={session.id} value={session.id}>{session.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>{text.class}</InputLabel>
              <Select value={classId} label={text.class} onChange={e => setClassId(e.target.value)}>
                <MenuItem value=''>{text.allClasses}</MenuItem>
                {classes.map(item => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>{text.status}</InputLabel>
              <Select value={status} label={text.status} onChange={e => setStatus(e.target.value)}>
                <MenuItem value=''>{text.all}</MenuItem>
                <MenuItem value='Pending'>{text.pending}</MenuItem>
                <MenuItem value='Approved'>{text.approved}</MenuItem>
                <MenuItem value='Rejected'>{text.rejected}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>{text.fee}</InputLabel>
              <Select value={feePaid} label={text.fee} onChange={e => setFeePaid(e.target.value)}>
                <MenuItem value=''>{text.all}</MenuItem>
                <MenuItem value='paid'>{text.paid}</MenuItem>
                <MenuItem value='unpaid'>{text.unpaid}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField fullWidth size='small' value={keyword} onChange={e => setKeyword(e.target.value)} placeholder={text.search} InputProps={{ startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> }} />
          </Grid>
        </Grid>
      </CardContent>

      {loading ? (
        <Box className='flex justify-center p-8'><CircularProgress /></Box>
      ) : sortedRegistrations.length === 0 ? (
        <CardContent><Alert severity='info'>{text.empty}</Alert></CardContent>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{text.student}</TableCell>
                  <TableCell>{text.examSession}</TableCell>
                  <TableCell>{text.class}</TableCell>
                  <TableCell>{text.registerStatus}</TableCell>
                  <TableCell>{text.feePaid}</TableCell>
                  <TableCell>{text.currentBelt}</TableCell>
                  <TableCell>{text.targetBelt}</TableCell>
                  <TableCell>{text.registeredBy}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedRows.map(row => (
                  <TableRow key={row.id} hover>
                    <TableCell><Typography color='text.primary' fontWeight={600}>{row.studentName}</Typography><Typography variant='caption' color='text.secondary'>{formatDateTime(row.createdAt)}</Typography></TableCell>
                    <TableCell>{row.examSessionName}</TableCell>
                    <TableCell>{row.className}</TableCell>
                    <TableCell><Tooltip title={row.rejectionReason || ''}><Chip label={statusLabels[row.status] || row.status} color={statusColors[row.status] || 'secondary'} size='small' variant='tonal' /></Tooltip></TableCell>
                    <TableCell>
                      <Box className='flex flex-col items-start gap-1'>
                        <Chip label={row.isFeePaid ? text.paid : text.unpaid} color={row.isFeePaid ? 'success' : 'warning'} size='small' variant='tonal' />
                        {row.isFeePaid && row.paidAt && <Typography variant='caption' color='text.secondary'>{formatDateTime(row.paidAt)}</Typography>}
                      </Box>
                    </TableCell>
                    <TableCell>{row.currentBeltLevelName || text.noBelt}</TableCell>
                    <TableCell><Typography color='primary.main' fontWeight={600}>{row.targetBeltLevelName}</Typography></TableCell>
                    <TableCell>{row.registeredByUserName || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component='div' count={sortedRegistrations.length} page={page} rowsPerPage={rowsPerPage} rowsPerPageOptions={[10, 25, 50, 100]} onPageChange={(_, nextPage) => setPage(nextPage)} onRowsPerPageChange={event => { setRowsPerPage(Number(event.target.value)); setPage(0) }} />
        </>
      )}
    </Card>
  )
}

export default BeltExamRegistrationsView

