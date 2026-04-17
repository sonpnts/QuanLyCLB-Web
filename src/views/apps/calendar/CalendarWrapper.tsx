'use client'

// React Imports
import { logger } from '@/utils/logger'
import { useState, useEffect, useCallback } from 'react'

// MUI Imports
import { useMediaQuery } from '@mui/material'
import type { Theme } from '@mui/material/styles'

// Third-party Imports
import { useDispatch, useSelector } from 'react-redux'
import type { EventInput } from '@fullcalendar/core'

// Type Imports
import type { CalendarColors, CalendarType } from '@/types/apps/calendarTypes'
import type { ScheduleType } from '@/services/scheduleService'

// Service Imports
import scheduleService from '@/services/scheduleService'
import { getDayName } from '@/utils/constants'

// Component Imports
import Calendar from './Calendar'
import SidebarLeft from './SidebarLeft'
import AddEventSidebar from './AddEventSidebar'

// Slice Imports
import { setScheduleEvents } from '@/redux-store/slices/calendar'

// CalendarColors Object
const calendarsColor: CalendarColors = {
  Personal: 'error',
  Business: 'primary',
  Family: 'warning',
  Holiday: 'success',
  ETC: 'info',
  Schedule: 'info' // ThÃªm mÃ u cho schedule events
}

// Helper function to convert ScheduleType to EventInput
const convertScheduleToEvent = (schedule: ScheduleType, year: number, month: number): EventInput[] => {
  if (!schedule.isActive) return []

  const events: EventInput[] = []
  const dayOfWeek = schedule.dayOfWeek // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Get all dates for this day of week in the current month
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0) // Last day of month

  // Find first occurrence of this day of week in the month
  const currentDate = new Date(startDate)

  // Calculate days to add to get to the first occurrence of the target day
  // JavaScript Date.getDay() returns: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const firstDayOfMonth = currentDate.getDay()
  let daysToAdd = (dayOfWeek - firstDayOfMonth + 7) % 7

  // If daysToAdd is 0 and firstDayOfMonth !== dayOfWeek, we need to go to next week
  if (daysToAdd === 0 && firstDayOfMonth !== dayOfWeek) {
    daysToAdd = 7
  }

  currentDate.setDate(currentDate.getDate() + daysToAdd)

  // Generate events for each occurrence of this day in the month
  while (currentDate <= endDate && currentDate.getMonth() === month) {
    // Parse time (format: "HH:mm:ss" or "HH:mm")
    const startTimeParts = schedule.startTime.split(':')
    const endTimeParts = schedule.endTime.split(':')
    const startHour = parseInt(startTimeParts[0], 10)
    const startMinute = parseInt(startTimeParts[1] || '0', 10)
    const endHour = parseInt(endTimeParts[0], 10)
    const endMinute = parseInt(endTimeParts[1] || '0', 10)

    const startDateTime = new Date(currentDate)

    startDateTime.setHours(startHour, startMinute, 0, 0)

    const endDateTime = new Date(currentDate)

    endDateTime.setHours(endHour, endMinute, 0, 0)

    // If end time is earlier than start time, it means it goes to next day
    if (endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1)
    }

    const className = schedule.class?.name || 'Lá»›p há»c'
    const branchName = schedule.branch?.name || 'Chi nhÃ¡nh'
    const dayName = getDayName(dayOfWeek)
    const timeStr = `${schedule.startTime.substring(0, 5)} - ${schedule.endTime.substring(0, 5)}`

    events.push({
      id: `schedule-${schedule.id}-${currentDate.getTime()}`,
      title: `${className} - ${branchName}`,
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      allDay: false,
      extendedProps: {
        calendar: 'Schedule',
        scheduleId: schedule.id,
        className: className,
        branchName: branchName,
        dayOfWeek: dayOfWeek,
        dayName: dayName,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        description: `Lá»›p: ${className}\nChi nhÃ¡nh: ${branchName}\nThá»©: ${dayName}\nGiá»: ${timeStr}`
      }
    })

    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7)
  }

  return events
}

const AppCalendar = () => {
  // States
  const [calendarApi, setCalendarApi] = useState<null | any>(null)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false)
  const [addEventSidebarOpen, setAddEventSidebarOpen] = useState<boolean>(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_loadingSchedules, setLoadingSchedules] = useState<boolean>(false)

  // Hooks
  const dispatch = useDispatch()
  const calendarStore = useSelector((state: { calendarReducer: CalendarType }) => state.calendarReducer)
  const mdAbove = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'))

  const handleLeftSidebarToggle = () => setLeftSidebarOpen(!leftSidebarOpen)

  const handleAddEventSidebarToggle = () => setAddEventSidebarOpen(!addEventSidebarOpen)

  // Load schedules and convert to events
  const loadScheduleEvents = useCallback(async () => {
    try {
      setLoadingSchedules(true)
      const response = await scheduleService.getSchedules({})

      if (response.success && response.data) {
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth()

        // Generate events for current month and next 2 months
        const events: EventInput[] = []

        for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
          const year = currentMonth + monthOffset >= 12 ? currentYear + 1 : currentYear
          const month = (currentMonth + monthOffset) % 12

          response.data.forEach(schedule => {
            const scheduleEvents = convertScheduleToEvent(schedule, year, month)

            events.push(...scheduleEvents)
          })
        }

        dispatch(setScheduleEvents(events))
      }
    } catch (error) {
      logger.error('CalendarWrapper', 'Error loading schedules for calendar', error)
    } finally {
      setLoadingSchedules(false)
    }
  }, [dispatch])

  // Load schedules when component mounts and when calendar view changes
  useEffect(() => {
    loadScheduleEvents()

    // Reload when calendar view changes (user navigates to different month)
    if (calendarApi) {
      const handleDatesSet = () => {
        loadScheduleEvents()
      }

      calendarApi.on('datesSet', handleDatesSet)

      return () => {
        calendarApi.off('datesSet', handleDatesSet)
      }
    }
  }, [loadScheduleEvents, calendarApi])

  return (
    <>
      <SidebarLeft
        mdAbove={mdAbove}
        dispatch={dispatch}
        calendarApi={calendarApi}
        calendarStore={calendarStore}
        calendarsColor={calendarsColor}
        leftSidebarOpen={leftSidebarOpen}
        handleLeftSidebarToggle={handleLeftSidebarToggle}
        handleAddEventSidebarToggle={handleAddEventSidebarToggle}
      />
      <div className='p-5 pbe-0 flex-grow overflow-visible bg-backgroundPaper rounded'>
        <Calendar
          dispatch={dispatch}
          calendarApi={calendarApi}
          calendarStore={calendarStore}
          setCalendarApi={setCalendarApi}
          calendarsColor={calendarsColor}
          handleLeftSidebarToggle={handleLeftSidebarToggle}
          handleAddEventSidebarToggle={handleAddEventSidebarToggle}
        />
      </div>
      <AddEventSidebar
        dispatch={dispatch}
        calendarApi={calendarApi}
        calendarStore={calendarStore}
        addEventSidebarOpen={addEventSidebarOpen}
        handleAddEventSidebarToggle={handleAddEventSidebarToggle}
      />
    </>
  )
}

export default AppCalendar
