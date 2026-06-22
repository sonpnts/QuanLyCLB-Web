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
  totalCollectedToDate: number
  totalDiscountAmount: number
  totalManualDiscountAmount: number
  totalHandedOver: number
  cashAvailableToHandover: number
  bankTransferAvailableToHandover: number
  availableToHandover: number
  invoiceCount: number
  asOf?: string
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
  handedOverTotal: number
  fromDate?: string
  toDate?: string
  classId?: string
  branchId?: string
  instructorId?: string
}
