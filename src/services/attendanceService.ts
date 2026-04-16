import { apiClient } from '@/utils/apiClient'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { apiList } from '@/utils/serviceHelper'
import { logger } from '@/utils/logger'
import type {
  AttendanceAdminOverviewType,
  InstructorMonthlyStatsType,
  ClassAttendanceSummaryType
} from '@/types/apps/attendanceTypes'

export interface CheckInRequest {
  checkedInAt: string // DateTime
  latitude: number
  longitude: number
}

export interface CheckOutRequest {
  checkedOutAt: string // DateTime
  latitude: number
  longitude: number
}

export interface ManualAttendanceRequest {
  classScheduleId: string
  userId: string
  occurredAt: string // DateTime
  status: AttendanceStatus
  notes?: string
  ticketId?: string
}

export interface CreateTicketRequest {
  classScheduleId: string
  userId: string
  reason?: string
  createdBy?: string
  createdByUserId?: string
}

export interface TicketApprovalRequest {
  approve: boolean
  approver?: string
  notes?: string
  updatedByUserId?: string
}

export interface GetUserAttendanceParams {
  userId: string
  fromDate?: string // Date format
  toDate?: string // Date format
}

export enum AttendanceStatus {
  Present = 0,
  Absent = 1,
  Late = 2,
  Excused = 3,
  Pending = 4
}

class AttendanceService {
  async checkIn(data: CheckInRequest): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.attendance.checkIn, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message,
          code: apiResponse.code
        }
      }

      return {
        success: true,
        data: apiResponse.data,
        message: apiResponse.message,
        code: apiResponse.code
      }
    } catch (error: any) {
      logger.error('AttendanceService', 'checkIn', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async createManualAttendance(data: ManualAttendanceRequest): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.attendance.manual, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      return {
        success: true,
        data: apiResponse.data,
        message: apiResponse.message
      }
    } catch (error: any) {
      logger.error('AttendanceService', 'createManualAttendance', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async checkOut(data: CheckOutRequest): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.attendance.checkOut, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      return {
        success: true,
        data: apiResponse.data,
        message: apiResponse.message
      }
    } catch (error: any) {
      logger.error('AttendanceService', 'checkOut', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getUserAttendance(params: GetUserAttendanceParams): Promise<ResponseResult<any[]>> {
    const { userId, fromDate, toDate } = params
    const queryParams: any = {}

    if (fromDate) queryParams.fromDate = fromDate
    if (toDate) queryParams.toDate = toDate

    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.attendance.byUser(userId), { params: queryParams })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return {
        success: true,
        data: apiResponse.data?.records || apiResponse.data || []
      }
    } catch (error) {
      logger.error('AttendanceService', 'getUserAttendance', error)
      return { success: true, data: [] }
    }
  }

  async getMyAttendance(params?: Omit<GetUserAttendanceParams, 'userId'>): Promise<ResponseResult<any[]>> {
    const queryParams: any = {}

    if (params?.fromDate) queryParams.fromDate = params.fromDate
    if (params?.toDate) queryParams.toDate = params.toDate

    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.attendance.my, { params: queryParams })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return {
        success: true,
        data: apiResponse.data?.records || apiResponse.data || []
      }
    } catch (error) {
      logger.error('AttendanceService', 'getMyAttendance', error)
      return { success: true, data: [] }
    }
  }

  async createTicket(data: CreateTicketRequest): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.attendance.tickets, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      return {
        success: true,
        data: apiResponse.data,
        message: apiResponse.message
      }
    } catch (error: any) {
      logger.error('AttendanceService', 'createTicket', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async approveTicket(ticketId: string, data: TicketApprovalRequest): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.attendance.ticketApproval(ticketId), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      return {
        success: true,
        data: apiResponse.data,
        message: apiResponse.message
      }
    } catch (error: any) {
      logger.error('AttendanceService', 'approveTicket', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getAdminOverview(params?: {
    month?: number
    year?: number
    instructorId?: string
    classId?: string
  }): Promise<ResponseResult<AttendanceAdminOverviewType>> {
    return apiList(
      () => apiClient.get<any>(API_ENDPOINTS.attendance.adminOverview, { params }),
      data => data
    ) as unknown as Promise<ResponseResult<AttendanceAdminOverviewType>>
  }

  async getInstructorAttendanceStats(params?: {
    month?: number
    year?: number
    instructorId?: string
  }): Promise<ResponseResult<InstructorMonthlyStatsType[]>> {
    return apiList(
      () => apiClient.get<any>(API_ENDPOINTS.attendance.adminInstructorStats, { params }),
      data => (Array.isArray(data) ? data : [])
    )
  }

  async getClassAttendanceSummary(params?: {
    month?: number
    year?: number
    classId?: string
  }): Promise<ResponseResult<ClassAttendanceSummaryType[]>> {
    return apiList(
      () => apiClient.get<any>(API_ENDPOINTS.attendance.adminClassSummary, { params }),
      data => (Array.isArray(data) ? data : [])
    )
  }
}

export default new AttendanceService()
