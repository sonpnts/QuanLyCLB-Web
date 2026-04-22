import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import type { ResponseResult } from '@/types/common'

export interface DashboardStatisticsDto {
  totalStudents: number
  activeStudents: number
  totalClasses: number
  activeClasses: number
  totalInstructors: number
  totalBranches: number
  monthlyRevenue: number
  pendingTransfers: number
  upcomingExams: number
  todayAttendance: number
}

export interface RevenueStatisticsDto {
  year: number
  month: number
  totalRevenue: number
  tuitionFees: number
  examFees: number
  otherFees: number
  totalPayments: number
}

export interface StudentStatisticsDto {
  totalStudents: number
  activeStudents: number
  inactiveStudents: number
  newStudentsThisMonth: number
  studentsByBeltLevel: Record<string, number>
  studentsByClass: Record<string, number>
}

export interface ClassStatisticsDto {
  totalClasses: number
  activeClasses: number
  totalEnrollments: number
  averageStudentsPerClass: number
  classesByBranch: Record<string, number>
}

export interface AttendanceStatisticsDto {
  totalSessions: number
  completedSessions: number
  missedSessions: number
  attendanceRate: number
  attendanceByDay: Record<string, number>
}

class DashboardService {
  async getStatistics(): Promise<ResponseResult<DashboardStatisticsDto>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.dashboard.statistics)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('DashboardService', 'getStatistics', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getRevenue(params?: { year?: number; months?: number }): Promise<ResponseResult<RevenueStatisticsDto[]>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.dashboard.revenue, { params })
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data || [] }
    } catch (error: any) {
      logger.error('DashboardService', 'getRevenue', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getStudentStats(): Promise<ResponseResult<StudentStatisticsDto>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.dashboard.students)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('DashboardService', 'getStudentStats', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getClassStats(): Promise<ResponseResult<ClassStatisticsDto>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.dashboard.classes)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('DashboardService', 'getClassStats', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }

  async getAttendanceStats(): Promise<ResponseResult<AttendanceStatisticsDto>> {
    try {
      const response = await apiClient.get<any>(API_ENDPOINTS.dashboard.attendance)
      const apiResponse = response.data

      if (!apiResponse.isSuccess) return { success: false, message: apiResponse.message }

      return { success: true, data: apiResponse.data }
    } catch (error: any) {
      logger.error('DashboardService', 'getAttendanceStats', error)
      return { success: false, message: error?.response?.data?.message || 'Lỗi kết nối máy chủ' }
    }
  }
}

const dashboardService = new DashboardService()
export default dashboardService
