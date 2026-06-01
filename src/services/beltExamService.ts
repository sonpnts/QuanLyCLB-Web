import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import type {
  AdminExamSessionViewType,
  BeltExamRegistrationListType,
  BeltLevelType,
  CreateRegistrationListRequest,
  EligibleStudentForExamType,
  ExamRegistrationType,
  ExamSessionType
} from '@/types/apps/beltExamTypes'
import type { ResponseResult } from '@/types/common'
import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'

const unwrapList = (payload: any): any[] => {
  if (Array.isArray(payload?.records)) return payload.records
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload)) return payload

  return []
}

export interface CreateExamSessionRequest {
  name: string
  description?: string
  examDate: string
  location?: string
  registrationDeadline?: string
  examFee?: number
}

export interface UpdateExamSessionRequest {
  name: string
  description?: string
  examDate: string
  location?: string
  isActive: boolean
  registrationDeadline?: string
  examFee?: number
}

export interface CreateExamRegistrationRequest {
  examSessionId: string
  studentId: string
  classId: string
}

export interface BatchExamRegistrationRequest {
  examSessionId: string
  classId: string
  studentIds: string[]
}

export interface UpdateExamResultRequest {
  result: number
  score?: number
  notes?: string
}

class BeltExamService {
  async getExamSessions(): Promise<ResponseResult<ExamSessionType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.beltExams.sessions)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      return {
        success: true,
        data: unwrapList(apiResponse.data) as ExamSessionType[]
      }
    } catch (error) {
      logger.error('BeltExamService', 'getExamSessions', error)

      return { success: true, data: [] }
    }
  }

  async getExamSessionById(id: string): Promise<ResponseResult<ExamSessionType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.beltExams.sessionById(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('BeltExamService', 'getExamSessionById', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async createExamSession(data: CreateExamSessionRequest): Promise<ResponseResult<ExamSessionType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.beltExams.sessions, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('BeltExamService', 'createExamSession', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async updateExamSession(id: string, data: UpdateExamSessionRequest): Promise<ResponseResult<ExamSessionType>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.beltExams.sessionById(id), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('BeltExamService', 'updateExamSession', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async openSession(id: string): Promise<ResponseResult<ExamSessionType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.beltExams.openSession(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('BeltExamService', 'openSession', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getExamRegistrations(params?: any): Promise<ResponseResult<ExamRegistrationType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.beltExams.registrations, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      return {
        success: true,
        data: unwrapList(apiResponse.data) as ExamRegistrationType[]
      }
    } catch (error) {
      logger.error('BeltExamService', 'getExamRegistrations', error)

      return { success: true, data: [] }
    }
  }

  async createExamRegistration(data: CreateExamRegistrationRequest): Promise<ResponseResult<ExamRegistrationType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.beltExams.registrations, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('BeltExamService', 'createExamRegistration', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async batchExamRegistration(data: BatchExamRegistrationRequest): Promise<ResponseResult<ExamRegistrationType[]>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.beltExams.registrationBatch, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('BeltExamService', 'batchExamRegistration', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async updateExamResult(id: string, data: UpdateExamResultRequest): Promise<ResponseResult<ExamRegistrationType>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.beltExams.registrationResult(id), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('BeltExamService', 'updateExamResult', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getBeltLevels(): Promise<ResponseResult<BeltLevelType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.beltLevels.root)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      let data = apiResponse.data

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        data = data.items || data.records || []
      }

      return { success: true, data: Array.isArray(data) ? data : [] }
    } catch (error) {
      logger.error('BeltExamService', 'getBeltLevels', error)

      return { success: false, data: [], message: 'Không thể tải danh sách cấp đai' }
    }
  }

  async getOpenSessions(): Promise<ResponseResult<ExamSessionType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.beltExams.openSessions)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      return { success: true, data: apiResponse.data?.records || apiResponse.data || [] }
    } catch (error: any) {
      logger.error('BeltExamService', 'getOpenSessions', error)

      return { success: false, data: [], message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getEligibleStudents(sessionId: string, classId: string): Promise<ResponseResult<EligibleStudentForExamType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.beltExams.eligibleStudents(sessionId, classId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      return { success: true, data: apiResponse.data || [] }
    } catch (error: any) {
      logger.error('BeltExamService', 'getEligibleStudents', error)

      return { success: false, data: [], message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async createOrUpdateRegistrationList(
    sessionId: string,
    data: CreateRegistrationListRequest
  ): Promise<ResponseResult<BeltExamRegistrationListType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.beltExams.registrationList(sessionId), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('BeltExamService', 'createOrUpdateRegistrationList', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getMyRegistrationList(sessionId: string, classId: string): Promise<ResponseResult<BeltExamRegistrationListType>> {
    try {
      const response = await apiClient.get<any>(
        `${API_ENDPOINTS.beltExams.myRegistrationList(sessionId)}?classId=${classId}`
      )
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('BeltExamService', 'getMyRegistrationList', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async removeStudentFromList(listId: string, studentId: string): Promise<ResponseResult<null>> {
    try {
      const response = await apiClient.delete<any>(API_ENDPOINTS.beltExams.removeStudentFromList(listId, studentId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      logger.error('BeltExamService', 'removeStudentFromList', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async lockSession(sessionId: string): Promise<ResponseResult<null>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.beltExams.lockSession(sessionId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      logger.error('BeltExamService', 'lockSession', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getAdminView(sessionId: string, onlyPaid = true): Promise<ResponseResult<AdminExamSessionViewType>> {
    try {
      const response = await apiClient.get<any>(
        `${API_ENDPOINTS.beltExams.adminView(sessionId)}?onlyPaid=${onlyPaid}`
      )
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('BeltExamService', 'getAdminView', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async exportRegistrationList(sessionId: string, format: 'excel' | 'pdf'): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.get<any>(
        `${API_ENDPOINTS.beltExams.exportList(sessionId)}?format=${format}`
      )
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('BeltExamService', 'exportRegistrationList', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

const beltExamService = new BeltExamService()

export default beltExamService
