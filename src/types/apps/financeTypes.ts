export type ClassInstructorSummaryType = {
  instructorId: string
  instructorName?: string
  classId: string
  className?: string
  tuitionCollected: number
  otherPaymentsCollected: number
  productSalesCollected: number
  totalCollected: number
}

export type InstructorClassCollectionType = {
  instructorId: string
  instructorName?: string
  classId: string
  className?: string
  tuitionCollectedToDate: number
  examFeeCollectedToDate: number
  otherPaymentsCollectedToDate: number
  productSalesCollectedToDate: number
  cashCollectedToDate: number
  bankTransferCollectedToDate: number
  totalCollectedToDate: number
  totalHandedOver: number
  cashAvailableToHandover: number
  bankTransferAvailableToHandover: number
  availableToHandover: number
  asOf?: string
  breakdown: {
    key: string
    label: string
    amount: number
  }[]
}

export type FinanceAmountSummaryType = {
  amount: number
  raw?: Record<string, unknown>
}

export type FinanceTransactionSummaryType = {
  tuitionTotal: number
  examFeeTotal: number
  productSalesTotal: number
  receiptTotal: number
  handedOverTotal: number
  fromDate?: string
  toDate?: string
  classId?: string
  branchId?: string
  instructorId?: string
}
