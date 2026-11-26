'use client'

import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Card from '@mui/material/Card'

import RoleGuard from '@/hocs/RoleGuard'
import WebPushOverviewCards from '@/views/admin/web-push/WebPushOverviewCards'
import WebPushComposeTab from '@/views/admin/web-push/WebPushComposeTab'
import WebPushHistoryTab from '@/views/admin/web-push/WebPushHistoryTab'
import WebPushSubscribersTab from '@/views/admin/web-push/WebPushSubscribersTab'

export default function WebPushAdminPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'subscribers'>('compose')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleNotificationCreated = () => {
    setRefreshTrigger(prev => prev + 1)
    setActiveTab('history')
  }

  return (
    <RoleGuard>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant='h4' fontWeight={700} gutterBottom>
            Quản trị Web Push Notification
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Quản lý và phát thông báo trực tiếp đến trình duyệt máy tính, điện thoại Android và iPhone/iPad của võ sinh, phụ huynh và huấn luyện viên.
          </Typography>
        </Box>

        {/* Overview Stats */}
        <WebPushOverviewCards refreshTrigger={refreshTrigger} />

        {/* Tab Navigation */}
        <Card sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Tab
              value='compose'
              label='Tạo thông báo mới'
              icon={<i className='ri-add-circle-line' style={{ fontSize: '1.2rem' }} />}
              iconPosition='start'
            />
            <Tab
              value='history'
              label='Lịch sử & Đã lên lịch'
              icon={<i className='ri-history-line' style={{ fontSize: '1.2rem' }} />}
              iconPosition='start'
            />
            <Tab
              value='subscribers'
              label='Thiết bị đã kết nối'
              icon={<i className='ri-device-line' style={{ fontSize: '1.2rem' }} />}
              iconPosition='start'
            />
          </Tabs>
        </Card>

        {/* Tab Content */}
        {activeTab === 'compose' && (
          <WebPushComposeTab onNotificationCreated={handleNotificationCreated} />
        )}

        {activeTab === 'history' && (
          <WebPushHistoryTab refreshTrigger={refreshTrigger} />
        )}

        {activeTab === 'subscribers' && (
          <WebPushSubscribersTab />
        )}
      </Box>
    </RoleGuard>
  )
}
