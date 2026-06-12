import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { ClassType } from '@/types/apps/classTypes'
import type { StudentType } from '@/types/apps/studentTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

const unwrapList = (payload: any): any[] => {
  if (Array.isArray(payload?.records)) return payload.records
  if (Array.isArray(payload?.Records)) return payload.Records
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.Items)) return payload.Items
  if (Array.isArray(payload)) return payload

  return []
}

const unwrapPagedResult = <T>(payload: any): PagedResult<T> => {
  const records = unwrapList(payload) as T[]

  const totalRecords =
    payload?.totalRecords ??
    payload?.TotalRecords ??
    payload?.totalCount ??
    payload?.TotalCount ??
    records.length

  return {
    totalRecords: Number(totalRecords || 0),
    records
  }
}

// Query parameters for GET /api/Classes - Theo API Documentation
export interface GetClassesParams {
  pageNumber?: number
  pageSize?: number
  keyword?: string
  isActive?: boolean
}

// Request body for POST /api/Classes
export interface CreateClassRequest {
  code: string
  name: string
  description?: string
  branchId: string
  userIds?: string[] // Array of instructor UUIDs
  leadInstructorId?: string
}

// Request body for PUT /api/Classes/{id}
export interface UpdateClassRequest {
  name?: string
  description?: string
  branchId: string
  userIds?: string[]
  leadInstructorId?: string
}

// Request body for bulk create schedules
export interface BulkCreateScheduleRequest {
  daysOfWeek: number[]
  startTime: string
  endTime: string
}

export interface ClassInfo {
  id?: string
  code?: string
  name: string
  description?: string
  isActive?: boolean
}

// API response type from /api/Classes
/** Unified assignment shape cho cả Coach lẫn Assistant */
export interface ApiClassUserAssignment {
  userId: string
  fullName: string
  email?: string | null
  phoneNumber?: string | null
  skillLevel?: string | null
  roleName: string
  isLeadInstructor: boolean
}

/** @deprecated dùng ApiClassUserAssignment */
export type ApiClassCoach = ApiClassUserAssignment

/** @deprecated dùng ApiClassUserAssignment */
export type ApiClassAssistant = ApiClassUserAssignment

export interface ApiClassResponse {
  id: string
  code: string
  name: string
  description?: string
  branchId?: string
  branch?: {
    id: string
    name?: string
    address?: string
    googleMapsEmbedUrl?: string | null
    tuitionFee?: number
  } | null
  tuitionFee?: number
  userIds?: string[] // API trả về userIds thay vì coachIds
  coaches?: ApiClassUserAssignment[]
  assistants?: ApiClassUserAssignment[]
  isActive?: boolean
  createdAt?: string
  updatedAt?: string | null
  createdByUserId?: string | null
  updatedByUserId?: string | null
  currentStudents?: number
}

export interface ClassPermissionCatalogItem {
  code: string
  name: string
  leadCoachOnly: boolean
}

export interface ClassLookupType {
  id: string
  code: string
  name: string
  isActive: boolean
}

export interface PagedResult<T> {
  totalRecords: number
  records: T[]
}

class ClassService {
  private mapApiClassToClassType(apiClass: ApiClassResponse): ClassType {
    return {
      id: apiClass.id,
      code: apiClass.code,
      name: apiClass.name,
      description: apiClass.description,
      branchId: apiClass.branchId,
      branch: apiClass.branch,
      branchName: apiClass.branch?.name,
      tuitionFee: apiClass.tuitionFee ?? apiClass.branch?.tuitionFee,
      currentStudents: apiClass.currentStudents ?? 0,
      instructorId: apiClass.userIds?.[0],
      isActive: apiClass.isActive !== undefined ? apiClass.isActive : true,
      createdDate: apiClass.createdAt,
      createdBy: apiClass.createdByUserId || undefined,
      updatedDate: apiClass.updatedAt || undefined,
      updatedBy: apiClass.updatedByUserId || undefined,
      coachIds: apiClass.userIds || [], // Map userIds sang coachIds cho frontend
      leadInstructorId: apiClass.coaches?.find(c => c.isLeadInstructor)?.userId || apiClass.userIds?.[0],
      coaches: apiClass.coaches || [],
      assistants: apiClass.assistants || []
    }
  }

  async getClasses(params?: GetClassesParams): Promise<ResponseResult<ClassType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.classes.root, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      const records = unwrapList(apiResponse.data) as ApiClassResponse[]

