export type PaymentInvoiceDraft = {
  classId?: string
  className?: string
  studentId?: string
  studentName?: string
  forMonth?: number
  forYear?: number
  initialMode?: 'tuition' | 'one-time' | 'exam' | 'blank'
}

const STORAGE_PREFIX = 'payment-invoice-draft:'

export const savePaymentInvoiceDraft = (draft: PaymentInvoiceDraft) => {
  if (typeof window === 'undefined') return ''

  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  window.sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(draft))

  return key
}

export const readPaymentInvoiceDraft = (key: string) => {
  if (typeof window === 'undefined' || !key) return null

  const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${key}`)

  if (!raw) return null

  try {
    return JSON.parse(raw) as PaymentInvoiceDraft
  } catch {
    return null
  }
}

export const clearPaymentInvoiceDraft = (key: string) => {
  if (typeof window === 'undefined' || !key) return
  window.sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`)
}
