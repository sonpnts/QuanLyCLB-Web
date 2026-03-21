import { apiClient } from '@/utils/apiClient'
import type { AuditLogType } from '@/types/apps/auditLogTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

// Query parameters for GET /audit-logs
export interface GetAuditLogsParams {
  pageNumber?: number
  pageSize?: number
  userId?: string
  userRole?: string
  action?: string
  entityType?: string
  entityId?: string
  timestampFrom?: string
  timestampTo?: string
  isSuccess?: boolean
}

class AuditLogService {
  async getAuditLogs(params?: GetAuditLogsParams): Promise<ResponseResult<AuditLogType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.auditLogs.root, { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return {
      success: true,
      data: apiResponse.data?.items || apiResponse.data?.records || []
    }
  }

  async getAuditLogById(id: string): Promise<ResponseResult<AuditLogType>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.auditLogs.byId(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data }
  }

  async getAuditLogsByUser(userId: string): Promise<ResponseResult<AuditLogType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.auditLogs.byUser(userId))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }

  async getAuditLogsByEntity(entityType: string, entityId: string): Promise<ResponseResult<AuditLogType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.auditLogs.byEntity(entityType, entityId))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }
}

const auditLogService = new AuditLogService()
export default auditLogService
