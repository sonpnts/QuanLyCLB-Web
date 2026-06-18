import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type {
  PaymentRecordType,
  DiscountedReceiptPagedResultType,
  ReceiptListPagedResultType,
  ReceiptListItemType,
  CollectedPaymentSummaryType,
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

export interface GetDiscountedReceiptsParams {
  pageNumber?: number
  pageSize?: number
  classId?: string
  collectedByUserId?: string
  keyword?: string
  isActive?: boolean
  paymentDateFrom?: string
  paymentDateTo?: string
  discountScope?: string
}

export interface GetReceiptListParams {
  pageNumber?: number
  pageSize?: number
  classId?: string
  collectedByUserId?: string
  keyword?: string
  type?: number
  method?: number
  isActive?: boolean
  paymentDateFrom?: string
  paymentDateTo?: string
}

export interface CreatePaymentRequest {
  studentId: string | null
  classId?: string
  productId?: string
  productVariantId?: string
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
  buyerName?: string
  buyerPhone?: string
}

export interface BulkPaymentItemRequest {
  type: number
  amount?: number
  description?: string
  classId?: string
  productId?: string
  productVariantId?: string
  forMonth?: number
  forYear?: number
  examRegistrationId?: string
  discountAmount?: number
  discountReason?: string
}

export interface CreateBulkPaymentRequest {
  studentId: string | null
  paymentDate: string
  method: number
  transactionRef?: string
  transferProofImageUrl?: string
  collectedByUserId?: string
  sendZaloConfirmation?: boolean
  discountAmount?: number
  discountReason?: string
  buyerName?: string
  buyerPhone?: string
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
  productVariantId?: string
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

const unwrapPagedPayload = (payload: any) => ({
  totalRecords: Number(payload?.totalRecords ?? payload?.TotalRecords ?? payload?.totalCount ?? payload?.TotalCount ?? 0),
  records: unwrapList(payload)
})

const normalizeNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) return parsed
  }

  return null
}

const normalizeReceiptListItem = (payload: any): ReceiptListItemType | null => {
  if (!payload || typeof payload !== 'object') return null

  const receiptNumber = payload.receiptNumber ?? payload.ReceiptNumber
  const studentId = payload.studentId ?? payload.StudentId ?? null
  const studentName = payload.studentName ?? payload.StudentName
  const paymentDate = payload.paymentDate ?? payload.PaymentDate
  const method = normalizeNumber(payload.method ?? payload.Method)
  const totalAmount = normalizeNumber(payload.totalAmount ?? payload.TotalAmount)
  const collectedByUserName = payload.collectedByUserName ?? payload.CollectedByUserName
  const itemCount = normalizeNumber(payload.itemCount ?? payload.ItemCount)
  const types = Array.isArray(payload.types ?? payload.Types) ? (payload.types ?? payload.Types).map((item: any) => Number(item)) : []
  const periods = Array.isArray(payload.periods ?? payload.Periods) ? (payload.periods ?? payload.Periods).map(String) : []
  const classNames = Array.isArray(payload.classNames ?? payload.ClassNames) ? (payload.classNames ?? payload.ClassNames).map(String) : []
  const transferProofImageUrl = payload.transferProofImageUrl ?? payload.TransferProofImageUrl ?? undefined

  if (
    typeof receiptNumber !== 'string' ||
    (typeof studentId !== 'string' && studentId !== null) ||
    typeof studentName !== 'string' ||
    typeof paymentDate !== 'string' ||
    method === null ||
    totalAmount === null ||
    typeof collectedByUserName !== 'string' ||
    itemCount === null
  ) {
    return null
  }

  return {
    receiptNumber,
    studentId,
    studentName,
    paymentDate,
    method: method as ReceiptListItemType['method'],
    types,
    periods,
    totalAmount,
    collectedByUserName,
    classNames,
    transferProofImageUrl: typeof transferProofImageUrl === 'string' ? transferProofImageUrl : undefined,
    itemCount
  }
}

const normalizeCollectedPaymentSummary = (payload: any): CollectedPaymentSummaryType => ({
  receiptCount: Number(payload?.receiptCount ?? payload?.ReceiptCount ?? 0),
  totalTuition: Number(payload?.totalTuition ?? payload?.TotalTuition ?? 0),
  totalExamFees: Number(payload?.totalExamFees ?? payload?.TotalExamFees ?? 0),
  totalOtherFees: Number(payload?.totalOtherFees ?? payload?.TotalOtherFees ?? 0),
  grandTotal: Number(payload?.grandTotal ?? payload?.GrandTotal ?? 0)
})

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

  async getReceiptList(params?: GetReceiptListParams): Promise<ResponseResult<ReceiptListPagedResultType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.receipts, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message,
          data: { totalRecords: 0, records: [] }
        }
      }

      const payload = unwrapPagedPayload(apiResponse.data)

      return {
        success: true,
        data: {
          totalRecords: payload.totalRecords,
          records: payload.records.map(normalizeReceiptListItem).filter((item): item is ReceiptListItemType => item !== null)
        }
      }
    } catch (error: any) {
      logger.error('PaymentService', 'getReceiptList', error)

      return {
        success: false,
        message: error?.response?.data?.message || 'Loi ket noi may chu',
        data: { totalRecords: 0, records: [] }
      }
    }
  }

  async getReceiptSummary(params?: GetReceiptListParams): Promise<ResponseResult<CollectedPaymentSummaryType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.receiptsSummary, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message,
          data: {
            receiptCount: 0,
            totalTuition: 0,
            totalExamFees: 0,
            totalOtherFees: 0,
            grandTotal: 0
          }
        }
      }

      return {
        success: true,
        data: normalizeCollectedPaymentSummary(apiResponse.data)
      }
    } catch (error: any) {
      logger.error('PaymentService', 'getReceiptSummary', error)

      return {
        success: false,
        message: error?.response?.data?.message || 'Loi ket noi may chu',
        data: {
          receiptCount: 0,
          totalTuition: 0,
          totalExamFees: 0,
          totalOtherFees: 0,
          grandTotal: 0
        }
      }
    }
  }

  async getDiscountedReceipts(
    params?: GetDiscountedReceiptsParams
  ): Promise<ResponseResult<DiscountedReceiptPagedResultType>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.discountedReceipts, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) {
        return {
          success: false,
          message: apiResponse.message,
          data: { totalRecords: 0, records: [] }
        }
      }

      const payload = apiResponse.data || {}

      return {
        success: true,
        data: {
          totalRecords: Number(payload.totalRecords ?? payload.TotalRecords ?? 0),
          records: unwrapList(payload) as PaymentRecordType[]
        }
      }
    } catch (error: any) {
      logger.error('PaymentService', 'getDiscountedReceipts', error)
      
return {
        success: false,
        message: error?.response?.data?.message || 'Loi ket noi may chu',
        data: { totalRecords: 0, records: [] }
      }
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
