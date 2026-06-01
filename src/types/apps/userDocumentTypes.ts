import type { ThemeColor } from '@core/types'

// 0=ProfilePhoto, 1=BeltCertificate, 2=Certificate, 3=BankTransferProof
export type UserDocumentType = 0 | 1 | 2 | 3

// Backend mới chỉ dùng 1=Approved, 2=NeedsResubmission.
// Giá trị 0 được giữ để tương thích dữ liệu cũ và hiển thị như hợp lệ.
export type UserDocumentStatus = 0 | 1 | 2

export type UserDocumentDto = {
  id: string
  userId?: string
  userFullName?: string
  studentId?: string
  studentFullName?: string
  documentType: UserDocumentType
  documentTypeLabel: string
  status: UserDocumentStatus
  statusLabel: string
  fileName: string
  contentType: string
  fileUrl: string
  resubmissionReason?: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
  createdByUserId?: string
  updatedByUserId?: string
}

export const documentTypeLabels: Record<UserDocumentType, string> = {
  0: 'Ảnh thẻ',
  1: 'Văn bằng đẳng',
  2: 'Chứng chỉ',
  3: 'Ảnh chuyển khoản'
}

export const documentTypeIcons: Record<UserDocumentType, string> = {
  0: 'ri-user-photo-line',
  1: 'ri-award-line',
  2: 'ri-file-text-line',
  3: 'ri-bank-card-line'
}

export const documentTypeAccept: Record<UserDocumentType, string> = {
  0: 'image/jpeg,image/png,image/webp',
  1: 'image/jpeg,image/png,image/webp,application/pdf',
  2: 'image/jpeg,image/png,image/webp,application/pdf',
  3: 'image/jpeg,image/png,image/webp'
}

export const documentStatusLabels: Record<UserDocumentStatus, string> = {
  0: 'Hợp lệ',
  1: 'Hợp lệ',
  2: 'Cần nộp lại'
}

export const documentStatusColors: Record<UserDocumentStatus, ThemeColor> = {
  0: 'success',
  1: 'success',
  2: 'error'
}
