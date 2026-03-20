// Type Imports
import type { ThemeColor } from '@core/types'

export type LeaveType = 0 | 1 | 2 | 3 | 4 | 5 // 0=Annual, 1=Sick, 2=Personal, 3=Unpaid, 4=Maternity, 5=Other
export type LeaveRequestStatus = 0 | 1 | 2 | 3 // 0=Pending, 1=Approved, 2=Rejected, 3=Cancelled

export type LeaveRequestType = {
  id: string
  userId: string
  userName: string
  leaveType: LeaveType
  startDate: string
  endDate: string
  reason: string
  status: LeaveRequestStatus
  approvedByUserId?: string
  approvedByUserName?: string
  approvedAt?: string
  approvalNotes?: string
  rejectionReason?: string
  createdAt: string
}

export const leaveTypeLabels: { [key: number]: string } = {
  0: 'Nghỉ phép năm',
  1: 'Nghỉ ốm',
  2: 'Nghỉ việc riêng',
  3: 'Nghỉ không lương',
  4: 'Nghỉ thai sản',
  5: 'Khác'
}

export const leaveTypeColors: { [key: number]: ThemeColor } = {
  0: 'primary',
  1: 'error',
  2: 'info',
  3: 'secondary',
  4: 'warning',
  5: 'secondary'
}

export const leaveStatusLabels: { [key: number]: string } = {
  0: 'Chờ duyệt',
  1: 'Đã duyệt',
  2: 'Từ chối',
  3: 'Đã hủy'
}

export const leaveStatusColors: { [key: number]: ThemeColor } = {
  0: 'warning',
  1: 'success',
  2: 'error',
  3: 'secondary'
}
