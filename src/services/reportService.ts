import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import type { ResponseResult } from '@/types/common'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'

export type ExportedFile = {
  blob: Blob
  fileName: string
}

const parseErrorMessage = async (payload: unknown, fallbackMessage: string): Promise<string> => {
  if (payload instanceof Blob) {
    const text = await payload.text()

    if (!text) return fallbackMessage

    try {
      const parsed = JSON.parse(text)

      return parsed?.message || parsed?.title || text
    } catch {
      return text
    }
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  if (payload && typeof payload === 'object') {
    const message = (payload as { message?: string; title?: string }).message || (payload as { title?: string }).title

    if (message) return message
  }

  return fallbackMessage
}

class ReportService {
  async exportClassStudentsExcel(classId: string, classCode?: string): Promise<ResponseResult<ExportedFile>> {
    const fallbackMessage = 'Khong the xuat file Excel'

    try {
      const response = await apiClient.get(API_ENDPOINTS.reports.studentList, {
        params: { classId, format: 'excel' },
        responseType: 'blob'
      })

      if ((response.status ?? 200) >= 400) {
        const errorMessage = await parseErrorMessage(response.data, fallbackMessage)

        return { success: false, message: errorMessage }
      }

      const contentDisposition = response.headers?.['content-disposition'] as string | undefined
      const fileNameMatch = contentDisposition?.match(/filename\*?=(?:UTF-8'')?\"?([^\";]+)\"?/i)
      const fallbackFileKey = classCode?.trim() || classId
      const fileName = fileNameMatch?.[1] ? decodeURIComponent(fileNameMatch[1]) : `HocVien_${fallbackFileKey}.xlsx`

      return {
        success: true,
        data: {
          blob: response.data as Blob,
          fileName
        }
      }
    } catch (error: any) {
      logger.error('ReportService', 'exportClassStudentsExcel', error)

      const errorMessage = await parseErrorMessage(error?.response?.data, 'Mất kết nối máy chủ')

      return { success: false, message: errorMessage }
    }
  }

  async exportAllStudentsByClassExcel(): Promise<ResponseResult<ExportedFile>> {
    const fallbackMessage = 'Không thể xuất file Excel'

    try {
      const response = await apiClient.get(API_ENDPOINTS.reports.allStudentsByClass, {
        params: { format: 'excel' },
        responseType: 'blob'
      })

      if ((response.status ?? 200) >= 400) {
        const errorMessage = await parseErrorMessage(response.data, fallbackMessage)
        return { success: false, message: errorMessage }
      }

      const contentDisposition = response.headers?.['content-disposition'] as string | undefined
      const fileNameMatch = contentDisposition?.match(/filename\*?=(?:UTF-8'')?\"?([^\";]+)\"?/i)
      const fileName = fileNameMatch?.[1] ? decodeURIComponent(fileNameMatch[1]) : `DanhSachVoSinh.xlsx`

      return {
        success: true,
        data: {
          blob: response.data as Blob,
          fileName
        }
      }
    } catch (error: any) {
      logger.error('ReportService', 'exportAllStudentsByClassExcel', error)
      const errorMessage = await parseErrorMessage(error?.response?.data, fallbackMessage)
      return { success: false, message: errorMessage }
    }
  }
}

const reportService = new ReportService()

export default reportService
