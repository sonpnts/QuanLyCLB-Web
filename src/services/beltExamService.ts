import { apiClient } from '@/utils/apiClient'
import type { ExamSessionType, ExamRegistrationType, BeltLevelType } from '@/types/apps/beltExamTypes'
import type { ResponseResult } from '@/types/common'

// Request body for POST /belt-exams/sessions
export interface CreateExamSessionRequest {
  name: string
  examDate: string
  registrationDeadline: string
  beltLevelId: string
  examFee: number
  maxCandidates: number
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
    const response = await apiClient.get<any>('/belt-exams/sessions')
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return {
      success: true,
      data: apiResponse.data?.items || apiResponse.data?.records || apiResponse.data || []
    }
  }

  async createExamSession(data: CreateExamSessionRequest): Promise<ResponseResult<ExamSessionType>> {
    const response = await apiClient.post<any>('/belt-exams/sessions', data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async submitExamSession(id: string): Promise<ResponseResult<ExamSessionType>> {
    const response = await apiClient.post<any>(`/belt-exams/sessions/${id}/submit`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async approveExamSession(id: string): Promise<ResponseResult<ExamSessionType>> {
    const response = await apiClient.post<any>(`/belt-exams/sessions/${id}/approve`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async rejectExamSession(id: string): Promise<ResponseResult<ExamSessionType>> {
    const response = await apiClient.post<any>(`/belt-exams/sessions/${id}/reject`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  // Exam Registrations
  async getExamRegistrations(): Promise<ResponseResult<ExamRegistrationType[]>> {
    const response = await apiClient.get<any>('/belt-exams/registrations')
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
    const response = await apiClient.post<any>('/belt-exams/registrations', data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async batchExamRegistration(data: BatchExamRegistrationRequest): Promise<ResponseResult<ExamRegistrationType[]>> {
    const response = await apiClient.post<any>('/belt-exams/registrations/batch', data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async approveExamRegistration(id: string): Promise<ResponseResult<ExamRegistrationType>> {
    const response = await apiClient.post<any>(`/belt-exams/registrations/${id}/approve`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async rejectExamRegistration(id: string): Promise<ResponseResult<ExamRegistrationType>> {
    const response = await apiClient.post<any>(`/belt-exams/registrations/${id}/reject`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async updateExamResult(id: string, data: UpdateExamResultRequest): Promise<ResponseResult<ExamRegistrationType>> {
    const response = await apiClient.put<any>(`/belt-exams/registrations/${id}/result`, data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  // Belt Levels - NOTE: API chưa có, cần backend bổ sung
  async getBeltLevels(): Promise<ResponseResult<BeltLevelType[]>> {
    try {
      const response = await apiClient.get<any>('/belt-levels')
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
