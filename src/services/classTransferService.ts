import { apiClient } from '@/utils/apiClient'
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
  reason?: string
}

// Request body for PUT /class-transfers/{id}
export interface UpdateClassTransferRequest {
  toClassId?: string
  reason?: string
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
    const response = await apiClient.get<any>(API_ENDPOINTS.classTransfers.root, { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return {
      success: true,
      data: apiResponse.data?.items || apiResponse.data?.records || []
    }
  }

  async createClassTransfer(data: CreateClassTransferRequest): Promise<ResponseResult<ClassTransferType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.classTransfers.root, data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async updateClassTransfer(id: string, data: UpdateClassTransferRequest): Promise<ResponseResult<ClassTransferType>> {
    const response = await apiClient.put<any>(API_ENDPOINTS.classTransfers.byId(id), data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async approveClassTransfer(
    id: string,
    data: ApproveClassTransferRequest
  ): Promise<ResponseResult<ClassTransferType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.classTransfers.approve(id), data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async rejectClassTransfer(id: string, data: RejectClassTransferRequest): Promise<ResponseResult<ClassTransferType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.classTransfers.reject(id), data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async cancelClassTransfer(id: string): Promise<ResponseResult<ClassTransferType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.classTransfers.cancel(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async deleteClassTransfer(id: string): Promise<ResponseResult<void>> {
    const response = await apiClient.delete<any>(API_ENDPOINTS.classTransfers.byId(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, message: apiResponse.message }
  }

  async getTransfersByStudent(studentId: string): Promise<ResponseResult<ClassTransferType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.classTransfers.byStudent(studentId))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }

  async getPendingTransfers(): Promise<ResponseResult<ClassTransferType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.classTransfers.pending)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }
}

const classTransferService = new ClassTransferService()
export default classTransferService
