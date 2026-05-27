import type { ResponseResult } from '@/types/common'

import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

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
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payroll.root, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      return { success: true, data: apiResponse.data?.records || [] }
    } catch (error) {
      logger.error('PayrollService', 'getPayrolls', error)
      
return { success: true, data: [] }
    }
  }

  async getPayrollById(payrollId: string): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payroll.byId(payrollId))
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
    } catch (error: any) {
      logger.error('PayrollService', 'getPayrollById', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getPayrollByCoach(coachId: string): Promise<ResponseResult<any[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.payroll.byCoach(coachId))
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: true, data: [] }

      return { success: true, data: apiResponse.data?.records || apiResponse.data || [] }
    } catch (error) {
      logger.error('PayrollService', 'getPayrollByCoach', error)
      
return { success: true, data: [] }
    }
  }

  async generatePayroll(data: GeneratePayrollRequest): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.payroll.calculate, data)
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
    } catch (error: any) {
      logger.error('PayrollService', 'generatePayroll', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async createPayroll(data: GeneratePayrollRequest): Promise<ResponseResult<any>> {
    try {
      const response = await apiClient.post<any>(API_ENDPOINTS.payroll.generate, data)
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
    } catch (error: any) {
      logger.error('PayrollService', 'createPayroll', error)
      
return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

export default new PayrollService()
