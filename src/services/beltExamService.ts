import { apiClient } from '@/utils/apiClient'
import type {
  ExamSessionType,
  ExamRegistrationType,
  BeltLevelType,
  EligibleStudentForExamType,
  BeltExamRegistrationListType,
  CreateRegistrationListRequest,
  AdminExamSessionViewType
} from '@/types/apps/beltExamTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
// Request body for POST /belt-exams/sessions
export interface CreateExamSessionRequest {
  name: string
  description?: string
  examDate: string
  location?: string
  registrationDeadline?: string
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

  async openSession(id: string, registrationDeadline?: string): Promise<ResponseResult<ExamSessionType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.beltExams.openSession(id), {
        registrationDeadline: registrationDeadline || null
      })
      const apiResponse = response.data
      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối' }
    }
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

  // ─── Luồng HLV đăng ký thi cấp ───────────────────────────────────────────

  async getOpenSessions(): Promise<ResponseResult<ExamSessionType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.beltExams.openSessions)
      const apiResponse = response.data
      if (!apiResponse.isSuccess) return { success: false, data: [], message: apiResponse.message }

      return { success: true, data: apiResponse.data?.records || apiResponse.data || [] }
    } catch (error: any) {
      return { success: false, data: [], message: error?.response?.data?.message || 'Lỗi kết nối' }
    }
  }

  async getEligibleStudents(sessionId: string, classId: string): Promise<ResponseResult<EligibleStudentForExamType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.beltExams.eligibleStudents(sessionId, classId))
      const apiResponse = response.data
      if (!apiResponse.isSuccess) return { success: false, data: [], message: apiResponse.message }

      return { success: true, data: apiResponse.data || [] }
    } catch (error: any) {
      return { success: false, data: [], message: error?.response?.data?.message || 'Lỗi kết nối' }
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
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối' }
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
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối' }
    }
  }

  async submitRegistrationList(listId: string): Promise<ResponseResult<null>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.beltExams.submitRegistrationList(listId))
      const apiResponse = response.data
      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối' }
    }
  }

  async removeStudentFromList(listId: string, studentId: string): Promise<ResponseResult<null>> {
    try {
      const response = await apiClient.delete<any>(API_ENDPOINTS.beltExams.removeStudentFromList(listId, studentId))
      const apiResponse = response.data
      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối' }
    }
  }

  async lockSession(sessionId: string): Promise<ResponseResult<null>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.beltExams.lockSession(sessionId))
      const apiResponse = response.data
      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối' }
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
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối' }
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
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối' }
    }
  }
}

const beltExamService = new BeltExamService()
export default beltExamService
