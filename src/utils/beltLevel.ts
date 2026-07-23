/**
 * Hiển thị số cấp đai từ belt level order.
 * - Cấp 1–10 → "1"–"10"
 * - Cấp >10 (đẳng) → "X Đẳng" (ví dụ 11 → "1 Đẳng")
 */
export const formatBeltLevelOrder = (order?: number | null, fallback = '—'): string => {
  if (order == null) return fallback

  if (order >= 1 && order <= 10) return String(order)

  if (order > 10) return `${order - 10} Đẳng`

  return String(order)
}
