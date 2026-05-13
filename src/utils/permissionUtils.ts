export const normalizePermissionCode = (code: string) => code.trim().toLowerCase()

export const hasPermission = (permissions?: string[] | null, code?: string | null): boolean => {
  if (!code) return false
  const expected = normalizePermissionCode(code)
  return (permissions ?? []).some(p => normalizePermissionCode(p) === expected)
}

export const hasAnyPermission = (permissions?: string[] | null, codes?: string[]): boolean => {
  if (!codes || codes.length === 0) return false
  return codes.some(c => hasPermission(permissions, c))
}