      return { success: true, data: records.map(this.mapApiClassToClassType) }
    } catch (error) {
      logger.error('ClassService', 'getClasses', error)
      
return { success: true, data: [] }
    }
  }

  async getClassesPaged(params?: GetClassesParams): Promise<ResponseResult<PagedResult<ClassType>>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.classes.root, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: { totalRecords: 0, records: [] } }
      }

      const paged = unwrapPagedResult<ApiClassResponse>(apiResponse.data)

      return {
        success: true,
        data: {
          totalRecords: paged.totalRecords,
          records: paged.records.map(this.mapApiClassToClassType)
        }
      }
    } catch (error) {
      logger.error('ClassService', 'getClassesPaged', error)

      return { success: true, data: { totalRecords: 0, records: [] } }
    }
  }

  async getClassLookup(params?: { keyword?: string; isActive?: boolean; pageSize?: number; pageNumber?: number }): Promise<ResponseResult<ClassLookupType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.classes.lookup, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      const items = unwrapList(apiResponse.data)

      return {
        success: true,
        data: items.map(x => ({
          id: x.id,
          code: x.code,
          name: x.name,
          isActive: Boolean(x.isActive)
        }))
      }
    } catch (error) {
      logger.error('ClassService', 'getClassLookup', error)
      
return { success: true, data: [] }
    }
  }

  /** Lấy danh sách lớp học được phân công cho một user (HLV/trợ giảng). */
  async getClassesByUserId(userId: string, params?: GetClassesParams): Promise<ResponseResult<ClassType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.users.classes(userId), { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      // Backend có thể trả records hoặc items tùy endpoint
      const records: ApiClassResponse[] =
        apiResponse.data?.records || apiResponse.data?.items || apiResponse.data || []

      return { success: true, data: (Array.isArray(records) ? records : []).map(c => this.mapApiClassToClassType(c)) }
    } catch (error) {
      logger.error('ClassService', 'getClassesByUserId', error)
      
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
        data: this.mapApiClassToClassType(apiResponse.data),
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
      const list = Array.isArray(raw) ? raw : raw?.records || raw?.items || []

      // Chuẩn hóa dayOfWeek về kiểu number (0=CN, 1=T2... 6=T7).
      // Backend có thể trả số (int) hoặc chuỗi tên ngày tiếng Anh ("Monday"...) tùy version.
      const STR_TO_NUM: Record<string, number> = {
        Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
      }

      const data = list.map((s: any) => ({
        ...s,
        dayOfWeek: typeof s.dayOfWeek === 'number'
          ? s.dayOfWeek
          : (STR_TO_NUM[s.dayOfWeek] ?? Number(s.dayOfWeek) ?? 0),

        // Map branchName từ branch.name nếu chưa có (dùng cho display ở tab Lịch học)
        branchName: s.branchName || s.branch?.name || undefined
      }))

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

  async getClassStudents(
    classId: string,
    params?: { pageNumber?: number; pageSize?: number; keyword?: string; isActive?: boolean }
  ): Promise<ResponseResult<PagedResult<StudentType>>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.classes.students(classId), { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: { totalRecords: 0, records: [] } }
      }

      const records = apiResponse.data?.records || apiResponse.data?.items || []
      const totalRecords = apiResponse.data?.totalRecords ?? records.length ?? 0

      return { success: true, data: { totalRecords, records } }
    } catch (error) {
      logger.error('ClassService', 'getClassStudents', error)
      
return { success: true, data: { totalRecords: 0, records: [] } }
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

      return { success: true, data: this.mapApiClassToClassType(apiResponse.data), message: apiResponse.message }
    } catch (error: any) {
      logger.error('ClassService', 'duplicateClass', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getClassPermissions(classId: string): Promise<ResponseResult<any[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.classes.permissions(classId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data || [] }
    } catch (error) {
      logger.error('ClassService', 'getClassPermissions', error)
      
return { success: true, data: [] }
    }
  }

  async updateClassPermissions(classId: string, userId: string, permissions: string[]): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.classes.permissionsByUser(classId, userId), permissions)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('ClassService', 'updateClassPermissions', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getClassPermissionsForUser(classId: string, userId: string): Promise<ResponseResult<string[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.classes.permissionsUser(classId, userId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data || [] }
    } catch (error: any) {
      logger.error('ClassService', 'getClassPermissionsForUser', error)
      
return { success: false, data: [], message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getClassPermissionCatalog(): Promise<ResponseResult<ClassPermissionCatalogItem[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.classes.permissionsCatalog)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data || [] }
    } catch (error: any) {
      logger.error('ClassService', 'getClassPermissionCatalog', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

const classService = new ClassService()

export default classService

