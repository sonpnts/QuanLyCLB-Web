import { apiClient } from '@/utils/apiClient'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

export interface CheckInRequest {
  userId: string
  checkedInAt: string // DateTime
  latitude: number
  longitude: number
}

export interface CheckOutRequest {
  userId: string
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
    const response = await apiClient.post<any>(API_ENDPOINTS.attendance.checkIn, data)
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
  }

  async createManualAttendance(data: ManualAttendanceRequest): Promise<ResponseResult<any>> {
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
  }

  async checkOut(data: CheckOutRequest): Promise<ResponseResult<any>> {
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
  }

  async getUserAttendance(params: GetUserAttendanceParams): Promise<ResponseResult<any[]>> {
    const { userId, fromDate, toDate } = params
    const queryParams: any = {}

    if (fromDate) queryParams.fromDate = fromDate
    if (toDate) queryParams.toDate = toDate

    const response = await apiClient.get<any>(API_ENDPOINTS.attendance.byUser(userId), { params: queryParams })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        data: [],
        message: apiResponse.message
      }
    }

    return {
      success: true,
      data: apiResponse.data?.records || apiResponse.data || []
    }
  }

  async getMyAttendance(params?: Omit<GetUserAttendanceParams, 'userId'>): Promise<ResponseResult<any[]>> {
    const queryParams: any = {}

    if (params?.fromDate) queryParams.fromDate = params.fromDate
    if (params?.toDate) queryParams.toDate = params.toDate

    const response = await apiClient.get<any>(API_ENDPOINTS.attendance.my, { params: queryParams })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        data: [],
        message: apiResponse.message
      }
    }

    return {
      success: true,
      data: apiResponse.data?.records || apiResponse.data || []
    }
  }

  async createTicket(data: CreateTicketRequest): Promise<ResponseResult<any>> {
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
  }

  async approveTicket(ticketId: string, data: TicketApprovalRequest): Promise<ResponseResult<any>> {
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
  }
}

export default new AttendanceService()
