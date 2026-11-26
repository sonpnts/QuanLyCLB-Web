'use client'

import React, { useState, useEffect } from 'react'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'

import webPushService from '@/services/webPushService'

interface Props {
  refreshTrigger: number
}

export const WebPushOverviewCards: React.FC<Props> = ({ refreshTrigger }) => {
  const [stats, setStats] = useState({
    subscribersCount: 0,
    sentCount: 0,
    scheduledCount: 0,
    successRate: 100
  })

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const [subsRes, histRes] = await Promise.allSettled([
          webPushService.getSubscriptions(1, 1),
          webPushService.getHistory({ pageIndex: 1, pageSize: 50 })
        ])

        let subsCount = 0
        if (subsRes.status === 'fulfilled' && subsRes.value.data) {
          subsCount = subsRes.value.data.length
        }

        let sent = 0
        let scheduled = 0
        let totalRecipients = 0
        let totalSuccess = 0

        if (histRes.status === 'fulfilled' && histRes.value.data) {
          const items = histRes.value.data.items || []
          items.forEach(it => {
            if (it.status === 'Sent') sent++
            if (it.status === 'Scheduled') scheduled++
            totalRecipients += it.totalSubscribers
            totalSuccess += it.successCount
          })
        }

        const rate = totalRecipients > 0 ? Math.round((totalSuccess / totalRecipients) * 100) : 100

        setStats({
          subscribersCount: subsCount,
          sentCount: sent,
          scheduledCount: scheduled,
          successRate: rate
        })
      } catch (e) {
        console.error('Failed to load overview cards', e)
      }
    }

    loadOverview()
  }, [refreshTrigger])

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', width: 48, height: 48 }}>
              <i className='ri-smartphone-line' style={{ fontSize: '1.6rem' }} />
            </Avatar>
            <Box>
              <Typography variant='h5' fontWeight={700}>
                {stats.subscribersCount}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Thiết bị đã kết nối
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'success.lighter', color: 'success.main', width: 48, height: 48 }}>
              <i className='ri-check-double-line' style={{ fontSize: '1.6rem' }} />
            </Avatar>
            <Box>
              <Typography variant='h5' fontWeight={700}>
                {stats.sentCount}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Thông báo đã phát
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'info.lighter', color: 'info.main', width: 48, height: 48 }}>
              <i className='ri-time-line' style={{ fontSize: '1.6rem' }} />
            </Avatar>
            <Box>
              <Typography variant='h5' fontWeight={700}>
                {stats.scheduledCount}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Đang chờ lịch gửi
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'warning.lighter', color: 'warning.main', width: 48, height: 48 }}>
              <i className='ri-percent-line' style={{ fontSize: '1.6rem' }} />
            </Avatar>
            <Box>
              <Typography variant='h5' fontWeight={700}>
                {stats.successRate}%
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Tỷ lệ gửi thành công
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default WebPushOverviewCards
