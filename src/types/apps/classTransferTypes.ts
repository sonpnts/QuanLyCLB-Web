// Type Imports
import type { ThemeColor } from '@core/types'

export type ClassTransferStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'

export type ClassTransferType = {
  id: string
  studentId: string
  studentName: string
  fromClassId: string
  fromClassName: string
  toClassId: string
  toClassName: string
  reason?: string
  status: ClassTransferStatus
  requestDate: string
  approvedDate?: string
  approvedByUserName?: string
  approvalNotes?: string
  rejectionReason?: string
}

export type ClassTransferStatusType = {
  [key: string]: ThemeColor
}

export const classTransferStatusObj: ClassTransferStatusType = {
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error',
  Cancelled: 'secondary'
}

export const classTransferStatusLabels: { [key: string]: string } = {
  Pending: 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Từ chối',
  Cancelled: 'Đã hủy'
}
