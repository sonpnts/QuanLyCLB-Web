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
  tuitionCollected: number
  examFeeCollected: number
  otherFeesCollected: number
  productSalesCollected: number
  totalCollectedToDate: number
  totalDiscountAmount: number
  totalManualDiscountAmount: number
  totalHandedOver: number
  cashAvailableToHandover: number
  bankTransferAvailableToHandover: number
  availableToHandover: number
  invoiceCount: number
}

export type InvoiceSummaryType = {
  receiptNumber: string
  studentName: string
  paymentDate: string
  totalAmount: number
  discountAmount: number
  manualDiscountAmount: number
  finalAmount: number
  method: number
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
  registrationFeeTotal: number
  facilityFeeTotal: number
  codeChangeFeeTotal: number
  otherFeesTotal: number
  fromDate?: string
  toDate?: string
  classId?: string
  branchId?: string
  instructorId?: string
}
