// Type Imports
import type { ThemeColor } from '@core/types'

/** Unified assignment DTO — dùng cho cả HLV (Coach) và trợ giảng (Assistant) */
export type ClassUserAssignment = {
  userId: string
  fullName: string
  email?: string | null
  phoneNumber?: string | null
  skillLevel?: string | null
  roleName: string
  isLeadInstructor: boolean
}

/** @deprecated dùng ClassUserAssignment */
export type ClassCoach = ClassUserAssignment

/** @deprecated dùng ClassUserAssignment */
export type ClassAssistant = ClassUserAssignment & { assistantId?: string }

export type ClassType = {
  id: string
  code: string
  name: string
  description?: string
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
  leadInstructorId?: string
  coaches?: ClassUserAssignment[]
  assistants?: ClassUserAssignment[]
}

export type ClassStatusType = {
  [key: string]: ThemeColor
}
