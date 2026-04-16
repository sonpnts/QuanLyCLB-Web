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
