import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type {
  ClassInstructorSummaryType,
  FinanceAmountSummaryType,
  InstructorClassCollectionType
} from '@/types/apps/financeTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

export interface FinanceDateRangeParams {
  fromDate?: string
  toDate?: string
}

export interface ProductSalesSummaryParams extends FinanceDateRangeParams {
  classId?: string
  branchId?: string
  instructorId?: string
}

const unwrapPayload = (value: any) => value?.data ?? value

const parseAmount = (payload: any): number => {
  const candidates = [
    payload?.amount,
    payload?.totalAmount,
    payload?.totalCollected,
    payload?.totalRevenue,
    payload?.total,
    payload?.value
  ]
  const first = candidates.find(item => typeof item === 'number')

  return Number(first ?? 0)
}

class FinanceService {
  async getClassTuitionSummary(
    classId: string,
    params?: FinanceDateRangeParams
  ): Promise<ResponseResult<FinanceAmountSummaryType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.finance.classTuitionSummary(classId), { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      const payload = unwrapPayload(apiResponse.data)

      return {
        success: true,
        data: {
          amount: parseAmount(payload),
          raw: payload
        }
      }
    } catch (error: any) {
      logger.error('FinanceService', 'getClassTuitionSummary', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getProductSalesSummary(
    params?: ProductSalesSummaryParams
  ): Promise<ResponseResult<FinanceAmountSummaryType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.finance.productSalesSummary, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      const payload = unwrapPayload(apiResponse.data)

      return {
        success: true,
        data: {
          amount: parseAmount(payload),
          raw: payload
        }
      }
    } catch (error: any) {
      logger.error('FinanceService', 'getProductSalesSummary', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getClassInstructorSummary(
    classId: string,
    instructorId: string,
    params?: FinanceDateRangeParams
  ): Promise<ResponseResult<ClassInstructorSummaryType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.finance.classInstructorSummary(classId, instructorId), {
        params
      })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      const payload = unwrapPayload(apiResponse.data)

      return {
        success: true,
        data: {
          instructorId: payload.instructorId || instructorId,
          instructorName: payload.instructorName,
          classId: payload.classId || classId,
          className: payload.className,
          tuitionCollected: Number(payload.tuitionCollected || 0),
          otherPaymentsCollected: Number(payload.otherPaymentsCollected || 0),
          productSalesCollected: Number(payload.productSalesCollected || 0),
          totalCollected: Number(payload.totalCollected || 0)
        }
      }
    } catch (error: any) {
      logger.error('FinanceService', 'getClassInstructorSummary', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getBranchSummary(
    branchId: string,
    params?: FinanceDateRangeParams
  ): Promise<ResponseResult<FinanceAmountSummaryType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.finance.branchSummary(branchId), { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      const payload = unwrapPayload(apiResponse.data)

      return {
        success: true,
        data: {
          amount: parseAmount(payload),
          raw: payload
        }
      }
    } catch (error: any) {
      logger.error('FinanceService', 'getBranchSummary', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getClassCollectionsByInstructor(
    instructorId: string,
    asOfDate?: string
  ): Promise<ResponseResult<InstructorClassCollectionType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.finance.instructorClassCollections(instructorId), {
        params: { asOfDate }
      })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      const rows: any[] = Array.isArray(apiResponse.data) ? apiResponse.data : []

      return {
        success: true,
        data: rows.map(item => ({
          instructorId: item.instructorId || instructorId,
          instructorName: item.instructorName,
          classId: item.classId,
          className: item.className,
          tuitionCollectedToDate: Number(item.tuitionCollectedToDate || 0),
          productSalesCollectedToDate: Number(item.productSalesCollectedToDate || 0),
          totalCollectedToDate: Number(item.totalCollectedToDate || 0),
          totalHandedOver: Number(item.totalHandedOver || 0),
          availableToHandover: Number(item.availableToHandover || 0),
          asOf: item.asOf
        }))
      }
    } catch (error) {
      logger.error('FinanceService', 'getClassCollectionsByInstructor', error)
      return { success: true, data: [] }
    }
  }

  async getMyClassCollections(asOfDate?: string): Promise<ResponseResult<InstructorClassCollectionType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.finance.myClassCollections, {
        params: { asOfDate }
      })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      const rows: any[] = Array.isArray(apiResponse.data) ? apiResponse.data : []

      return {
        success: true,
        data: rows.map(item => ({
          instructorId: item.instructorId,
          instructorName: item.instructorName,
          classId: item.classId,
          className: item.className,
          tuitionCollectedToDate: Number(item.tuitionCollectedToDate || 0),
          productSalesCollectedToDate: Number(item.productSalesCollectedToDate || 0),
          totalCollectedToDate: Number(item.totalCollectedToDate || 0),
          totalHandedOver: Number(item.totalHandedOver || 0),
          availableToHandover: Number(item.availableToHandover || 0),
          asOf: item.asOf
        }))
      }
    } catch (error) {
      logger.error('FinanceService', 'getMyClassCollections', error)
      return { success: true, data: [] }
    }
  }
}

export default new FinanceService()
