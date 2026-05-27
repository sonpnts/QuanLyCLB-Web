/**
 * Role name constants — phải khớp với backend MsgConstants.Roles và RbacHelper.
 *
 * Backend dùng:
 *   MsgConstants.Roles.Admin = "Administrator"
 *   RbacHelper.LegacyAdminRole = "Admin"
 *   MsgConstants.Roles.Coach  = "Coach"
 */

export const ROLE_ADMIN         = 'Administrator'
export const ROLE_ADMIN_LEGACY  = 'Admin'
export const ROLE_COACH         = 'Coach'
export const ROLE_ASSISTANT     = 'Assistant'
export const ROLE_MODERATOR     = 'Moderator'
export const ROLE_STUDENT       = 'Student'
export const ROLE_MEMBER        = 'Member'

/** Tất cả giá trị được coi là Admin */
const ADMIN_ROLE_NAMES = [ROLE_ADMIN, ROLE_ADMIN_LEGACY]

/**
 * Kiểm tra một role string có phải admin không (case-insensitive).
 */
export const isAdminRoleName = (role: string): boolean =>
  ADMIN_ROLE_NAMES.some(a => a.toLowerCase() === role.toLowerCase())

/**
 * Kiểm tra danh sách roles có chứa admin không.
 * Dùng trong component: `hasAdminRole(auth?.roles)`
 */
export const hasAdminRole = (roles?: string[] | null): boolean =>
  roles?.some(isAdminRoleName) ?? false

/**
 * Kiểm tra danh sách roles có chứa một role cụ thể không (case-insensitive).
 */
export const hasRole = (roles?: string[] | null, roleName?: string): boolean => {
  if (!roleName) return false
  
return roles?.some(r => r.toLowerCase() === roleName.toLowerCase()) ?? false
}

/**
 * Kiểm tra danh sách roles có chứa Coach không.
 */
export const hasCoachRole = (roles?: string[] | null): boolean =>
  hasRole(roles, ROLE_COACH)

/**
 * Kiểm tra danh sách roles có chứa Assistant không.
 */
export const hasAssistantRole = (roles?: string[] | null): boolean =>
  hasRole(roles, ROLE_ASSISTANT)

/**
 * Trả về true nếu user là HLV hoặc trợ giảng (Coach/Assistant).
 * Dùng để phân biệt với admin và hiển thị dữ liệu theo phân công.
 */
export const isInstructorUser = (roles?: string[] | null): boolean =>
  hasCoachRole(roles) || hasAssistantRole(roles)
