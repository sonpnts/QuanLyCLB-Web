// Type Imports
import type { ThemeColor } from '@core/types'

export type ClassCoach = {
  userId: string
  fullName: string
  email?: string | null
  phoneNumber?: string | null
  skillLevel?: string | null
  isLeadInstructor: boolean
}

export type ClassAssistant = {
  assistantId: string
  fullName: string
  email?: string | null
  phoneNumber?: string | null
  skillLevel?: string | null
  roleName: string
}

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
  coaches?: ClassCoach[]
  assistants?: ClassAssistant[]
}

export type ClassStatusType = {
  [key: string]: ThemeColor
}
