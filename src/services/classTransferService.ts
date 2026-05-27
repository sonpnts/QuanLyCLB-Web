import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { ClassTransferType } from '@/types/apps/classTransferTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

// Query parameters for GET /class-transfers
export interface GetClassTransfersParams {
  pageNumber?: number
  pageSize?: number
  studentId?: string
  fromClassId?: string
  toClassId?: string
  status?: string
  requestDateFrom?: string
  requestDateTo?: string
}

// Request body for POST /class-transfers
export interface CreateClassTransferRequest {
  studentId: string
  fromClassId: string
  toClassId: string
  reason: string
}

// Request body for PUT /class-transfers/{id}
export interface UpdateClassTransferRequest {
  toClassId: string
  reason: string
}

// Request body for approve
export interface ApproveClassTransferRequest {
  approvalNotes?: string
}

// Request body for reject
export interface RejectClassTransferRequest {
  rejectionReason: string
}

class ClassTransferService {
  async getClassTransfers(params?: GetClassTransfersParams): Promise<ResponseResult<ClassTransferType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.classTransfers.root, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return {
        success: true,
        data: apiResponse.data?.items || apiResponse.data?.records || []
      }
    } catch (error) {
      logger.error('ClassTransferService', 'getClassTransfers', error)
      
return { success: true, data: [] }
    }
  }

  async createClassTransfer(data: CreateClassTransferRequest): Promise<ResponseResult<ClassTransferType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.classTransfers.root, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('ClassTransferService', 'createClassTransfer', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async updateClassTransfer(id: string, data: UpdateClassTransferRequest): Promise<ResponseResult<ClassTransferType>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.classTransfers.byId(id), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('ClassTransferService', 'updateClassTransfer', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async approveClassTransfer(
    id: string,
    data: ApproveClassTransferRequest
  ): Promise<ResponseResult<ClassTransferType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.classTransfers.approve(id), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('ClassTransferService', 'approveClassTransfer', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async rejectClassTransfer(id: string, data: RejectClassTransferRequest): Promise<ResponseResult<ClassTransferType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.classTransfers.reject(id), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('ClassTransferService', 'rejectClassTransfer', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async cancelClassTransfer(id: string): Promise<ResponseResult<ClassTransferType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.classTransfers.cancel(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('ClassTransferService', 'cancelClassTransfer', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async deleteClassTransfer(id: string): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.delete<any>(API_ENDPOINTS.classTransfers.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      logger.error('ClassTransferService', 'deleteClassTransfer', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getTransfersByStudent(studentId: string): Promise<ResponseResult<ClassTransferType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.classTransfers.byStudent(studentId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return { success: true, data: apiResponse.data || [] }
    } catch (error) {
      logger.error('ClassTransferService', 'getTransfersByStudent', error)
      
return { success: true, data: [] }
    }
  }

  async getPendingTransfers(): Promise<ResponseResult<ClassTransferType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.classTransfers.pending)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return { success: true, data: apiResponse.data || [] }
    } catch (error) {
      logger.error('ClassTransferService', 'getPendingTransfers', error)
      
return { success: true, data: [] }
    }
  }
}

const classTransferService = new ClassTransferService()

export default classTransferService
