import { apiClient } from '@/utils/apiClient'
import type { ExamSessionType, ExamRegistrationType, BeltLevelType } from '@/types/apps/beltExamTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
// Request body for POST /belt-exams/sessions
export interface CreateExamSessionRequest {
  name: string
  description?: string
  examDate: string
  location?: string
}

// Request body for POST /belt-exams/registrations
export interface CreateExamRegistrationRequest {
  examSessionId: string
  studentId: string
}

// Request body for batch registration
export interface BatchExamRegistrationRequest {
  examSessionId: string
  studentIds: string[]
}

// Request body for updating result
export interface UpdateExamResultRequest {
  result: number
  score?: number
  notes?: string
}

class BeltExamService {
  // Exam Sessions
  async getExamSessions(): Promise<ResponseResult<ExamSessionType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.beltExams.sessions)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return {
      success: true,
      data: apiResponse.data?.items || apiResponse.data?.records || apiResponse.data || []
    }
  }

  async getExamSessionById(id: string): Promise<ResponseResult<ExamSessionType>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.beltExams.sessionById(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async createExamSession(data: CreateExamSessionRequest): Promise<ResponseResult<ExamSessionType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.beltExams.sessions, data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async submitExamSession(id: string): Promise<ResponseResult<ExamSessionType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.beltExams.sessionSubmit(id))
    const apiResponse = response.data
    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async approveExamSession(id: string): Promise<ResponseResult<ExamSessionType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.beltExams.sessionApprove(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async rejectExamSession(id: string): Promise<ResponseResult<ExamSessionType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.beltExams.sessionReject(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  // Exam Registrations
  async getExamRegistrations(params?: any): Promise<ResponseResult<ExamRegistrationType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.beltExams.registrations, { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return {
      success: true,
      data: apiResponse.data?.items || apiResponse.data?.records || apiResponse.data || []
    }
  }

  async createExamRegistration(data: CreateExamRegistrationRequest): Promise<ResponseResult<ExamRegistrationType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.beltExams.registrations, data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async batchExamRegistration(data: BatchExamRegistrationRequest): Promise<ResponseResult<ExamRegistrationType[]>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.beltExams.registrationBatch, data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async approveExamRegistration(id: string): Promise<ResponseResult<ExamRegistrationType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.beltExams.registrationApprove(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async rejectExamRegistration(id: string): Promise<ResponseResult<ExamRegistrationType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.beltExams.registrationReject(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async updateExamResult(id: string, data: UpdateExamResultRequest): Promise<ResponseResult<ExamRegistrationType>> {
    const response = await apiClient.put<any>(API_ENDPOINTS.beltExams.registrationResult(id), data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  // Belt Levels - NOTE: API chưa có, cần backend bổ sung
  async getBeltLevels(): Promise<ResponseResult<BeltLevelType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.beltLevels.root)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, data: [], message: apiResponse.message }
      }

      // Handle different response formats
      let data = apiResponse.data

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        data = data.items || data.records || []
      }

      return { success: true, data: Array.isArray(data) ? data : [] }
    } catch (error) {
      console.error('Error fetching belt levels:', error)

      return { success: false, data: [], message: 'Không thể tải danh sách cấp đai' }
    }
  }
}

const beltExamService = new BeltExamService()
export default beltExamService
