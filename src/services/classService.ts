import apiClient from '@/utils/apiClient'
import type { ClassType } from '@/types/apps/classTypes'
import type { ResponseResult } from '@/types/common'


// API Types
// Query parameters for GET /api/Classes
export interface GetClassesParams {
  StartDateFrom?: string // Date format: YYYY-MM-DD
  StartDateTo?: string // Date format: YYYY-MM-DD
  EndDateFrom?: string // Date format: YYYY-MM-DD
  EndDateTo?: string // Date format: YYYY-MM-DD
  MinMaxStudents?: number // Integer
  MaxMaxStudents?: number // Integer
  CreatedDate?: string // DateTime format
  CreatedBy?: string
  UpdatedDate?: string // DateTime format
  UpdatedBy?: string
  IsActive?: boolean
  Keyword?: string
  PageSize?: number // Integer
  PageNumber?: number // Integer
  Code?: string
}

// Request body for POST /api/Classes
export interface CreateClassRequest {
  name: string
  code: string
  description?: string
  startDate: string // Date format
  endDate: string // Date format
  maxStudents: number // Integer
  coachIds?: string[] // Array of UUIDs
  isActive?: boolean
}

// Request body for PUT /api/Classes/{id}
export interface UpdateClassRequest {
  name?: string
  description?: string
  startDate?: string // Date format
  endDate?: string // Date format
  maxStudents?: number // Integer
  instructorId?: string // UUID
  isActive?: boolean
}

export interface BulkCreateScheduleRequest {
  schedules: Array<{
    date: string
    startTime: string
    endTime: string
    room?: string
  }>
}

export interface ClassInfo {
  startDateFrom?: string
  startDateTo?: string
  endDateFrom?: string
  endDateTo?: string
  minMaxStudents?: number
  maxMaxStudents?: number
  createdDate?: string
  createdBy?: string
  updatedDate?: string
  updatedBy?: string
  isActive?: boolean
  code?: string
  name : string
}

// Path parameters for endpoints with ID
export interface ClassPathParams {
  id: string // UUID
}

// API response type from /api/Classes
export interface ApiClassResponse {
  id: string
  code: string
  name: string
  description?: string
  startDate: string
  endDate: string
  maxStudents: number
  coachIds?: string[]
  isActive?: boolean
  createdAt?: string
  updatedAt?: string | null
  createdByUserId?: string | null
  updatedByUserId?: string | null
}

class ClassService {
  // Helper function to map API class to ClassType
  private mapApiClassToClassType(apiClass: ApiClassResponse): ClassType {
    return {
      id: apiClass.id,
      name: apiClass.name,
      description: apiClass.description,
      startDate: apiClass.startDate,
      endDate: apiClass.endDate,
      maxStudents: apiClass.maxStudents,
      instructorId: apiClass.coachIds?.[0],
      code: apiClass.code,
      isActive: apiClass.isActive !== undefined ? apiClass.isActive : true,
      createdDate: apiClass.createdAt,
      createdBy: apiClass.createdByUserId || undefined,
      updatedDate: apiClass.updatedAt || undefined,
      updatedBy: apiClass.updatedByUserId || undefined,
      coachIds: apiClass.coachIds || []
    }
  }

  /**
   * GET /api/Classes
   * Get a list of classes with optional filtering and pagination
   * @param params - Query parameters for filtering classes
   * @returns ResponseResult with an array of ClassType
   */
  async getClasses(params?: GetClassesParams): Promise<ResponseResult<ClassType[]>> {
    const response = await apiClient.get<any>('/api/Classes', { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        data: [],
        message: apiResponse.message
      }
    }

    // Extract records from response.data.records
    const records: ApiClassResponse[] = apiResponse.data?.records || []
    const classes = records.map(this.mapApiClassToClassType)

    return {
      success: true,
      data: classes
    }
  }

  /**
   * GET /api/Classes/{id}
   * Get a specific class by ID
   * @param id - Class ID (UUID)
   * @returns ResponseResult with ClassType
   */
  async getClassById(id: string): Promise<ResponseResult<ClassType>> {
    const response = await apiClient.get<any>(`/api/Classes/${id}`)
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

  /**
   * POST /api/Classes
   * Create a new training class
   * @param data - Class creation data
   * @returns ResponseResult with created ClassType
   */
  async createClass(data: CreateClassRequest): Promise<ResponseResult<ClassType>> {
    const response = await apiClient.post('/api/Classes', data)
    const apiResponse = response.data

    // Map API response structure (isSuccess) to service response structure (success)
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

  /**
   * PUT /api/Classes/{id}
   * Update an existing training class
   * @param id - Class ID (UUID)
   * @param data - Class update data
   * @returns ResponseResult with updated ClassType
   */
  async updateClass(id: string, data: UpdateClassRequest): Promise<ResponseResult<ClassType>> {
    const response = await apiClient.put<any>(`/api/Classes/${id}`, data)
    const apiResponse = response.data

    // Map API response structure (isSuccess) to service response structure (success)
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

  /**
   * DELETE /api/Classes/{id}
   * Delete a training class
   * @param id - Class ID (UUID)
   * @returns ResponseResult
   */
  async deleteClass(id: string): Promise<ResponseResult<void>> {
    const response = await apiClient.delete<any>(`/api/Classes/${id}`)
    const apiResponse = response.data

    // Map API response structure (isSuccess) to service response structure (success)
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

  /**
   * POST /api/Classes/{id}/restore
   * Restore an inactive training class
   * @param id - Class ID (UUID)
   * @returns ResponseResult with restored ClassType
   */
  async restoreClass(id: string): Promise<ResponseResult<ClassType>> {
    const response = await apiClient.post<any>(`/api/Classes/${id}/restore`)
    const apiResponse = response.data

    // Map API response structure (isSuccess) to service response structure (success)
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

  /**
   * GET /api/Classes/{classId}/schedules
   * Get schedules for a specific class
   * @param classId - Class ID (UUID)
   * @returns ResponseResult with an array of schedules
   */
  async getClassSchedules(classId: string): Promise<ResponseResult<any[]>> {
    const response = await apiClient.get(`/api/Classes/${classId}/schedules`)

    return response.data
  }

  /**
   * POST /api/Classes/{classId}/schedules
   * Create schedules for a class in bulk
   * @param classId - Class ID (UUID)
   * @param schedules - Bulk schedule creation data
   * @returns ResponseResult with created schedules
   */
  async createClassSchedules(classId: string, schedules: BulkCreateScheduleRequest): Promise<ResponseResult<any[]>> {
    const response = await apiClient.post(`/api/Classes/${classId}/schedules`, schedules)

    return response.data
  }
}

const classService = new ClassService()

export default classService
