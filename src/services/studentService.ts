import { apiClient } from '@/utils/apiClient'
import type { StudentType, EnrollmentType, TuitionStatusType, ExamHistoryType } from '@/types/apps/studentTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

// Query parameters for GET /api/Students - Theo API Documentation
export interface GetStudentsParams {
  pageNumber?: number
  pageSize?: number
  keyword?: string
  classId?: string
  beltLevelId?: string
  gender?: boolean
  enrollmentStatus?: string // Active, Inactive, Completed
}

// Request body for POST /api/Students
export interface CreateStudentRequest {
  fullName: string
  phoneNumber?: string
  address?: string
  identityNumber?: string
  dateOfBirth?: string
  email?: string
  gender?: boolean
  notes?: string
  currentBeltLevelId?: string
}

// Request body for POST /api/Students/enroll
export interface EnrollStudentRequest {
  studentId: string
  classId: string
  enrollmentDate: string
  notes?: string
}

class StudentService {
  async getStudents(params?: GetStudentsParams): Promise<ResponseResult<StudentType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.students.root, { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return {
      success: true,
      data: apiResponse.data?.items || apiResponse.data?.records || []
    }
  }

  async getStudentById(id: string): Promise<ResponseResult<StudentType>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.students.byId(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data }
  }

  async createStudent(data: CreateStudentRequest): Promise<ResponseResult<StudentType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.students.root, data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async updateStudent(id: string, data: Partial<CreateStudentRequest>): Promise<ResponseResult<StudentType>> {
    const response = await apiClient.put<any>(API_ENDPOINTS.students.byId(id), data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async deleteStudent(id: string): Promise<ResponseResult<void>> {
    const response = await apiClient.delete<any>(API_ENDPOINTS.students.byId(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, message: apiResponse.message }
  }

  async restoreStudent(id: string): Promise<ResponseResult<StudentType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.students.restore(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async getStudentEnrollments(studentId: string): Promise<ResponseResult<EnrollmentType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.students.enrollments(studentId))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }

  async enrollStudent(data: EnrollStudentRequest): Promise<ResponseResult<EnrollmentType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.students.enroll, data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async getStudentsByClass(classId: string): Promise<ResponseResult<StudentType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.students.byClass(classId))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }

  async getTuitionStatus(
    studentId: string,
    classId: string,
    month: number,
    year: number
  ): Promise<ResponseResult<TuitionStatusType>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.students.tuitionStatus(studentId), {
      params: { classId, month, year }
    })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data }
  }

  async getExamHistory(studentId: string): Promise<ResponseResult<ExamHistoryType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.students.examHistory(studentId))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }

  async getStudentPayments(
    studentId: string,
    params?: { fromDate?: string; toDate?: string }
  ): Promise<ResponseResult<any[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.students.payments(studentId), { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }

  async getStudentAttendance(
    studentId: string,
    params?: { fromDate?: string; toDate?: string }
  ): Promise<ResponseResult<any[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.students.attendance(studentId), { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }
}

const studentService = new StudentService()
export default studentService
