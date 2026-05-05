'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'

import menuAdminService, { type AdminMenuItemDto } from '@/services/menuAdminService'
import roleService, { type RoleType } from '@/services/roleService'
import menuService from '@/services/menuService'
import { useNotification } from '@/contexts/notificationContext'

// itemId → set of role names that can access it (null = open to all)
type MatrixState = Record<string, string[] | null>

function setsEqual(a: string[] | null, b: string[] | null): boolean {
  if (a === null && b === null) return true
  if (a === null || b === null) return false
  if (a.length !== b.length) return false
  const setA = new Set(a)
  return b.every(r => setA.has(r))
}

const PermissionMatrix = () => {
  const { showNotification } = useNotification()

  const [menuItems, setMenuItems] = useState<AdminMenuItemDto[]>([])
  const [roles, setRoles] = useState<RoleType[]>([])
  const [matrix, setMatrix] = useState<MatrixState>({})
  const [original, setOriginal] = useState<MatrixState>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)

  // Fetch matrix data and roles in parallel
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [matrixRes, rolesRes] = await Promise.all([
        menuAdminService.getRbacMatrix(),
        roleService.getRoles({ PageSize: 100 })
      ])

      if (matrixRes.success && matrixRes.data) {
        setMenuItems(matrixRes.data)
        const initial: MatrixState = {}
        for (const item of matrixRes.data) {
          // null = server trả về null/undefined → công khai
          // []   = server trả về mảng rỗng → giới hạn nhưng chưa chọn role
          // [...] = danh sách role cụ thể
          initial[item.id] = item.requiredRoles == null ? null : [...item.requiredRoles]
        }
        setMatrix(initial)
        setOriginal(initial)
      } else {
        showNotification(matrixRes.message || 'Không thể tải dữ liệu phân quyền', 'error')
      }

      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data)
      }

      setLoading(false)
    }

    load()
  }, [])

  // Build hierarchy: sections with their children
  const sections = useMemo(() => {
    const roots = menuItems.filter(m => !m.parentId && m.isSection)
    return roots.map(section => ({
      section,
      children: menuItems.filter(m => m.parentId === section.id && !m.isSection)
    }))
  }, [menuItems])

  // Which items changed compared to original
  const changedIds = useMemo(
    () => Object.keys(matrix).filter(id => !setsEqual(matrix[id], original[id])),
    [matrix, original]
  )

  // null  = công khai (tất cả user đăng nhập đều thấy)
  // []    = giới hạn nhưng chưa chọn role nào (không ai thấy)
  // [...] = giới hạn theo các role cụ thể
  const isOpenToAll = (id: string) => matrix[id] === null

  const hasRole = (id: string, role: string) => {
    if (isOpenToAll(id)) return false
    return matrix[id]?.includes(role) ?? false
  }

  const toggleOpenToAll = useCallback((id: string, checked: boolean) => {
    setMatrix(prev => ({ ...prev, [id]: checked ? null : [] }))
  }, [])

  const toggleRole = useCallback((id: string, role: string, checked: boolean) => {
    setMatrix(prev => {
      const current = prev[id] ? [...prev[id]!] : []
      const next = checked ? [...new Set([...current, role])] : current.filter(r => r !== role)
      return { ...prev, [id]: next.length > 0 ? next : [] }
    })
  }, [])

  const handleSave = async () => {
    if (changedIds.length === 0) return
    setSaving(true)

    const results = await Promise.allSettled(
      changedIds.map(id => menuAdminService.updateItemRoles(id, matrix[id]))
    )

    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))

    if (failed.length > 0) {
      showNotification(`Lưu thất bại ${failed.length}/${changedIds.length} mục`, 'error')
    } else {
      showNotification(`Đã cập nhật quyền cho ${changedIds.length} mục menu`, 'success')
      setOriginal({ ...matrix })
      // Invalidate cache so VerticalMenu + RoleGuard pick up the new permissions
      menuService.invalidateCache()
    }

    setSaving(false)
  }

  const handleReset = () => setMatrix({ ...original })

  const handleSeedMenu = async () => {
    setSeeding(true)
    try {
      const res = await menuService.seedMenuData()
      if (res.success) {
        showNotification('Đã cập nhật cấu trúc menu. Đang tải lại...', 'success')
        menuService.invalidateCache()
        // Reload matrix sau khi seed
        const [matrixRes, rolesRes] = await Promise.all([
          menuAdminService.getRbacMatrix(),
          roleService.getRoles({ PageSize: 100 })
        ])
        if (matrixRes.success && matrixRes.data) {
          setMenuItems(matrixRes.data)
          const refreshed: MatrixState = {}
          for (const item of matrixRes.data) {
            refreshed[item.id] = item.requiredRoles == null ? null : [...item.requiredRoles]
          }
          setMatrix(refreshed)
          setOriginal(refreshed)
        }
        if (rolesRes.success && rolesRes.data) setRoles(rolesRes.data)
      } else {
        showNotification(res.message || 'Cập nhật menu thất bại', 'error')
      }
    } catch {
      showNotification('Lỗi khi cập nhật menu', 'error')
    }
    setSeeding(false)
  }

  if (loading) {
    return (
      <Box className='flex justify-center items-center p-12'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Card>
      <CardHeader
        title='Ma trận phân quyền menu'
        subheader='Cấu hình vai trò nào được truy cập từng mục menu. "Công khai" = tất cả người dùng đã đăng nhập.'
        action={
          <Box className='flex gap-2'>
            <Tooltip title='Thêm các mục menu còn thiếu vào DB (chạy seeder), sau đó tải lại danh sách'>
              <Button
                variant='outlined'
                color='secondary'
                onClick={handleSeedMenu}
                disabled={seeding || saving}
                startIcon={seeding ? <CircularProgress size={16} color='inherit' /> : <i className='ri-refresh-line' />}
              >
                {seeding ? 'Đang cập nhật...' : 'Cập nhật menu'}
              </Button>
            </Tooltip>
            <Button variant='outlined' onClick={handleReset} disabled={changedIds.length === 0 || saving}>
              Hoàn tác
            </Button>
            <Button
              variant='contained'
              onClick={handleSave}
              disabled={changedIds.length === 0 || saving}
              startIcon={saving ? <CircularProgress size={16} color='inherit' /> : undefined}
            >
              {saving ? 'Đang lưu...' : `Lưu thay đổi${changedIds.length > 0 ? ` (${changedIds.length})` : ''}`}
            </Button>
          </Box>
        }
      />
      <CardContent className='p-0'>
        {changedIds.length > 0 && (
          <Alert severity='info' className='mx-6 mb-4'>
            Có <strong>{changedIds.length}</strong> mục đã thay đổi. Nhấn "Lưu thay đổi" để áp dụng.
          </Alert>
        )}
        <div className='overflow-x-auto'>
          <table className='w-full text-sm border-collapse'>
            <thead>
              <tr className='bg-action-hover'>
                <th className='p-3 text-left font-semibold sticky left-0 bg-backgroundPaper z-10 min-w-[220px]'>
                  Mục menu
                </th>
                <th className='p-3 text-center font-semibold min-w-[90px]'>
                  <Chip label='Công khai' size='small' color='success' variant='tonal' />
                </th>
                {roles.map(role => (
                  <th key={role.id} className='p-3 text-center font-semibold min-w-[90px]'>
                    <Chip label={role.name} size='small' color='primary' variant='tonal' />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map(({ section, children }) => (
                <React.Fragment key={section.id}>
                  {/* Section header row */}
                  <tr className='bg-action-selected'>
                    <td
                      colSpan={2 + roles.length}
                      className='p-3 font-semibold'
                    >
                      <Box className='flex items-center gap-2'>
                        {section.icon && <i className={`${section.icon} text-base`} />}
                        <Typography variant='body2' className='font-semibold uppercase tracking-wide text-primary'>
                          {section.label}
                        </Typography>
                      </Box>
                    </td>
                  </tr>

                  {/* Child item rows */}
                  {children.map((item, idx) => {
                    const openAll = isOpenToAll(item.id)
                    const noRoles = !openAll && (matrix[item.id]?.length ?? 0) === 0
                    const changed = !setsEqual(matrix[item.id], original[item.id])

                    return (
                      <tr
                        key={item.id}
                        className={`border-t transition-colors ${changed ? 'bg-warning-lighter' : idx % 2 === 0 ? '' : 'bg-action-hover'}`}
                      >
                        <td className='p-3 sticky left-0 z-10'>
                          <Box className='flex items-center gap-2 pl-4'>
                            {item.icon && <i className={`${item.icon} text-base text-secondary`} />}
                            <Box>
                              <Typography variant='body2'>{item.label}</Typography>
                              {item.href && (
                                <Typography variant='caption' color='text.disabled'>
                                  {item.href}
                                </Typography>
                              )}
                            </Box>
                            {changed && (
                              <Chip label='Thay đổi' size='small' color='warning' variant='tonal' className='ml-1' />
                            )}
                            {noRoles && (
                              <Chip label='Không ai thấy' size='small' color='error' variant='tonal' className='ml-1' />
                            )}
                          </Box>
                        </td>

                        {/* Open to all checkbox */}
                        <td className='p-3 text-center'>
                          <Tooltip title={openAll ? 'Đang công khai — tất cả user đăng nhập đều thấy. Bỏ chọn để giới hạn theo role.' : 'Chỉ các vai trò được tick mới thấy'}>
                            <Checkbox
                              checked={openAll}
                              onChange={e => toggleOpenToAll(item.id, e.target.checked)}
                              color='success'
                              size='small'
                            />
                          </Tooltip>
                        </td>

                        {/* Per-role checkboxes */}
                        {roles.map(role => (
                          <td key={role.id} className='p-3 text-center'>
                            <Tooltip title={openAll ? 'Đang công khai — bỏ chọn "Công khai" để giới hạn theo role' : (hasRole(item.id, role.name) ? `Role "${role.name}" có quyền` : `Role "${role.name}" không có quyền`)}>
                              <span>
                                <Checkbox
                                  checked={hasRole(item.id, role.name)}
                                  disabled={openAll}
                                  onChange={e => toggleRole(item.id, role.name, e.target.checked)}
                                  size='small'
                                />
                              </span>
                            </Tooltip>
                          </td>
                        ))}
                      </tr>
                    )
                  })}

                  {children.length === 0 && (
                    <tr className='border-t'>
                      <td colSpan={2 + roles.length} className='p-3 pl-8'>
                        <Typography variant='body2' color='text.disabled'>
                          (Không có mục con)
                        </Typography>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <Divider />
        <Box className='p-4 flex items-center gap-4'>
          <Box className='flex items-center gap-1'>
            <Checkbox checked size='small' color='success' readOnly />
            <Typography variant='caption'>Công khai = tất cả user đăng nhập đều xem được</Typography>
          </Box>
          <Box className='flex items-center gap-1'>
            <Checkbox checked={false} size='small' readOnly />
            <Checkbox checked size='small' color='primary' readOnly />
            <Typography variant='caption'>Bỏ công khai → tick vai trò cụ thể</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default PermissionMatrix
