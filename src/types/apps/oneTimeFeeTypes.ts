export type FeePriceScopeType = 'Global' | 'Branch'

export type FeeDefinitionType = {
  feeCode: string
  name: string
  description?: string | null
  isOneTime: boolean
  isRequiredForExam: boolean
  isActive: boolean
}

export type CreateFeeDefinitionRequest = {
  feeCode: string
  name: string
  description?: string | null
  isRequiredForExam: boolean
  isActive: boolean
}

export type FeePriceType = {
  id: string
  feeCode: string
  scopeType: FeePriceScopeType
  scopeId?: string | null
  amount: number
  effectiveFrom: string
  effectiveTo?: string | null
  isActive: boolean
}

export type UpsertFeePriceRequest = {
  feeCode: string
  scopeType: FeePriceScopeType
  scopeId?: string | null
  amount: number
}

export type OneTimeFeeOptionType = {
  feeCode: string
  feeName: string
  amount: number
  scopeType: FeePriceScopeType
  scopeId?: string | null
  isPaid: boolean
  isRequiredForExam: boolean
}

export type StudentOneTimeFeeStatusType = {
  feeCode: string
  feeName: string
  paidAt: string
  amount: number
  scopeType: FeePriceScopeType
  scopeId?: string | null
  paymentRecordId?: string | null
  recordedByUserId?: string | null
  recordedByUserName?: string | null
  note?: string | null
}

export type OneTimeFeeImportRowResultType = {
  rowNumber: number
  studentCode?: string | null
  studentName?: string | null
  status: string
  message: string
}

export type OneTimeFeeImportResultType = {
  totalRows: number
  importedRows: number
  skippedRows: number
  rows: OneTimeFeeImportRowResultType[]
}

export type OneTimeFeeAdminStatusType = {
  studentId: string
  studentCode?: string | null
  studentName: string
  classId: string
  classCode?: string | null
  className: string
  branchId: string
  branchName?: string | null
  feeCode: string
  feeName: string
  amount: number
  scopeType: FeePriceScopeType
  scopeId?: string | null
  isPaid: boolean
  paidAt?: string | null
  paymentRecordId?: string | null
  recordedByUserId?: string | null
  recordedByUserName?: string | null
  note?: string | null
  paidSource?: string | null
}

export type OneTimeFeeAdminStatusesResultType = {
  totalRecords: number
  pageNumber: number
  pageSize: number
  records: OneTimeFeeAdminStatusType[]
}

export type GetOneTimeFeeAdminStatusesParams = {
  classId?: string
  feeCode?: string
  isPaid?: boolean
  keyword?: string
  pageNumber?: number
  pageSize?: number
}

export type MarkOneTimeFeePaidRequestType = {
  studentId: string
  classId?: string
  feeCode: string
  note?: string | null
  paidAt?: string | null
}
