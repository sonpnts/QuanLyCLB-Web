import { apiClient } from '@/utils/apiClient'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import type { ResponseResult } from '@/types/common'

export interface WebPushConfig {
  publicKey: string
}

export interface WebPushSendPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  url?: string
  targetType: 'All' | 'Role' | 'Branch' | 'Class' | 'User'
  targetIds?: string[]
  scheduledAt?: string | null
}

export interface WebPushFilterParams {
  keyword?: string
  status?: string
  fromDate?: string
  toDate?: string
  pageIndex?: number
  pageSize?: number
}

export interface WebPushNotificationItem {
  id: string
  title: string
  body: string
  icon?: string
  image?: string
  url?: string
  targetType: string
  targetDescription?: string
  scheduledAt?: string | null
  sentAt?: string | null
  status: 'Draft' | 'Scheduled' | 'Sending' | 'Sent' | 'Failed' | 'Cancelled'
  totalSubscribers: number
  successCount: number
  failureCount: number
  errorMessage?: string | null
  createdAt: string
  createdByUserName?: string | null
}

export interface WebPushDeliveryLog {
  id: string
  userId: string
  userName?: string | null
  deviceName?: string | null
  browserName?: string | null
  platform?: string | null
  isSuccess: boolean
  statusCode?: number | null
  errorMessage?: string | null
  sentAt: string
}

export interface WebPushNotificationDetail extends WebPushNotificationItem {
  deliveryLogs: WebPushDeliveryLog[]
}

export interface WebPushSubscriptionItem {
  id: string
  userId: string
  userName?: string | null
  deviceName?: string | null
  browserName?: string | null
  platform?: string | null
  createdAt: string
  lastUpdatedAt?: string | null
  lastSuccessAt?: string | null
}

export interface TargetSubscribersCount {
  totalSubscribers: number
  totalUsers: number
}

class WebPushService {
  async getConfig(): Promise<ResponseResult<WebPushConfig>> {
    const res = await apiClient.get<ResponseResult<WebPushConfig>>(API_ENDPOINTS.webpush.config)
    return res.data
  }

  async estimateSubscribers(targetType: string, targetIds?: string[]): Promise<ResponseResult<TargetSubscribersCount>> {
    const res = await apiClient.post<ResponseResult<TargetSubscribersCount>>(
      API_ENDPOINTS.webpush.subscribersCount,
      { targetType, targetIds }
    )
    return res.data
  }

  async sendOrSchedule(payload: WebPushSendPayload): Promise<ResponseResult<{ notificationId: string }>> {
    const res = await apiClient.post<ResponseResult<{ notificationId: string }>>(
      API_ENDPOINTS.webpush.send,
      payload
    )
    return res.data
  }

  async cancelScheduled(id: string): Promise<ResponseResult<null>> {
    const res = await apiClient.post<ResponseResult<null>>(API_ENDPOINTS.webpush.cancel(id))
    return res.data
  }

  async getHistory(params?: WebPushFilterParams): Promise<ResponseResult<{ items: WebPushNotificationItem[]; totalCount: number; totalPages: number }>> {
    const res = await apiClient.get<ResponseResult<{ items: WebPushNotificationItem[]; totalCount: number; totalPages: number }>>(
      API_ENDPOINTS.webpush.history,
      { params }
    )
    return res.data
  }

  async getDetail(id: string): Promise<ResponseResult<WebPushNotificationDetail>> {
    const res = await apiClient.get<ResponseResult<WebPushNotificationDetail>>(API_ENDPOINTS.webpush.detail(id))
    return res.data
  }

  async getSubscriptions(pageIndex: number = 1, pageSize: number = 50): Promise<ResponseResult<WebPushSubscriptionItem[]>> {
    const res = await apiClient.get<ResponseResult<WebPushSubscriptionItem[]>>(
      API_ENDPOINTS.webpush.subscriptions,
      { params: { pageIndex, pageSize } }
    )
    return res.data
  }
}

export const webPushService = new WebPushService()
export default webPushService
