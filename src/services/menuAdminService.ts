import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

export type CanonicalRbacPermissionDto = {
  permissionId: string
  permissionCode: string
  permissionName: string
  description?: string | null
  isActive: boolean
  roleNames: string[]
  functionCodes: string[]
  functionNames: string[]
  apiPatterns: string[]
  menuHrefs: string[]
}

export type CanonicalFunctionDto = {
  functionId: string
  functionCode: string
  functionName: string
  module?: string | null
  requiredPermissionModule?: string | null
  route?: string | null
  icon?: string | null
  displayOrder?: number
  showOnMenu?: boolean
  apiPattern: string
  httpMethod?: string | null
  menuHref?: string | null
  isActive: boolean
}

export type PermissionFunctionMatrixItemDto = {
  permissionId: string
  permissionCode: string
  permissionName: string
  functionCodes: string[]
}

export type UpsertFunctionRequest = {
  name: string
  code: string
  module?: string | null
  requiredPermissionModule?: string | null
  apiPattern: string
  httpMethod?: string | null
  route?: string | null
  icon?: string | null
  displayOrder: number
  isActive: boolean
  showOnMenu: boolean
}

class MenuAdminService {
  async getCanonicalRbacMatrix(): Promise<ResponseResult<CanonicalRbacPermissionDto[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.menu.rbacCanonical)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message, data: [] }
      }

      return { success: true, data: apiResponse.data?.permissions || [] }
    } catch (error: any) {
      logger.error('MenuAdminService', 'getCanonicalRbacMatrix', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ', data: [] }
    }
  }

  async updatePermissionRoles(permissionId: string, roleNames: string[]): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.patch<any>(API_ENDPOINTS.menu.patchPermissionRoles(permissionId), { roleNames })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      logger.error('MenuAdminService', 'updatePermissionRoles', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getPermissionFunctionMatrix(): Promise<ResponseResult<{ functions: CanonicalFunctionDto[]; permissions: PermissionFunctionMatrixItemDto[] }>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.menu.permissionFunctions)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message, data: { functions: [], permissions: [] } }
      }

      return { success: true, data: apiResponse.data || { functions: [], permissions: [] } }
    } catch (error: any) {
      logger.error('MenuAdminService', 'getPermissionFunctionMatrix', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ', data: { functions: [], permissions: [] } }
    }
  }

  async updatePermissionFunctions(permissionId: string, functionCodes: string[]): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.patch<any>(API_ENDPOINTS.menu.patchPermissionFunctions(permissionId), { functionCodes })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      logger.error('MenuAdminService', 'updatePermissionFunctions', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getFunctions(): Promise<ResponseResult<CanonicalFunctionDto[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.menu.functions)
      const apiResponse = response.data
      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message, data: [] }
      return { success: true, data: apiResponse.data || [] }
    } catch (error: any) {
      logger.error('MenuAdminService', 'getFunctions', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ', data: [] }
    }
  }

  async createFunction(payload: UpsertFunctionRequest): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.menu.functions, payload)
      const apiResponse = response.data
      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }
      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      logger.error('MenuAdminService', 'createFunction', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async updateFunction(functionId: string, payload: UpsertFunctionRequest): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.menu.functionById(functionId), payload)
      const apiResponse = response.data
      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }
      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      logger.error('MenuAdminService', 'updateFunction', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async deleteFunction(functionId: string): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.delete<any>(API_ENDPOINTS.menu.functionById(functionId))
      const apiResponse = response.data
      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }
      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      logger.error('MenuAdminService', 'deleteFunction', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

const menuAdminService = new MenuAdminService()
export default menuAdminService
