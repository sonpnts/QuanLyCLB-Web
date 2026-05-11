import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { BranchType } from './branchService'
import type { ClassInfo } from '@/services/classService'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

// Query parameters for GET /api/Schedules - Theo API Documentation
export interface GetSchedulesParams {
  ClassId?: string
  BranchId?: string
  DayOfWeek?: number // 0=Sunday, 1=Monday...
  IsActive?: boolean
  PageSize?: number
  PageNumber?: number
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

// Backend giờ trả về int (0-6) trực tiếp.
// Giữ map fallback cho trường hợp backward-compat (data cũ trả "Monday", "Tuesday"...).
// 0=Chủ nhật, 1=Thứ hai, 2=Thứ ba, ..., 6=Thứ bảy
const DAY_OF_WEEK_STRING_MAP: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
}

function parseDayOfWeek(value: number | string): number {
  if (typeof value === 'number') return value
  return DAY_OF_WEEK_STRING_MAP[value] ?? 0
}

class ScheduleService {
  private mapApiScheduleToScheduleType(apiSchedule: ApiScheduleResponse): ScheduleType {
    return {
      id: apiSchedule.id,
      classId: apiSchedule.classId,
      class: apiSchedule.class as ClassInfo,
      dayOfWeek: parseDayOfWeek(apiSchedule.dayOfWeek as unknown as string),
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
    } catch (error) {
      logger.error('ScheduleService', 'getSchedules', error)
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
      logger.error('ScheduleService', 'getScheduleById', error)
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
      logger.error('ScheduleService', 'createSchedule', error)
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
      logger.error('ScheduleService', 'updateSchedule', error)
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
      logger.error('ScheduleService', 'deleteSchedule', error)
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
      logger.error('ScheduleService', 'restoreSchedule', error)
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
      logger.error('ScheduleService', 'createClassSchedules', error)
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
    } catch (error) {
      logger.error('ScheduleService', 'getSchedulesByDate', error)
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
    } catch (error) {
      logger.error('ScheduleService', 'getSchedulesByInstructor', error)
      return { success: true, data: [] }
    }
  }

  async getMySchedules(params?: GetSchedulesParams): Promise<ResponseResult<ScheduleType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.users.mySchedules, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      const records: ApiScheduleResponse[] = apiResponse.data?.records || []
      const schedules = records.map(this.mapApiScheduleToScheduleType)

      return { success: true, data: schedules }
    } catch (error) {
      logger.error('ScheduleService', 'getMySchedules', error)
      return { success: true, data: [] }
    }
  }
}

export default new ScheduleService()
