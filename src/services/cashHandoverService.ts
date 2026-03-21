import { apiClient } from '@/utils/apiClient'
import type { CashHandoverType } from '@/types/apps/cashHandoverTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

export interface GetCashHandoversParams {
  classId?: string
  instructorId?: string
  handoverFrom?: string
  handoverTo?: string
}

export interface CreateCashHandoverRequest {
  classId: string
  instructorId: string
  amountHandedOver: number
  notes?: string
}

const toCashHandover = (value: any): CashHandoverType => ({
  id: value.id,
  classId: value.classId,
  className: value.className,
  instructorId: value.instructorId,
  instructorName: value.instructorName,
  handoverAt: value.handoverAt,
  snapshotTuitionAmount: Number(value.snapshotTuitionAmount || 0),
  snapshotProductSalesAmount: Number(value.snapshotProductSalesAmount || 0),
  snapshotTotalAmount: Number(value.snapshotTotalAmount || 0),
  previousHandedOverAmount: Number(value.previousHandedOverAmount || 0),
  amountHandedOver: Number(value.amountHandedOver || 0),
  remainingAmountAfterHandover: Number(value.remainingAmountAfterHandover || 0),
  notes: value.notes,
  createdByUserId: value.createdByUserId,
  createdByUserName: value.createdByUserName
})

const unwrapList = (value: any): any[] => {
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.records)) return value.records
  if (Array.isArray(value)) return value

  return []
}

class CashHandoverService {
  async getCashHandovers(params?: GetCashHandoversParams): Promise<ResponseResult<CashHandoverType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.cashHandovers.root, { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return {
      success: true,
      data: unwrapList(apiResponse.data).map(toCashHandover)
    }
  }

  async getCashHandoverById(id: string): Promise<ResponseResult<CashHandoverType>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.cashHandovers.byId(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: toCashHandover(apiResponse.data) }
  }

  async createCashHandover(data: CreateCashHandoverRequest): Promise<ResponseResult<CashHandoverType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.cashHandovers.root, data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: toCashHandover(apiResponse.data), message: apiResponse.message }
  }
}

export default new CashHandoverService()
