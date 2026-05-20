'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
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
import Typography from '@mui/material/Typography'

import cronJobLogService from '@/services/cronJobLogService'
import type { CronJobLogType } from '@/types/apps/cronJobLogTypes'
import { useNotification } from '@/contexts/notificationContext'

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('vi-VN')
}

const getStatusColor = (status?: string) => {
  const normalized = (status || '').toLowerCase()
  if (normalized === 'success') return 'success'
  if (normalized === 'failed') return 'error'
  if (normalized === 'running') return 'warning'
  return 'default'
}

export default function CronJobLogListView() {
  const { showNotification } = useNotification()

  const [rows, setRows] = useState<CronJobLogType[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [jobKey, setJobKey] = useState('')
  const [status, setStatus] = useState('')
  const [scheduledFrom, setScheduledFrom] = useState('')
  const [scheduledTo, setScheduledTo] = useState('')
  const [selectedRow, setSelectedRow] = useState<CronJobLogType | null>(null)

  const jobOptions = useMemo(
    () =>
      Array.from(new Set(rows.map(item => item.jobKey).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'vi')),
    [rows]
  )

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await cronJobLogService.getCronJobLogs({
        pageNumber: page + 1,
        pageSize: rowsPerPage,
        keyword: keyword.trim() || undefined,
        jobKey: jobKey || undefined,
        status: status || undefined,
        scheduledFrom: scheduledFrom || undefined,
        scheduledTo: scheduledTo || undefined
      })

      if (!response.success || !response.data) {
        setRows([])
        setTotalCount(0)
        showNotification(response.message || 'Không thể tải nhật ký cronjob.', 'error')
        return
      }

      setRows(response.data.items || [])
      setTotalCount(response.data.totalCount || 0)
    } catch {
      setRows([])
      setTotalCount(0)
      showNotification('Không thể tải nhật ký cronjob.', 'error')
    } finally {
      setLoading(false)
    }
  }, [jobKey, keyword, page, rowsPerPage, scheduledFrom, scheduledTo, showNotification, status])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <>
      <Card>
        <CardHeader
          title='Nhật ký cronjob'
          subheader='Theo dõi các job nền tự chạy hằng ngày, xem trạng thái thành công / thất bại và lỗi nếu có.'
        />
        <CardContent>
          <Box className='flex flex-wrap gap-4 items-center'>
            <TextField
              size='small'
              label='Tìm kiếm'
              placeholder='Job key hoặc lỗi...'
              value={keyword}
              onChange={event => {
                setKeyword(event.target.value)
                setPage(0)
              }}
              sx={{ minWidth: 240 }}
            />

            <FormControl size='small' sx={{ minWidth: 220 }}>
              <InputLabel id='cron-job-key'>Job</InputLabel>
              <Select
                labelId='cron-job-key'
                label='Job'
                value={jobKey}
                onChange={event => {
                  setJobKey(String(event.target.value))
                  setPage(0)
                }}
              >
                <MenuItem value=''>Tất cả job</MenuItem>
                {jobOptions.map(item => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size='small' sx={{ minWidth: 160 }}>
              <InputLabel id='cron-job-status'>Trạng thái</InputLabel>
              <Select
                labelId='cron-job-status'
                label='Trạng thái'
                value={status}
                onChange={event => {
                  setStatus(String(event.target.value))
                  setPage(0)
                }}
              >
                <MenuItem value=''>Tất cả</MenuItem>
                <MenuItem value='Success'>Success</MenuItem>
                <MenuItem value='Failed'>Failed</MenuItem>
                <MenuItem value='Running'>Running</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size='small'
              type='date'
              label='Từ ngày'
              value={scheduledFrom}
              onChange={event => {
                setScheduledFrom(event.target.value)
                setPage(0)
              }}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              size='small'
              type='date'
              label='Đến ngày'
              value={scheduledTo}
              onChange={event => {
                setScheduledTo(event.target.value)
                setPage(0)
              }}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Button
              variant='outlined'
              onClick={() => {
                setKeyword('')
                setJobKey('')
                setStatus('')
                setScheduledFrom('')
                setScheduledTo('')
                setPage(0)
              }}
            >
              Xóa lọc
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {loading ? (
            <Box className='flex justify-center py-10'>
              <CircularProgress />
            </Box>
          ) : rows.length === 0 ? (
            <Typography variant='body2' color='text.secondary' className='text-center py-6'>
              Không có dữ liệu.
            </Typography>
          ) : (
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Job</TableCell>
                    <TableCell>Thời điểm chạy</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell align='center'>Attempt</TableCell>
                    <TableCell align='right'>Kết quả</TableCell>
                    <TableCell>Thời gian xử lý</TableCell>
                    <TableCell align='right'>Chi tiết</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography className='font-medium'>{row.jobKey}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {row.forMonth && row.forYear ? `Kỳ ${row.forMonth}/${row.forYear}` : 'Theo ngày'}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDateTime(row.scheduledAtLocal)}</TableCell>
                      <TableCell>
                        <Chip size='small' label={row.status} color={getStatusColor(row.status) as any} variant='tonal' />
                      </TableCell>
                      <TableCell align='center'>{row.attemptCount}</TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2'>OK: {row.totalSent}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Candidate: {row.totalCandidates} / Failed: {row.totalFailed}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>Bắt đầu: {formatDateTime(row.startedAtUtc)}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Xong: {formatDateTime(row.finishedAtUtc)}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Button size='small' onClick={() => setSelectedRow(row)}>
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            component='div'
            rowsPerPageOptions={[10, 20, 50]}
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={event => {
              setRowsPerPage(Number(event.target.value))
              setPage(0)
            }}
            labelRowsPerPage='Số dòng:'
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </CardContent>
      </Card>

      <Dialog open={!!selectedRow} onClose={() => setSelectedRow(null)} maxWidth='md' fullWidth>
        <DialogTitle>Chi tiết cronjob</DialogTitle>
        <DialogContent dividers>
          <Box className='space-y-3'>
            <Typography><b>Job:</b> {selectedRow?.jobKey}</Typography>
            <Typography><b>Lịch chạy:</b> {formatDateTime(selectedRow?.scheduledAtLocal)}</Typography>
            <Typography><b>Trạng thái:</b> {selectedRow?.status}</Typography>
            <Typography><b>StartedAtUtc:</b> {formatDateTime(selectedRow?.startedAtUtc)}</Typography>
            <Typography><b>FinishedAtUtc:</b> {formatDateTime(selectedRow?.finishedAtUtc)}</Typography>
            <Typography><b>Attempt:</b> {selectedRow?.attemptCount}</Typography>
            <Typography><b>TotalCandidates:</b> {selectedRow?.totalCandidates}</Typography>
            <Typography><b>TotalSent:</b> {selectedRow?.totalSent}</Typography>
            <Typography><b>TotalSkippedAlreadySent:</b> {selectedRow?.totalSkippedAlreadySent}</Typography>
            <Typography><b>TotalFailed:</b> {selectedRow?.totalFailed}</Typography>
            <TextField
              fullWidth
              label='Lỗi'
              value={selectedRow?.errorMessage || ''}
              multiline
              minRows={4}
              InputProps={{ readOnly: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRow(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
