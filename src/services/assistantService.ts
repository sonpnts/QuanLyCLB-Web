import { logger } from '@/utils/logger'
import type { ResponseResult } from '@/types/common'
import type { UsersType } from '@/types/apps/userTypes'
import userService from './userService'

/**
 * Service quản lý Trợ giảng (Assistant).
 * Trợ giảng là user có role "Assistant" trong hệ thống.
 * Reuse userService cho CRUD cơ bản, chỉ filter theo role.
 */
class AssistantService {
  private readonly ASSISTANT_ROLE = 'Assistant'

  /** Lấy danh sách user có role Assistant */
  async getAssistants(): Promise<ResponseResult<UsersType[]>> {
    try {
      const res = await userService.getUsers({ Role: this.ASSISTANT_ROLE, PageSize: 1000 })

      
return res
    } catch (error: any) {
      logger.error('AssistantService', 'getAssistants', error)
      
return { success: false, data: [], message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  /** Gán role Assistant cho user (giữ nguyên các role hiện có, chỉ thêm Assistant) */
  async assignAssistantRole(userId: string): Promise<ResponseResult<UsersType>> {
    try {
      // Lấy roles hiện tại
      const userRes = await userService.getUserById(userId)

      if (!userRes.success || !userRes.data) {
        return { success: false, message: userRes.message || 'Không tìm thấy người dùng.' }
      }

      const currentRoles = (userRes.data.roles || []).map((r: any) => (typeof r === 'string' ? r : r?.name)).filter(Boolean)

      if (currentRoles.includes(this.ASSISTANT_ROLE)) {
        return { success: false, message: 'Người dùng đã là Trợ giảng.' }
      }

      const newRoles = [...currentRoles, this.ASSISTANT_ROLE]
      const updateRes = await userService.updateUserRoles(userId, newRoles)

      
return updateRes
    } catch (error: any) {
      logger.error('AssistantService', 'assignAssistantRole', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  /** Bỏ role Assistant của user */
  async removeAssistantRole(userId: string): Promise<ResponseResult<UsersType>> {
    try {
      const userRes = await userService.getUserById(userId)

      if (!userRes.success || !userRes.data) {
        return { success: false, message: userRes.message || 'Không tìm thấy người dùng.' }
      }

      const currentRoles = (userRes.data.roles || []).map((r: any) => (typeof r === 'string' ? r : r?.name)).filter(Boolean)
      const newRoles = currentRoles.filter((r: string) => r !== this.ASSISTANT_ROLE)

      const updateRes = await userService.updateUserRoles(userId, newRoles)

      
return updateRes
    } catch (error: any) {
      logger.error('AssistantService', 'removeAssistantRole', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

const assistantService = new AssistantService()

export default assistantService
