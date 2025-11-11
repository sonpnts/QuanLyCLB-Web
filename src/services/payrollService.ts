
import type { ResponseResult } from '@/types/common'

import apiClient from '@/utils/apiClient'

export interface GetPayrollParams {
  CoachId?: string
  Year?: number
  Month?: number
  MinTotalAmount?: number
  MaxTotalAmount?: number
  GeneratedAtFrom?: string
  GeneratedAtTo?: string
  CreatedDate?: string
  CreatedBy?: string
  UpdatedDate?: string
  UpdatedBy?: string
  IsActive?: boolean
  Keyword?: string
  PageSize?: number
  PageNumber?: number
}

export interface GeneratePayrollRequest {
  coachId: string
  year: number
  month: number
}

class PayrollService {
  async getPayrolls(params?: GetPayrollParams): Promise<ResponseResult<any[]>> {
    const response = await apiClient.get<any>('/api/Payroll', { params })
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        data: [],
        message: apiResponse.message
      }
    }

    const records = apiResponse.data?.records || []

    return {
      success: true,
      data: records
    }
  }

  async getPayrollById(payrollId: string): Promise<ResponseResult<any>> {
    const response = await apiClient.get<any>(`/api/Payroll/${payrollId}`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        message: apiResponse.message
      }
    }

    return {
      success: true,
      data: apiResponse.data
    }
  }

  async getPayrollByCoach(coachId: string): Promise<ResponseResult<any[]>> {
    const response = await apiClient.get<any>(`/api/Payroll/coach/${coachId}`)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        data: [],
        message: apiResponse.message
      }
    }

    return {
      success: true,
      data: apiResponse.data?.records || apiResponse.data || []
    }
  }

  async generatePayroll(data: GeneratePayrollRequest): Promise<ResponseResult<any>> {
    const response = await apiClient.post<any>('/api/Payroll/generate', data)
    const apiResponse = response.data

    if (!apiResponse.isSuccess) {
      return {
        success: false,
        message: apiResponse.message
      }
    }

    return {
      success: true,
      data: apiResponse.data,
      message: apiResponse.message
    }
  }
}

export default new PayrollService()





