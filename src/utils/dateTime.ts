const VN_TIMEZONE = 'Asia/Ho_Chi_Minh'

const pad2 = (n: number) => String(n).padStart(2, '0')

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

