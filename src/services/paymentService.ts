import { apiClient } from '@/utils/apiClient'
import type { PaymentRecordType, PaymentSummaryType, MonthlyReportType } from '@/types/apps/paymentTypes'
import type { ResponseResult } from '@/types/common'

// Query parameters for GET /api/payments - Theo API Documentation
export interface GetPaymentsParams {
  pageNumber?: number
  pageSize?: number
  studentId?: string
  classId?: string
  type?: number // 0=Tuition, 1=ExamFee, 2=Registration, 3=Other
  fromDate?: string
  toDate?: string
}

// Request body for POST /api/payments
export interface CreatePaymentRequest {
  studentId: string
  classId?: string
  type: number
  amount: number
  paymentDate: string
  method: number // 0=Cash, 1=BankTransfer, 2=Card
  forMonth?: number
  forYear?: number
  description?: string
}

class PaymentService {
  async getPayments(params?: GetPaymentsParams): Promise<ResponseResult<PaymentRecordType[]>> {
    const response = await apiClient.get<any>('/payments', { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return {
      success: true,
      data: apiResponse.data?.items || apiResponse.data?.records || []
    }
  }

  async getPaymentById(id: string): Promise<ResponseResult<PaymentRecordType>> {
    const response = await apiClient.get<any>(`/payments/${id}`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data }
  }

  async createPayment(data: CreatePaymentRequest): Promise<ResponseResult<PaymentRecordType>> {
    const response = await apiClient.post<any>('/payments', data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async updatePayment(id: string, data: Partial<CreatePaymentRequest>): Promise<ResponseResult<PaymentRecordType>> {
    const response = await apiClient.put<any>(`/payments/${id}`, data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async deletePayment(id: string): Promise<ResponseResult<void>> {
    const response = await apiClient.delete<any>(`/payments/${id}`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, message: apiResponse.message }
  }

  async restorePayment(id: string): Promise<ResponseResult<PaymentRecordType>> {
    const response = await apiClient.post<any>(`/payments/${id}/restore`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data, message: apiResponse.message }
  }

  async getPaymentsByStudent(studentId: string): Promise<ResponseResult<PaymentRecordType[]>> {
    const response = await apiClient.get<any>(`/payments/by-student/${studentId}`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }

  async getPaymentsByClass(classId: string): Promise<ResponseResult<PaymentRecordType[]>> {
    const response = await apiClient.get<any>(`/payments/by-class/${classId}`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data || [] }
  }

  async getClassSummary(
    classId: string,
    fromDate: string,
    toDate: string
  ): Promise<ResponseResult<PaymentSummaryType>> {
    const response = await apiClient.get<any>(`/payments/summary/class/${classId}`, {
      params: { fromDate, toDate }
    })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data }
  }

  async getMonthlyReport(year: number, month: number): Promise<ResponseResult<MonthlyReportType>> {
    const response = await apiClient.get<any>('/payments/reports/monthly', {
      params: { year, month }
    })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data }
  }

  async getClassStatistics(classId: string, month: number, year: number): Promise<ResponseResult<any>> {
    const response = await apiClient.get<any>(`/payments/statistics/class/${classId}`, {
      params: { month, year }
    })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data }
  }

  async getOverduePayments(): Promise<ResponseResult<any[]>> {
    const response = await apiClient.get<any>('/payments/overdue')
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return { success: false, data: [], message: apiResponse.message }
    }

    return { success: true, data: apiResponse.data?.items || apiResponse.data || [] }
  }
}

const paymentService = new PaymentService()
export default paymentService
