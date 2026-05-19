// Type Imports
import type { ThemeColor } from '@core/types'

// Payment type: 0=Tuition, 1=ExamFee, 2=Registration, 3=Other, 4=FacilityFee, 5=CodeChangeFee
export type PaymentType = 0 | 1 | 2 | 3 | 4 | 5

// Payment method: 0=Cash, 1=BankTransfer, 2=Card
export type PaymentMethod = 0 | 1 | 2

export type PaymentRecordType = {
  id: string
  studentId: string
  studentName?: string
  classId?: string
  className?: string
  productId?: string
  productName?: string
  examRegistrationId?: string
  type: PaymentType
  amount: number
  originalAmount?: number
  discountAmount?: number
  discountReason?: string
  paymentDate: string
  method: PaymentMethod
  forMonth?: number
  forYear?: number
  description?: string
  transferProofImageUrl?: string
  transactionRef?: string
  receiptNumber?: string
  collectedByUserId?: string
  collectedByUserName?: string
  createdByUserId?: string
  createdByUserName?: string
  updatedByUserId?: string
  updatedByUserName?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export type PaymentSummaryType = {
  classId: string
  className?: string
  totalAmount: number
  totalPayments: number
  fromDate: string
  toDate: string
}

export type MonthlyReportType = {
  year: number
  month: number
  totalRevenue: number
  totalTuition: number
  totalExamFees: number
  totalRegistrationFees: number
  paymentCount: number
}

export const PaymentTypeColors: { [key: number]: ThemeColor } = {
  0: 'primary',
  1: 'info',
  2: 'success',
  3: 'secondary',
  4: 'warning',
  5: 'info'
}

export const paymentTypeLabels: { [key: number]: string } = {
  0: 'Học phí',
  1: 'Lệ phí thi',
  2: 'Phí đăng ký',
  3: 'Khác / Mua sản phẩm',
  4: 'Phí CSVC',
  5: 'Phí chuyển mã / import'
}

export const paymentMethodLabels: { [key: number]: string } = {
  0: 'Tiền mặt',
  1: 'Chuyển khoản',
  2: 'Khác'
}
