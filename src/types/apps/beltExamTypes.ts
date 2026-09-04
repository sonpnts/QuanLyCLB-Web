import type { ThemeColor } from '@core/types'

export type ExamSessionStatus = 'Draft' | 'Open' | 'Locked'
export type EffectiveExamSessionStatus = ExamSessionStatus | 'Expired'
export type ExamResult = 'Passed' | 'Failed' | null
export type ExamType = 'Regular' | 'ThangDang'

export type ExamSessionType = {
  id: string
  name: string
  description?: string
  examDate: string
  location?: string
  status: ExamSessionStatus
  examType: ExamType
  totalRegistrations: number
  paidRegistrations: number
  unpaidRegistrations: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
  registrationDeadline?: string
  isLocked?: boolean
  examFee?: number
}

export type ExamRegistrationType = {
  id: string
  examSessionId: string
  examSessionName: string
  studentId: string
  studentName: string
  studentCode?: string
  dateOfBirth?: string
  currentBeltLevelId?: string
  currentBeltLevelName?: string
  currentBeltLevelOrder?: number
  targetBeltLevelId: string
  targetBeltLevelOrder?: number
  targetBeltLevelName: string
  classId: string
  className: string
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
  suggestedTargetBeltLevelOrder?: number
  suggestedTargetBeltLevelName?: string
  alreadyRegistered: boolean
  existingRegistrationListId?: string
  isRegistrationProfileComplete: boolean
  registrationProfileNote?: string
  alreadyRegisteredIsFeePaid?: boolean
  existingRegistrationId?: string
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
}

export type BeltExamRegistrationListType = {
  id: string
  examSessionId: string
  examSessionName: string
  coachId: string
  coachName: string
  classId: string
  className: string
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
  studentCreatedAt?: string
  tuitionDebtMonths?: string[]
  recentPaidTuitionMonths?: string[]
}

export type AdminExamGroupByCoachType = {
  coachId: string
  coachName: string
  classId: string
  className: string
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

export const examSessionStatusColors: Record<ExamSessionStatus, ThemeColor> = {
  Draft: 'secondary',
  Open: 'primary',
  Locked: 'error'
}

export const examSessionStatusLabels: Record<ExamSessionStatus, string> = {
  Draft: 'Nháp',
  Open: 'Mở đăng ký',
  Locked: 'Đã chốt'
}

export const examSessionStatusObj = examSessionStatusColors

export const examTypeColors: Record<ExamType, ThemeColor> = {
  Regular: 'primary',
  ThangDang: 'warning'
}

export const examTypeLabels: Record<ExamType, string> = {
  Regular: 'Thi cấp đai',
  ThangDang: 'Thi thăng đẳng'
}

export const effectiveExamSessionStatusColors: Record<EffectiveExamSessionStatus, ThemeColor> = {
  ...examSessionStatusColors,
  Expired: 'warning'
}

export const effectiveExamSessionStatusLabels: Record<EffectiveExamSessionStatus, string> = {
  ...examSessionStatusLabels,
  Expired: 'Đã hết hạn'
}

type ExamSessionStatusLike = {
  status: ExamSessionStatus
  registrationDeadline?: string
  isLocked?: boolean
}

export const isExamSessionExpired = (session: ExamSessionStatusLike): boolean => {
  if (session.isLocked || session.status === 'Locked' || !session.registrationDeadline) {
    return false
  }

  const deadline = new Date(session.registrationDeadline)

  if (Number.isNaN(deadline.getTime())) {
    return false
  }

  return deadline.getTime() <= Date.now()
}

export const getEffectiveExamSessionStatus = (session: ExamSessionStatusLike): EffectiveExamSessionStatus => {
  if (session.isLocked || session.status === 'Locked') {
    return 'Locked'
  }

  if (isExamSessionExpired(session)) {
    return 'Expired'
  }

  return session.status
}

export const getEffectiveExamSessionStatusDisplay = (session: ExamSessionStatusLike) => {
  const status = getEffectiveExamSessionStatus(session)

  return {
    status,
    label: effectiveExamSessionStatusLabels[status],
    color: effectiveExamSessionStatusColors[status]
  }
}

export const examResultLabels: Record<Exclude<ExamResult, null>, string> = {
  Passed: 'Đạt',
  Failed: 'Không đạt'
}

export const examResultColors: Record<Exclude<ExamResult, null>, ThemeColor> = {
  Passed: 'success',
  Failed: 'error'
}

export type ExamSessionStatusType = Record<string, ThemeColor>

/** @deprecated Use ExamSessionStatus. */
export type BeltExamSessionStatusExtended = ExamSessionStatus
