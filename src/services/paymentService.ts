import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type {
  PaymentRecordType,
  PaymentSummaryType,
  MonthlyReportType,
  StudentDiscountConfigType
} from '@/types/apps/paymentTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

export interface GetPaymentsParams {
  pageNumber?: number
  pageSize?: number
  studentId?: string
  classId?: string
  collectedByUserId?: string
  type?: number
  fromDate?: string
  toDate?: string
  paymentDateFrom?: string
  paymentDateTo?: string
}

export interface CreatePaymentRequest {
  studentId: string
  classId?: string
  productId?: string
  examRegistrationId?: string
  type: number
  amount?: number
  discountAmount?: number
  discountReason?: string
  studentDiscountConfigId?: string
  paymentDate: string
  method: number
  transactionRef?: string
  transferProofImageUrl?: string
  forMonth?: number
  forYear?: number
  description?: string
  collectedByUserId?: string
}

export interface BulkPaymentItemRequest {
  type: number
  amount?: number
  description?: string
  classId?: string
  productId?: string
  forMonth?: number
  forYear?: number
  examRegistrationId?: string
  discountAmount?: number
  discountReason?: string
  studentDiscountConfigId?: string
}

export interface CreateBulkPaymentRequest {
  studentId: string
  paymentDate: string
  method: number
  transactionRef?: string
  transferProofImageUrl?: string
  collectedByUserId?: string
  items: BulkPaymentItemRequest[]
}

export interface TuitionQuoteType {
  classId: string
  studentId: string
  forMonth: number
  forYear: number
  monthlyFee: number
  suggestedDiscountAmount: number
  alreadyPaid: boolean
  finalAmount: number
  message?: string
}

export interface ExamFeeOptionType {
  registrationId: string
  examSessionId: string
  examSessionName: string
  targetBeltLevelId: string
  targetBeltLevelName: string
  feeAmount: number
  isFeePaid: boolean
}

const unwrapList = (payload: any): any[] => {
  if (Array.isArray(payload?.records)) return payload.records
  if (Array.isArray(payload?.Records)) return payload.Records
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.Items)) return payload.Items
  if (Array.isArray(payload)) return payload

  return []
}

class PaymentService {
  async getPayments(params?: GetPaymentsParams): Promise<ResponseResult<PaymentRecordType[]>> {
    try {
      const normalizedParams = params
        ? {
            ...params,
            paymentDateFrom: params.paymentDateFrom ?? params.fromDate,
            paymentDateTo: params.paymentDateTo ?? params.toDate
          }
        : undefined

      const response = await apiClient.get<any>(API_ENDPOINTS.payments.root, { params: normalizedParams })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return {
        success: true,
        data: unwrapList(apiResponse.data)
      }
    } catch (error) {
      logger.error('PaymentService', 'getPayments', error)
      return { success: true, data: [] }
    }
  }

