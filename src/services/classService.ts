import { apiClient } from '@/utils/apiClient'
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
export interface ApiClassResponse {
  id: string
  code: string
  name: string
  description?: string
  maxStudents: number
  userIds?: string[] // API trả về userIds thay vì coachIds
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
      coachIds: apiClass.userIds || [] // Map userIds sang coachIds cho frontend
    }
  }

  async getClasses(params?: GetClassesParams): Promise<ResponseResult<ClassType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.classes.root, { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        data: [],
        message: apiResponse.message
      }
    }

    const records: ApiClassResponse[] = apiResponse.data?.records || []
    const classes = records.map(this.mapApiClassToClassType)

    return {
      success: true,
      data: classes
    }
  }

  async getClassById(id: string): Promise<ResponseResult<ClassType>> {
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
  }

  async createClass(data: CreateClassRequest): Promise<ResponseResult<ClassType>> {
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
  }

  async updateClass(id: string, data: UpdateClassRequest): Promise<ResponseResult<ClassType>> {
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
  }

  async deleteClass(id: string): Promise<ResponseResult<void>> {
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
  }

  async restoreClass(id: string): Promise<ResponseResult<ClassType>> {
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
  }

  async getClassSchedules(classId: string): Promise<ResponseResult<any[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.classes.schedules(classId))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }

  async createClassSchedules(classId: string, data: BulkCreateScheduleRequest): Promise<ResponseResult<any[]>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.classes.schedules(classId), data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [], message: apiResponse.message }
  }

  async getClassStudents(classId: string): Promise<ResponseResult<any[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.classes.students(classId))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data?.records || apiResponse.data?.items || apiResponse.data || [] }
  }

  async getClassAttendance(
    classId: string,
    params?: { fromDate?: string; toDate?: string }
  ): Promise<ResponseResult<any[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.classes.attendance(classId), { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }

  async getClassPayments(classId: string): Promise<ResponseResult<any[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.classes.payments(classId))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }

  async duplicateClass(
    classId: string,
    data: { newCode: string; newName: string; copySchedules?: boolean; copyInstructors?: boolean }
  ): Promise<ResponseResult<ClassType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.classes.duplicate(classId), data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }
}

const classService = new ClassService()

export default classService
