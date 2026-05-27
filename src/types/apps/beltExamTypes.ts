// Type Imports
import type { ThemeColor } from '@core/types'

export type ExamSessionStatus =
  | 'Draft' | 'Pending' | 'PendingApproval'
  | 'Approved' | 'Rejected' | 'Completed'
  | 'Cancelled' | 'Open' | 'Closed' | 'Locked'

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
  registrationDeadline?: string
  isLocked?: boolean
  examFee?: number
}

export type ExamRegistrationStatus = 'Pending' | 'Approved' | 'Rejected'
export type ExamResult = 'Passed' | 'Failed' | null

export type ExamRegistrationType = {
  id: string
  examSessionId: string
  examSessionName: string
  studentId: string
  studentName: string
  currentBeltLevelId?: string
  currentBeltLevelName?: string
  currentBeltLevelOrder?: number
  targetBeltLevelId: string
  targetBeltLevelOrder?: number
  targetBeltLevelName: string
  classId: string
  className: string
  status: ExamRegistrationStatus
  result: ExamResult
  score?: number
  resultNotes?: string
  isFeePaid: boolean
  feeAmount?: number
  rejectionReason?: string
  resultUpdatedAt?: string
  registeredByUserId: string
  registeredByUserName: string
  paymentRecordId?: string
  paidAt?: string
  oneTimeFeesCompleted?: boolean
  createdAt?: string
  updatedAt?: string
}

export type BeltLevelType = {
  id: string
  name: string
  order: number
  description?: string
  isActive?: boolean
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

export const examResultLabels: Record<string, string> = {
  Passed: 'Đạt',
  Failed: 'Không đạt'
}

export const examResultColors: Record<string, ThemeColor> = {
  Passed: 'success',
  Failed: 'error'
}

// ─── Luồng đăng ký thi cấp mới ────────────────────────────────────────────────

/** @deprecated Use ExamSessionStatus which now includes all statuses */
export type BeltExamSessionStatusExtended = ExamSessionStatus

export type RegistrationListStatus = 'Draft' | 'Submitted'

export type EligibleStudentForExamType = {
  studentId: string
  studentName: string
  studentCode?: string
  dateOfBirth?: string
  gender?: boolean
  phoneNumber?: string
  currentBeltLevelId?: string
  currentBeltLevelName?: string
  currentBeltOrder?: number
  suggestedTargetBeltLevelId?: string
  suggestedTargetBeltLevelOrder?: string
  suggestedTargetBeltLevelName?: string
  alreadyRegistered: boolean
  existingRegistrationListId?: string
}

export type RegistrationListItemType = {
  id: string
  studentId: string
  studentName: string
  currentBeltLevelName?: string
  targetBeltLevelId: string
  targetBeltLevelOrder?: number
  targetBeltLevelName: string
  isFeePaid: boolean
  paymentRecordId?: string
  status: string
}

export type BeltExamRegistrationListType = {
  id: string
  examSessionId: string
  examSessionName: string
  coachId: string
  coachName: string
  classId: string
  className: string
  status: RegistrationListStatus
  submittedAt?: string
  isAutoSubmitted: boolean
  totalStudents: number
  paidCount: number
  isActive: boolean
  createdAt: string
  registrations: RegistrationListItemType[]
}

export type AdminExamStudentRowType = {
  registrationId: string
  studentId: string
  studentName: string
  studentCode?: string
  dateOfBirth?: string
  gender?: boolean
  phoneNumber?: string
  personalIdNumber?: string
  educationLevel?: string
  currentBeltLevelName?: string
  currentBeltLevelOrder?: number
  targetBeltLevelName: string
  targetBeltLevelOrder?: number
  className: string
  coachName: string
  hasPaid: boolean
  oneTimeFeesCompleted: boolean
  paidAt?: string
  paymentRecordId?: string
}

export type AdminExamGroupByCoachType = {
  coachId: string
  coachName: string
  classId: string
  className: string
  listStatus: RegistrationListStatus
  isAutoSubmitted: boolean
  totalStudents: number
  paidCount: number
  students: AdminExamStudentRowType[]
}

export type AdminExamSessionViewType = {
  sessionId: string
  sessionName: string
  examDate: string
  registrationDeadline?: string
  status: ExamSessionStatus
  isLocked: boolean
  lockedAt?: string
  totalRegistered: number
  totalPaid: number
  totalUnpaid: number
  totalAmountCollected: number
  coachGroups: AdminExamGroupByCoachType[]
}

export type CreateRegistrationListItemRequest = {
  studentId: string
  targetBeltLevelId: string
}

export type CreateRegistrationListRequest = {
  examSessionId: string
  classId: string
  students: CreateRegistrationListItemRequest[]
}

export const examSessionStatusColors: Record<string, ThemeColor> = {
  Draft: 'secondary',
  Pending: 'warning',
  PendingApproval: 'warning',
  Approved: 'success',
  Rejected: 'error',
  Completed: 'info',
  Cancelled: 'error',
  Open: 'primary',
  Closed: 'warning',
  Locked: 'error'
}

export const examSessionStatusLabels: Record<string, string> = {
  Draft: 'Nháp',
  Pending: 'Chờ duyệt',
  PendingApproval: 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Từ chối',
  Completed: 'Hoàn thành',
  Cancelled: 'Đã hủy',
  Open: 'Đang mở ĐK',
  Closed: 'Đã đóng ĐK',
  Locked: 'Đã chốt'
}

export const registrationListStatusLabels: Record<RegistrationListStatus, string> = {
  Draft: 'Nháp',
  Submitted: 'Đã nộp'
}

export const registrationListStatusColors: Record<RegistrationListStatus, ThemeColor> = {
  Draft: 'warning',
  Submitted: 'success'
}
