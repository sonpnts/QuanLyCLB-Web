import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { StudentType, EnrollmentType, TuitionStatusType, ExamHistoryType } from '@/types/apps/studentTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

export type TuitionDiscountStatus = 'None' | 'Pending' | 'Approved' | 'Rejected' | number

export interface TuitionDiscountRequestPayload {
  discountAmount: number
  reason: string
  isExempt?: boolean
}

export interface DecideTuitionDiscountPayload {
  approve: boolean
  note?: string
}

export interface TuitionDiscountRequestRow {
  studentId: string
  studentCode: string
  studentName: string
  className?: string
  phoneNumber?: string
  discountAmount: number
  reason: string
  status: TuitionDiscountStatus
  requestedAt?: string
  requestedByUserId?: string
  requestedByName?: string
  decidedAt?: string
  decidedByUserId?: string
  decidedByName?: string
  decisionNote?: string
}

export interface PaginatedResult<T> {
  records: T[]
  totalRecords: number
}

export interface StudentAttendanceHistoryType {
  id: string
  studentId: string
  studentName: string
  studentPhone?: string
  classId: string
  className: string
  classScheduleId?: string
  attendanceDate: string
  isExcused: boolean
  reason?: string
  markedByUserId?: string
  markedByUserName?: string
  createdAt: string
  updatedAt?: string
}

export interface GetStudentsParams {
  pageNumber?: number
  pageSize?: number
  keyword?: string
  classId?: string
  withoutClass?: boolean
  beltLevelId?: string
  gender?: boolean
  enrollmentStatus?: string
  isSuspended?: boolean
}

export interface CreateStudentRequest {
  fullName: string
  classId: string
  code?: string
  phoneNumber?: string
  personalIdNumber?: string
  address?: string
  dateOfBirth?: string
  educationLevel: string
  gender?: boolean
  notes?: string
  currentBeltLevelId?: string
}

export interface UpdateStudentRequest {
  code?: string | null
  fullName?: string
  phoneNumber?: string
  personalIdNumber?: string | null
  address?: string
  dateOfBirth?: string
  educationLevel?: string
  gender?: boolean
  notes?: string
  isActive?: boolean
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

export interface StudentImportRowResult {
  rowNumber: number
  code: string
  fullName: string
  status: string
  message: string
}

export interface StudentImportResult {
  totalRows: number
  createdStudents: number
  enrolledStudents: number
  skippedRows: number
  rows: StudentImportRowResult[]
}

const unwrapList = (payload: any): any[] => {
  if (Array.isArray(payload?.records)) return payload.records
  if (Array.isArray(payload?.Records)) return payload.Records
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.Items)) return payload.Items
  if (Array.isArray(payload)) return payload

  return []
}

const unwrapPaginatedList = <T>(payload: any): PaginatedResult<T> => {
  const records = unwrapList(payload) as T[]

  const totalRecords =
    payload?.totalRecords ??
    payload?.TotalRecords ??
    payload?.totalCount ??
    payload?.TotalCount ??
    records.length

  return {
    records,
    totalRecords: Number(totalRecords || 0)
  }
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

  async getStudentsPaged(params?: GetStudentsParams): Promise<ResponseResult<PaginatedResult<StudentType>>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.students.root, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: { records: [], totalRecords: 0 } }
      }

      return { success: true, data: unwrapPaginatedList<StudentType>(apiResponse.data) }
    } catch (error) {
      logger.error('StudentService', 'getStudentsPaged', error)

      return { success: true, data: { records: [], totalRecords: 0 } }
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

  async updateStudent(id: string, data: UpdateStudentRequest): Promise<ResponseResult<StudentType>> {
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

  async getStudentPayments(
    studentId: string,
    params?: { fromDate?: string; toDate?: string; pageNumber?: number; pageSize?: number }
  ): Promise<ResponseResult<any[]>> {
    try {
      const normalizedParams = params
        ? {
            ...params,
            paymentDateFrom: params.fromDate,
            paymentDateTo: params.toDate
          }
        : undefined

      const response = await apiClient.get<any>(API_ENDPOINTS.students.payments(studentId), { params: normalizedParams })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      return { success: true, data: unwrapList(apiResponse.data) }
    } catch (error) {
      logger.error('StudentService', 'getStudentPayments', error)
      
return { success: true, data: [] }
    }
  }

  async getStudentAttendance(
    studentId: string,
    params?: { fromDate?: string; toDate?: string; pageNumber?: number; pageSize?: number; keyword?: string }
  ): Promise<ResponseResult<PaginatedResult<StudentAttendanceHistoryType>>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.students.attendance(studentId), { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: { records: [], totalRecords: 0 } }
      }

      return { success: true, data: unwrapPaginatedList<StudentAttendanceHistoryType>(apiResponse.data) }
    } catch (error) {
      logger.error('StudentService', 'getStudentAttendance', error)
      
 return { success: true, data: { records: [], totalRecords: 0 } }
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

  async requestTuitionDiscount(studentId: string, payload: TuitionDiscountRequestPayload): Promise<ResponseResult<StudentType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.students.tuitionDiscountRequest(studentId), payload)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }
      
