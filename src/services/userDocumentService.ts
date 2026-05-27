import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { UserDocumentDto } from '@/types/apps/userDocumentTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

export interface GetDocumentsParams {
  pageNumber?: number
  pageSize?: number
  userId?: string
  studentId?: string
  documentType?: number
  status?: number
}

class UserDocumentService {
  // ── User-facing ─────────────────────────────────────────────────────────────

  async getMyDocuments(): Promise<ResponseResult<UserDocumentDto[]>> {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.userDocuments.my)
      const api = res.data

      
return { success: true, data: api.isSuccess ? api.data ?? [] : [] }
    } catch (error) {
      logger.error('UserDocumentService', 'getMyDocuments', error)
      
return { success: true, data: [] }
    }
  }

  async uploadMyDocument(documentType: number, file: File): Promise<ResponseResult<UserDocumentDto>> {
    try {
      const form = new FormData()

      form.append('DocumentType', String(documentType))
      form.append('File', file)

      const res = await apiClient.post<any>(API_ENDPOINTS.userDocuments.my, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const api = res.data

      if (!api.isSuccess) return { success: false, message: api.message }
      
return { success: true, data: api.data, message: api.message }
    } catch (error: any) {
      logger.error('UserDocumentService', 'uploadMyDocument', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async deleteMyDocument(id: string): Promise<ResponseResult<void>> {
    try {
      const res = await apiClient.delete<any>(API_ENDPOINTS.userDocuments.myDelete(id))
      const api = res.data

      if (!api.isSuccess) return { success: false, message: api.message }
      
return { success: true, message: api.message }
    } catch (error: any) {
      logger.error('UserDocumentService', 'deleteMyDocument', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  // ── Student-facing ───────────────────────────────────────────────────────────

  async getStudentDocuments(studentId: string): Promise<ResponseResult<UserDocumentDto[]>> {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.userDocuments.student(studentId))
      const api = res.data

      
return { success: true, data: api.isSuccess ? api.data ?? [] : [] }
    } catch (error) {
      logger.error('UserDocumentService', 'getStudentDocuments', error)
      
return { success: true, data: [] }
    }
  }

  async uploadStudentDocument(studentId: string, documentType: number, file: File): Promise<ResponseResult<UserDocumentDto>> {
    try {
      const form = new FormData()

      form.append('DocumentType', String(documentType))
      form.append('File', file)

      const res = await apiClient.post<any>(API_ENDPOINTS.userDocuments.student(studentId), form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const api = res.data

      if (!api.isSuccess) return { success: false, message: api.message }
      
return { success: true, data: api.data, message: api.message }
    } catch (error: any) {
      logger.error('UserDocumentService', 'uploadStudentDocument', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async deleteStudentDocument(studentId: string, docId: string): Promise<ResponseResult<void>> {
    try {
      const res = await apiClient.delete<any>(API_ENDPOINTS.userDocuments.studentDelete(studentId, docId))
      const api = res.data

      if (!api.isSuccess) return { success: false, message: api.message }
      
return { success: true, message: api.message }
    } catch (error: any) {
      logger.error('UserDocumentService', 'deleteStudentDocument', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  // ── Admin ────────────────────────────────────────────────────────────────────

  async getAllDocuments(params?: GetDocumentsParams): Promise<ResponseResult<UserDocumentDto[]>> {
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.userDocuments.root, { params })
      const api = res.data

      
return { success: true, data: api.isSuccess ? api.data?.records ?? [] : [] }
    } catch (error) {
      logger.error('UserDocumentService', 'getAllDocuments', error)
      
return { success: true, data: [] }
    }
  }

  async approveDocument(id: string): Promise<ResponseResult<UserDocumentDto>> {
    try {
      const res = await apiClient.post<any>(API_ENDPOINTS.userDocuments.approve(id))
      const api = res.data

      if (!api.isSuccess) return { success: false, message: api.message }
      
return { success: true, data: api.data, message: api.message }
    } catch (error: any) {
      logger.error('UserDocumentService', 'approveDocument', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async requestResubmission(id: string, reason: string): Promise<ResponseResult<UserDocumentDto>> {
    try {
      const res = await apiClient.post<any>(API_ENDPOINTS.userDocuments.requestResubmission(id), { reason })
      const api = res.data

      if (!api.isSuccess) return { success: false, message: api.message }
      
return { success: true, data: api.data, message: api.message }
    } catch (error: any) {
      logger.error('UserDocumentService', 'requestResubmission', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

const userDocumentService = new UserDocumentService()

export default userDocumentService
