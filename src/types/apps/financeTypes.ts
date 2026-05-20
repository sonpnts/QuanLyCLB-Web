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
  totalCollectedToDate: number
  totalHandedOver: number
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
