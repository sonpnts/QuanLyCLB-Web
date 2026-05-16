export type HandoverStatus = 'Pending' | 'Confirmed' | 'Rejected'

export const HandoverStatusLabel: Record<HandoverStatus, string> = {
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  Rejected: 'Bị từ chối'
}

export type CashHandoverDeductionType = {
  id: string
  description: string
  amount: number
}

export type CashHandoverType = {
  id: string
  classId: string
  className?: string
  instructorId: string
  instructorName?: string
  handoverAt?: string
  snapshotTuitionAmount: number
  snapshotExamFeeAmount: number
  snapshotProductSalesAmount: number
  snapshotTotalAmount: number
  previousHandedOverAmount: number
  totalDeductionAmount: number
  amountHandedOver: number
  remainingAmountAfterHandover: number
  status: HandoverStatus
  confirmedByUserId?: string
  confirmedByUserName?: string
  confirmedAt?: string
  deductions: CashHandoverDeductionType[]
  notes?: string
  createdByUserId?: string
  createdByUserName?: string
}

export type LateTuitionStudentType = {
  studentId: string
  studentName: string
  classId: string
  className: string
  lastPaymentDate?: string
  daysSinceLastPayment: number
}
