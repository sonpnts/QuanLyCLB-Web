import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { StudentType, EnrollmentType, TuitionStatusType, ExamHistoryType } from '@/types/apps/studentTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

export interface GetStudentsParams {
  pageNumber?: number
  pageSize?: number
  keyword?: string
  classId?: string
  beltLevelId?: string
  gender?: boolean
  enrollmentStatus?: string
  isSuspended?: boolean
}

export interface CreateStudentRequest {
  fullName: string
  code?: string
  phoneNumber?: string
  address?: string
  dateOfBirth?: string
  email?: string
  gender?: boolean
  notes?: string
  currentBeltLevelId?: string
}

export interface ZaloUserInfo {
  user_id: string
  user_id_by_app?: string
  display_name?: string
  avatar?: string
  avatars?: { '240'?: string; '120'?: string }
  user_is_follower?: boolean
}

export interface ZaloVerifyResult {
  success: boolean
  isFollower: boolean
  error?: number
  message?: string
  data?: ZaloUserInfo
}

export interface EnrollStudentRequest {
  studentId: string
  classId: string
  enrollmentDate: string
  notes?: string
}

class StudentService {
  async getStudents(params?: GetStudentsParams): Promise<ResponseResult<StudentType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.students.root, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      return { success: true, data: apiResponse.data?.items || apiResponse.data?.records || [] }
    } catch (error) {
      logger.error('StudentService', 'getStudents', error)
      return { success: true, data: [] }
    }
  }

  async getStudentById(id: string): Promise<ResponseResult<StudentType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.students.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('StudentService', 'getStudentById', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async createStudent(data: CreateStudentRequest): Promise<ResponseResult<StudentType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.students.root, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('StudentService', 'createStudent', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async updateStudent(id: string, data: Partial<CreateStudentRequest>): Promise<ResponseResult<StudentType>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.students.byId(id), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('StudentService', 'updateStudent', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async deleteStudent(id: string): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.delete<any>(API_ENDPOINTS.students.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      logger.error('StudentService', 'deleteStudent', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async restoreStudent(id: string): Promise<ResponseResult<StudentType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.students.restore(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('StudentService', 'restoreStudent', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async suspendStudent(id: string, reason?: string): Promise<ResponseResult<StudentType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.students.suspend(id), { reason })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('StudentService', 'suspendStudent', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async resumeStudent(id: string): Promise<ResponseResult<StudentType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.students.resume(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('StudentService', 'resumeStudent', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getStudentEnrollments(studentId: string): Promise<ResponseResult<EnrollmentType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.students.enrollments(studentId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      return { success: true, data: apiResponse.data || [] }
    } catch (error) {
      logger.error('StudentService', 'getStudentEnrollments', error)
      return { success: true, data: [] }
    }
  }

  async enrollStudent(data: EnrollStudentRequest): Promise<ResponseResult<EnrollmentType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.students.enroll, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('StudentService', 'enrollStudent', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getStudentsByClass(classId: string): Promise<ResponseResult<StudentType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.students.byClass(classId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      return { success: true, data: apiResponse.data || [] }
    } catch (error) {
      logger.error('StudentService', 'getStudentsByClass', error)
      return { success: true, data: [] }
    }
  }

  async getTuitionStatus(studentId: string, classId: string, month: number, year: number): Promise<ResponseResult<TuitionStatusType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.students.tuitionStatus(studentId), {
        params: { classId, month, year }
      })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('StudentService', 'getTuitionStatus', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getExamHistory(studentId: string): Promise<ResponseResult<ExamHistoryType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.students.examHistory(studentId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      return { success: true, data: apiResponse.data || [] }
    } catch (error) {
      logger.error('StudentService', 'getExamHistory', error)
      return { success: true, data: [] }
    }
  }

  async getStudentPayments(studentId: string, params?: { fromDate?: string; toDate?: string }): Promise<ResponseResult<any[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.students.payments(studentId), { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      return { success: true, data: apiResponse.data || [] }
    } catch (error) {
      logger.error('StudentService', 'getStudentPayments', error)
      return { success: true, data: [] }
    }
  }

  async getStudentAttendance(studentId: string, params?: { fromDate?: string; toDate?: string }): Promise<ResponseResult<any[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.students.attendance(studentId), { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      return { success: true, data: apiResponse.data || [] }
    } catch (error) {
      logger.error('StudentService', 'getStudentAttendance', error)
      return { success: true, data: [] }
    }
  }

  async updateStudentZalo(studentId: string, userIdZalo: string, phoneNumber: string): Promise<ResponseResult<StudentType>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.students.zaloUpdate(studentId), { userIdZalo, phoneNumber })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('StudentService', 'updateStudentZalo', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async verifyZaloPhone(phoneNumber: string): Promise<ZaloVerifyResult> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.students.zaloVerifyPhone, {
        params: { phoneNumber }
      })
      return response.data as ZaloVerifyResult
    } catch (error: any) {
      logger.error('StudentService', 'verifyZaloPhone', error)
      return { success: false, isFollower: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

const studentService = new StudentService()
export default studentService
