'use client'

import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'

export type RbacAction = 'View' | 'Create' | 'Update' | 'Delete' | 'Approve'

export type ModulePermissionMeta = {
  label: string
  actions: RbacAction[]
}

export const RBAC_ACTION_LABELS: Record<RbacAction, string> = {
  View: 'Xem',
  Create: 'Them',
  Update: 'Sua',
  Delete: 'Xoa',
  Approve: 'Duyet'
}

export const RBAC_ACTION_ORDER: RbacAction[] = ['View', 'Create', 'Update', 'Delete', 'Approve']

export const RBAC_MODULE_META: Record<string, ModulePermissionMeta> = {
  Branch: { label: 'Chi nhanh', actions: ['View', 'Create', 'Update', 'Delete'] },
  Class: { label: 'Lop hoc', actions: ['View', 'Create', 'Update', 'Delete'] },
  Student: { label: 'Hoc vien', actions: ['View', 'Create', 'Update', 'Delete'] },
  User: { label: 'Nguoi dung', actions: ['View', 'Create', 'Update', 'Delete'] },
  UserDocument: { label: 'Tai lieu', actions: ['View', 'Create', 'Update', 'Delete'] },
  ClassTransfer: { label: 'Chuyen lop', actions: ['View', 'Create', 'Update', 'Approve'] },
  Role: { label: 'Vai tro', actions: ['View', 'Create', 'Update', 'Delete'] },
  Permission: { label: 'Quyen han', actions: ['View', 'Approve'] },
  Schedule: { label: 'Lich day', actions: ['View', 'Create', 'Update', 'Delete'] },
  Attendance: { label: 'Diem danh', actions: ['View', 'Create', 'Update', 'Approve'] },
  AttendanceTicket: { label: 'Cham cong bu', actions: ['View', 'Create', 'Approve'] },
  LeaveRequest: { label: 'Xin nghi phep', actions: ['View', 'Create', 'Update', 'Delete', 'Approve'] },
  Payment: { label: 'Thanh toan', actions: ['View', 'Create', 'Update', 'Delete'] },
  'Payment.Collect': { label: 'Thu tien lop', actions: ['View', 'Create', 'Update', 'Delete'] },
  Finance: { label: 'Thong ke tai chinh', actions: ['View'] },
  CashHandover: { label: 'Ban giao tien', actions: ['View', 'Create', 'Update', 'Delete'] },
  Payroll: { label: 'Bang luong', actions: ['View', 'Create', 'Update', 'Delete', 'Approve'] },
  Invoice: { label: 'Hoa don', actions: ['View', 'Create', 'Update', 'Delete'] },
  Product: { label: 'San pham', actions: ['View', 'Create', 'Update', 'Delete'] },
  ProductSale: { label: 'Ban san pham', actions: ['View', 'Create', 'Update', 'Delete'] },
  BeltLevel: { label: 'Cap dai', actions: ['View', 'Create', 'Update', 'Delete'] },
  'BeltExam.Admin': { label: 'Thi cap dai', actions: ['View', 'Create', 'Update', 'Approve'] },
  'BeltExam.Register': { label: 'Dang ky thi cap', actions: ['View', 'Create', 'Update'] },
  'BeltExam.RegisterList': { label: 'Danh sach dang ky thi', actions: ['View', 'Approve'] },
  AuditLog: { label: 'Nhat ky he thong', actions: ['View'] },
  SystemConfig: { label: 'Cau hinh he thong', actions: ['View', 'Update'] },
  StudentTuitionDiscount: { label: 'Duyet giam hoc phi', actions: ['View', 'Create', 'Update', 'Approve'] }
}

export const getPermissionCode = (moduleCode: string, action: RbacAction) => `${moduleCode}.${action}`

export const getModuleDisplayName = (moduleCode: string) => RBAC_MODULE_META[moduleCode]?.label || moduleCode

export const getModuleSupportedActions = (moduleCode: string) => RBAC_MODULE_META[moduleCode]?.actions || RBAC_ACTION_ORDER

export const hasModulePermission = (
  permissions: string[] | null | undefined,
  roles: string[] | null | undefined,
  moduleCode: string,
  action: RbacAction
) => hasAdminRole(roles) || hasPermission(permissions, getPermissionCode(moduleCode, action))

export const buildModulePermissionMap = (
  permissions: string[] | null | undefined,
  roles: string[] | null | undefined,
  moduleCode: string
) => ({
  canView: hasModulePermission(permissions, roles, moduleCode, 'View'),
  canCreate: hasModulePermission(permissions, roles, moduleCode, 'Create'),
  canUpdate: hasModulePermission(permissions, roles, moduleCode, 'Update'),
  canDelete: hasModulePermission(permissions, roles, moduleCode, 'Delete'),
  canApprove: hasModulePermission(permissions, roles, moduleCode, 'Approve')
})

export const getPermissionModuleFromCode = (permissionCode: string) => {
  const parts = permissionCode.split('.').filter(Boolean)
  return parts.length > 1 ? parts.slice(0, parts.length - 1).join('.') : permissionCode
}
