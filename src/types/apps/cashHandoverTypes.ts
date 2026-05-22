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

export type CashHandoverClassDetailType = {
  classId: string
  className: string
  snapshotTuitionAmount: number
  snapshotExamFeeAmount: number
  snapshotProductSalesAmount: number
  snapshotTotalAmount: number
  previousHandedOverAmount: number
  totalDeductionAmount: number
  amountHandedOver: number
  remainingAmountAfterHandover: number
}

export type CashHandoverType = {
  id: string
  batchCode?: string | null
  classId?: string | null
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
  details: CashHandoverClassDetailType[]
  classCount: number
  notes?: string
  createdByUserId?: string
  createdByUserName?: string
  createdAt?: string
  updatedAt?: string
}

export type LateTuitionStudentType = {
  studentId: string
  studentName: string
  classId: string
  className: string
  lastPaymentDate?: string
  daysSinceLastPayment: number
}
