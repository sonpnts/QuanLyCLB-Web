'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

import zaloLinkService from '@/services/zaloLinkService'
import studentService from '@/services/studentService'
import ZaloVerifyModal from '@/views/apps/student/list/ZaloVerifyModal'
import { useNotification } from '@/contexts/notificationContext'

import type { ZaloLinkCoachOverviewType, ZaloLinkCoachStudentRowType } from '@/types/apps/zaloLinkTypes'

const getRateChip = (rate?: number | null) => {
  const safeRate = typeof rate === 'number' && Number.isFinite(rate) ? rate : 0
  const color = safeRate >= 80 ? 'success' : safeRate >= 50 ? 'warning' : 'error'

  return <Chip size='small' label={`${safeRate.toFixed(2)}%`} color={color as any} variant='tonal' />
}

const emptyOverview: ZaloLinkCoachOverviewType = {
  totalStudents: 0,
  linkedStudents: 0,
  unlinkedStudents: 0,
  linkedRate: 0,
  classes: []
}

export default function ZaloLinkCoachView() {
  const { showNotification } = useNotification()

  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState<ZaloLinkCoachOverviewType | null>(null)
  const [rows, setRows] = useState<ZaloLinkCoachStudentRowType[]>([])

  const [classId, setClassId] = useState<string>('')
  const [onlyUnlinked, setOnlyUnlinked] = useState<boolean>(false)
  const [keyword, setKeyword] = useState<string>('')

  const [selectedRow, setSelectedRow] = useState<ZaloLinkCoachStudentRowType | null>(null)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [unlinkOpen, setUnlinkOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadOverview = useCallback(async () => {
    const res = await zaloLinkService.getCoachOverview()

    setOverview(res.success ? (res.data as any) : null)
  }, [])

  const loadRows = useCallback(async () => {
    setLoading(true)

    try {
      const res = await zaloLinkService.getCoachStudents({
        classId: classId || undefined,
        onlyUnlinked,
        keyword: keyword.trim() || undefined
      })

      setRows(res.success && res.data ? res.data : [])
    } finally {
      setLoading(false)
    }
  }, [classId, onlyUnlinked, keyword])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  const safeOverview = useMemo(() => overview ?? emptyOverview, [overview])
  const classes = useMemo(() => safeOverview.classes ?? [], [safeOverview])

  const selectedClassStats = useMemo(
    () => (classId ? classes.find(item => item.classId === classId) ?? null : null),
    [classId, classes]
  )

  const displayOverview = useMemo(
    () =>
      selectedClassStats
        ? {
            totalStudents: selectedClassStats.totalStudents,
            linkedStudents: selectedClassStats.linkedStudents,
            unlinkedStudents: selectedClassStats.unlinkedStudents,
            linkedRate: selectedClassStats.linkedRate
          }
        : safeOverview,
    [safeOverview, selectedClassStats]
  )

  const overviewTitle = selectedClassStats
    ? `Thống kê lớp ${selectedClassStats.classCode}`
    : 'Thống kê tất cả lớp'

  const openVerify = (r: ZaloLinkCoachStudentRowType) => {
    setSelectedRow(r)
    setVerifyOpen(true)
  }

  const handleConfirmZalo = async (userId: string, phone: string) => {
    if (!selectedRow) return

    try {
      setSaving(true)
      const res = await studentService.updateStudentZalo(selectedRow.studentId, userId, phone)

      if (!res.success) {
        showNotification(res.message || 'Không thể cập nhật liên kết Zalo.', 'error')
        
return
      }

      showNotification('Đã cập nhật liên kết Zalo.', 'success')
      setVerifyOpen(false)
      setSelectedRow(null)
      await Promise.all([loadOverview(), loadRows()])
    } finally {
      setSaving(false)
    }
  }

  const unlink = async (r: ZaloLinkCoachStudentRowType) => {
    setSelectedRow(r)
    setUnlinkOpen(true)
  }

  const doUnlink = async () => {
    if (!selectedRow) return

    try {
      setSaving(true)
      const res = await studentService.updateStudentZalo(selectedRow.studentId, '', selectedRow.phoneNumber || '')

      if (!res.success) {
        showNotification(res.message || 'Không thể hủy liên kết Zalo.', 'error')
        
return
      }

      showNotification('Đã hủy liên kết Zalo.', 'success')
      setUnlinkOpen(false)
      setSelectedRow(null)
      await Promise.all([loadOverview(), loadRows()])
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box className='space-y-6'>
      <Card>
        <CardHeader title='Liên kết Zalo (Coach)' subheader='Lọc theo lớp, xem danh sách chưa liên kết và cập nhật liên kết theo SĐT.' />
        <CardContent>
          {!overview ? (
            <Typography variant='body2' color='text.secondary'>
              Không có dữ liệu.
            </Typography>
          ) : (
            <Box className='space-y-3'>
              <Typography variant='body2' color='text.secondary'>
                {overviewTitle}
              </Typography>
              <Box className='flex flex-wrap gap-3 items-center'>
                <Chip label={`Tổng: ${displayOverview.totalStudents}`} variant='outlined' />
                <Chip label={`Đã LK: ${displayOverview.linkedStudents}`} color='success' variant='outlined' />
                <Chip label={`Chưa LK: ${displayOverview.unlinkedStudents}`} color='warning' variant='outlined' />
                {getRateChip(displayOverview.linkedRate)}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title='Bộ lọc' />
        <CardContent>
          <Box className='flex flex-wrap gap-4 items-center'>
            <FormControl size='small' sx={{ minWidth: 280 }}>
              <InputLabel id='zalo-coach-class'>Lọc theo lớp</InputLabel>
              <Select
                labelId='zalo-coach-class'
                label='Lọc theo lớp'
                value={classId}
                onChange={e => setClassId(e.target.value)}
              >
                <MenuItem value=''>Tất cả lớp</MenuItem>
                {classes.map(c => (
                  <MenuItem key={c.classId} value={c.classId}>
                    {c.classCode}
                    {/*{c.className} ({c.classCode}) - {c.branchName}*/}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={<Switch checked={onlyUnlinked} onChange={e => setOnlyUnlinked(e.target.checked)} />}
              label='Chỉ xem chưa liên kết'
            />

            <TextField
              size='small'
              label='Tìm kiếm'
              placeholder='Tên / mã HV / SĐT...'
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              sx={{ minWidth: 260 }}
            />

            <Button variant='outlined' onClick={loadRows} disabled={loading}>
              Lọc
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title='Danh sách học viên' />
        <CardContent>
          {loading ? (
            <Box className='flex justify-center py-8'>
              <CircularProgress />
            </Box>
          ) : rows.length === 0 ? (
            <Typography variant='body2' color='text.secondary' className='text-center py-4'>
              Không có dữ liệu.
            </Typography>
          ) : (
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Mã HV</TableCell>
                    <TableCell>Họ tên</TableCell>
                    <TableCell>SĐT</TableCell>
                    <TableCell>Lớp</TableCell>
                    <TableCell align='center'>Zalo</TableCell>
                    <TableCell align='right'>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(r => {
                    const linked = !!(r.userIdZalo && r.userIdZalo.trim())

                    
return (
                      <TableRow key={`${r.classId}_${r.studentId}`} hover>
                        <TableCell>{r.studentCode}</TableCell>
                        <TableCell>{r.studentName}</TableCell>
                        <TableCell>{r.phoneNumber || '-'}</TableCell>
                        <TableCell>
                          {r.classCode}
                        </TableCell>
                        <TableCell align='center'>
                          {linked ? (
                            <Chip size='small' color='success' variant='tonal' label='Đã LK' />
                          ) : (
                            <Chip size='small' color='warning' variant='tonal' label='Chưa LK' />
                          )}
                        </TableCell>
                        <TableCell align='right'>
                          <Box className='flex items-center justify-end gap-1'>
                            <IconButton size='small' title='Liên kết/cập nhật' onClick={() => openVerify(r)} disabled={saving}>
                              <i className='ri-chat-check-line' />
                            </IconButton>
                            {linked && (
                              <IconButton size='small' title='Hủy liên kết' onClick={() => unlink(r)} disabled={saving}>
                                <i className='ri-link-unlink' />
                              </IconButton>
                            )}
                          </Box>
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

      <ZaloVerifyModal
        open={verifyOpen}
        onClose={() => {
          if (saving) return
          setVerifyOpen(false)
          setSelectedRow(null)
        }}
        defaultPhone={selectedRow?.phoneNumber || ''}
        onConfirm={handleConfirmZalo}
      />

      <Dialog open={unlinkOpen} onClose={() => (saving ? null : setUnlinkOpen(false))} maxWidth='xs' fullWidth>
        <DialogTitle>Hủy liên kết Zalo</DialogTitle>
        <DialogContent dividers>
          <Typography variant='body2'>
            Học viên: <b>{selectedRow?.studentName}</b> ({selectedRow?.studentCode})
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
            Thao tác này sẽ xóa `UserIdZalo` của học viên.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnlinkOpen(false)} disabled={saving}>
            Hủy
          </Button>
          <Button variant='contained' color='error' onClick={doUnlink} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
