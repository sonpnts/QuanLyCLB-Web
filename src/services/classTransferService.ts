import { apiClient } from '@/utils/apiClient'
import type { ClassTransferType } from '@/types/apps/classTransferTypes'
import type { ResponseResult } from '@/types/common'

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
    const response = await apiClient.get<any>('/class-transfers', { params })
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
    const response = await apiClient.post<any>('/class-transfers', data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async updateClassTransfer(id: string, data: UpdateClassTransferRequest): Promise<ResponseResult<ClassTransferType>> {
    const response = await apiClient.put<any>(`/class-transfers/${id}`, data)
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
    const response = await apiClient.post<any>(`/class-transfers/${id}/approve`, data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async rejectClassTransfer(id: string, data: RejectClassTransferRequest): Promise<ResponseResult<ClassTransferType>> {
    const response = await apiClient.post<any>(`/class-transfers/${id}/reject`, data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async cancelClassTransfer(id: string): Promise<ResponseResult<ClassTransferType>> {
    const response = await apiClient.post<any>(`/class-transfers/${id}/cancel`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async deleteClassTransfer(id: string): Promise<ResponseResult<void>> {
    const response = await apiClient.delete<any>(`/class-transfers/${id}`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, message: apiResponse.message }
  }

  async getTransfersByStudent(studentId: string): Promise<ResponseResult<ClassTransferType[]>> {
    const response = await apiClient.get<any>(`/class-transfers/student/${studentId}`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }

  async getPendingTransfers(): Promise<ResponseResult<ClassTransferType[]>> {
    const response = await apiClient.get<any>('/class-transfers/pending')
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }
}

const classTransferService = new ClassTransferService()
export default classTransferService
