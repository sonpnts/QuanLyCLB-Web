export const PAYMENT_METHOD_MAP: Record<string, number> = {
  Cash: 0,
  BankTransfer: 1,
  Other: 2
}

export const normalizePaymentMethod = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') return PAYMENT_METHOD_MAP[value] ?? fallback
  return fallback
}

export const isBankTransferMethod = (value: unknown): boolean => normalizePaymentMethod(value, -1) === 1

