'use client'

import { useState } from 'react'

import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import Card from '@mui/material/Card'

import CustomTabList from '@core/components/mui/TabList'

// Component Imports
import AuditLogListTable from './AuditLogListTable'
import LoginLogTable from './LoginLogTable'
import FailedCheckInTable from './FailedCheckInTable'

const AuditLogList = () => {
  const [tab, setTab] = useState('actions')

  return (
    <TabContext value={tab}>
      <Card className='mb-4'>
        <CustomTabList onChange={(_, v) => setTab(v as string)} variant='scrollable' pill='true'>
          <Tab
            label='Hành động hệ thống'
            value='actions'
            icon={<i className='ri-history-line' />}
            iconPosition='start'
          />
          <Tab
            label='Nhật ký đăng nhập'
            value='logins'
            icon={<i className='ri-login-circle-line' />}
            iconPosition='start'
          />
          <Tab
            label='Check-in thất bại'
            value='failed-checkin'
            icon={<i className='ri-map-pin-2-line' />}
            iconPosition='start'
          />
        </CustomTabList>
      </Card>

      <TabPanel value='actions' className='p-0'>
        <AuditLogListTable />
      </TabPanel>
      <TabPanel value='logins' className='p-0'>
        <LoginLogTable />
      </TabPanel>
      <TabPanel value='failed-checkin' className='p-0'>
        <FailedCheckInTable />
      </TabPanel>
    </TabContext>
  )
}

export default AuditLogList
