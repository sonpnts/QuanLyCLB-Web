/**
 * Tiện ích xuất dữ liệu sang file Excel (.xlsx) sử dụng SheetJS (xlsx).
 * - Hỗ trợ tiếng Việt (UTF-8)
 * - Tự động fit độ rộng cột
 * - Có thể xuất nhiều sheet trong cùng 1 file
 */

import * as XLSX from 'xlsx'

export type ExcelColumn<T> = {
  /** Tiêu đề cột hiển thị trong file Excel */
  header: string
  /** Field name hoặc hàm lấy giá trị từ row */
  accessor: keyof T | ((row: T) => unknown)
  /** Hàm format giá trị (vd: format ngày, currency) */
  formatter?: (value: unknown, row: T) => string | number
  /** Độ rộng cột (số ký tự). Mặc định: tự tính theo nội dung */
  width?: number
}

export type ExcelSheet<T> = {
  /** Tên sheet (Excel giới hạn 31 ký tự) */
  name: string
  columns: ExcelColumn<T>[]
  rows: T[]
}

const buildAOA = <T extends Record<string, any>>(columns: ExcelColumn<T>[], rows: T[]): unknown[][] => {
  const headerRow = columns.map(c => c.header)
  const dataRows = rows.map(row =>
    columns.map(col => {
      const raw = typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]
      const formatted = col.formatter ? col.formatter(raw, row) : raw

      if (formatted === null || formatted === undefined) return ''

      // Giữ kiểu số nếu là number để Excel có thể tính toán
      if (typeof formatted === 'number') return formatted
      return String(formatted)
    })
  )
  return [headerRow, ...dataRows]
}

const computeColWidths = (aoa: unknown[][]): { wch: number }[] => {
  if (aoa.length === 0) return []
  const colCount = aoa[0].length
  const widths: number[] = new Array(colCount).fill(10)

  for (const row of aoa) {
    for (let i = 0; i < colCount; i++) {
      const cell = row[i]
      const len = cell === null || cell === undefined ? 0 : String(cell).length
      if (len > widths[i]) widths[i] = len
    }
  }
  // clamp 8..50
  return widths.map(w => ({ wch: Math.min(50, Math.max(8, w + 2)) }))
}

const sanitizeSheetName = (name: string): string => {
  // Excel: tối đa 31 ký tự, không chứa : \ / ? * [ ]
  return name.replace(/[:\\/?*[\]]/g, '_').slice(0, 31) || 'Sheet1'
}

const downloadWorkbook = (wb: XLSX.WorkBook, filename: string) => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const finalName = filename.endsWith('.xlsx') ? filename : `${filename}_${timestamp}.xlsx`
  XLSX.writeFile(wb, finalName)
}

/**
 * Xuất danh sách `rows` thành 1 file Excel 1 sheet và download.
 */
export function exportToExcel<T extends Record<string, any>>(options: {
  filename: string
  sheetName?: string
  columns: ExcelColumn<T>[]
  rows: T[]
}): void {
  const { filename, sheetName = 'Dữ liệu', columns, rows } = options

  const aoa = buildAOA(columns, rows)
  const ws = XLSX.utils.aoa_to_sheet(aoa)

  // Set column widths
  const customWidths = columns.map(c => (c.width ? { wch: c.width } : null))
  const autoWidths = computeColWidths(aoa)
  ws['!cols'] = customWidths.map((w, i) => w || autoWidths[i])

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(sheetName))
  downloadWorkbook(wb, filename)
}

/**
 * Xuất nhiều sheet vào cùng 1 file Excel.
 */
export function exportToExcelMultiSheet(options: { filename: string; sheets: ExcelSheet<any>[] }): void {
  const { filename, sheets } = options

  const wb = XLSX.utils.book_new()

  for (const sheet of sheets) {
    const aoa = buildAOA(sheet.columns, sheet.rows)
    const ws = XLSX.utils.aoa_to_sheet(aoa)

    const customWidths = sheet.columns.map(c => (c.width ? { wch: c.width } : null))
    const autoWidths = computeColWidths(aoa)
    ws['!cols'] = customWidths.map((w, i) => w || autoWidths[i])

    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(sheet.name))
  }

  downloadWorkbook(wb, filename)
}

/* ============================ Helpers format ============================ */

export const formatVnDate = (value: unknown): string => {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value as string)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('vi-VN')
}

export const formatVnDateTime = (value: unknown): string => {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value as string)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('vi-VN')
}

/**
 * Trả về kiểu number để Excel hiển thị đúng định dạng số (có thể tính toán).
 * Trả empty string nếu null/undefined/NaN.
 */
export const formatVnCurrency = (value: unknown): number | string => {
  if (value === null || value === undefined || value === '') return ''
  const n = Number(value)
  if (isNaN(n)) return String(value)
  return n
}

export const formatBool = (value: unknown, trueText = 'Có', falseText = 'Không'): string => {
  if (value === true) return trueText
  if (value === false) return falseText
  return ''
}
