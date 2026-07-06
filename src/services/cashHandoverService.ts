import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type {
  CashHandoverClassDetailType,
  CashHandoverDeductionType,
  CashHandoverType,
  LateTuitionStudentType,
  OutstandingInstructorType
} from '@/types/apps/cashHandoverTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

export interface GetCashHandoversParams {
  classId?: string
  instructorId?: string
  handoverFrom?: string
  handoverTo?: string
  status?: string
}

export interface CreateDeductionRequest {
  description: string
  amount: number
}

export interface CreateCashHandoverRequest {
  instructorId?: string
  classId?: string
  amountHandedOver?: number
  notes?: string
  deductions?: CreateDeductionRequest[]
}

export interface CashHandoverListResult {
  handovers: CashHandoverType[]
  outstandingInstructors: OutstandingInstructorType[]
}

const toDeduction = (value: any): CashHandoverDeductionType => ({
  id: value.id,
  description: value.description,
  amount: Number(value.amount || 0)
})

const toClassDetail = (value: any): CashHandoverClassDetailType => ({
  classId: value.classId,
  className: value.className,
  snapshotTuitionAmount: Number(value.snapshotTuitionAmount || 0),
  snapshotExamFeeAmount: Number(value.snapshotExamFeeAmount || 0),
  snapshotProductSalesAmount: Number(value.snapshotProductSalesAmount || 0),
  snapshotCashAmount: Number(value.snapshotCashAmount || 0),
  snapshotBankTransferAmount: Number(value.snapshotBankTransferAmount || 0),
  snapshotTotalAmount: Number(value.snapshotTotalAmount || 0),
  previousHandedOverCashAmount: Number(value.previousHandedOverCashAmount || 0),
  previousHandedOverBankTransferAmount: Number(value.previousHandedOverBankTransferAmount || 0),
  previousHandedOverAmount: Number(value.previousHandedOverAmount || 0),
  totalDeductionAmount: Number(value.totalDeductionAmount || 0),
  amountHandedOverCashAmount: Number(value.amountHandedOverCashAmount || 0),
  amountHandedOverBankTransferAmount: Number(value.amountHandedOverBankTransferAmount || 0),
  amountHandedOver: Number(value.amountHandedOver || 0),
  remainingCashAmountAfterHandover: Number(value.remainingCashAmountAfterHandover || 0),
  remainingBankTransferAmountAfterHandover: Number(value.remainingBankTransferAmountAfterHandover || 0),
  remainingAmountAfterHandover: Number(value.remainingAmountAfterHandover || 0)
})

const toCashHandover = (value: any): CashHandoverType => ({
  id: value.id,
  batchCode: value.batchCode,
  classId: value.classId,
  className: value.className,
  instructorId: value.instructorId,
  instructorName: value.instructorName,
  handoverAt: value.handoverAt,
  snapshotTuitionAmount: Number(value.snapshotTuitionAmount || 0),
  snapshotExamFeeAmount: Number(value.snapshotExamFeeAmount || 0),
  snapshotProductSalesAmount: Number(value.snapshotProductSalesAmount || 0),
  snapshotCashAmount: Number(value.snapshotCashAmount || 0),
  snapshotBankTransferAmount: Number(value.snapshotBankTransferAmount || 0),
  snapshotTotalAmount: Number(value.snapshotTotalAmount || 0),
  previousHandedOverCashAmount: Number(value.previousHandedOverCashAmount || 0),
  previousHandedOverBankTransferAmount: Number(value.previousHandedOverBankTransferAmount || 0),
  previousHandedOverAmount: Number(value.previousHandedOverAmount || 0),
  totalDeductionAmount: Number(value.totalDeductionAmount || 0),
  amountHandedOverCashAmount: Number(value.amountHandedOverCashAmount || 0),
  amountHandedOverBankTransferAmount: Number(value.amountHandedOverBankTransferAmount || 0),
  amountHandedOver: Number(value.amountHandedOver || 0),
  remainingCashAmountAfterHandover: Number(value.remainingCashAmountAfterHandover || 0),
  remainingBankTransferAmountAfterHandover: Number(value.remainingBankTransferAmountAfterHandover || 0),
  remainingAmountAfterHandover: Number(value.remainingAmountAfterHandover || 0),
  status: value.status ?? 'Pending',
  confirmedByUserId: value.confirmedByUserId,
  confirmedByUserName: value.confirmedByUserName,
  confirmedAt: value.confirmedAt,
  deductions: Array.isArray(value.deductions) ? value.deductions.map(toDeduction) : [],
  details: Array.isArray(value.details) ? value.details.map(toClassDetail) : [],
  classCount: Number(value.classCount || 0),
  notes: value.notes,
  createdByUserId: value.createdByUserId,
  createdByUserName: value.createdByUserName,
  createdAt: value.createdAt,
  updatedAt: value.updatedAt
})

