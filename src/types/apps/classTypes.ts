// Type Imports
import type { ThemeColor } from '@core/types'

export type ClassType = {
  id: string
  code: string
  name: string
  description?: string
  maxStudents: number
  currentStudents?: number
  instructorId?: string
  instructorName?: string
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
