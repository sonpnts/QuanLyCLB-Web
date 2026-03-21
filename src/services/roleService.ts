import { apiClient } from '@/utils/apiClient'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

// API Types
export interface GetRolesParams {
  Keyword?: string
  PageSize?: number
  PageNumber?: number
}

export interface CreateRoleRequest {
  name: string
  description?: string
  permissions?: string[]
}

export interface UpdateRoleRequest {
  name?: string
  description?: string
  permissions?: string[]
}

export interface RoleType {
  id: string
  name: string
  description?: string
  permissions?: string[]
  isActive?: boolean
  createdDate?: string
  createdBy?: string
  updatedDate?: string
  updatedBy?: string
}

export interface ApiRoleResponse {
  id: string
  name: string
  description?: string
  permissions?: string[]
  isActive?: boolean
  createdAt?: string
  updatedAt?: string | null
  createdByUserId?: string | null
  updatedByUserId?: string | null
}

class RoleService {
  // Map API response to RoleType
  private mapApiRoleToRoleType(apiRole: ApiRoleResponse): RoleType {
    return {
      id: apiRole.id,
      name: apiRole.name,
      description: apiRole.description,
      permissions: apiRole.permissions,
      isActive: apiRole.isActive !== undefined ? apiRole.isActive : true,
      createdDate: apiRole.createdAt,
      createdBy: apiRole.createdByUserId || undefined,
      updatedDate: apiRole.updatedAt || undefined,
      updatedBy: apiRole.updatedByUserId || undefined
    }
  }

  /**
   * GET /api/Roles
   * Get a list of roles with optional filtering and pagination
   */
  async getRoles(params?: GetRolesParams): Promise<ResponseResult<RoleType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.roles.root, { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        data: [],
        message: apiResponse.message
      }
    }

    const records: ApiRoleResponse[] = apiResponse.data?.records || []
    const roles = records.map(this.mapApiRoleToRoleType)

    return {
      success: true,
      data: roles
    }
  }

  /**
   * POST /api/Roles
   * Create a new role
   */
  async createRole(data: CreateRoleRequest): Promise<ResponseResult<RoleType>> {
    const response = await apiClient.post(API_ENDPOINTS.roles.root, data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        message: apiResponse.message
      }
    }

    const roleData = this.mapApiRoleToRoleType(apiResponse.data)

    return {
      success: true,
      data: roleData,
      message: apiResponse.message
    }
  }

  /**
   * GET /api/Roles/{id}
   * Get a role by ID
   */
  async getRoleById(id: string): Promise<ResponseResult<RoleType>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.roles.byId(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        message: apiResponse.message
      }
    }

    const roleData = this.mapApiRoleToRoleType(apiResponse.data)

    return {
      success: true,
      data: roleData
    }
  }

  /**
   * PUT /api/Roles/{id}
   * Update a role
   */
  async updateRole(id: string, data: UpdateRoleRequest): Promise<ResponseResult<RoleType>> {
    const response = await apiClient.put<any>(API_ENDPOINTS.roles.byId(id), data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        message: apiResponse.message
      }
    }

    const roleData = this.mapApiRoleToRoleType(apiResponse.data)

    return {
      success: true,
      data: roleData,
      message: apiResponse.message
    }
  }

  /**
   * DELETE /api/Roles/{id}
   * Delete a role
   */
  async deleteRole(id: string): Promise<ResponseResult<void>> {
    const response = await apiClient.delete<any>(API_ENDPOINTS.roles.byId(id))
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

  /**
   * POST /api/Roles/{id}/restore
   * Restore a deleted role
   */
  async restoreRole(id: string): Promise<ResponseResult<RoleType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.roles.restore(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        message: apiResponse.message
      }
    }

    const roleData = this.mapApiRoleToRoleType(apiResponse.data)

    return {
      success: true,
      data: roleData,
      message: apiResponse.message
    }
  }
}

const roleService = new RoleService()

export default roleService
