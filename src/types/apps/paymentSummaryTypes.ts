// Types cho tổng hợp công nợ & thu chi

export type UnpaidStudentItem = {
  studentId: string
  studentName: string
  amount: number
  examRegistrationId?: string
  targetBeltLevelName?: string
}

export type TuitionSummary = {
  totalStudents: number
  paidCount: number
  unpaidCount: number
  unpaidAmount: number
  unpaidStudents: UnpaidStudentItem[]
}

export type ExamFeeSummary = {
  sessionId: string
  sessionName: string
  isCollectable?: boolean
  registrationDeadline?: string | null
  totalRegistered: number
  paidCount: number
  unpaidCount: number
  unpaidAmount: number
  unpaidStudents: UnpaidStudentItem[]
}

export type ClassPaymentSummary = {
  classId: string
  className: string
  tuition: TuitionSummary
  examFees: ExamFeeSummary[]
  branchName?: string | null
  branchId?: string | null
}

export type CoachPaymentSummaryType = {
  month: number
  year: number
  classes: ClassPaymentSummary[]
  grandTotalUnpaid: number
}

export type AdminPaymentSummaryType = {
  month: number
  year: number
  overallTuition: TuitionSummary
  overallExamFees: ExamFeeSummary[]
  totalCollectedThisMonth: number
  totalUnpaid: number
}

export type OutstandingPaymentItem = {
  type: 'Tuition' | 'ExamFee' | string
  amount: number
  isPaid: boolean
  forMonth?: number
  forYear?: number
  examSessionId?: string
  examSessionName?: string
  targetBeltLevelName?: string
  examRegistrationId?: string
  description?: string
}

export type StudentOutstandingType = {
  studentId: string
  studentName: string
  items: OutstandingPaymentItem[]
  totalUnpaid: number
}
