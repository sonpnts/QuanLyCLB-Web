import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import type { CronJobLogType } from '@/types/apps/cronJobLogTypes'

export interface GetCronJobLogsParams {
  pageNumber?: number
  pageSize?: number
  keyword?: string
  jobKey?: string
  status?: string
  scheduledFrom?: string
  scheduledTo?: string
}

export interface CronJobLogsPagedResult {
  items: CronJobLogType[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

class CronJobLogService {
  async getCronJobLogs(params?: GetCronJobLogsParams): Promise<ResponseResult<CronJobLogsPagedResult>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.auditLogs.cronJobs, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      const raw = apiResponse.data
      const items: CronJobLogType[] = raw?.items || raw?.records || []

      return {
        success: true,
        data: {
          items,
          totalCount: raw?.totalCount ?? raw?.totalRecords ?? items.length,
          pageNumber: raw?.pageNumber ?? params?.pageNumber ?? 1,
          pageSize: raw?.pageSize ?? params?.pageSize ?? items.length
        }
      }
    } catch (error: any) {
      logger.error('CronJobLogService', 'getCronJobLogs', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

export default new CronJobLogService()
