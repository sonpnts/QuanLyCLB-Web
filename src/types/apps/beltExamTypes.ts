// Type Imports
import type { ThemeColor } from '@core/types'

export type ExamSessionStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Completed'

export type ExamSessionType = {
  id: string
  name: string
  description?: string
  examDate: string
  location?: string
  status: ExamSessionStatus
  adminNotes?: string
  approvedAt?: string
  approvedByUserId?: string
  approvedByUserName?: string
  totalRegistrations: number
  approvedRegistrations: number
  pendingRegistrations: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export type ExamRegistrationStatus = 'Pending' | 'Approved' | 'Rejected'
export type ExamResult = 0 | 1 | 2 // 0 = Pending, 1 = Pass, 2 = Fail

export type ExamRegistrationType = {
  id: string
  examSessionId: string
  examSessionName: string
  studentId: string
  studentName: string
  currentBeltLevelId?: string
  currentBeltLevelName?: string
  targetBeltLevelId: string
  targetBeltLevelName: string
  classId: string
  className: string
  status: ExamRegistrationStatus
  result: ExamResult
  score?: number
  resultNotes?: string
  isFeePaid: boolean
  feeAmount: number
  rejectionReason?: string
  resultUpdatedAt?: string
  registeredByUserId: string
  registeredByUserName: string
}

export type BeltLevelType = {
  id: string
  name: string
  order: number
  description?: string
  colorCode?: string
}

export type ExamSessionStatusType = {
  [key: string]: ThemeColor
}

export const examSessionStatusObj: ExamSessionStatusType = {
  Draft: 'secondary',
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error',
  Completed: 'info'
}

export const examResultLabels: { [key: number]: string } = {
  0: 'Chưa có kết quả',
  1: 'Đạt',
  2: 'Không đạt'
}

export const examResultColors: { [key: number]: ThemeColor } = {
  0: 'secondary',
  1: 'success',
  2: 'error'
}