return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('StudentService', 'requestTuitionDiscount', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async decideTuitionDiscount(studentId: string, payload: DecideTuitionDiscountPayload): Promise<ResponseResult<StudentType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.students.tuitionDiscountDecide(studentId), payload)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }
      
return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('StudentService', 'decideTuitionDiscount', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getMyTuitionDiscountRequests(params?: { pageNumber?: number; pageSize?: number; keyword?: string; status?: any }): Promise<ResponseResult<TuitionDiscountRequestRow[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.students.tuitionDiscountMy, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }
      
return { success: true, data: unwrapList(apiResponse.data) as TuitionDiscountRequestRow[] }
    } catch (error) {
      logger.error('StudentService', 'getMyTuitionDiscountRequests', error)
      
return { success: true, data: [] }
    }
  }

  async getPendingTuitionDiscountRequests(params?: { pageNumber?: number; pageSize?: number; keyword?: string }): Promise<ResponseResult<TuitionDiscountRequestRow[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.students.tuitionDiscountPending, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }
      
return { success: true, data: unwrapList(apiResponse.data) as TuitionDiscountRequestRow[] }
    } catch (error) {
      logger.error('StudentService', 'getPendingTuitionDiscountRequests', error)
      
return { success: true, data: [] }
    }
  }

  async getPendingTuitionDiscountRequestsPaged(params?: {
    pageNumber?: number
    pageSize?: number
    keyword?: string
  }): Promise<ResponseResult<PaginatedResult<TuitionDiscountRequestRow>>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.students.tuitionDiscountPending, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: { records: [], totalRecords: 0 } }
      
return { success: true, data: unwrapPaginatedList<TuitionDiscountRequestRow>(apiResponse.data) }
    } catch (error) {
      logger.error('StudentService', 'getPendingTuitionDiscountRequestsPaged', error)
      
return { success: true, data: { records: [], totalRecords: 0 } }
    }
  }

  async getHistoryTuitionDiscountRequestsPaged(params?: {
    pageNumber?: number
    pageSize?: number
    keyword?: string
    status?: any
  }): Promise<ResponseResult<PaginatedResult<TuitionDiscountRequestRow>>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.students.tuitionDiscountHistory, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: { records: [], totalRecords: 0 } }
      
return { success: true, data: unwrapPaginatedList<TuitionDiscountRequestRow>(apiResponse.data) }
    } catch (error) {
      logger.error('StudentService', 'getHistoryTuitionDiscountRequestsPaged', error)
      
return { success: true, data: { records: [], totalRecords: 0 } }
    }
  }

  async downloadImportTemplate(): Promise<ResponseResult<Blob>> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.students.importTemplate, { responseType: 'blob' })

      
return { success: true, data: response.data as Blob }
    } catch (error: any) {
      logger.error('StudentService', 'downloadImportTemplate', error)
      
return { success: false, message: error?.response?.data?.message || 'Không thể tải file mẫu' }
    }
  }

  async importStudents(classId: string, file: File): Promise<ResponseResult<StudentImportResult>> {
    try {
      const form = new FormData()

      form.append('classId', classId)
      form.append('file', file)

      const response = await apiClient.post<any>(API_ENDPOINTS.students.import, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }
      
return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('StudentService', 'importStudents', error)
      
return { success: false, message: error?.response?.data?.message || 'Import thất bại' }
    }
  }
}

const studentService = new StudentService()

export default studentService
