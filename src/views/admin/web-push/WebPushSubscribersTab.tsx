'use client'

import React, { useState, useEffect } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

import webPushService from '@/services/webPushService'
import type { WebPushSubscriptionItem } from '@/services/webPushService'

export const WebPushSubscribersTab: React.FC = () => {
  const [subscribers, setSubscribers] = useState<WebPushSubscriptionItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSubscribers = async () => {
    setLoading(true)
    try {
      const res = await webPushService.getSubscriptions(1, 100)
      if (res.data) {
        setSubscribers(res.data)
      }
    } catch (e) {
      console.error('Failed to load subscriptions', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscribers()
  }, [])

  return (
    <Card>
      <CardHeader
        title='Thiết bị đã kết nối nhận thông báo'
        subheader='Danh sách các thiết bị người dùng đã cấp quyền và kích hoạt nhận Web Push thành công'
        titleTypographyProps={{ sx: { fontSize: { xs: '1.15rem', sm: '1.25rem' }, fontWeight: 700 } }}
        subheaderTypographyProps={{ sx: { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: { xs: 1.5, sm: 0 },
          '& .MuiCardHeader-action': {
            m: 0,
            alignSelf: { xs: 'flex-start', sm: 'center' }
          }
        }}
        action={
          <Button
            size='small'
            variant='outlined'
            startIcon={<i className='ri-refresh-line' />}
            onClick={fetchSubscribers}
          >
            Làm mới
          </Button>
        }
      />
      <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto', width: '100%' }}>
          <Table size='small' sx={{ minWidth: 680 }}>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Người dùng</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Thiết bị</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trình duyệt</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Hệ điều hành</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Thời gian đăng ký</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Hoạt động gần nhất</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : subscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    Chưa có thiết bị nào đăng ký nhận Web Push.
                  </TableCell>
                </TableRow>
              ) : (
                subscribers.map(sub => (
                  <TableRow key={sub.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{sub.userName || sub.userId}</TableCell>
                    <TableCell>{sub.deviceName || 'Không rõ'}</TableCell>
                    <TableCell>{sub.browserName || 'Không rõ'}</TableCell>
                    <TableCell>
                      <Chip
                        size='small'
                        label={sub.platform || 'Desktop'}
                        color={
                          sub.platform === 'ios'
                            ? 'default'
                            : sub.platform === 'android'
                            ? 'success'
                            : 'primary'
                        }
                        variant='tonal'
                      />
                    </TableCell>
                    <TableCell>{new Date(sub.createdAt).toLocaleString('vi-VN')}</TableCell>
                    <TableCell>
                      {sub.lastSuccessAt
                        ? new Date(sub.lastSuccessAt).toLocaleString('vi-VN')
                        : sub.lastUpdatedAt
                        ? new Date(sub.lastUpdatedAt).toLocaleString('vi-VN')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip size='small' label='Đang hoạt động' color='success' variant='tonal' />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

export default WebPushSubscribersTab
