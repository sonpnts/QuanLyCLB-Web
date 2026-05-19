export type FeePriceScopeType = 'Global' | 'Branch'

export type FeeDefinitionType = {
  feeCode: string
  name: string
  description?: string | null
  isOneTime: boolean
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
