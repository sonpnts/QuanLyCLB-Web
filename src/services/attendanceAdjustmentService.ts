import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import type { ResponseResult } from '@/types/common'

export type AdjustmentStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'

export type AttendanceType = 'CheckIn' | 'CheckOut' | 'MakeupCheckIn' | 'MakeupCheckOut'

export interface AttendanceAdjustmentType {
  id: string
  userId: string
  userName: string
  userFullName?: string
  adjustmentDate: string
  classId?: string
  className?: string
  classScheduleId?: string
  adjustmentType: AttendanceType
  dayOfWeek?: number
  startTime?: string
  endTime?: string
  branchName?: string
  requestedCheckInAt?: string
  requestedCheckOutAt?: string
  reason: string
  attachmentUrl?: string
  latitude?: number
  longitude?: number
  notes?: string
  status: AdjustmentStatus
  approvedByUserId?: string
  approvedByUserName?: string
  approvedAt?: string
  approvalNotes?: string
  attendanceRecordId?: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface CreateAdjustmentRequest {
  adjustmentDate: string
  classId?: string
  classScheduleId?: string
  adjustmentType: AttendanceType
  requestedCheckInAt?: string
  requestedCheckOutAt?: string
  reason: string
  attachmentUrl?: string
  latitude?: number
  longitude?: number
  notes?: string
}

export interface AdjustmentApprovalRequest {
  approve: boolean
  approvalNotes?: string
}

export interface AdjustmentFilterParams {
  month?: number
  year?: number
  userId?: string
  status?: AdjustmentStatus
  pageNumber?: number
  pageSize?: number
}

export interface PaginatedAdjustments {
  items: AttendanceAdjustmentType[]
  totalCount: number
  page: number
  pageSize: number
}

class AttendanceAdjustmentService {
  async getMyAdjustments(params?: AdjustmentFilterParams): Promise<ResponseResult<PaginatedAdjustments>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.attendanceAdjustments.my, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('AttendanceAdjustmentService', 'getMyAdjustments', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getAllAdjustments(params?: AdjustmentFilterParams): Promise<ResponseResult<PaginatedAdjustments>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.attendanceAdjustments.root, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('AttendanceAdjustmentService', 'getAllAdjustments', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getById(id: string): Promise<ResponseResult<AttendanceAdjustmentType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.attendanceAdjustments.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('AttendanceAdjustmentService', 'getById', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async create(request: CreateAdjustmentRequest): Promise<ResponseResult<string>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.attendanceAdjustments.root, request)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('AttendanceAdjustmentService', 'create', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async cancel(id: string): Promise<ResponseResult> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.attendanceAdjustments.cancel(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true }
    } catch (error: any) {
      logger.error('AttendanceAdjustmentService', 'cancel', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async approve(id: string, request: AdjustmentApprovalRequest): Promise<ResponseResult> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.attendanceAdjustments.approve(id), request)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true }
    } catch (error: any) {
      logger.error('AttendanceAdjustmentService', 'approve', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async reject(id: string, request: AdjustmentApprovalRequest): Promise<ResponseResult> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.attendanceAdjustments.reject(id), request)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true }
    } catch (error: any) {
      logger.error('AttendanceAdjustmentService', 'reject', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getPendingCount(): Promise<ResponseResult<number>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.attendanceAdjustments.pendingCount)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('AttendanceAdjustmentService', 'getPendingCount', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getMyPendingCount(): Promise<ResponseResult<number>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.attendanceAdjustments.myPendingCount)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('AttendanceAdjustmentService', 'getMyPendingCount', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async canCreateAdjustment(adjustmentDate: string): Promise<ResponseResult<{ canCreate: boolean }>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.attendanceAdjustments.canCreate, {
        params: { adjustmentDate }
      })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('AttendanceAdjustmentService', 'canCreateAdjustment', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

const attendanceAdjustmentService = new AttendanceAdjustmentService()

export default attendanceAdjustmentService
