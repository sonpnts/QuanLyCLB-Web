import { apiClient } from '@/utils/apiClient'
import type { PaymentRecordType, PaymentSummaryType, MonthlyReportType } from '@/types/apps/paymentTypes'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

export interface GetPaymentsParams {
  pageNumber?: number
  pageSize?: number
  studentId?: string
  classId?: string
  type?: number
  fromDate?: string
  toDate?: string
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
  transferProofImageUrl?: string
  forMonth?: number
  forYear?: number
  description?: string
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
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload)) return payload

  return []
}

class PaymentService {
  async getPayments(params?: GetPaymentsParams): Promise<ResponseResult<PaymentRecordType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.payments.root, { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return {
      success: true,
      data: unwrapList(apiResponse.data)
    }
  }

  async getPaymentById(id: string): Promise<ResponseResult<PaymentRecordType>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.payments.byId(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data }
  }

  async createPayment(data: CreatePaymentRequest): Promise<ResponseResult<PaymentRecordType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.payments.root, data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async updatePayment(id: string, data: Partial<CreatePaymentRequest>): Promise<ResponseResult<PaymentRecordType>> {
    const response = await apiClient.put<any>(API_ENDPOINTS.payments.byId(id), data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async deletePayment(id: string): Promise<ResponseResult<void>> {
    const response = await apiClient.delete<any>(API_ENDPOINTS.payments.byId(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, message: apiResponse.message }
  }

  async restorePayment(id: string): Promise<ResponseResult<PaymentRecordType>> {
    const response = await apiClient.post<any>(API_ENDPOINTS.payments.restore(id))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async getPaymentsByStudent(studentId: string): Promise<ResponseResult<PaymentRecordType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.payments.byStudent(studentId))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: unwrapList(apiResponse.data) }
  }

  async getPaymentsByClass(classId: string): Promise<ResponseResult<PaymentRecordType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.payments.byClass(classId))
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: unwrapList(apiResponse.data) }
  }

  async getClassSummary(classId: string, fromDate: string, toDate: string): Promise<ResponseResult<PaymentSummaryType>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.payments.classSummary(classId), {
      params: { fromDate, toDate }
    })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data }
  }

  async getMonthlyReport(year: number, month: number): Promise<ResponseResult<MonthlyReportType>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.payments.monthlyReport, {
      params: { year, month }
    })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data }
  }

  async getClassStatistics(classId: string, month: number, year: number): Promise<ResponseResult<any>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.payments.classStatistics(classId), {
      params: { month, year }
    })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data }
  }

  async getOverduePayments(): Promise<ResponseResult<any[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.payments.overdue)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: unwrapList(apiResponse.data) }
  }

  async getTuitionQuote(
    classId: string,
    studentId: string,
    month: number,
    year: number,
    paymentDate?: string
  ): Promise<ResponseResult<TuitionQuoteType>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.payments.tuitionQuote, {
      params: { classId, studentId, month, year, paymentDate }
    })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data }
  }

  async getExamFeeOptions(classId: string, studentId: string): Promise<ResponseResult<ExamFeeOptionType[]>> {
    const response = await apiClient.get<any>(API_ENDPOINTS.payments.examFeeOptions, {
      params: { classId, studentId }
    })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: unwrapList(apiResponse.data) as ExamFeeOptionType[] }
  }

  async uploadTransferProof(file: File): Promise<ResponseResult<{ imageUrl: string; storedImageId: string }>> {
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
  }
}

const paymentService = new PaymentService()
export default paymentService
