import { apiClient } from '@/utils/apiClient'
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
    const response = await apiClient.get<any>(API_ENDPOINTS.leaveRequests.root, { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return {
      success: true,
      data: apiResponse.data?.items || apiResponse.data?.records || []
    }
  }

  async getLeaveRequestById(id: string): Promise<ResponseResult<LeaveRequestType>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.leaveRequests.byId(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data }
  }

  async createLeaveRequest(data: CreateLeaveRequestRequest): Promise<ResponseResult<LeaveRequestType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.leaveRequests.root, data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async updateLeaveRequest(id: string, data: UpdateLeaveRequestRequest): Promise<ResponseResult<LeaveRequestType>> {
    const response = await apiClient.put<any>(API_ENDPOINTS.leaveRequests.byId(id), data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async deleteLeaveRequest(id: string): Promise<ResponseResult<void>> {
    const response = await apiClient.delete<any>(API_ENDPOINTS.leaveRequests.byId(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, message: apiResponse.message }
  }

  async approveLeaveRequest(id: string, data: ApproveLeaveRequestRequest): Promise<ResponseResult<LeaveRequestType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.leaveRequests.approve(id), data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async rejectLeaveRequest(id: string, data: RejectLeaveRequestRequest): Promise<ResponseResult<LeaveRequestType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.leaveRequests.reject(id), data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async getPendingRequests(): Promise<ResponseResult<LeaveRequestType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.leaveRequests.pending)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }

  async getMyRequests(): Promise<ResponseResult<LeaveRequestType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.leaveRequests.myRequests)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }
}

const leaveRequestService = new LeaveRequestService()
export default leaveRequestService
