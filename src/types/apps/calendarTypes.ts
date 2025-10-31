// Third-party Imports
import type { Dispatch } from '@reduxjs/toolkit'
import type { EventInput } from '@fullcalendar/core'

// Type Imports
import type { ThemeColor } from '@core/types'

export type CalendarFiltersType = 'Personal' | 'Business' | 'Family' | 'Holiday' | 'ETC' | 'Schedule'

export type CalendarColors = {
  ETC: ThemeColor
  Family: ThemeColor
  Holiday: ThemeColor
  Personal: ThemeColor
  Business: ThemeColor
  Schedule: ThemeColor
}

export type CalendarType = {
  events: EventInput[]
  filteredEvents: EventInput[]
  selectedEvent: null | any
  selectedCalendars: CalendarFiltersType[]
  selectedClasses: string[] // Danh sách các lớp học đã chọn để filter
}

export type AddEventType = Omit<EventInput, 'id'>

export type SidebarLeftProps = {
  mdAbove: boolean
  calendarApi: any
  calendarStore: CalendarType
  leftSidebarOpen: boolean
  dispatch: Dispatch
  calendarsColor: CalendarColors
  handleLeftSidebarToggle: () => void
  handleAddEventSidebarToggle: () => void
}

export type AddEventSidebarType = {
  calendarStore: CalendarType
  calendarApi: any
  dispatch: Dispatch
  addEventSidebarOpen: boolean
  handleAddEventSidebarToggle: () => void
  readOnly?: boolean // Nếu true, chỉ hiển thị thông tin, không cho phép edit/delete
}
