import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { ClassType } from '@/types/apps/classTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

// Query parameters for GET /api/Classes - Theo API Documentation
export interface GetClassesParams {
  pageNumber?: number
  pageSize?: number
  keyword?: string
}

// Request body for POST /api/Classes
export interface CreateClassRequest {
  code: string
  name: string
  description?: string
  maxStudents: number
  userIds?: string[] // Array of instructor UUIDs
}

// Request body for PUT /api/Classes/{id}
export interface UpdateClassRequest {
  name?: string
  description?: string
  maxStudents?: number
  userIds?: string[]
}

// Request body for bulk create schedules
export interface BulkCreateScheduleRequest {
  branchId: string
  daysOfWeek: number[]
  startTime: string
  endTime: string
}

export interface ClassInfo {
  id?: string
  code?: string
  name: string
  description?: string
  maxStudents?: number
  isActive?: boolean
}

// API response type from /api/Classes
export interface ApiClassCoach {
  userId: string
  fullName: string
  email?: string | null
  phoneNumber?: string | null
  skillLevel?: string | null
  isLeadInstructor: boolean
}

export interface ApiClassAssistant {
  assistantId: string
  fullName: string
  email?: string | null
  phoneNumber?: string | null
  skillLevel?: string | null
  roleName: string
}

export interface ApiClassResponse {
  id: string
  code: string
  name: string
  description?: string
  maxStudents: number
  userIds?: string[] // API trả về userIds thay vì coachIds
  coaches?: ApiClassCoach[]
  assistants?: ApiClassAssistant[]
  isActive?: boolean
  createdAt?: string
  updatedAt?: string | null
  createdByUserId?: string | null
  updatedByUserId?: string | null
}

class ClassService {
  private mapApiClassToClassType(apiClass: ApiClassResponse): ClassType {
    return {
      id: apiClass.id,
      code: apiClass.code,
      name: apiClass.name,
      description: apiClass.description,
      maxStudents: apiClass.maxStudents,
      instructorId: apiClass.userIds?.[0],
      isActive: apiClass.isActive !== undefined ? apiClass.isActive : true,
      createdDate: apiClass.createdAt,
      createdBy: apiClass.createdByUserId || undefined,
      updatedDate: apiClass.updatedAt || undefined,
      updatedBy: apiClass.updatedByUserId || undefined,
      coachIds: apiClass.userIds || [], // Map userIds sang coachIds cho frontend
      coaches: apiClass.coaches || [],
      assistants: apiClass.assistants || []
    }
  }

  async getClasses(params?: GetClassesParams): Promise<ResponseResult<ClassType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.classes.root, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      const records: ApiClassResponse[] = apiResponse.data?.records || []

      return { success: true, data: records.map(this.mapApiClassToClassType) }
    } catch (error) {
      logger.error('ClassService', 'getClasses', error)
      return { success: true, data: [] }
    }
  }

  async getClassById(id: string): Promise<ResponseResult<ClassType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.classes.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      const classData = this.mapApiClassToClassType(apiResponse.data)

      return {
        success: true,
        data: classData
      }
    } catch (error: any) {
      logger.error('ClassService', 'getClassById', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async createClass(data: CreateClassRequest): Promise<ResponseResult<ClassType>> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.classes.root, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      return {
        success: true,
        data: apiResponse.data,
        message: apiResponse.message
      }
    } catch (error: any) {
      logger.error('ClassService', 'createClass', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async updateClass(id: string, data: UpdateClassRequest): Promise<ResponseResult<ClassType>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.classes.byId(id), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      const classData = this.mapApiClassToClassType(apiResponse.data)

      return {
        success: true,
        data: classData,
        message: apiResponse.message
      }
    } catch (error: any) {
      logger.error('ClassService', 'updateClass', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async deleteClass(id: string): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.delete<any>(API_ENDPOINTS.classes.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      return {
        success: true,
        message: apiResponse.message
      }
    } catch (error: any) {
      logger.error('ClassService', 'deleteClass', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async restoreClass(id: string): Promise<ResponseResult<ClassType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.classes.restore(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      const classData = this.mapApiClassToClassType(apiResponse.data)

      return {
        success: true,
        data: classData,
        message: apiResponse.message
      }
    } catch (error: any) {
      logger.error('ClassService', 'restoreClass', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getClassSchedules(classId: string): Promise<ResponseResult<any[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.classes.schedules(classId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      // Backend có thể trả về plain array, paginated { records: [...] } hoặc { items: [...] }
      const raw = apiResponse.data
      const data = Array.isArray(raw) ? raw : raw?.records || raw?.items || []

      return { success: true, data }
    } catch (error) {
      logger.error('ClassService', 'getClassSchedules', error)
      return { success: true, data: [] }
    }
  }

  async createClassSchedules(classId: string, data: BulkCreateScheduleRequest): Promise<ResponseResult<any[]>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.classes.schedules(classId), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return { success: true, data: apiResponse.data || [], message: apiResponse.message }
    } catch (error: any) {
      logger.error('ClassService', 'createClassSchedules', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getClassStudents(classId: string): Promise<ResponseResult<any[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.classes.students(classId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return { success: true, data: apiResponse.data?.records || apiResponse.data?.items || apiResponse.data || [] }
    } catch (error) {
      logger.error('ClassService', 'getClassStudents', error)
      return { success: true, data: [] }
    }
  }

  async getClassAttendance(
    classId: string,
    params?: { fromDate?: string; toDate?: string }
  ): Promise<ResponseResult<any[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.classes.attendance(classId), { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return { success: true, data: apiResponse.data || [] }
    } catch (error) {
      logger.error('ClassService', 'getClassAttendance', error)
      return { success: true, data: [] }
    }
  }

  async getClassPayments(classId: string): Promise<ResponseResult<any[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.classes.payments(classId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return { success: true, data: apiResponse.data || [] }
    } catch (error) {
      logger.error('ClassService', 'getClassPayments', error)
      return { success: true, data: [] }
    }
  }

  async duplicateClass(
    classId: string,
    data: { newCode: string; newName: string; copySchedules?: boolean; copyInstructors?: boolean }
  ): Promise<ResponseResult<ClassType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.classes.duplicate(classId), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('ClassService', 'duplicateClass', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

const classService = new ClassService()

export default classService
