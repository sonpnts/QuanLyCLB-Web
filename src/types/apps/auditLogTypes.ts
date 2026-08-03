// Type Imports
import type { ThemeColor } from '@core/types'

export type AuditAction =
  | 'Login'
  | 'Logout'
  | 'LoginFailed'
  | 'Create'
  | 'Read'
  | 'Update'
  | 'Delete'
  | 'Restore'
  | 'StudentEnroll'
  | 'StudentTransfer'
  | 'StudentGraduate'
  | 'StudentSuspend'
  | 'StudentDrop'
  | 'StudentComplete'
  | 'StudentResume'
  | 'StudentZaloUpdate'
  | 'CheckIn'
  | 'CheckOut'
  | 'AttendanceManual'
  | 'AttendanceApprove'
  | 'AttendanceMark'
  | 'ExamRegister'
  | 'ExamApprove'
  | 'ExamReject'
  | 'ExamResult'
  | 'PaymentCreate'
  | 'PaymentUpdate'
  | 'PaymentDelete'
  | 'TransferRequest'
  | 'TransferApprove'
  | 'TransferReject'
  | 'TransferCancel'
  | 'ConfigUpdate'
  | 'DataExport'
  | 'DataImport'
  | 'Other'

export type AuditLogType = {
  id: string
  userId: string
  userName: string
  userRole: string
  action: AuditAction
  entityType: string
  entityId?: string
  description: string
  oldValues?: string
  newValues?: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
  isSuccess: boolean
}

export const AuditActionColors: { [key: string]: ThemeColor } = {
  Login: 'success',
  Logout: 'secondary',
  LoginFailed: 'error',
  Create: 'primary',
  Read: 'info',
  Update: 'warning',
  Delete: 'error',
  Restore: 'success',
  StudentEnroll: 'primary',
  StudentTransfer: 'info',
  StudentGraduate: 'success',
  StudentSuspend: 'warning',
  StudentDrop: 'error',
  StudentComplete: 'success',
  StudentResume: 'info',
  StudentZaloUpdate: 'secondary',
  CheckIn: 'success',
  CheckOut: 'secondary',
  AttendanceManual: 'warning',
  AttendanceApprove: 'info',
  AttendanceMark: 'primary',
  ExamRegister: 'primary',
  ExamApprove: 'success',
  ExamReject: 'error',
  ExamResult: 'info',
  PaymentCreate: 'success',
  PaymentUpdate: 'warning',
  PaymentDelete: 'error',
  TransferRequest: 'primary',
  TransferApprove: 'success',
  TransferReject: 'error',
  TransferCancel: 'secondary',
  ConfigUpdate: 'warning',
  DataExport: 'info',
  DataImport: 'info',
  Other: 'secondary'
}

export const auditActionLabels: { [key: string]: string } = {
  Login: 'Đăng nhập',
  Logout: 'Đăng xuất',
  LoginFailed: 'Đăng nhập thất bại',
  Create: 'Tạo mới',
  Read: 'Xem',
  Update: 'Cập nhật',
  Delete: 'Xóa',
  Restore: 'Khôi phục',
  StudentEnroll: 'Đăng ký học viên',
  StudentTransfer: 'Chuyển lớp',
  StudentGraduate: 'Tốt nghiệp',
  StudentSuspend: 'Tạm nghỉ',
  StudentDrop: 'Nghỉ học',
  StudentComplete: 'Hoàn thành khóa',
  StudentResume: 'Khôi phục học viên',
  StudentZaloUpdate: 'Cập nhật Zalo',
  CheckIn: 'Check-in',
  CheckOut: 'Check-out',
  AttendanceManual: 'Chấm công thủ công',
  AttendanceApprove: 'Duyệt chấm công',
  AttendanceMark: 'Điểm danh học viên',
  ExamRegister: 'Đăng ký thi',
  ExamApprove: 'Duyệt thi',
  ExamReject: 'Từ chối thi',
  ExamResult: 'Kết quả thi',
  PaymentCreate: 'Tạo thanh toán',
  PaymentUpdate: 'Cập nhật thanh toán',
  PaymentDelete: 'Xóa thanh toán',
  TransferRequest: 'Yêu cầu chuyển lớp',
  TransferApprove: 'Duyệt chuyển lớp',
  TransferReject: 'Từ chối chuyển lớp',
  TransferCancel: 'Hủy chuyển lớp',
  ConfigUpdate: 'Cập nhật cấu hình',
  DataExport: 'Xuất dữ liệu',
  DataImport: 'Nhập dữ liệu',
  Other: 'Khác'
}

export const entityTypeLabels: { [key: string]: string } = {
  Student: 'Học viên',
  Class: 'Lớp học',
  ClassTransferRequest: 'Yêu cầu chuyển lớp',
  Payment: 'Thanh toán',
  BeltExam: 'Thi đai',
  Attendance: 'Chấm công',
  Branch: 'Chi nhánh',
  Instructor: 'Giáo viên',
  User: 'Người dùng',
  StudentLeaveRecord: 'Phiếu tạm nghỉ',
  StudentEnrollment: 'Đăng ký học viên',
  Invoice: 'Hóa đơn',
  InvoiceDetail: 'Chi tiết hóa đơn',
  StudentAttendance: 'Điểm danh học viên',
  BeltExamRegistration: 'Đăng ký thi đai',
  AttendanceAdjustment: 'Điều chỉnh chấm công',
  UserAccount: 'Tài khoản',
  UserRole: 'Vai trò',
  Config: 'Cấu hình'
}
