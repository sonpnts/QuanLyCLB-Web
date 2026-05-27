export const PAYMENT_TYPE_MAP: Record<string, number> = {
  Tuition: 0,
  ExamFee: 1,
  Registration: 2,
  Other: 3,
  FacilityFee: 4,
  CodeChangeFee: 5
}

export const normalizePaymentType = (value: unknown, fallback = 3): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') return PAYMENT_TYPE_MAP[value] ?? fallback
  
return fallback
}
