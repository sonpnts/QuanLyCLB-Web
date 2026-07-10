import { apiClient } from '@/utils/apiClient'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { apiList } from '@/utils/serviceHelper'
import { logger } from '@/utils/logger'
import type {
  AttendanceAdminOverviewType,
  InstructorMonthlyStatsType,
  ClassAttendanceSummaryType,
  MakeupTicket,
  MakeupTicketListResponse,
  CreateMakeupTicketRequest,
  TicketApprovalRequest as MakeupTicketApprovalRequest,
  TicketType
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
  classId?: string
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

  async getMyRecentAttendance(count: number = 5): Promise<ResponseResult<any[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.attendance.myRecent(count))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, data: [], message: apiResponse.message }
      }

      return {
        success: true,
        data: apiResponse.data || []
      }
    } catch (error) {
      logger.error('AttendanceService', 'getMyRecentAttendance', error)
      return { success: false, data: [], message: 'Lỗi kết nối máy chủ' }
    }
  }

  async getUserAttendanceDetail(userId: string, month: number, year: number): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.attendance.userDetail(userId, month, year))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, data: null, message: apiResponse.message }
      }

      return {
        success: true,
        data: apiResponse.data
      }
    } catch (error) {
      logger.error('AttendanceService', 'getUserAttendanceDetail', error)
      return { success: false, data: null, message: 'Lỗi kết nối máy chủ' }
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

  async generateAttendanceReport(data: {
    userIds?: string[]
    month: number
    year: number
    sendEmail: boolean
  }): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.attendance.adminGenerateReport, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('AttendanceService', 'generateAttendanceReport', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getAttendanceHistoryList(month: number, year: number): Promise<ResponseResult<any[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.attendance.adminHistoryList, {
        params: { month, year }
      })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, data: [], message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data || [], message: apiResponse.message }
    } catch (error: any) {
      logger.error('AttendanceService', 'getAttendanceHistoryList', error)
      return { success: false, data: [], message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getMyAttendanceHistory(month: number, year: number): Promise<ResponseResult<any[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.attendance.myHistory, {
        params: { month, year }
      })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, data: [], message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data || [], message: apiResponse.message }
    } catch (error: any) {
      logger.error('AttendanceService', 'getMyAttendanceHistory', error)
      return { success: false, data: [], message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getReportHistory(month?: number, year?: number): Promise<ResponseResult<any[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.attendance.reportHistory(month, year))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, data: [], message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data || [], message: apiResponse.message }
    } catch (error: any) {
      logger.error('AttendanceService', 'getReportHistory', error)
      return { success: false, data: [], message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async downloadReport(reportId: string): Promise<Blob | null> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.attendance.reportDownload(reportId), {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      logger.error('AttendanceService', 'downloadReport', error)
      return null
    }
  }

  async getMakeupTickets(params?: {
    page?: number
    pageSize?: number
    status?: string
    ticketType?: TicketType
    fromDate?: string
    toDate?: string
    userId?: string
  }): Promise<ResponseResult<MakeupTicketListResponse>> {
    try {
      const queryParams: any = {}
      if (params?.page) queryParams.page = params.page
      if (params?.pageSize) queryParams.pageSize = params.pageSize
      if (params?.status) queryParams.status = params.status
      if (params?.ticketType) queryParams.ticketType = params.ticketType
      if (params?.fromDate) queryParams.fromDate = params.fromDate
      if (params?.toDate) queryParams.toDate = params.toDate
      if (params?.userId) queryParams.userId = params.userId

      const response = await apiClient.get<any>(API_ENDPOINTS.attendance.tickets, { params: queryParams })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return {
        success: true,
        data: apiResponse.data
      }
    } catch (error: any) {
      logger.error('AttendanceService', 'getMakeupTickets', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getMyMakeupTickets(params?: {
    page?: number
    pageSize?: number
    status?: string
    ticketType?: TicketType
    fromDate?: string
    toDate?: string
  }): Promise<ResponseResult<MakeupTicketListResponse>> {
    try {
      const queryParams: any = {}
      if (params?.page) queryParams.page = params.page
      if (params?.pageSize) queryParams.pageSize = params.pageSize
      if (params?.status) queryParams.status = params.status
      if (params?.ticketType) queryParams.ticketType = params.ticketType
      if (params?.fromDate) queryParams.fromDate = params.fromDate
      if (params?.toDate) queryParams.toDate = params.toDate

      const response = await apiClient.get<any>(`${API_ENDPOINTS.attendance.tickets}/my`, { params: queryParams })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return {
        success: true,
        data: apiResponse.data
      }
    } catch (error: any) {
      logger.error('AttendanceService', 'getMyMakeupTickets', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getAvailableSchedulesForMakeup(params: {
    month: number
    year: number
    ticketType: TicketType
  }): Promise<ResponseResult<any[]>> {
    try {
      const response = await apiClient.get<any>(`${API_ENDPOINTS.attendance.tickets}/available-schedules`, {
        params: { month: params.month, year: params.year, ticketType: params.ticketType }
      })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, data: [], message: apiResponse.message }
      }

      return {
        success: true,
        data: apiResponse.data || []
      }
    } catch (error: any) {
      logger.error('AttendanceService', 'getAvailableSchedulesForMakeup', error)
      return { success: false, data: [], message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async createMakeupTicket(data: CreateMakeupTicketRequest): Promise<ResponseResult<MakeupTicket>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.attendance.tickets, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return {
        success: true,
        data: apiResponse.data,
        message: apiResponse.message
      }
    } catch (error: any) {
      logger.error('AttendanceService', 'createMakeupTicket', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async approveMakeupTicket(ticketId: string, data: MakeupTicketApprovalRequest): Promise<ResponseResult<MakeupTicket>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.attendance.ticketApproval(ticketId), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return {
        success: true,
        data: apiResponse.data,
        message: apiResponse.message
      }
    } catch (error: any) {
      logger.error('AttendanceService', 'approveMakeupTicket', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getUnassignedAttendances(params?: {
    fromDate?: string
    toDate?: string
  }): Promise<ResponseResult<any[]>> {
    try {
      const queryParams: any = {}
      if (params?.fromDate) queryParams.fromDate = params.fromDate
      if (params?.toDate) queryParams.toDate = params.toDate

      const response = await apiClient.get<any>(API_ENDPOINTS.attendance.unassigned, { params: queryParams })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, data: [], message: apiResponse.message }
      }

      const data = apiResponse.data
      return {
        success: true,
        data: data?.records || data || []
      }
    } catch (error: any) {
      logger.error('AttendanceService', 'getUnassignedAttendances', error)
      return { success: false, data: [], message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getMissedSessions(params?: {
    month?: number
    year?: number
  }): Promise<ResponseResult<any[]>> {
    try {
      const queryParams: any = {}
      if (params?.month) queryParams.month = params.month
      if (params?.year) queryParams.year = params.year

      const response = await apiClient.get<any>(API_ENDPOINTS.attendance.missedSessions, { params: queryParams })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, data: [], message: apiResponse.message }
      }

      return {
        success: true,
        data: apiResponse.data || []
      }
    } catch (error: any) {
      logger.error('AttendanceService', 'getMissedSessions', error)
      return { success: false, data: [], message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getAdminAllRecords(params?: {
    month?: number
    year?: number
    userId?: string
    pageNumber?: number
    pageSize?: number
  }): Promise<ResponseResult<any>> {
    try {
      const queryParams: any = {}
      if (params?.month) queryParams.month = params.month
      if (params?.year) queryParams.year = params.year
      if (params?.userId) queryParams.userId = params.userId
      if (params?.pageNumber) queryParams.pageNumber = params.pageNumber
      if (params?.pageSize) queryParams.pageSize = params.pageSize

      const response = await apiClient.get<any>(API_ENDPOINTS.attendance.adminAllRecords, { params: queryParams })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, data: null, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('AttendanceService', 'getAdminAllRecords', error)
      return { success: false, data: null, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getAdminAllPairs(params?: {
    month?: number
    year?: number
    userId?: string
    pageNumber?: number
    pageSize?: number
  }): Promise<ResponseResult<any>> {
    try {
      const queryParams: any = {}
      if (params?.month) queryParams.month = params.month
      if (params?.year) queryParams.year = params.year
      if (params?.userId) queryParams.userId = params.userId
      if (params?.pageNumber) queryParams.pageNumber = params.pageNumber
      if (params?.pageSize) queryParams.pageSize = params.pageSize

      const response = await apiClient.get<any>(API_ENDPOINTS.attendance.adminAllPairs, { params: queryParams })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, data: null, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('AttendanceService', 'getAdminAllPairs', error)
      return { success: false, data: null, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async updateAttendanceTime(data: { id: string; newCheckedInAt: string }): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.attendance.adminUpdateRecord, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, data: null, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('AttendanceService', 'updateAttendanceTime', error)
      return { success: false, data: null, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async cancelAttendanceRecord(recordId: string): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.delete<any>(API_ENDPOINTS.attendance.adminCancelRecord(recordId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, data: null, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('AttendanceService', 'cancelAttendanceRecord', error)
      return { success: false, data: null, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

export default new AttendanceService()
