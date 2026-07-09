'use client'

import { useEffect, useState, useCallback } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

import attendanceService from '@/services/attendanceService'
import { useAuth } from '@/contexts/authContext'
import { formatDateTimeVN } from '@/utils/dateTime'

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i)

interface HistoryItem {
  userId: string
  userName: string
  email?: string
  month: number
  year: number
  totalCheckIns: number
  totalCheckOuts: number
  totalSessions: number
  lastCheckInAt?: string
  hasReport: boolean
  checkInOutPairs?: Array<{
    checkInAt: string | null
    checkOutAt: string | null
    checkInBranchId: string | null
    checkInBranchName: string | null
    checkOutBranchId: string | null
    checkOutBranchName: string | null
  }>
}

interface UserDetail {
  userId: string
  userName: string
  email: string | null
  records: Array<{
    id: string
    checkedInAt: string
    latitude: number
    longitude: number
    attendanceType: string
    branchName?: string
  }>
}

const AttendanceType = {
  CheckIn: 'CheckIn',
  CheckOut: 'CheckOut',
  MakeupCheckIn: 'MakeupCheckIn',
  MakeupCheckOut: 'MakeupCheckOut'
}

const InstructorHistoryView = () => {
  const { auth } = useAuth()
  const currentUserId = auth?.user?.id

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth)
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [historyItem, setHistoryItem] = useState<HistoryItem | null>(null)
  const [loading, setLoading] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailData, setDetailData] = useState<UserDetail | null>(null)

  const loadHistory = useCallback(async () => {
    if (!currentUserId) return

    setLoading(true)
    try {
      const response = await attendanceService.getMyAttendanceHistory(selectedMonth, selectedYear)
      if (response.success && response.data) {
        const items = response.data as HistoryItem[]
        const myItem = items.find(i => i.userId === currentUserId) || null
        setHistoryItem(myItem)
      } else {
        setHistoryItem(null)
      }
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear, currentUserId])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const openDetail = async () => {
    if (!currentUserId) return

    setDetailOpen(true)
    setDetailLoading(true)
    setDetailData(null)

    try {
      const response = await attendanceService.getUserAttendanceDetail(currentUserId, selectedMonth, selectedYear)
      if (response.success && response.data) {
        setDetailData(response.data)
      }
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setDetailData(null)
  }

  return (
    <>
      <Box className='flex flex-col gap-6'>
        <Card>
          <CardHeader
            title='Lịch sử chấm công của tôi'
            subheader='Xem lịch sử chấm công cá nhân theo tháng.'
          />
          <CardContent>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Tháng</InputLabel>
                  <Select
                    label='Tháng'
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(Number(e.target.value))}
                  >
                    {MONTHS.map(m => (
                      <MenuItem key={m} value={m}>Tháng {m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel>Năm</InputLabel>
                  <Select
                    label='Năm'
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                  >
                    {YEARS.map(y => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {loading ? (
              <Box className='flex justify-center py-12'>
                <CircularProgress />
              </Box>
            ) : !historyItem ? (
              <Alert severity='info'>Không có dữ liệu chấm công trong tháng này.</Alert>
            ) : (
              <>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Card variant='outlined'>
                      <CardContent>
                        <Typography variant='body2' color='text.secondary'>Tổng lượt vào</Typography>
                        <Typography variant='h4' color='primary.main'>{historyItem.totalCheckIns}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Card variant='outlined'>
                      <CardContent>
                        <Typography variant='body2' color='text.secondary'>Tổng lượt ra</Typography>
                        <Typography variant='h4' color='secondary.main'>{historyItem.totalCheckOuts}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Card variant='outlined'>
                      <CardContent>
                        <Typography variant='body2' color='text.secondary'>Buổi làm việc</Typography>
                        <Typography variant='h4' color='success.main'>{historyItem.totalSessions}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Card variant='outlined'>
                  <CardContent>
                    <Box className='flex justify-between items-center mb-4'>
                      <Typography variant='h6'>Chi tiết vào/ra</Typography>
                      <Button variant='outlined' size='small' onClick={openDetail}>
                        Xem chi tiết
                      </Button>
                    </Box>
                    {historyItem.checkInOutPairs && historyItem.checkInOutPairs.length > 0 ? (
                      <div className='overflow-x-auto'>
                        <Table size='small'>
                          <TableHead>
                            <TableRow>
                              <TableCell align='center'>#</TableCell>
                              <TableCell>Vào</TableCell>
                              <TableCell>Cơ sở vào</TableCell>
                              <TableCell>Ra</TableCell>
                              <TableCell>Cơ sở ra</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {historyItem.checkInOutPairs.map((pair, idx) => (
                              <TableRow key={idx}>
                                <TableCell align='center'>
                                  <Chip label={idx + 1} size='small' color='primary' variant='tonal' />
                                </TableCell>
                                <TableCell>
                                  {pair.checkInAt ? formatDateTimeVN(pair.checkInAt) : '-'}
                                </TableCell>
                                <TableCell>
                                  <Typography variant='body2' color='text.secondary'>
                                    {pair.checkInBranchName || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {pair.checkOutAt ? (
                                    formatDateTimeVN(pair.checkOutAt)
                                  ) : (
                                    <Typography variant='body2' color='error'>Chưa ra</Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Typography variant='body2' color='text.secondary'>
                                    {pair.checkOutBranchName || '-'}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <Typography color='text.secondary'>Không có dữ liệu.</Typography>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </CardContent>
        </Card>
      </Box>

      <Dialog open={detailOpen} onClose={closeDetail} maxWidth='md' fullWidth>
        <DialogTitle>
          <Typography variant='h6'>Chi tiết chấm công - {detailData?.userName || ''}</Typography>
          <Typography variant='body2' color='text.secondary'>
            Tháng {selectedMonth}/{selectedYear}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box className='flex justify-center py-10'>
              <CircularProgress size={30} />
            </Box>
          ) : detailData ? (
            <Stack spacing={3}>
              {detailData.records.length === 0 ? (
                <Alert severity='info'>Không có dữ liệu chấm công trong tháng này.</Alert>
              ) : (
                <div className='overflow-x-auto'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>STT</TableCell>
                        <TableCell>Loại</TableCell>
                        <TableCell>Ngày</TableCell>
                        <TableCell>Thời gian</TableCell>
                        <TableCell>Chi nhánh</TableCell>
                        <TableCell>Vĩ độ</TableCell>
                        <TableCell>Kinh độ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailData.records.map((record, index) => (
                        <TableRow key={record.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Chip
                              label={record.attendanceType === AttendanceType.CheckIn ? 'Vào' : 'Ra'}
                              color={record.attendanceType === AttendanceType.CheckIn ? 'primary' : 'secondary'}
                              size='small'
                              variant='tonal'
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(record.checkedInAt).toLocaleDateString('vi-VN')}
                          </TableCell>
                          <TableCell>
                            {new Date(record.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2'>{(record as any).branchName || '-'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={record.latitude.toFixed(6)}>
                              <Typography variant='body2'>{record.latitude.toFixed(4)}</Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={record.longitude.toFixed(6)}>
                              <Typography variant='body2'>{record.longitude.toFixed(4)}</Typography>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Stack>
          ) : (
            <Alert severity='error'>Không thể tải dữ liệu.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetail}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default InstructorHistoryView
