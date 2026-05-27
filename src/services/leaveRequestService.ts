import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { LeaveRequestType } from '@/types/apps/leaveRequestTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

// Query parameters for GET /leave-requests
export interface GetLeaveRequestsParams {
  pageNumber?: number
  pageSize?: number
  userId?: string
  leaveType?: number
  status?: number
  fromDate?: string
  toDate?: string
}

// Request body for POST /leave-requests
export interface CreateLeaveRequestRequest {
  leaveType: number
  startDate: string
  endDate: string
  reason: string
}

// Request body for PUT /leave-requests/{id}
export interface UpdateLeaveRequestRequest {
  leaveType?: number
  startDate?: string
  endDate?: string
  reason?: string
}

// Request body for approve
export interface ApproveLeaveRequestRequest {
  notes?: string
}

// Request body for reject
export interface RejectLeaveRequestRequest {
  reason: string
}

class LeaveRequestService {
  async getLeaveRequests(params?: GetLeaveRequestsParams): Promise<ResponseResult<LeaveRequestType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.leaveRequests.root, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return {
        success: true,
        data: apiResponse.data?.items || apiResponse.data?.records || []
      }
    } catch (error) {
      logger.error('LeaveRequestService', 'getLeaveRequests', error)
      
return { success: true, data: [] }
    }
  }

  async getLeaveRequestById(id: string): Promise<ResponseResult<LeaveRequestType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.leaveRequests.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('LeaveRequestService', 'getLeaveRequestById', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async createLeaveRequest(data: CreateLeaveRequestRequest): Promise<ResponseResult<LeaveRequestType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.leaveRequests.root, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('LeaveRequestService', 'createLeaveRequest', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async updateLeaveRequest(id: string, data: UpdateLeaveRequestRequest): Promise<ResponseResult<LeaveRequestType>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.leaveRequests.byId(id), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('LeaveRequestService', 'updateLeaveRequest', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async deleteLeaveRequest(id: string): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.delete<any>(API_ENDPOINTS.leaveRequests.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      logger.error('LeaveRequestService', 'deleteLeaveRequest', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async approveLeaveRequest(id: string, data: ApproveLeaveRequestRequest): Promise<ResponseResult<LeaveRequestType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.leaveRequests.approve(id), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('LeaveRequestService', 'approveLeaveRequest', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async rejectLeaveRequest(id: string, data: RejectLeaveRequestRequest): Promise<ResponseResult<LeaveRequestType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.leaveRequests.reject(id), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('LeaveRequestService', 'rejectLeaveRequest', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getPendingRequests(): Promise<ResponseResult<LeaveRequestType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.leaveRequests.pending)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return { success: true, data: apiResponse.data || [] }
    } catch (error) {
      logger.error('LeaveRequestService', 'getPendingRequests', error)
      
return { success: true, data: [] }
    }
  }

  async getMyRequests(): Promise<ResponseResult<LeaveRequestType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.leaveRequests.myRequests)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return { success: true, data: apiResponse.data || [] }
    } catch (error) {
      logger.error('LeaveRequestService', 'getMyRequests', error)
      
return { success: true, data: [] }
    }
  }
}

const leaveRequestService = new LeaveRequestService()

export default leaveRequestService
