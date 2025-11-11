import { apiClient } from '@/utils/apiClient'
import type { BranchType } from './branchService'
import type { ClassInfo } from '@/services/classService'

export interface GetSchedulesParams {
  ClassId?: string
  BranchId?: string
  DayOfWeek?: number
  StartTimeFrom?: string
  StartTimeTo?: string
  EndTimeFrom?: string
  EndTimeTo?: string
  CreatedDate?: string
  CreatedBy?: string
  UpdatedDate?: string
  UpdatedBy?: string
  IsActive?: boolean
  Keyword?: string
  PageSize?: number
  PageNumber?: number
}

export interface CreateClassScheduleRequest {
  classId: string
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  startTime: string // time format
  endTime: string // time format
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
  branch?: BranchType // Added for mapping
  class?: ClassInfo // Added for mapping
}

export interface ScheduleType {
  id: string
  classId: string
  class: ClassInfo
  dayOfWeek: number
  startTime: string
  endTime: string
  branchId: string
  branch: BranchType // Thêm dòng này
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
    const response = await apiClient.get<any>('/api/Schedules', { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        data: [],
        message: apiResponse.message
      }
    }

    const records: ApiScheduleResponse[] = apiResponse.data?.records || []
    const schedules = records.map(this.mapApiScheduleToScheduleType)

    return {
      success: true,
      data: schedules
    }
  }

  async getScheduleById(id: string): Promise<ResponseResult<ScheduleType>> {
    const response = await apiClient.get<any>(`/api/Schedules/${id}`)
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
  }

  async createSchedule(data: CreateClassScheduleRequest): Promise<ResponseResult<ScheduleType>> {
    const response = await apiClient.post<any>('/api/Schedules', data)
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
  }

  async updateSchedule(id: string, data: UpdateClassScheduleRequest): Promise<ResponseResult<ScheduleType>> {
    const response = await apiClient.put<any>(`/api/Schedules/${id}`, data)
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
  }

  async deleteSchedule(id: string): Promise<ResponseResult<void>> {
    const response = await apiClient.delete<any>(`/api/Schedules/${id}`)
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

  async restoreSchedule(id: string): Promise<ResponseResult<ScheduleType>> {
    const response = await apiClient.post<any>(`/api/Schedules/${id}/restore`)
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
  }

  async createClassSchedules(
    classId: string,
    data: BulkCreateScheduleRequest
  ): Promise<ResponseResult<ScheduleType[]>> {
    console.log(data)
    const response = await apiClient.post(`/api/Classes/${classId}/schedules`, data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        data: [],
        message: apiResponse.message
      }
    }

    // Nếu API trả về danh sách lịch vừa tạo, map lại về ScheduleType (nếu muốn)
    const records: ApiScheduleResponse[] = Array.isArray(apiResponse.data)
      ? apiResponse.data
      : apiResponse.data?.records || []

    const schedules = records.map(this.mapApiScheduleToScheduleType)

    return {
      success: true,
      data: schedules,
      message: apiResponse.message
    }
  }
}

export default new ScheduleService()
