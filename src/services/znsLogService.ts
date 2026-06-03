import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import type { ZnsLogPagedResultType } from '@/types/apps/znsLogTypes'
import type { ResponseResult } from '@/types/common'
import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'

export interface GetZnsLogsParams {
  pageNumber?: number
  pageSize?: number
  keyword?: string
  isSuccess?: boolean
  notificationType?: string
  errorCode?: number
  sentFrom?: string
  sentTo?: string
}

class ZnsLogService {
  async getZnsLogs(params?: GetZnsLogsParams): Promise<ResponseResult<ZnsLogPagedResultType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.znsLogs.root, { params })
      const apiResponse = response.data

      if (!apiResponse?.isSuccess) {
        return {
          success: false,
          message: apiResponse?.message || 'Không thể tải nhật ký gửi ZNS',
          data: { items: [], totalCount: 0, pageNumber: params?.pageNumber || 1, pageSize: params?.pageSize || 20 }
        }
      }

      const payload = apiResponse.data || {}

      return {
        success: true,
        data: {
          items: payload.items || payload.Items || [],
          totalCount: Number(payload.totalCount ?? payload.TotalCount ?? 0),
          pageNumber: Number(payload.pageNumber ?? payload.PageNumber ?? params?.pageNumber ?? 1),
          pageSize: Number(payload.pageSize ?? payload.PageSize ?? params?.pageSize ?? 20)
        }
      }
    } catch (error: any) {
      logger.error('ZnsLogService', 'getZnsLogs', error)

      return {
        success: false,
        message: error?.response?.data?.message || 'Lỗi kết nối máy chủ',
        data: { items: [], totalCount: 0, pageNumber: params?.pageNumber || 1, pageSize: params?.pageSize || 20 }
      }
    }
  }

  async retryZnsLog(id: string): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.znsLogs.retry(id))
      const apiResponse = response.data

      if (!apiResponse?.isSuccess) {
        return { success: false, message: apiResponse?.message || 'Không thể gửi lại ZNS' }
      }

      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      logger.error('ZnsLogService', 'retryZnsLog', error)

      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

const znsLogService = new ZnsLogService()

export default znsLogService
