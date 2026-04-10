import { apiClient } from '@/utils/apiClient'
import type { BranchType } from './branchService'
import type { ClassInfo } from '@/services/classService'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

// Query parameters for GET /api/Schedules - Theo API Documentation
export interface GetSchedulesParams {
  ClassId?: string
  BranchId?: string
  DayOfWeek?: number // 0=Sunday, 1=Monday...
  IsActive?: boolean
}

export interface CreateClassScheduleRequest {
  classId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  branchId: string
}

export interface BulkCreateScheduleRequest {
  classId: string
  daysOfWeek?: number[]
  startTime: string
  endTime: string
  branchId: string
}

export interface UpdateClassScheduleRequest {
  dayOfWeek?: number
  startTime?: string
  endTime?: string
  branchId?: string
}

export interface ApiScheduleResponse {
  id: string
  classId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  branchId: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string | null
  createdByUserId?: string | null
  updatedByUserId?: string | null
  branch?: BranchType
  class?: ClassInfo
}

export interface ScheduleType {
  id: string
  classId: string
  class: ClassInfo
  dayOfWeek: number
  startTime: string
  endTime: string
  branchId: string
  branch: BranchType
  isActive: boolean
  createdDate?: string
  createdBy?: string
  updatedDate?: string
  updatedBy?: string
}

export interface ResponseResult<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

class ScheduleService {
  private mapApiScheduleToScheduleType(apiSchedule: ApiScheduleResponse): ScheduleType {
    return {
      id: apiSchedule.id,
      classId: apiSchedule.classId,
      class: apiSchedule.class as ClassInfo,
      dayOfWeek: apiSchedule.dayOfWeek,
      startTime: apiSchedule.startTime,
      endTime: apiSchedule.endTime,
      branchId: apiSchedule.branchId,
      branch: apiSchedule.branch as BranchType,
      isActive: apiSchedule.isActive ?? true,
      createdDate: apiSchedule.createdAt,
      createdBy: apiSchedule.createdByUserId || undefined,
      updatedDate: apiSchedule.updatedAt || undefined,
      updatedBy: apiSchedule.updatedByUserId || undefined
    }
  }

  async getSchedules(params?: GetSchedulesParams): Promise<ResponseResult<ScheduleType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.schedules.root, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      const records: ApiScheduleResponse[] = apiResponse.data?.records || []
      const schedules = records.map(this.mapApiScheduleToScheduleType)

      return {
        success: true,
        data: schedules
      }
    } catch {
      return { success: true, data: [] }
    }
  }

  async getScheduleById(id: string): Promise<ResponseResult<ScheduleType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.schedules.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      const scheduleData = this.mapApiScheduleToScheduleType(apiResponse.data)

      return {
        success: true,
        data: scheduleData
      }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async createSchedule(data: CreateClassScheduleRequest): Promise<ResponseResult<ScheduleType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.schedules.root, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      const scheduleData = this.mapApiScheduleToScheduleType(apiResponse.data)

      return {
        success: true,
        data: scheduleData,
        message: apiResponse.message
      }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async updateSchedule(id: string, data: UpdateClassScheduleRequest): Promise<ResponseResult<ScheduleType>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.schedules.byId(id), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      const scheduleData = this.mapApiScheduleToScheduleType(apiResponse.data)

      return {
        success: true,
        data: scheduleData,
        message: apiResponse.message
      }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async deleteSchedule(id: string): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.delete<any>(API_ENDPOINTS.schedules.byId(id))
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
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async restoreSchedule(id: string): Promise<ResponseResult<ScheduleType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.schedules.restore(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      const scheduleData = this.mapApiScheduleToScheduleType(apiResponse.data)

      return {
        success: true,
        data: scheduleData,
        message: apiResponse.message
      }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async createClassSchedules(
    classId: string,
    data: BulkCreateScheduleRequest
  ): Promise<ResponseResult<ScheduleType[]>> {
    try {
      const response = await apiClient.post(API_ENDPOINTS.classes.schedules(classId), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          data: [],
          message: apiResponse.message
        }
      }

      const records: ApiScheduleResponse[] = Array.isArray(apiResponse.data)
        ? apiResponse.data
        : apiResponse.data?.records || []

      const schedules = records.map(this.mapApiScheduleToScheduleType)

      return {
        success: true,
        data: schedules,
        message: apiResponse.message
      }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getSchedulesByDate(date: string): Promise<ResponseResult<ScheduleType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.schedules.byDate, { params: { date } })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      const records: ApiScheduleResponse[] = apiResponse.data || []
      const schedules = records.map(this.mapApiScheduleToScheduleType)

      return { success: true, data: schedules }
    } catch {
      return { success: true, data: [] }
    }
  }

  async getSchedulesByInstructor(instructorId: string): Promise<ResponseResult<ScheduleType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.schedules.byInstructor(instructorId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      const records: ApiScheduleResponse[] = apiResponse.data || []
      const schedules = records.map(this.mapApiScheduleToScheduleType)

      return { success: true, data: schedules }
    } catch {
      return { success: true, data: [] }
    }
  }
}

export default new ScheduleService()
