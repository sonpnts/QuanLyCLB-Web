const VN_TIMEZONE = 'Asia/Ho_Chi_Minh'

const pad2 = (n: number) => String(n).padStart(2, '0')
const VN_UTC_OFFSET_HOURS = 7

type DateValue = Date | string | number | null | undefined

const toValidDate = (value: DateValue): Date | null => {
  if (value === null || value === undefined || value === '') return null

  const date = value instanceof Date ? value : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

const toVietnamDateParts = (value: DateValue) => {
  const date = toValidDate(value)

  if (!date) return null

  const vnDate = new Date(date.getTime() + VN_UTC_OFFSET_HOURS * 60 * 60 * 1000)

  return {
    day: pad2(vnDate.getUTCDate()),
    month: pad2(vnDate.getUTCMonth() + 1),
    year: String(vnDate.getUTCFullYear()),
    hour: pad2(vnDate.getUTCHours()),
    minute: pad2(vnDate.getUTCMinutes()),
    second: pad2(vnDate.getUTCSeconds())
  }
}

export const formatVietnamDate = (
  value: DateValue,
  options?: {
    withTime?: boolean
    fallback?: string
  }
): string => {
  const { withTime = false, fallback = '-' } = options || {}
  const parts = toVietnamDateParts(value)

  if (!parts) return fallback

  const dateText = `${parts.day}/${parts.month}/${parts.year}`

  return withTime ? `${parts.hour}:${parts.minute}:${parts.second} ${dateText}` : dateText
}

export const formatDateVN = (value: DateValue, fallback = '-') => formatVietnamDate(value, { fallback })

export const formatDateTimeVN = (value: DateValue, fallback = '-') =>
  formatVietnamDate(value, { withTime: true, fallback })

export const getVietnamNow = (): Date => {
  const now = new Date()
  const asVn = now.toLocaleString('sv-SE', { timeZone: VN_TIMEZONE })

  return new Date(asVn.replace(' ', 'T'))
}

export const toVietnamISOString = (date: Date): string => {
  const asVn = date.toLocaleString('sv-SE', { timeZone: VN_TIMEZONE })
  const [datePart, timePart] = asVn.split(' ')

  if (!datePart || !timePart) return date.toISOString()

  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute, second] = timePart.split(':').map(Number)

  return `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:${pad2(second)}+07:00`
}
