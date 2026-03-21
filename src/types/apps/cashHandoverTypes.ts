export type CashHandoverType = {
  id: string
  classId: string
  className?: string
  instructorId: string
  instructorName?: string
  handoverAt?: string
  snapshotTuitionAmount: number
  snapshotProductSalesAmount: number
  snapshotTotalAmount: number
  previousHandedOverAmount: number
  amountHandedOver: number
  remainingAmountAfterHandover: number
  notes?: string
  createdByUserId?: string
  createdByUserName?: string
}
