'use client'

import { useCallback, useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { toast } from 'react-toastify'

import tableStyles from '@core/styles/table.module.css'
import znsLogService from '@/services/znsLogService'
import type { ZnsLogType } from '@/types/apps/znsLogTypes'
import { formatDateTimeVN } from '@/utils/dateTime'
import ReceiptModal from '@/views/apps/invoice/list/ReceiptModal'

const ZnsLogListView = () => {
  const [rows, setRows] = useState<ZnsLogType[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'success' | 'failed'>('')
  const [notificationTypeFilter, setNotificationTypeFilter] = useState('')
  const [sentFrom, setSentFrom] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [selectedRow, setSelectedRow] = useState<ZnsLogType | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [selectedReceiptNumber, setSelectedReceiptNumber] = useState<string | null>(null)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)

    const result = await znsLogService.getZnsLogs({
      pageNumber: page + 1,
      pageSize,
      keyword: keyword.trim() || undefined,
      isSuccess: statusFilter === '' ? undefined : statusFilter === 'success',
      notificationType: notificationTypeFilter.trim() || undefined,
      sentFrom: sentFrom || undefined,
      sentTo: sentTo ? `${sentTo}T23:59:59` : undefined
    })

    if (result.success && result.data) {
      setRows(result.data.items || [])
      setTotalCount(result.data.totalCount || 0)
    } else {
      setRows([])
      setTotalCount(0)
    }

    setLoading(false)
  }, [keyword, notificationTypeFilter, page, pageSize, sentFrom, sentTo, statusFilter])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadData()
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [loadData])

  const retryRow = async (row: ZnsLogType) => {
    try {
      setRetryingId(row.id)
      const result = await znsLogService.retryZnsLog(row.id)

      if (result.success) {
        toast.success(result.message || 'Đã gửi lại ZNS.')
        await loadData()
      } else {
        toast.error(result.message || 'Không thể gửi lại ZNS.')
      }
    } finally {
      setRetryingId(null)
    }
  }

  const openReceiptPreview = (receiptNumber?: string | null) => {
    if (!receiptNumber) return

    setSelectedReceiptNumber(receiptNumber)
    setReceiptModalOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader
          title='Nhật ký gửi ZNS'
          subheader='Theo dõi trạng thái gửi thông báo Zalo ZNS từ các giao dịch thanh toán'
        />

        <Box px={5} pb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size='small'
                label='Tìm kiếm'
                value={keyword}
                onChange={event => {
                  setKeyword(event.target.value)
                  setPage(0)
                }}
                placeholder='Học viên, SĐT, biên lai, userIdZalo...'
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size='small'
                select
                label='Trạng thái'
                value={statusFilter}
                onChange={event => {
                  setStatusFilter(event.target.value as '' | 'success' | 'failed')
                  setPage(0)
                }}
              >
                <MenuItem value=''>Tất cả</MenuItem>
                <MenuItem value='success'>Thành công</MenuItem>
                <MenuItem value='failed'>Thất bại</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size='small'
                label='Loại thông báo'
                value={notificationTypeFilter}
                onChange={event => {
                  setNotificationTypeFilter(event.target.value)
                  setPage(0)
                }}
                placeholder='TuitionPaidConfirmation'
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size='small'
                type='date'
                label='Từ ngày'
                value={sentFrom}
                onChange={event => {
                  setSentFrom(event.target.value)
                  setPage(0)
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size='small'
                type='date'
                label='Đến ngày'
                value={sentTo}
                onChange={event => {
                  setSentTo(event.target.value)
                  setPage(0)
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 2 }}>
            Mặc định sắp xếp theo thời gian gửi mới nhất.
          </Typography>
        </Box>

        <div className='overflow-x-auto'>
          {loading ? (
            <Box className='flex justify-center p-8'>
              <CircularProgress />
            </Box>
          ) : (
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Học viên</th>
                  <th>SĐT nhận</th>
                  <th>Loại thông báo</th>
                  <th>Biên lai</th>
                  <th>Kết quả</th>
                  <th>Mã lỗi</th>
                  <th>Response</th>
                  <th>Thời gian gửi</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className='text-center p-6'>
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  rows.map(row => (
                    <tr key={row.id} onClick={() => setSelectedRow(row)} style={{ cursor: 'pointer' }}>
                      <td>
                        <Typography variant='body2' className='font-medium'>
                          {row.studentName || '-'}
                        </Typography>
                      </td>
                      <td>{row.studentPhoneNumber || '-'}</td>
                      <td>{row.notificationType}</td>
                      <td onClick={event => event.stopPropagation()}>
                        {row.receiptNumber ? (
                          <Button
                            size='small'
                            variant='text'
                            sx={{ minWidth: 0, p: 0, textTransform: 'none' }}
                            onClick={() => openReceiptPreview(row.receiptNumber)}
                          >
                            {row.receiptNumber}
                          </Button>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <Chip
                          size='small'
                          variant='tonal'
                          color={row.errorCode === 0 ? 'success' : 'error'}
                          label={row.errorCode === 0 ? 'Đã gửi thành công' : 'Gửi lỗi'}
                        />
                        <Typography variant='caption' display='block' color='text.secondary'>
                          isSuccess: {row.isSuccess ? 'Có' : 'Không'}
                        </Typography>
                      </td>
                      <td>{row.errorCode}</td>
                      <td>
                        <Typography
                          variant='body2'
                          color={row.errorCode === 0 ? 'text.secondary' : 'error'}
                          className='max-w-[260px] truncate'
                          title={row.errorCode === 0 ? row.errorMessage || '' : row.responseJson || row.errorMessage || ''}
                        >
                          {row.errorCode === 0 ? row.errorMessage || '-' : row.responseJson || row.errorMessage || '-'}
                        </Typography>
                      </td>
                      <td>{formatDateTimeVN(row.sentAtUtc)}</td>
                      <td onClick={event => event.stopPropagation()}>
                        <Button
                          size='small'
                          variant='contained'
                          color='warning'
                          disabled={!row.canRetry || retryingId === row.id}
                          onClick={() => retryRow(row)}
                        >
                          {retryingId === row.id ? 'Đang gửi...' : 'Gửi lại'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <TablePagination
          component='div'
          count={totalCount}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={event => {
            setPageSize(Number(event.target.value))
            setPage(0)
          }}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Card>

      <Dialog open={Boolean(selectedRow)} onClose={() => setSelectedRow(null)} fullWidth maxWidth='md'>
        <DialogTitle>Chi tiết log gửi ZNS</DialogTitle>
        <DialogContent>
          {!selectedRow ? null : (
            <Box className='flex flex-col gap-4 py-2'>
              <Alert severity={selectedRow.errorCode === 0 ? 'success' : 'error'}>
                {selectedRow.errorCode === 0
                  ? 'Gửi ZNS thành công.'
                  : `Gửi ZNS thất bại. Mã lỗi: ${selectedRow.errorCode}`}
              </Alert>

              <Box>
                <Typography variant='subtitle2'>Học viên</Typography>
                <Typography variant='body2'>{selectedRow.studentName || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant='subtitle2'>Số điện thoại nhận</Typography>
                <Typography variant='body2'>{selectedRow.studentPhoneNumber || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant='subtitle2'>Endpoint URL</Typography>
                <Typography variant='body2' sx={{ wordBreak: 'break-all' }}>
                  {selectedRow.endpointUrl || '-'}
                </Typography>
              </Box>

              <Box>
                <Typography variant='subtitle2'>UserId Zalo</Typography>
                <Typography variant='body2' sx={{ wordBreak: 'break-all' }}>
                  {selectedRow.userIdZalo || '-'}
                </Typography>
              </Box>

              <Box>
                <Typography variant='subtitle2'>Template Data</Typography>
                <Box
                  component='pre'
                  sx={{
                    m: 0,
                    p: 2,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: 240,
                    overflow: 'auto'
                  }}
                >
                  {selectedRow.templateDataJson || '-'}
                </Box>
              </Box>

              <Box>
                <Typography variant='subtitle2'>Response JSON</Typography>
                <Box
                  component='pre'
                  sx={{
                    m: 0,
                    p: 2,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: 240,
                    overflow: 'auto'
                  }}
                >
                  {selectedRow.responseJson || '-'}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <ReceiptModal
        open={receiptModalOpen}
        receiptNumber={selectedReceiptNumber}
        onClose={() => {
          setReceiptModalOpen(false)
          setSelectedReceiptNumber(null)
        }}
      />
    </>
  )
}

export default ZnsLogListView
