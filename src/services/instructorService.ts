import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

// Query parameters for GET /api/Instructors - Theo API Documentation
export interface GetInstructorsParams {
  skillLevelId?: string
  certification?: string
}

export interface CreateInstructorRequest {
  fullName: string
  email?: string
  phoneNumber?: string
  skillLevelId?: string | null
  certification?: string
  memberCode?: string | null
}

export interface UpdateInstructorRequest {
  fullName?: string
  phoneNumber?: string
  skillLevelId?: string | null
  certification?: string
  memberCode?: string | null
}

export interface ApiInstructorResponse {
  id: string
  avatar: string
  fullName?: string
  email?: string
  phoneNumber?: string
  skillLevelId?: string
  skillLevelName?: string
  certification?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string | null
  createdByUserId?: string | null
  updatedByUserId?: string | null

  // Federation (read-only display) — camelCase from BeltLevel* properties in InstructorDto
  memberCode?: string | null
  beltLevelId?: string | null
  beltLevelName?: string | null
  beltLevelOrder?: number | null
}

export interface InstructorType {
  id: string
  avatar: string
  fullName: string
  email?: string
  phoneNumber?: string
  skillLevelId?: string
  skillLevelName?: string
  certification?: string
  isActive: boolean
  createdDate?: string
  createdBy?: string
  updatedDate?: string
  updatedBy?: string

  // Federation (read-only display)
  memberCode?: string | null
  beltLevelName?: string | null
  beltLevelId?: string | null
  beltLevelOrder?: number | null
}

class InstructorService {
  private mapApiInstructorToInstructorType(apiInstructor: ApiInstructorResponse): InstructorType {
    return {
      id: apiInstructor.id,
      avatar: apiInstructor.avatar,
      fullName: apiInstructor.fullName || '',
      email: apiInstructor.email,
      phoneNumber: apiInstructor.phoneNumber,
      skillLevelId: apiInstructor.skillLevelId,
      skillLevelName: apiInstructor.skillLevelName,
      certification: apiInstructor.certification,
      isActive: apiInstructor.isActive ?? true,
      createdDate: apiInstructor.createdAt,
      createdBy: apiInstructor.createdByUserId || undefined,
      updatedDate: apiInstructor.updatedAt || undefined,
      updatedBy: apiInstructor.updatedByUserId || undefined,
      memberCode: apiInstructor.memberCode,
      beltLevelName: apiInstructor.beltLevelName,
      beltLevelId: apiInstructor.beltLevelId ?? undefined,
      beltLevelOrder: apiInstructor.beltLevelOrder
    }
  }

  async getInstructors(params?: GetInstructorsParams): Promise<ResponseResult<InstructorType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.instructors.root, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      const records: ApiInstructorResponse[] = apiResponse.data?.records || []
      const instructors = records.map(this.mapApiInstructorToInstructorType)

      return {
        success: true,
        data: instructors
      }
    } catch (error) {
      logger.error('InstructorService', 'getInstructors', error)
      return { success: true, data: [] }
    }
  }

  async getInstructorById(id: string): Promise<ResponseResult<InstructorType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.instructors.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      const instructorData = this.mapApiInstructorToInstructorType(apiResponse.data)

      return {
        success: true,
        data: instructorData
      }
    } catch (error: any) {
      logger.error('InstructorService', 'getInstructorById', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async createInstructor(data: CreateInstructorRequest): Promise<ResponseResult<InstructorType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.instructors.root, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      const instructorData = this.mapApiInstructorToInstructorType(apiResponse.data)

      return {
        success: true,
        data: instructorData,
        message: apiResponse.message
      }
    } catch (error: any) {
      logger.error('InstructorService', 'createInstructor', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async updateInstructor(id: string, data: UpdateInstructorRequest): Promise<ResponseResult<InstructorType>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.instructors.byId(id), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      const instructorData = this.mapApiInstructorToInstructorType(apiResponse.data)

      return {
        success: true,
        data: instructorData,
        message: apiResponse.message
      }
    } catch (error: any) {
      logger.error('InstructorService', 'updateInstructor', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async deleteInstructor(id: string): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.delete<any>(API_ENDPOINTS.instructors.byId(id))
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
      logger.error('InstructorService', 'deleteInstructor', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async restoreInstructor(id: string): Promise<ResponseResult<InstructorType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.instructors.restore(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      const instructorData = this.mapApiInstructorToInstructorType(apiResponse.data)

      return {
        success: true,
        data: instructorData,
        message: apiResponse.message
      }
    } catch (error: any) {
      logger.error('InstructorService', 'restoreInstructor', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getInstructorStatistics(id: string, params?: { month?: number; year?: number }): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.instructors.statistics(id), { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('InstructorService', 'getInstructorStatistics', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getInstructorSchedules(id: string): Promise<ResponseResult<any[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.instructors.schedules(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return { success: true, data: apiResponse.data || [] }
    } catch (error) {
      logger.error('InstructorService', 'getInstructorSchedules', error)
      return { success: true, data: [] }
    }
  }

  async getInstructorClasses(id: string): Promise<ResponseResult<any[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.instructors.classes(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return { success: true, data: apiResponse.data || [] }
    } catch (error) {
      logger.error('InstructorService', 'getInstructorClasses', error)
      return { success: true, data: [] }
    }
  }
}

export default new InstructorService()
