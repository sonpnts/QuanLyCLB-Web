import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

export type AdminMenuItemDto = {
  id: string
  label: string
  icon?: string | null
  href?: string | null
  parentId?: string | null
  isSection: boolean
  order: number
  isActive: boolean
  requiredRoles?: string[] | null
}

class MenuAdminService {
  async getRbacMatrix(): Promise<ResponseResult<AdminMenuItemDto[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.menu.rbac)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message, data: [] }
      }

      return { success: true, data: apiResponse.data || [] }
    } catch (error: any) {
      logger.error('MenuAdminService', 'getRbacMatrix', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ', data: [] }
    }
  }

  async updateItemRoles(id: string, requiredRoles: string[] | null): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.patch<any>(API_ENDPOINTS.menu.patchRoles(id), {
        requiredRoles: requiredRoles && requiredRoles.length > 0 ? requiredRoles : null
      })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      logger.error('MenuAdminService', 'updateItemRoles', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

const menuAdminService = new MenuAdminService()
export default menuAdminService