const toLateTuitionStudent = (value: any): LateTuitionStudentType => ({
  studentId: value.studentId,
  studentName: value.studentName,
  classId: value.classId,
  className: value.className,
  lastPaymentDate: value.lastPaymentDate,
  daysSinceLastPayment: Number(value.daysSinceLastPayment || 0)
})

const unwrapList = (value: any): any[] => {
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.records)) return value.records
  if (Array.isArray(value)) return value

  return []
}

class CashHandoverService {
  async getCashHandovers(params?: GetCashHandoversParams): Promise<ResponseResult<CashHandoverListResult>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.cashHandovers.root, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: { handovers: [], outstandingInstructors: [] } }

      const payload = apiResponse.data
      const handovers = unwrapList(payload?.handovers ?? payload).map(toCashHandover)
      const outstandingInstructors: OutstandingInstructorType[] = Array.isArray(payload?.outstandingInstructors)
        ? payload.outstandingInstructors.map((item: any) => ({
            instructorId: String(item.instructorId || ''),
            instructorName: String(item.instructorName || ''),
            classCount: Number(item.classCount || 0),
            totalAvailableToHandover: Number(item.totalAvailableToHandover || 0)
          }))
        : []

      return { success: true, data: { handovers, outstandingInstructors } }
    } catch (error) {
      logger.error('CashHandoverService', 'getCashHandovers', error)
      
return { success: true, data: { handovers: [], outstandingInstructors: [] } }
    }
  }

  async getCashHandoverById(id: string): Promise<ResponseResult<CashHandoverType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.cashHandovers.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: toCashHandover(apiResponse.data) }
    } catch (error: any) {
      logger.error('CashHandoverService', 'getCashHandoverById', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async createCashHandover(data: CreateCashHandoverRequest): Promise<ResponseResult<CashHandoverType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.cashHandovers.root, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: toCashHandover(apiResponse.data), message: apiResponse.message }
    } catch (error: any) {
      logger.error('CashHandoverService', 'createCashHandover', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async confirmCashHandover(id: string): Promise<ResponseResult<CashHandoverType>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.cashHandovers.confirm(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: toCashHandover(apiResponse.data), message: apiResponse.message }
    } catch (error: any) {
      logger.error('CashHandoverService', 'confirmCashHandover', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async rejectCashHandover(id: string, reason: string): Promise<ResponseResult<CashHandoverType>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.cashHandovers.reject(id), { reason })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: toCashHandover(apiResponse.data), message: apiResponse.message }
    } catch (error: any) {
      logger.error('CashHandoverService', 'rejectCashHandover', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getLateTuitionStudents(params?: {
    classId?: string
    instructorId?: string
  }): Promise<ResponseResult<LateTuitionStudentType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.cashHandovers.lateTuitionStudents, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      return { success: true, data: unwrapList(apiResponse.data).map(toLateTuitionStudent) }
    } catch (error) {
      logger.error('CashHandoverService', 'getLateTuitionStudents', error)
      
return { success: true, data: [] }
    }
  }
}

export default new CashHandoverService()
