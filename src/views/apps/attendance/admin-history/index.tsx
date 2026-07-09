'use client'

import { useEffect, useState, useCallback } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
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
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import attendanceService from '@/services/attendanceService'
import { formatDateTimeVN } from '@/utils/dateTime'
import { useAuth } from '@/contexts/authContext'
import { hasCoachRole } from '@/utils/roleUtils'

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

interface AttendanceRecord {
  id: string
  checkedInAt: string
  latitude: number
  longitude: number
  attendanceType: number
  branchId: string | null
  branchName: string | null
  deviceInfo: string | null
}

interface UserDetail {
  userId: string
  userName: string
  email: string | null
  records: AttendanceRecord[]
}

const AttendanceType = {
  CheckIn: 0,
  CheckOut: 1
}

const AdminAttendanceHistoryView = () => {
  const { auth } = useAuth()
  const isCoach = hasCoachRole(auth?.roles)

  const [activeTab, setActiveTab] = useState(0)
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth)
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [historyList, setHistoryList] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMonth, setDialogMonth] = useState<number>(currentMonth)
  const [dialogYear, setDialogYear] = useState<number>(currentYear)
  const [sendEmail, setSendEmail] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<any>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailData, setDetailData] = useState<UserDetail | null>(null)

  const [reportHistory, setReportHistory] = useState<any[]>([])
  const [loadingReports, setLoadingReports] = useState(false)

  const loadHistoryList = useCallback(async () => {
    setLoading(true)
    try {
      const response = await attendanceService.getAttendanceHistoryList(selectedMonth, selectedYear)
      if (response.success && response.data) {
        setHistoryList(response.data)
      } else {
        setHistoryList([])
      }
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    loadHistoryList()
  }, [loadHistoryList])

  const loadReportHistory = useCallback(async () => {
    setLoadingReports(true)
    try {
      const response = await attendanceService.getReportHistory(selectedMonth, selectedYear)
      if (response.success && response.data) {
        setReportHistory(response.data)
      } else {
        setReportHistory([])
      }
    } finally {
      setLoadingReports(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    if (activeTab === 1) {
      loadReportHistory()
    }
  }, [activeTab, loadReportHistory])

  const handleDownloadReport = async (reportId: string, fileName: string) => {
    const blob = await attendanceService.downloadReport(reportId)
    if (blob) {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    if (checked) {
      setSelectedUserIds(new Set(historyList.map(item => item.userId)))
    } else {
      setSelectedUserIds(new Set())
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSet = new Set(selectedUserIds)
    if (checked) {
      newSet.add(userId)
    } else {
      newSet.delete(userId)
    }
    setSelectedUserIds(newSet)
    setSelectAll(newSet.size === historyList.length)
  }

  const openCreateDialog = () => {
    setDialogMonth(selectedMonth)
    setDialogYear(selectedYear)
    setSendEmail(true)
    setGenerateResult(null)
    // Pre-select all HLV with data
    setSelectedUserIds(new Set(historyList.map(item => item.userId)))
    setDialogOpen(true)
  }

  const closeCreateDialog = () => {
    setDialogOpen(false)
    setGenerateResult(null)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setGenerateResult(null)

    try {
      const userIds = selectedUserIds.size > 0
        ? Array.from(selectedUserIds)
        : undefined

      const response = await attendanceService.generateAttendanceReport({
        userIds,
        month: dialogMonth,
        year: dialogYear,
        sendEmail
      })

      setGenerateResult(response)
    } finally {
      setGenerating(false)
    }
  }

  const openDetail = async (userId: string) => {
    setDetailOpen(true)
    setDetailLoading(true)
    setDetailData(null)

    try {
      const response = await attendanceService.getUserAttendanceDetail(userId, selectedMonth, selectedYear)
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

  const getLatestBranchName = (item: HistoryItem) => {
    if (!detailData || detailData.userId !== item.userId) return '-'
    const checkIns = detailData.records.filter(r => r.attendanceType === AttendanceType.CheckIn)
    return checkIns.length > 0 ? checkIns[checkIns.length - 1].branchName || '-' : '-'
  }

  const isCurrentMonth = dialogMonth === currentMonth && dialogYear === currentYear

  const totalCheckIns = historyList.reduce((sum, item) => sum + item.totalCheckIns, 0)
  const totalCheckOuts = historyList.reduce((sum, item) => sum + item.totalCheckOuts, 0)
  const totalSessions = historyList.reduce((sum, item) => sum + item.totalSessions, 0)

  return (
    <>
      <Box className='flex flex-col gap-6'>
        <Card>
          <CardHeader
            title={isCoach ? 'Lịch sử chấm công của tôi' : 'Quản lý lịch sử chấm công'}
            subheader={isCoach ? 'Xem lịch sử chấm công cá nhân.' : 'Xem và tạo báo cáo chấm công cho huấn luyện viên.'}
            action={
              !isCoach && (
                <Button
                  variant='contained'
                  onClick={openCreateDialog}
                >
                  Tạo bảng lương
                </Button>
              )
            }
          />
          <CardContent>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 4 }}>
              <Tab label='Dữ liệu chấm công' />
              <Tab label='Lịch sử bảng lương' />
            </Tabs>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Tháng</InputLabel>
                  <Select
                    value={selectedMonth}
                    label='Tháng'
                    onChange={e => setSelectedMonth(Number(e.target.value))}
                  >
                    {MONTHS.map(m => (
                      <MenuItem key={m} value={m}>Tháng {m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Năm</InputLabel>
                  <Select
                    value={selectedYear}
                    label='Năm'
                    onChange={e => setSelectedYear(Number(e.target.value))}
                  >
                    {YEARS.map(y => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>
                      {isCoach ? 'Tổng lượt chấm công vào' : 'Tổng huấn luyện viên'}
                    </Typography>
                    <Typography variant='h4'>{isCoach ? totalCheckIns : historyList.length}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>
                      Tổng lượt chấm công vào
                    </Typography>
                    <Typography variant='h4' color='success.main'>{totalCheckIns}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card variant='outlined'>
                  <CardContent>
                    <Typography variant='body2' color='text.secondary'>
                      Tổng lượt chấm công ra
                    </Typography>
                    <Typography variant='h4' color='warning.main'>{totalCheckOuts}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {loading ? (
              <Box className='flex items-center justify-center py-10'>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHead>
                    <TableRow>
                      {!isCoach && (
                        <TableCell padding='checkbox'>
                          <Checkbox
                            checked={selectAll}
                            onChange={e => handleSelectAll(e.target.checked)}
                          />
                        </TableCell>
                      )}
                      <TableCell>{isCoach ? 'Thông tin chấm công' : 'Huấn luyện viên'}</TableCell>
                      <TableCell align='center'>Buổi</TableCell>
                      <TableCell>Chi tiết vào/ra</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyList.map(item => (
                      <TableRow key={item.userId} hover sx={{ cursor: 'pointer' }} onClick={() => openDetail(item.userId)}>
                        {!isCoach && (
                          <TableCell padding='checkbox' onClick={e => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedUserIds.has(item.userId)}
                              onChange={e => handleSelectUser(item.userId, e.target.checked)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <Typography fontWeight={600}>{item.userName}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {item.totalCheckIns} lượt vào / {item.totalCheckOuts} lượt ra
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Typography fontWeight={600}>{item.totalSessions}</Typography>
                        </TableCell>
                        <TableCell>
                          {item.checkInOutPairs && item.checkInOutPairs.length > 0 ? (
                            <Stack spacing={0.5}>
                              {item.checkInOutPairs.map((pair: any, idx: number) => (
                                <Stack key={idx} direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
                                  <Chip
                                    label={idx + 1}
                                    size='small'
                                    color='primary'
                                    variant='tonal'
                                    sx={{ minWidth: 24, height: 20 }}
                                  />
                                  <Box>
                                    <Typography variant='body2'>
                                      {pair.checkInAt ? formatDateTimeVN(pair.checkInAt) : '-'}
                                      {pair.checkInBranchName && (
                                        <Typography component='span' variant='caption' color='text.secondary'> ({pair.checkInBranchName})</Typography>
                                      )}
                                    </Typography>
                                    <Typography variant='body2' color='text.secondary'>
                                      → {pair.checkOutAt ? formatDateTimeVN(pair.checkOutAt) : <span style={{ color: '#999' }}>Chưa ra</span>}
                                      {pair.checkOutBranchName && (
                                        <Typography component='span' variant='caption' color='text.secondary'> ({pair.checkOutBranchName})</Typography>
                                      )}
                                    </Typography>
                                  </Box>
                                </Stack>
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant='body2' color='text.secondary'>Không có dữ liệu</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {historyList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align='center'>
                          <Typography color='text.secondary'>
                            Không có dữ liệu chấm công trong tháng này.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </Box>

      {activeTab === 0 && (
        <Box className='flex flex-col gap-6'>
          <Card>
            <CardHeader title='Lịch sử bảng lương đã tạo' />
            <CardContent>
              {loadingReports ? (
                <Box className='flex items-center justify-center py-10'>
                  <CircularProgress size={30} />
                </Box>
              ) : reportHistory.length === 0 ? (
                <Alert severity='info'>Chưa có bảng lương nào được tạo trong tháng này.</Alert>
              ) : (
                <div className='overflow-x-auto'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tháng/Năm</TableCell>
                        <TableCell>Tên file</TableCell>
                        <TableCell align='center'>Số HLV</TableCell>
                        <TableCell align='center'>Đã gửi email</TableCell>
                        <TableCell>Ngày tạo</TableCell>
                        <TableCell align='center'>Tải về</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportHistory.map((report: any) => (
                        <TableRow key={report.id} hover>
                          <TableCell>
                            <Typography fontWeight={500}>Tháng {report.month}/{report.year}</Typography>
                          </TableCell>
                          <TableCell>{report.fileName}</TableCell>
                          <TableCell align='center'>{report.totalInstructors}</TableCell>
                          <TableCell align='center'>{report.emailsSent}</TableCell>
                          <TableCell>{formatDateTimeVN(report.createdAt)}</TableCell>
                          <TableCell align='center'>
                            <Button
                              size='small'
                              variant='outlined'
                              startIcon={<i className='ri-download-line' />}
                              onClick={() => handleDownloadReport(report.id, report.fileName)}
                            >
                              Tải về
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={closeCreateDialog} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Stack direction='row' alignItems='center' spacing={1}>
            <Typography variant='h6'>Tạo bảng lương</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Tháng</InputLabel>
                  <Select
                    value={dialogMonth}
                    label='Tháng'
                    onChange={e => setDialogMonth(Number(e.target.value))}
                  >
                    {MONTHS.map(m => (
                      <MenuItem key={m} value={m}>Tháng {m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Năm</InputLabel>
                  <Select
                    value={dialogYear}
                    label='Năm'
                    onChange={e => setDialogYear(Number(e.target.value))}
                  >
                    {YEARS.map(y => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {isCurrentMonth && (
              <Alert severity='warning'>
                Bạn đang chọn tháng hiện tại. Dữ liệu chấm công có thể chưa đầy đủ do tháng chưa kết thúc.
              </Alert>
            )}

            <Divider />

            <Typography variant='subtitle2' fontWeight={600}>
              Chọn huấn luyện viên ({historyList.length} có dữ liệu)
            </Typography>

            {historyList.length > 0 && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedUserIds.size === historyList.length}
                    indeterminate={selectedUserIds.size > 0 && selectedUserIds.size < historyList.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                  />
                }
                label='Chọn tất cả'
              />
            )}

            <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              {historyList.length === 0 ? (
                <Alert severity='info' sx={{ m: 1 }}>
                  Không có huấn luyện viên nào có dữ liệu chấm công trong tháng này.
                </Alert>
              ) : (
                <Stack spacing={0}>
                  {historyList.map(item => (
                    <FormControlLabel
                      key={item.userId}
                      control={
                        <Checkbox
                          checked={selectedUserIds.has(item.userId)}
                          onChange={e => handleSelectUser(item.userId, e.target.checked)}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant='body2' fontWeight={500}>{item.userName}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {item.totalCheckIns} lượt vào / {item.totalCheckOuts} lượt ra
                          </Typography>
                        </Box>
                      }
                      sx={{ mx: 0, py: 0.5, borderBottom: 1, borderColor: 'divider', width: '100%' }}
                    />
                  ))}
                </Stack>
              )}
            </Box>

            <Divider />

            <FormControlLabel
              control={
                <Checkbox
                  checked={sendEmail}
                  onChange={e => setSendEmail(e.target.checked)}
                />
              }
              label='Gửi email báo cáo cho huấn luyện viên được chọn'
            />

            {selectedUserIds.size > 0 && (
              <Alert severity='info'>
                Đã chọn {selectedUserIds.size} huấn luyện viên. Báo cáo sẽ được tạo cho các huấn luyện viên này.
              </Alert>
            )}

            {selectedUserIds.size === 0 && (
              <Alert severity='info'>
                Không chọn huấn luyện viên nào - báo cáo sẽ được tạo cho tất cả huấn luyện viên.
              </Alert>
            )}

            {generateResult && (
              <Alert severity={generateResult.success ? 'success' : 'error'}>
                {generateResult.message}
                {generateResult.data?.items && (
                  <Box sx={{ mt: 1 }}>
                    {generateResult.data.items.map((item: any) => (
                      <Typography key={item.userId} variant='body2'>
                        {item.userName}: {item.emailSent ? 'Đã gửi email' : 'Không gửi email'}
                        {item.emailError && ` (${item.emailError})`}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreateDialog} disabled={generating}>
            Đóng
          </Button>
          <Button
            variant='contained'
            onClick={handleGenerate}
            disabled={generating}
            startIcon={generating ? <CircularProgress size={16} /> : undefined}
          >
            {generating ? 'Đang tạo...' : 'Tạo bảng lương'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOpen} onClose={closeDetail} maxWidth='md' fullWidth>
        <DialogTitle>
          <Stack direction='row' alignItems='center' spacing={1}>
            <Typography variant='h6'>
              Chi tiết chấm công - {detailData?.userName || ''}
            </Typography>
          </Stack>
          <Typography variant='body2' color='text.secondary'>
            Tháng {selectedMonth}/{selectedYear}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box className='flex items-center justify-center py-10'>
              <CircularProgress size={30} />
            </Box>
          ) : detailData ? (
            <Stack spacing={3}>
              <Divider />

              <Typography variant='subtitle1' fontWeight={600}>
                Lịch sử chấm công ({detailData.records.length} lượt)
              </Typography>

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

export default AdminAttendanceHistoryView
