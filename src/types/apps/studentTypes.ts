// Type Imports
import type { ThemeColor } from '@core/types'

export type StudentClassInfo = {
  classId: string
  className: string
  enrollmentId: string
  enrollmentDate?: string
  status?: string
}

export type StudentTuitionDiscountType = {
  id: string
  discountAmount: number
  reason: string
  status: number | string
  applyFromMonth?: number | null
  applyFromYear?: number | null
  applyToMonth?: number | null
  applyToYear?: number | null
  isPermanent: boolean
  periodLabel: string
  requestedAt?: string
  decidedAt?: string
  decisionNote?: string
}

export type StudentType = {
  id: string
  code?: string
  fullName: string
  phoneNumber?: string
  personalIdNumber?: string | null
  address?: string
  dateOfBirth?: string
  educationLevel?: string
  email?: string
  gender?: boolean // true = Nam, false = Nữ
  notes?: string
  beltLevelId?: string
  beltLevelName?: string
  isActive?: boolean
  isSuspended?: boolean
  suspendedAt?: string
  suspendReason?: string
  avatarColor?: ThemeColor
  createdAt?: string
  updatedAt?: string
  classes?: StudentClassInfo[]
  userIdZalo?: string

  tuitionDiscountAmount?: number
  tuitionDiscountReason?: string
  tuitionDiscountStatus?: number | string
  tuitionDiscountRequestedAt?: string
  tuitionDiscountDecidedAt?: string
  tuitionDiscountDecisionNote?: string
  tuitionDiscounts?: StudentTuitionDiscountType[]
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
  examName: string
  examDate: string
  beltLevelId: string
  beltLevelName: string

  // result: number // 0 = Pending, 1 = Pass, 2 = Fail
  // score?: number
  notes?: string
}

export type StudentLeaveRecordType = {
  id: string
  studentId: string
  studentName: string
  startDate: string
  endDate?: string | null
  reason?: string | null
  createdByUserId?: string | null
  createdByUserName?: string | null
  createdAt: string
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
