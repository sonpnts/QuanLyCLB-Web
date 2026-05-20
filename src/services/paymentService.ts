import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type {
  PaymentRecordType,
  PaymentSummaryType,
  MonthlyReportType,
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
  paymentDate: string
  method: number
  transactionRef?: string
  transferProofImageUrl?: string
  forMonth?: number
  forYear?: number
  description?: string
  collectedByUserId?: string
  sendZaloConfirmation?: boolean
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
}

export interface CreateBulkPaymentRequest {
  studentId: string
  paymentDate: string
  method: number
  transactionRef?: string
  transferProofImageUrl?: string
  collectedByUserId?: string
  sendZaloConfirmation?: boolean
  items: BulkPaymentItemRequest[]
}

export interface UpdatePaymentRequest {
  type: number
  amount: number
  originalAmount: number
  paymentDate: string
  method: number
  description?: string
  transactionRef?: string
  receiptNumber?: string
  classId?: string
  productId?: string
  forMonth?: number
  forYear?: number
  transferProofImageUrl?: string
  collectedByUserId?: string
  isActive: boolean
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
  isSuggested?: boolean
}

const unwrapList = (payload: any): any[] => {
  if (Array.isArray(payload?.records)) return payload.records
  if (Array.isArray(payload?.Records)) return payload.Records
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.Items)) return payload.Items
  if (Array.isArray(payload)) return payload

  return []
}

const normalizeNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) return parsed
  }

  return null
}

const normalizeTuitionQuote = (payload: any): TuitionQuoteType | null => {
  if (!payload || typeof payload !== 'object') return null

  const classId = payload.classId ?? payload.ClassId
  const studentId = payload.studentId ?? payload.StudentId
  const forMonth = normalizeNumber(payload.forMonth ?? payload.ForMonth)
  const forYear = normalizeNumber(payload.forYear ?? payload.ForYear)
  const monthlyFee = normalizeNumber(payload.monthlyFee ?? payload.MonthlyFee)
  const suggestedDiscountAmount = normalizeNumber(payload.suggestedDiscountAmount ?? payload.SuggestedDiscountAmount)
  const alreadyPaid = payload.alreadyPaid ?? payload.AlreadyPaid
  const finalAmount = normalizeNumber(payload.finalAmount ?? payload.FinalAmount)
  const message = payload.message ?? payload.Message

  if (
    typeof classId !== 'string' ||
    typeof studentId !== 'string' ||
    forMonth === null ||
    forYear === null ||
    monthlyFee === null ||
    suggestedDiscountAmount === null ||
    finalAmount === null ||
    typeof alreadyPaid !== 'boolean'
  ) {
    return null
  }

  return {
    classId,
    studentId,
    forMonth,
    forYear,
    monthlyFee,
    suggestedDiscountAmount,
    alreadyPaid,
    finalAmount,
    message: typeof message === 'string' ? message : undefined
  }
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

      const normalizedQuote = apiResponse.data

      if (!normalizedQuote) {
        return { success: false, message: apiResponse.message || 'Dữ liệu kiểm tra học phí không hợp lệ.' }
      }

      return { success: true, data: normalizedQuote }
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

  async updatePayment(id: string, data: UpdatePaymentRequest): Promise<ResponseResult<PaymentRecordType>> {
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

      const normalizedQuote = apiResponse.data

      if (!normalizedQuote) {
        return { success: false, message: apiResponse.message || 'Dữ liệu kiểm tra học phí không hợp lệ.' }
      }

      return { success: true, data: normalizedQuote }
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

      const normalizedQuote = normalizeTuitionQuote(apiResponse.data)

      if (!normalizedQuote) {
        return { success: false, message: apiResponse.message || 'Du lieu kiem tra hoc phi khong hop le.' }
      }

      return { success: true, data: normalizedQuote }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message || 'L???i k???t n???i m??y ch???' }
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
  }  // ─── Công nợ & tổng hợp thu chi (mới) ────────────────────────────────────

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
