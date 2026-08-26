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
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

import zaloLinkService from '@/services/zaloLinkService'
import type { ZaloLinkLookupResultType, ZaloLinkOverviewType, ZaloUnlinkedStudentRowType } from '@/types/apps/zaloLinkTypes'
import useStudentViewDrawer from '@/views/apps/student/list/useStudentViewDrawer'

const getRateChip = (rate?: number | null) => {
  const safeRate = typeof rate === 'number' && Number.isFinite(rate) ? rate : 0
  const color = safeRate >= 80 ? 'success' : safeRate >= 50 ? 'warning' : 'error'

  return <Chip size='small' label={`${safeRate.toFixed(2)}%`} color={color as any} variant='tonal' />
}

export default function ZaloLinkStatsView() {
  const { openStudentDrawer, studentDrawerElement } = useStudentViewDrawer()

  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingUnlinked, setLoadingUnlinked] = useState(false)

  const [stats, setStats] = useState<ZaloLinkOverviewType | null>(null)
  const [unlinked, setUnlinked] = useState<ZaloUnlinkedStudentRowType[]>([])

  const [selectedClassId, setSelectedClassId] = useState<string>('')

  const [lookupPhone, setLookupPhone] = useState('')
  const [lookupUserId, setLookupUserId] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupResult, setLookupResult] = useState<ZaloLinkLookupResultType | null>(null)

  const classes = useMemo(() => stats?.classes ?? [], [stats])

  const loadStats = useCallback(async () => {
    setLoadingStats(true)

    try {
      const res = await zaloLinkService.getStats()

      if (res.success && res.data) {
        setStats(res.data)
      } else {
        setStats(null)
      }
    } finally {
      setLoadingStats(false)
    }
  }, [])

  const loadUnlinked = useCallback(async (classId?: string) => {
    setLoadingUnlinked(true)

    try {
      const res = await zaloLinkService.getUnlinkedStudents(classId)

      setUnlinked(res.success && res.data ? res.data : [])
    } finally {
      setLoadingUnlinked(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadUnlinked(selectedClassId || undefined)
  }, [selectedClassId, loadUnlinked])

  const handleLookup = useCallback(async () => {
    setLookupLoading(true)

    try {
      const res = await zaloLinkService.lookupStudent({
        phoneNumber: lookupPhone.trim() || undefined,
        userIdZalo: lookupUserId.trim() || undefined
      })

      setLookupResult(res.success ? (res.data as any) : null)
    } finally {
      setLookupLoading(false)
    }
  }, [lookupPhone, lookupUserId])

  const selectedClassName = useMemo(() => {
    if (!selectedClassId) return 'Tất cả lớp'
    const found = classes.find(c => c.classId === selectedClassId)


return found ? `${found.className} (${found.classCode})` : 'Lớp'
  }, [selectedClassId, classes])

  return (
    <Box className='space-y-6'>
      <Card>
        <CardHeader title='Thống kê liên kết Zalo' />
        <CardContent>
          {loadingStats ? (
            <Box className='flex justify-center py-8'>
              <CircularProgress />
            </Box>
          ) : !stats ? (
            <Typography variant='body2' color='text.secondary'>
              Không có dữ liệu.
            </Typography>
          ) : (
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box className='flex items-center gap-3'>
                  <i className='ri-group-line text-2xl' />
                  <Box>
                    <Typography variant='h5'>{stats.totalStudents}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Tổng học viên (đang học)
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box className='flex items-center gap-3'>
                  <i className='ri-chat-check-line text-2xl' style={{ color: 'var(--mui-palette-success-main)' }} />
                  <Box>
                    <Typography variant='h5'>{stats.linkedStudents}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Đã liên kết
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box className='flex items-center gap-3'>
                  <i className='ri-chat-delete-line text-2xl' style={{ color: 'var(--mui-palette-error-main)' }} />
                  <Box>
                    <Typography variant='h5'>{stats.unlinkedStudents}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Chưa liên kết
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box className='flex items-center gap-3'>
                  <i className='ri-percent-line text-2xl' />
                  <Box>
                    <Typography variant='h5'>{getRateChip(stats.linkedRate)}</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Tỉ lệ liên kết
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title='Tra cứu học viên' subheader='Nhập SĐT hoặc UserIdZalo để ra thông tin học viên' />
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                label='Số điện thoại'
                value={lookupPhone}
                onChange={e => setLookupPhone(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='ri-phone-line' />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                label='UserIdZalo'
                value={lookupUserId}
                onChange={e => setLookupUserId(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='ri-user-3-line' />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }} className='flex items-center'>
              <Button fullWidth variant='contained' onClick={handleLookup} disabled={lookupLoading}>
                {lookupLoading ? 'Đang tra...' : 'Tra cứu'}
              </Button>
            </Grid>
          </Grid>

          <Divider className='my-4' />

          {!lookupResult ? (
            <Typography variant='body2' color='text.secondary'>
              Chưa có kết quả.
            </Typography>
          ) : (
            <Paper variant='outlined' className='p-4 space-y-2'>
              <Box className='flex flex-wrap items-center gap-3'>
                <Typography
                  variant='h6'
                  color='primary'
                  sx={{ cursor: 'pointer' }}
                  onClick={() => openStudentDrawer(lookupResult.studentId)}
                >
                  {lookupResult.studentName} <span className='text-textSecondary'>({lookupResult.studentCode})</span>
                </Typography>
                {lookupResult.isSuspended && <Chip size='small' label='Tạm dừng' color='warning' variant='tonal' />}
              </Box>
              <Typography variant='body2'>SĐT: {lookupResult.phoneNumber || '-'}</Typography>
              <Typography variant='body2'>UserIdZalo: {lookupResult.userIdZalo || '-'}</Typography>

              {lookupResult.classes.length > 0 && (
                <Box className='pt-2'>
                  <Typography variant='subtitle2' className='mb-2'>
                    Lớp đang/đã học
                  </Typography>
                  <Box className='space-y-2'>
                    {lookupResult.classes.map(c => (
                      <Box key={c.classId} className='flex items-center justify-between gap-2'>
                        <Typography variant='body2'>
                          {c.classCode} - {c.branchName}
                        </Typography>
                        {c.isActiveEnrollment ? (
                          <Chip size='small' label='Đang học' color='success' variant='tonal' />
                        ) : (
                          <Chip size='small' label='Đã chuyển/nghỉ' color='secondary' variant='tonal' />
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title='Tỉ lệ theo lớp' />
        <CardContent>
          {loadingStats ? (
            <Box className='flex justify-center py-8'>
              <CircularProgress />
            </Box>
          ) : classes.length === 0 ? (
            <Typography variant='body2' color='text.secondary' className='text-center py-4'>
              Không có dữ liệu lớp.
            </Typography>
          ) : (
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size='small' sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Lớp</TableCell>
                    <TableCell align='center'>Chưa liên kết</TableCell>
                    <TableCell align='center'>Tỉ lệ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classes.map(c => (
                    <TableRow
                      key={c.classId}
                      hover
                      selected={selectedClassId === c.classId}
                      onClick={() => setSelectedClassId(c.classId)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant='body2' noWrap>
                          {c.classCode}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>{c.unlinkedStudents}</TableCell>
                      <TableCell align='center'>{getRateChip(c.linkedRate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title='Danh sách chưa liên kết' />
        <CardContent>
          <Box className='flex flex-wrap items-center gap-3 mb-4'>
            <FormControl
              size='small'
              sx={{ minWidth: { xs: '100%', sm: 260 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
            >
              <InputLabel id='zalo-link-class-filter'>Lọc theo lớp</InputLabel>
              <Select
                labelId='zalo-link-class-filter'
                label='Lọc theo lớp'
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
              >
                <MenuItem value=''>Tất cả lớp</MenuItem>
                {classes.map(c => (
                  <MenuItem key={c.classId} value={c.classId}>
                    {c.classCode}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant='body2' color='text.secondary'>
              Đang xem: {selectedClassName}
            </Typography>
          </Box>

          {loadingUnlinked ? (
            <Box className='flex justify-center py-8'>
              <CircularProgress />
            </Box>
          ) : unlinked.length === 0 ? (
            <Typography variant='body2' color='text.secondary' className='text-center py-4'>
              Không có học viên chưa liên kết.
            </Typography>
          ) : (
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size='small' sx={{ minWidth: 500 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Mã HV</TableCell>
                    <TableCell>Họ tên</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {unlinked.map(r => (
                    <TableRow key={`${r.classId}_${r.studentId}`}>
                      <TableCell>{r.studentCode}</TableCell>
                      <TableCell>
                        <Typography
                          color='primary'
                          sx={{ cursor: 'pointer' }}
                          onClick={() => openStudentDrawer(r.studentId)}
                        >
                          {r.studentName}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {studentDrawerElement}
    </Box>
  )
}
