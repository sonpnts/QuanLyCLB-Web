'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'

import webPushService from '@/services/webPushService'
import type { WebPushNotificationItem, WebPushNotificationDetail } from '@/services/webPushService'

interface Props {
  refreshTrigger: number
}

export const WebPushHistoryTab: React.FC<Props> = ({ refreshTrigger }) => {
  const [items, setItems] = useState<WebPushNotificationItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [loading, setLoading] = useState(false)

  // Filters
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('All')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Detail Modal
  const [detailItem, setDetailItem] = useState<WebPushNotificationDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  // Cancel action
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await webPushService.getHistory({
        keyword: keyword.trim() || undefined,
        status: status !== 'All' ? status : undefined,
        fromDate: fromDate ? new Date(fromDate).toISOString() : undefined,
        toDate: toDate ? new Date(toDate).toISOString() : undefined,
        pageIndex: page + 1,
        pageSize: rowsPerPage
      })

      if (res.data) {
        setItems(res.data.items || [])
        setTotalCount(res.data.totalCount || 0)
      }
    } catch (e) {
      console.error('Failed to load history', e)
    } finally {
      setLoading(false)
    }
  }, [keyword, status, fromDate, toDate, page, rowsPerPage])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory, refreshTrigger])

  const handleOpenDetail = async (id: string) => {
    setLoadingDetail(true)
    setDetailOpen(true)
    try {
      const res = await webPushService.getDetail(id)
      if (res.data) {
        setDetailItem(res.data)
      }
    } catch (e) {
      console.error('Failed to load notification detail', e)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleCancelScheduled = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch gửi thông báo này?')) return

    setCancellingId(id)
    try {
      const res = await webPushService.cancelScheduled(id)
      if (res.success) {
        setActionFeedback('Đã hủy lịch gửi thông báo thành công.')
        fetchHistory()
      } else {
        alert(res.message || 'Không thể hủy lịch gửi.')
      }
    } catch (err: any) {
      alert(err?.message || 'Có lỗi xảy ra khi hủy lịch gửi.')
    } finally {
      setCancellingId(null)
    }
  }

  const getStatusChip = (st: string) => {
    switch (st) {
      case 'Sent':
        return <Chip size='small' label='Đã gửi' color='success' variant='tonal' />
      case 'Scheduled':
        return <Chip size='small' label='Đang lên lịch' color='info' variant='tonal' />
      case 'Sending':
        return <Chip size='small' label='Đang gửi...' color='warning' variant='tonal' />
      case 'Cancelled':
        return <Chip size='small' label='Đã hủy' color='secondary' variant='tonal' />
      case 'Failed':
        return <Chip size='small' label='Thất bại' color='error' variant='tonal' />
      default:
        return <Chip size='small' label={st} variant='tonal' />
    }
  }

  return (
    <Card>
      <CardHeader
        title='Lịch sử và lịch trình thông báo'
        subheader='Theo dõi trạng thái phân phát, tỷ lệ nhận thông báo và chi tiết lỗi'
      />
      <CardContent>
        {actionFeedback && (
          <Alert severity='success' onClose={() => setActionFeedback(null)} sx={{ mb: 2 }}>
            {actionFeedback}
          </Alert>
        )}

        {/* Filters */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <TextField
            size='small'
            placeholder='Tìm kiếm tiêu đề, nội dung...'
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            sx={{ flex: '1 1 200px' }}
          />

          <FormControl size='small' sx={{ minWidth: 160 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select value={status} label='Trạng thái' onChange={e => setStatus(e.target.value)}>
              <MenuItem value='All'>Tất cả trạng thái</MenuItem>
              <MenuItem value='Sent'>Đã gửi (Sent)</MenuItem>
              <MenuItem value='Scheduled'>Đang lên lịch (Scheduled)</MenuItem>
              <MenuItem value='Sending'>Đang gửi (Sending)</MenuItem>
              <MenuItem value='Failed'>Thất bại (Failed)</MenuItem>
              <MenuItem value='Cancelled'>Đã hủy (Cancelled)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size='small'
            type='date'
            label='Từ ngày'
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 150 }}
          />

          <TextField
            size='small'
            type='date'
            label='Đến ngày'
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 150 }}
          />

          <Button
            variant='outlined'
            size='small'
            startIcon={<i className='ri-refresh-line' />}
            onClick={() => {
              setPage(0)
              fetchHistory()
            }}
          >
            Làm mới
          </Button>
        </Box>

        {/* Table */}
        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table size='small'>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Thông báo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Đối tượng</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Thời gian gửi</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Kết quả gửi</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5 }}>
                    <CircularProgress size={28} />
                    <Typography variant='caption' sx={{ display: 'block', mt: 1 }}>
                      Đang tải lịch sử...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                    Chưa có thông báo nào được ghi nhận.
                  </TableCell>
                </TableRow>
              ) : (
                items.map(item => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant='subtitle2' fontWeight={600} noWrap>
                        {item.title}
                      </Typography>
                      <Typography variant='caption' color='text.secondary' noWrap sx={{ display: 'block' }}>
                        {item.body}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' noWrap>
                        {item.targetDescription || item.targetType}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Tạo bởi: {item.createdByUserName || 'Hệ thống'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {item.scheduledAt ? (
                        <Box>
                          <Typography variant='body2' color='info.main' fontWeight={600}>
                            {new Date(item.scheduledAt).toLocaleString('vi-VN')}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            (Hẹn giờ gửi)
                          </Typography>
                        </Box>
                      ) : item.sentAt ? (
                        <Typography variant='body2'>
                          {new Date(item.sentAt).toLocaleString('vi-VN')}
                        </Typography>
                      ) : (
                        <Typography variant='caption' color='text.secondary'>
                          {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{getStatusChip(item.status)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant='body2' fontWeight={600} color='success.main'>
                          ✓ {item.successCount}
                        </Typography>
                        {item.failureCount > 0 && (
                          <Typography variant='body2' fontWeight={600} color='error.main'>
                            ✗ {item.failureCount}
                          </Typography>
                        )}
                        <Typography variant='caption' color='text.secondary'>
                          / {item.totalSubscribers}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title='Xem chi tiết & Logs'>
                          <IconButton size='small' color='primary' onClick={() => handleOpenDetail(item.id)}>
                            <i className='ri-eye-line' />
                          </IconButton>
                        </Tooltip>

                        {item.status === 'Scheduled' && (
                          <Tooltip title='Hủy lịch gửi'>
                            <IconButton
                              size='small'
                              color='error'
                              disabled={cancellingId === item.id}
                              onClick={() => handleCancelScheduled(item.id)}
                            >
                              {cancellingId === item.id ? (
                                <CircularProgress size={16} color='inherit' />
                              ) : (
                                <i className='ri-close-circle-line' />
                              )}
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component='div'
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          labelRowsPerPage='Dòng mỗi trang:'
        />
      </CardContent>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant='h6' fontWeight={700}>
            Chi tiết thông báo & Nhật ký gửi
          </Typography>
          <IconButton size='small' onClick={() => setDetailOpen(false)}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {loadingDetail ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <CircularProgress size={32} />
            </Box>
          ) : detailItem ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant='h6' fontWeight={700}>
                  {detailItem.title}
                </Typography>
                <Typography variant='body2' sx={{ mt: 0.5 }}>
                  {detailItem.body}
                </Typography>
                {detailItem.url && (
                  <Typography variant='caption' color='primary.main' sx={{ display: 'block', mt: 1 }}>
                    Liên kết: {detailItem.url}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
                <Box>
                  <Typography variant='caption' color='text.secondary'>Trạng thái:</Typography>
                  <Box sx={{ mt: 0.5 }}>{getStatusChip(detailItem.status)}</Box>
                </Box>
                <Box>
                  <Typography variant='caption' color='text.secondary'>Đối tượng:</Typography>
                  <Typography variant='body2' fontWeight={600}>{detailItem.targetDescription || detailItem.targetType}</Typography>
                </Box>
                <Box>
                  <Typography variant='caption' color='text.secondary'>Thời gian tạo:</Typography>
                  <Typography variant='body2'>{new Date(detailItem.createdAt).toLocaleString('vi-VN')}</Typography>
                </Box>
                <Box>
                  <Typography variant='caption' color='text.secondary'>Tỷ lệ thành công:</Typography>
                  <Typography variant='body2' fontWeight={600} color='success.main'>
                    {detailItem.successCount} / {detailItem.totalSubscribers} ({detailItem.totalSubscribers > 0 ? Math.round((detailItem.successCount / detailItem.totalSubscribers) * 100) : 0}%)
                  </Typography>
                </Box>
              </Box>

              <Typography variant='subtitle2' fontWeight={700} sx={{ mt: 1 }}>
                Danh sách thiết bị nhận ({detailItem.deliveryLogs?.length || 0})
              </Typography>

              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxHeight: 300 }}>
                <Table size='small' stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Người dùng</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Thiết bị / Trình duyệt</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Thời gian</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Ghi chú lỗi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailItem.deliveryLogs && detailItem.deliveryLogs.length > 0 ? (
                      detailItem.deliveryLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell>{log.userName || log.userId}</TableCell>
                          <TableCell>
                            {log.deviceName || log.platform} • {log.browserName}
                          </TableCell>
                          <TableCell>
                            {log.isSuccess ? (
                              <Chip size='small' label='Thành công' color='success' variant='tonal' />
                            ) : (
                              <Chip size='small' label={`Lỗi ${log.statusCode || ''}`} color='error' variant='tonal' />
                            )}
                          </TableCell>
                          <TableCell>{new Date(log.sentAt).toLocaleTimeString('vi-VN')}</TableCell>
                          <TableCell sx={{ maxWidth: 200, color: 'error.main', fontSize: '0.75rem' }}>
                            {log.errorMessage || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                          Chưa có bản ghi phân phát chi tiết.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default WebPushHistoryTab