  async getPaymentById(id: string): Promise<ResponseResult<PaymentRecordType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('PaymentService', 'getPaymentById', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async createPayment(data: CreatePaymentRequest): Promise<ResponseResult<PaymentRecordType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.payments.root, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('PaymentService', 'createPayment', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async createBulkPayment(data: CreateBulkPaymentRequest): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.payments.bulk, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('PaymentService', 'createBulkPayment', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async updatePayment(id: string, data: Partial<CreatePaymentRequest>): Promise<ResponseResult<PaymentRecordType>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.payments.byId(id), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('PaymentService', 'updatePayment', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async deletePayment(id: string): Promise<ResponseResult<void>> {
    try {
      const response = await apiClient.delete<any>(API_ENDPOINTS.payments.byId(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, message: apiResponse.message }
    } catch (error: any) {
      logger.error('PaymentService', 'deletePayment', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async restorePayment(id: string): Promise<ResponseResult<PaymentRecordType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.payments.restore(id))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      logger.error('PaymentService', 'restorePayment', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getPaymentsByStudent(studentId: string): Promise<ResponseResult<PaymentRecordType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.byStudent(studentId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return { success: true, data: unwrapList(apiResponse.data) }
    } catch (error) {
      logger.error('PaymentService', 'getPaymentsByStudent', error)
      return { success: true, data: [] }
    }
  }

  async getPaymentsByClass(classId: string): Promise<ResponseResult<PaymentRecordType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.byClass(classId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return { success: true, data: unwrapList(apiResponse.data) }
    } catch (error) {
      logger.error('PaymentService', 'getPaymentsByClass', error)
      return { success: true, data: [] }
    }
  }

  async getClassSummary(classId: string, fromDate: string, toDate: string): Promise<ResponseResult<PaymentSummaryType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.classSummary(classId), {
        params: { fromDate, toDate }
      })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('PaymentService', 'getClassSummary', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getMonthlyReport(year: number, month: number): Promise<ResponseResult<MonthlyReportType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.monthlyReport, {
        params: { year, month }
      })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('PaymentService', 'getMonthlyReport', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getClassStatistics(classId: string, month: number, year: number): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.classStatistics(classId), {
        params: { month, year }
      })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getOverduePayments(): Promise<ResponseResult<any[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.overdue)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return { success: true, data: unwrapList(apiResponse.data) }
    } catch {
      return { success: true, data: [] }
    }
  }

  async getTuitionQuote(
    classId: string,
    studentId: string,
    month: number,
    year: number,
    paymentDate?: string
  ): Promise<ResponseResult<TuitionQuoteType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.tuitionQuote, {
        params: { classId, studentId, month, year, paymentDate }
      })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getExamFeeOptions(classId: string, studentId: string): Promise<ResponseResult<ExamFeeOptionType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.examFeeOptions, {
        params: { classId, studentId }
      })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return { success: true, data: unwrapList(apiResponse.data) as ExamFeeOptionType[] }
    } catch {
      return { success: true, data: [] }
    }
  }

  async uploadTransferProof(file: File): Promise<ResponseResult<{ imageUrl: string; storedImageId: string }>> {
    try {
      const formData = new FormData()

      formData.append('file', file)

      const response = await apiClient.post<any>(API_ENDPOINTS.payments.uploadTransferProof, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return {
        success: true,
        data: apiResponse.data,
        message: apiResponse.message
      }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }


  // ── Student discount configs ────────────────────────────────────────────

  async getStudentDiscountConfigs(params?: {
    studentId?: string
    branchId?: string
    classId?: string
    pageNumber?: number
    pageSize?: number
    isActive?: boolean
  }): Promise<ResponseResult<StudentDiscountConfigType[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.studentDiscountConfigs, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: true, data: [] }
      }

      return { success: true, data: unwrapList(apiResponse.data) }
    } catch {
      return { success: true, data: [] }
    }
  }

  async createStudentDiscountConfig(data: {
    studentId: string
    branchId?: string
    classId?: string
    maxDiscountAmount: number
    description?: string
    effectiveFrom?: string
    effectiveTo?: string
  }): Promise<ResponseResult<StudentDiscountConfigType>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.payments.studentDiscountConfigs, data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async updateStudentDiscountConfig(
    id: string,
    data: {
      branchId?: string
      classId?: string
      maxDiscountAmount: number
      description?: string
      effectiveFrom?: string
      effectiveTo?: string
      isActive: boolean
    }
  ): Promise<ResponseResult<StudentDiscountConfigType>> {
    try {
      const response = await apiClient.put<any>(API_ENDPOINTS.payments.studentDiscountConfigById(id), data)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return { success: false, message: apiResponse.message }
      }

      return { success: true, data: apiResponse.data, message: apiResponse.message }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  // ─── Công nợ & tổng hợp thu chi (mới) ────────────────────────────────────

  async getOutstandingByStudent(studentId: string, month?: number, year?: number): Promise<ResponseResult<any>> {
    try {
      const params: Record<string, string> = {}
      if (month) params['month'] = month.toString()
      if (year) params['year'] = year.toString()
      const qs = new URLSearchParams(params).toString()
      const url = `${API_ENDPOINTS.payments.outstanding(studentId)}${qs ? '?' + qs : ''}`
      const response = await apiClient.get<any>(url)
      const apiResponse = response.data
      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối' }
    }
  }

  async getSummaryForCoach(month: number, year: number): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.summaryMy, { params: { month, year } })
      const apiResponse = response.data
      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối' }
    }
  }

  async getSummaryForAdmin(month: number, year: number, classId?: string, coachId?: string): Promise<ResponseResult<any>> {
    try {
      const params: Record<string, string> = { month: month.toString(), year: year.toString() }
      if (classId) params['classId'] = classId
      if (coachId) params['coachId'] = coachId
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.summaryAdmin, { params })
      const apiResponse = response.data
      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối' }
    }
  }

  async getUnpaidList(params: {
    type: string
    month?: number
    year?: number
    classId?: string
    examSessionId?: string
    coachId?: string
  }): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.unpaid, { params })
      const apiResponse = response.data
      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối' }
    }
  }
}

const paymentService = new PaymentService()
export default paymentService
