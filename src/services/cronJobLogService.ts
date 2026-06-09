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

export interface CronJobManualRunResult {
  id: string
  jobKey: string
  scheduledAtLocal: string
  forMonth?: number | null
  forYear?: number | null
  status: string
  attemptCount: number
  totalCandidates: number
  totalSent: number
  totalSkippedAlreadySent: number
  totalFailed: number
  errorMessage?: string | null
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

  async runZnsTuitionDue(): Promise<ResponseResult<CronJobManualRunResult>> {
    return this.runJob(API_ENDPOINTS.auditLogs.runZnsTuitionDue, 'runZnsTuitionDue')
  }

  async runFederationSync(): Promise<ResponseResult<CronJobManualRunResult>> {
    return this.runJob(API_ENDPOINTS.auditLogs.runFederationSync, 'runFederationSync')
  }

  private async runJob(endpoint: string, action: string): Promise<ResponseResult<CronJobManualRunResult>> {
    try {
      const response = await apiClient.post<any>(endpoint)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message, data: apiResponse.data }
      }

      return {
        success: true,
        message: apiResponse.message,
        data: apiResponse.data
      }
    } catch (error: any) {
      logger.error('CronJobLogService', action, error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

export default new CronJobLogService()
