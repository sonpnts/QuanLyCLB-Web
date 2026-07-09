export const TICKET_REASONS = [
  'Bị ốm',
  'Việc gia đình',
  'Công việc đột xuất',
  'Tai nạn / Sự cố',
  'Điều kiện thời tiết',
  'Lý do cá nhân',
  'Điểm danh bù buổi trước',
  'Làm thêm giờ',
  'Checkout sớm'
] as const

export type TicketReason = (typeof TICKET_REASONS)[number]

export const TICKET_TYPES = [
  { value: 'makeup', label: 'Dạy thay / Dạy bù' },
  { value: 'missing', label: 'Thiếu chấm công' }
] as const

export type TicketType = (typeof TICKET_TYPES)[number]['value']

export type MakeupTicket = {
  id: string
  classScheduleId: string
  classScheduleName?: string
  className?: string
  userId: string
  userName?: string
  ticketType: TicketType
  reason?: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  createdAt: string
  updatedAt?: string
  createdByUserId?: string
  approverId?: string
  approvedAt?: string
}

export type CreateMakeupTicketRequest = {
  classScheduleId: string
  userId: string
  ticketType: TicketType
  reason?: string
  notes?: string
}

export type TicketApprovalRequest = {
  approve: boolean
  notes?: string
}

export type MakeupTicketListResponse = {
  records: MakeupTicket[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export type InstructorMonthlyStatsType = {
  instructorId: string
  instructorName: string
  month: number
  year: number
  totalSessions: number
  onTimeCount: number
  lateCount: number
  absentCount: number
  onTimeRate: number
  lateRate: number
}

export type ClassAttendanceSummaryType = {
  classId: string
  className: string
  month: number
  year: number
  totalStudents: number
  totalSessions: number
  presentCount: number
  lateCount: number
  absentCount: number
  attendanceRate: number
}

export type AttendanceAdminOverviewType = {
  month: number
  year: number
  totalInstructors: number
  totalSessions: number
  overallOnTimeRate: number
  instructorStats: InstructorMonthlyStatsType[]
  classStats: ClassAttendanceSummaryType[]
}
