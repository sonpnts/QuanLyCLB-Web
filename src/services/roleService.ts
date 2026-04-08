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
  private inFlightGetRoles = new Map<string, Promise<ResponseResult<RoleType[]>>>()
  private getRolesCache = new Map<string, { expiresAt: number; value: ResponseResult<RoleType[]> }>()
  private readonly getRolesCacheTtlMs = 3000

  private buildGetRolesKey(params?: GetRolesParams): string {
    if (!params) return '{}'

    const entries = Object.entries(params).sort(([a], [b]) => a.localeCompare(b))

    return JSON.stringify(Object.fromEntries(entries))
  }

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
    const key = this.buildGetRolesKey(params)
    const now = Date.now()
    const cached = this.getRolesCache.get(key)

    if (cached && cached.expiresAt > now) {
      return cached.value
    }

    const existingPromise = this.inFlightGetRoles.get(key)
    if (existingPromise) {
      return existingPromise
    }

    const requestPromise = (async (): Promise<ResponseResult<RoleType[]>> => {
      const response = await apiClient.get<any>(API_ENDPOINTS.roles.root, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        const failedResult: ResponseResult<RoleType[]> = {
          success: false,
          data: [],
          message: apiResponse.message
        }

        this.getRolesCache.set(key, {
          expiresAt: Date.now() + this.getRolesCacheTtlMs,
          value: failedResult
        })

        return failedResult
      }

      const records: ApiRoleResponse[] = apiResponse.data?.records || []
      const roles = records.map(this.mapApiRoleToRoleType)
      const successResult: ResponseResult<RoleType[]> = {
        success: true,
        data: roles
      }

      this.getRolesCache.set(key, {
        expiresAt: Date.now() + this.getRolesCacheTtlMs,
        value: successResult
      })

      return successResult
    })()

    this.inFlightGetRoles.set(key, requestPromise)

    try {
      return await requestPromise
    } finally {
      this.inFlightGetRoles.delete(key)
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
