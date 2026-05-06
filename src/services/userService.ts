import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { UsersType, ApiUserResponse } from '@/types/apps/userTypes'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

// API Types
// Query parameters for GET /api/Users
export interface GetUsersParams {
  Role?: string
  RoleId?: string
  BeltLevelName?: string
  CreatedDate?: string // DateTime format
  CreatedBy?: string
  UpdatedDate?: string // DateTime format
  UpdatedBy?: string
  IsActive?: boolean
  Keyword?: string
  PageSize?: number // Integer
  PageNumber?: number // Integer
  UserType?: string // Filter by user type (Admin, Coach, Student, etc.)
}

// Request body for POST /api/Users
export interface CreateUserRequest {
  fullName: string
  email: string
  username?: string
  roles?: string[]
  password?: string
  phoneNumber?: string
  isActive?: boolean
  memberCode?: string | null
}

// Request body for PUT /api/Users/{id}
export interface UpdateUserRequest {
  fullName?: string
  email?: string
  username?: string
  roles?: string[]
  phoneNumber?: string
  isActive?: boolean
  memberCode?: string | null
}

// Response type for all API endpoints
export interface ResponseResult<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

// Path parameters for endpoints with ID
export interface UserPathParams {
  id: string // UUID or number
}

class UserService {
  // Helper function to map API user to UsersType
  private mapApiUserToUsersType(apiUser: ApiUserResponse): UsersType {
    return {
      id: apiUser.id,
      username: apiUser.username,
      email: apiUser.email,
      fullName: apiUser.fullName,
      phoneNumber: apiUser.phoneNumber,
      avatarUrl: apiUser.avatarUrl,
      skillLevel: apiUser.skillLevel,
      certification: apiUser.certification,
      isActive: apiUser.isActive,
      roles: apiUser.roles || [],
      createdAt: (apiUser as any).createdAt,
      updatedAt: (apiUser as any).updatedAt,
      createdByUserId: (apiUser as any).createdByUserId,
      updatedByUserId: (apiUser as any).updatedByUserId,
      memberCode: apiUser.memberCode,
      beltLevelName: apiUser.beltLevelName ?? undefined,
      beltLevelId: apiUser.beltLevelId,
      beltLevelOrder: apiUser.beltLevelOrder
    }
  }

  /**
   * GET /api/Users
   * Get a list of users with optional filtering and pagination
   * @param params - Query parameters for filtering users
   * @returns ResponseResult with an array of UsersType
   */
  async getUsers(params?: GetUsersParams): Promise<ResponseResult<UsersType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.users.root, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      // Extract records from response.data.records
      const records: ApiUserResponse[] = apiResponse.data?.records || []
      const users = records.map(this.mapApiUserToUsersType)

      return {
        success: true,
        data: users
      }
    } catch (error) {
      logger.error('UserService', 'getUsers', error)
      return { success: true, data: [] }
    }
  }

  /**
   * GET /api/Users/{id}
   * Get a specific user by ID
   * @param id - User ID
   * @returns ResponseResult with UsersType
   */
  async getUserById(id: string): Promise<ResponseResult<UsersType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.users.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      const user = this.mapApiUserToUsersType(apiResponse.data)

      return {
        success: true,
        data: user
      }
    } catch (error: any) {
      logger.error('UserService', 'getUserById', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  /**
   * POST /api/Users
   * Create a new user
   * @param data - User creation data
   * @returns ResponseResult with created UsersType
   */
  async createUser(data: CreateUserRequest): Promise<ResponseResult<UsersType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.users.root, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      const user = this.mapApiUserToUsersType(apiResponse.data)

      return {
        success: true,
        data: user
      }
    } catch (error: any) {
      logger.error('UserService', 'createUser', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  /**
   * GET /api/Users with Coach role filter
   * Get list of coaches (users with role=Coach and IsActive=true)
   * @returns ResponseResult with an array of coach UsersType
   */
  async getCoaches(): Promise<ResponseResult<UsersType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.users.root, {
        params: {
          Role: 'Coach',
          IsActive: true
        }
      })

      // Response structure: { isSuccess, message, data: { totalRecords, records } }
      // axios wraps it in: response.data = { isSuccess, message, data, statusCode }
      const apiResponse = response.data

      // Check if API response is successful
      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      // Extract the records from response.data.records
      let records: ApiUserResponse[] = []

      if (apiResponse.data && apiResponse.data.records && Array.isArray(apiResponse.data.records)) {
        records = apiResponse.data.records
      } else if (apiResponse.data && Array.isArray(apiResponse.data)) {
        records = apiResponse.data
      }

      // Transform API response to UsersType
      const users = records.map(this.mapApiUserToUsersType)

      return {
        success: true,
        data: users
      }
    } catch (error) {
      logger.error('UserService', 'getCoaches', error)

      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * PUT /api/Users/{id}
   * Update a user
   */
  async updateUser(id: string, data: UpdateUserRequest): Promise<ResponseResult<UsersType>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.users.byId(id), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      const user = this.mapApiUserToUsersType(apiResponse.data)

      return {
        success: true,
        data: user,
        message: apiResponse.message
      }
    } catch (error: any) {
      logger.error('UserService', 'updateUser', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  /**
   * DELETE /api/Users/{id}
   * Delete a user (soft delete)
   */
  async deleteUser(id: string): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.delete<any>(API_ENDPOINTS.users.byId(id))
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
      logger.error('UserService', 'deleteUser', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  /**
   * POST /api/Users/{id}/restore
   * Restore a deleted user
   */
  async restoreUser(id: string): Promise<ResponseResult<UsersType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.users.restore(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      const user = this.mapApiUserToUsersType(apiResponse.data)

      return {
        success: true,
        data: user,
        message: apiResponse.message
      }
    } catch (error: any) {
      logger.error('UserService', 'restoreUser', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async updateUserRoles(id: string, roles: string[]): Promise<ResponseResult<UsersType>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.users.updateRoles(id), { roles })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message
        }
      }

      const user = this.mapApiUserToUsersType(apiResponse.data)

      return {
        success: true,
        data: user,
        message: apiResponse.message
      }
    } catch (error: any) {
      logger.error('UserService', 'updateUserRoles', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

export default new UserService()
