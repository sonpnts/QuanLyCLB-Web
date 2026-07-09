import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

export interface StudentAbsenceType {
  id: string
  studentId: string
  studentName: string
  studentPhone?: string
  classId: string
  className: string
  classScheduleId?: string
  attendanceDate: string
  isExcused: boolean
  reason?: string
  markedByUserId?: string
  markedByUserName?: string
  createdAt: string
  updatedAt?: string
}

export interface GetStudentAbsencesParams {
  pageNumber?: number
  pageSize?: number
  keyword?: string
  classId?: string
  studentId?: string
  isExcused?: boolean
  fromDate?: string
  toDate?: string
}

export interface CreateStudentAbsenceRequest {
  classId: string
  studentId: string
  attendanceDates: string[]
  reason: string
}

export interface CoachClassOption {
  classId: string
  classCode: string
  className: string
}

export interface AttendanceSheetStudentType {
  studentId: string
  studentName: string
  phoneNumber?: string
  isAbsent: boolean
  isExcused: boolean
  reason?: string
}

export interface AttendanceSheetType {
  classId: string
  className: string
  classScheduleId?: string
  selectedDate: string
  isSubmitted?: boolean
  submittedAt?: string | null
  submittedByUserName?: string | null
  students: AttendanceSheetStudentType[]
}

export interface SaveAttendanceSheetStudentRequest {
  studentId: string
  isExcused: boolean
  reason?: string
}

export interface SaveAttendanceSheetRequest {
  classId: string
  classScheduleId?: string
  attendanceDate: string
  absents: SaveAttendanceSheetStudentRequest[]
}

export interface StudentAttendanceSessionLogType {
  id: string
  classId: string
  className: string
  classScheduleId?: string
  attendanceDate: string
  markedByUserId: string
  markedByUserName?: string
  totalStudents: number
  absentCount: number
  excusedAbsentCount: number
  unexcusedAbsentCount: number
  createdAt: string
}

export interface GetAttendanceSessionLogsParams {
  pageNumber?: number
  pageSize?: number
  keyword?: string
  classId?: string
  fromDate?: string
  toDate?: string
}

export interface MissingAttendanceSessionType {
  classId: string
  classCode: string
  className: string
  attendanceDate: string
}

export interface MissingAttendanceOverviewType {
  totalMissingSessions: number
  totalClassesWithMissing: number
  sessions: MissingAttendanceSessionType[]
}

interface SuggestedDatePayload {
  classId?: string
  selectedDate?: string
  classScheduleId?: string
}

const unwrapList = (payload: any): any[] => {
  if (Array.isArray(payload?.records)) return payload.records
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload)) return payload

  return []
}

const toDateString = (value: unknown): string | null => {
  if (typeof value !== "string") return null

  const trimmed = value.trim()

  if (!trimmed) return null

  return trimmed.includes('T') ? trimmed.slice(0, 10) : trimmed
}

class StudentAttendanceService {
  async getAbsences(params?: GetStudentAbsencesParams): Promise<ResponseResult<StudentAbsenceType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.studentAttendance.absences, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      return { success: true, data: unwrapList(apiResponse.data) }
    } catch (error) {
      logger.error('StudentAttendanceService', 'getAbsences', error)

      return { success: true, data: [] }
    }
  }

  async createExcusedAbsences(data: CreateStudentAbsenceRequest): Promise<ResponseResult<StudentAbsenceType[]>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.studentAttendance.absences, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: unwrapList(apiResponse.data), message: apiResponse.message }
    } catch (error: any) {
      logger.error('StudentAttendanceService', 'createExcusedAbsences', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async deleteAttendance(id: string): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.delete<any>(API_ENDPOINTS.studentAttendance.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      logger.error('StudentAttendanceService', 'deleteAttendance', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getCoachClasses(): Promise<ResponseResult<CoachClassOption[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.studentAttendance.coachClasses)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      return { success: true, data: unwrapList(apiResponse.data) }
    } catch (error) {
      logger.error('StudentAttendanceService', 'getCoachClasses', error)

      return { success: true, data: [] }
    }
  }

  async getMissingSessions(): Promise<ResponseResult<MissingAttendanceOverviewType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.studentAttendance.missingSessions)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('StudentAttendanceService', 'getMissingSessions', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getSuggestedDate(classId: string): Promise<ResponseResult<string>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.studentAttendance.coachSuggestedDate(classId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      const payload = apiResponse.data as string | SuggestedDatePayload | null | undefined

      const normalizedDate =
        toDateString(payload) ?? toDateString((payload as SuggestedDatePayload | null)?.selectedDate ?? null)

      if (!normalizedDate) return { success: false, message: 'Không xác định được ngày điểm danh gợi ý' }

      return { success: true, data: normalizedDate }
    } catch (error: any) {
      logger.error('StudentAttendanceService', 'getSuggestedDate', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getCoachSheet(classId: string, date: string, search?: string): Promise<ResponseResult<AttendanceSheetType>> {
    try {
      const normalizedDate = toDateString(date)

      if (!normalizedDate) return { success: false, message: 'Ngày điểm danh không hợp lệ' }

      const response = await apiClient.get<any>(API_ENDPOINTS.studentAttendance.coachSheet(classId, normalizedDate), {
        params: search ? { search } : undefined
      })

      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('StudentAttendanceService', 'getCoachSheet', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async saveCoachSheet(data: SaveAttendanceSheetRequest): Promise<ResponseResult<boolean>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.studentAttendance.coachSaveSheet, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: true, message: apiResponse.message }
    } catch (error: any) {
      logger.error('StudentAttendanceService', 'saveCoachSheet', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getSessionLogs(params?: GetAttendanceSessionLogsParams): Promise<ResponseResult<StudentAttendanceSessionLogType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.studentAttendance.sessionLogs, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      const list = unwrapList(apiResponse.data)

      return { success: true, data: list }
    } catch (error) {
      logger.error('StudentAttendanceService', 'getSessionLogs', error)

      return { success: true, data: [] }
    }
  }

  async exportSessionLogs(params?: GetAttendanceSessionLogsParams): Promise<boolean> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.studentAttendance.exportSessionLogs, {
        params,
        responseType: 'blob'
      })

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `LichSuDiemDanh_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return true
    } catch (error) {
      logger.error('StudentAttendanceService', 'exportSessionLogs', error)
      return false
    }
  }
}

const studentAttendanceService = new StudentAttendanceService()

export default studentAttendanceService
