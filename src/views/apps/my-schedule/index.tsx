'use client'

// MUI Imports
import Card from '@mui/material/Card'

// Component Imports
import MyScheduleCalendar from './MyScheduleCalendar'

// Styled Component Imports
import AppFullCalendar from '@/libs/styles/AppFullCalendar'

const MyScheduleView = () => {
  return (
    <Card className='overflow-visible'>
      <AppFullCalendar className='app-calendar'>
        <MyScheduleCalendar />
      </AppFullCalendar>
    </Card>
  )
}

export default MyScheduleView
