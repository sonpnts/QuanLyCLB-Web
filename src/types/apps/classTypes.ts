// Type Imports
import type { ThemeColor } from '@core/types'

export type ClassType = {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  maxStudents: number
  currentStudents?: number
  instructorId?: string
  instructorName?: string
  code?: string
  isActive: boolean
  createdDate?: string
  createdBy?: string
  updatedDate?: string
  updatedBy?: string
  avatarColor?: ThemeColor
  coachIds?: string[]
}

export type ClassStatusType = {
  [key: string]: ThemeColor
}
