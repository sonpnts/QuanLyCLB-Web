// Type Imports
import type { ThemeColor } from '@core/types'

export type StudentType = {
  id: string
  fullName: string
  phoneNumber?: string
  address?: string
  identityNumber?: string
  dateOfBirth?: string
  email?: string
  gender?: boolean // true = Nam, false = Nữ
  notes?: string
  currentBeltLevelId?: string
  currentBeltLevelName?: string
  avatarColor?: ThemeColor
  createdAt?: string
  updatedAt?: string
}

export type EnrollmentStatus = 'Active' | 'Inactive' | 'Completed'

export type EnrollmentType = {
  id: string
  studentId: string
  studentName?: string
  classId: string
  className?: string
  enrollmentDate: string
  status: EnrollmentStatus
  notes?: string
  createdAt?: string
}

export type TuitionStatusType = {
  studentId: string
  classId: string
  month: number
  year: number
  isPaid: boolean
  amount?: number
  paidDate?: string
}

export type ExamHistoryType = {
  id: string
  examSessionId: string
  examSessionName: string
  examDate: string
  beltLevelId: string
  beltLevelName: string
  result: number // 0 = Pending, 1 = Pass, 2 = Fail
  score?: number
  notes?: string
}

export type StudentStatusType = {
  [key: string]: ThemeColor
}

export const studentStatusObj: StudentStatusType = {
  Active: 'success',
  Inactive: 'secondary',
  Completed: 'info'
}

export const genderObj: { [key: string]: string } = {
  true: 'Nam',
  false: 'Nữ'
}
