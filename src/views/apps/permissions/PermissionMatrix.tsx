'use client'

import React, { useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import menuAdminService, {
  type CanonicalFunctionDto,
  type CanonicalRbacPermissionDto,
  type UpsertFunctionRequest
} from '@/services/menuAdminService'
import roleService, { type RoleType } from '@/services/roleService'
import { useNotification } from '@/contexts/notificationContext'
import menuService from '@/services/menuService'
import {
  RBAC_ACTION_LABELS,
  RBAC_ACTION_ORDER,
  getModuleDisplayName,
  getModuleSupportedActions,
  getPermissionModuleFromCode,
  type RbacAction
} from '@/utils/rbac'

type MatrixState = Record<string, string[]>
type ActionKey = RbacAction
type FunctionForm = UpsertFunctionRequest & { functionId?: string }

const normalize = (values: string[] = []) =>
  [...new Set(values.filter(Boolean).map(value => value.trim()))].sort((a, b) => a.localeCompare(b))

const equal = (a: string[] = [], b: string[] = []) => JSON.stringify(normalize(a)) === JSON.stringify(normalize(b))
const isSystemMenuPermission = (code: string) => code.toLowerCase().startsWith('menu.')
const isLegacyGeneratedFunction = (code: string) => code.toLowerCase().startsWith('fn.')
const functionLabel = (item: CanonicalFunctionDto) =>
  item.functionName || item.route || item.menuHref || item.requiredPermissionModule || item.module || 'Chưa đặt tên'
const functionModule = (item: CanonicalFunctionDto) => item.requiredPermissionModule || item.module || '-'

const emptyFunctionForm: FunctionForm = {
  name: '',
  code: '',
  module: 'System',
  requiredPermissionModule: '',
  apiPattern: '',
  httpMethod: 'GET',
  route: '',
  icon: '',
  displayOrder: 1,
  isActive: true,
  showOnMenu: true
}

const PermissionMatrix = () => {
  const { showNotification } = useNotification()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const [saving, setSaving] = useState(false)

  const [roles, setRoles] = useState<RoleType[]>([])
  const [permissions, setPermissions] = useState<CanonicalRbacPermissionDto[]>([])
  const [functions, setFunctions] = useState<CanonicalFunctionDto[]>([])

  const [roleMatrix, setRoleMatrix] = useState<MatrixState>({})
  const [roleMatrixOriginal, setRoleMatrixOriginal] = useState<MatrixState>({})
  const [functionMatrix, setFunctionMatrix] = useState<MatrixState>({})
  const [functionMatrixOriginal, setFunctionMatrixOriginal] = useState<MatrixState>({})
  const [selectedRoleName, setSelectedRoleName] = useState('')

  const [functionForm, setFunctionForm] = useState<FunctionForm>(emptyFunctionForm)
  const [editingFunctionId, setEditingFunctionId] = useState<string | null>(null)

  const loadAll = async () => {
    setLoading(true)

    const [roleRes, roleListRes, functionMatrixRes, functionListRes] = await Promise.all([
      menuAdminService.getCanonicalRbacMatrix(),
      roleService.getRoles({ PageSize: 100 }),
      menuAdminService.getPermissionFunctionMatrix(),
      menuAdminService.getFunctions()
    ])

    if (!roleRes.success || !roleRes.data || !functionMatrixRes.success || !functionMatrixRes.data) {
      showNotification(roleRes.message || functionMatrixRes.message || 'Không thể tải ma trận RBAC', 'error')
      setLoading(false)

      return
    }

    const visiblePermissions = roleRes.data.filter(permission => !isSystemMenuPermission(permission.permissionCode))
    const visibleFunctions = (
      functionListRes.success && functionListRes.data?.length ? functionListRes.data : functionMatrixRes.data.functions || []
    ).filter(item => !isLegacyGeneratedFunction(item.functionCode))

    setPermissions(visiblePermissions)
    setFunctions(visibleFunctions)

    const nextRoleMatrix: MatrixState = {}

    visiblePermissions.forEach(permission => {
      nextRoleMatrix[permission.permissionId] = normalize(permission.roleNames || [])
    })

    setRoleMatrix(nextRoleMatrix)
    setRoleMatrixOriginal(nextRoleMatrix)

    const nextFunctionMatrix: MatrixState = {}

    functionMatrixRes.data.permissions
      .filter(permission => !isSystemMenuPermission(permission.permissionCode))
      .forEach(permission => {
        nextFunctionMatrix[permission.permissionId] = normalize(permission.functionCodes || [])
      })

    setFunctionMatrix(nextFunctionMatrix)
    setFunctionMatrixOriginal(nextFunctionMatrix)

    if (roleListRes.success && roleListRes.data) {
      setRoles(roleListRes.data)
      if (roleListRes.data.length > 0) setSelectedRoleName(roleListRes.data[0].name)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const changedRoleIds = useMemo(
    () => Object.keys(roleMatrix).filter(id => !equal(roleMatrix[id], roleMatrixOriginal[id])),
    [roleMatrix, roleMatrixOriginal]
  )

  const changedFunctionIds = useMemo(
    () => Object.keys(functionMatrix).filter(id => !equal(functionMatrix[id], functionMatrixOriginal[id])),
    [functionMatrix, functionMatrixOriginal]
  )

  const moduleRows = useMemo(() => {
    const rowMap: Record<string, Partial<Record<ActionKey, CanonicalRbacPermissionDto>>> = {}

    permissions.forEach(permission => {
      const parts = permission.permissionCode.split('.').filter(Boolean)

      if (parts.length < 2) return

      const action = parts[parts.length - 1] as ActionKey
      const module = parts.slice(0, parts.length - 1).join('.')

      if (!module || !RBAC_ACTION_ORDER.includes(action)) return

      if (!rowMap[module]) rowMap[module] = {}
      rowMap[module][action] = permission
    })

    return Object.keys(rowMap)
      .sort((a, b) => a.localeCompare(b))
      .map(module => ({ module, actions: rowMap[module] }))
  }, [permissions])

  const selectedFunctionCode = useMemo(() => functionForm.code.trim(), [functionForm.code])

  const toggleRole = (permissionId: string, roleName: string, checked: boolean) => {
    setRoleMatrix(prev => {
      const current = prev[permissionId] || []
      const next = checked ? normalize([...current, roleName]) : current.filter(item => item !== roleName)

      return { ...prev, [permissionId]: next }
    })
  }

  const togglePermissionFunction = (permissionId: string, checked: boolean) => {
    if (!selectedFunctionCode) return

    setFunctionMatrix(prev => {
      const current = prev[permissionId] || []
      const next = checked ? normalize([...current, selectedFunctionCode]) : current.filter(item => item !== selectedFunctionCode)

      return { ...prev, [permissionId]: next }
    })
  }

  const saveRoles = async () => {
    if (changedRoleIds.length === 0) return

    setSaving(true)

    const results = await Promise.allSettled(
      changedRoleIds.map(id => menuAdminService.updatePermissionRoles(id, roleMatrix[id] || []))
    )
    const failed = results.filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success))

    if (failed.length > 0) {
      showNotification(`Lưu thất bại ${failed.length}/${changedRoleIds.length} quyền role`, 'error')
    } else {
      showNotification(`Đã cập nhật ${changedRoleIds.length} permission-role`, 'success')
      setRoleMatrixOriginal({ ...roleMatrix })
      menuService.invalidateCache()
    }

    setSaving(false)
  }

  const saveFunctionMatrix = async () => {
    if (changedFunctionIds.length === 0) return

    setSaving(true)

    const results = await Promise.allSettled(
      changedFunctionIds.map(id => menuAdminService.updatePermissionFunctions(id, functionMatrix[id] || []))
    )
    const failed = results.filter(result => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success))

    if (failed.length > 0) {
      showNotification(`Lưu thất bại ${failed.length}/${changedFunctionIds.length} quyền chức năng`, 'error')
    } else {
      showNotification(`Đã cập nhật ${changedFunctionIds.length} permission-function`, 'success')
      setFunctionMatrixOriginal({ ...functionMatrix })
      menuService.invalidateCache()
    }

    setSaving(false)
  }

  const startEditFunction = (item: CanonicalFunctionDto) => {
    setEditingFunctionId(item.functionId)
    setFunctionForm({
      functionId: item.functionId,
      name: item.functionName,
      code: item.functionCode,
      module: item.module || 'System',
      requiredPermissionModule: item.requiredPermissionModule || item.module || '',
      apiPattern: item.apiPattern || '',
      httpMethod: item.httpMethod || 'GET',
      route: item.route || item.menuHref || '',
      icon: item.icon || '',
      displayOrder: item.displayOrder ?? 1,
      isActive: item.isActive,
      showOnMenu: item.showOnMenu ?? !!(item.route || item.menuHref)
    })
  }

  const resetFunctionForm = () => {
    setEditingFunctionId(null)
    setFunctionForm(emptyFunctionForm)
  }

  const saveFunction = async () => {
    if (!functionForm.name.trim() || !functionForm.code.trim() || !functionForm.apiPattern.trim()) {
      showNotification('Vui lòng nhập Tên function, Code, Route API.', 'error')

      return
    }

    const payload: UpsertFunctionRequest = {
      name: functionForm.name.trim(),
      code: functionForm.code.trim(),
      module: functionForm.module?.trim() || null,
      requiredPermissionModule: functionForm.requiredPermissionModule?.trim() || null,
      apiPattern: functionForm.apiPattern.trim(),
      httpMethod: functionForm.httpMethod?.trim() || null,
      route: functionForm.route?.trim() || null,
      icon: functionForm.icon?.trim() || null,
      displayOrder: Number(functionForm.displayOrder || 0),
      isActive: !!functionForm.isActive,
      showOnMenu: !!functionForm.showOnMenu
    }

    const response = editingFunctionId
      ? await menuAdminService.updateFunction(editingFunctionId, payload)
      : await menuAdminService.createFunction(payload)

    if (!response.success) {
      showNotification(response.message || 'Không thể lưu function.', 'error')

      return
    }

    showNotification(editingFunctionId ? 'Cập nhật function thành công.' : 'Tạo function thành công.', 'success')
    resetFunctionForm()
    await loadAll()
  }

  const removeFunction = async (functionId: string) => {
    const response = await menuAdminService.deleteFunction(functionId)

    if (!response.success) {
      showNotification(response.message || 'Không thể xóa function.', 'error')

      return
    }

    showNotification('Xóa function thành công.', 'success')
    if (editingFunctionId === functionId) resetFunctionForm()
    await loadAll()
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
      <CardHeader title='Phân quyền RBAC' subheader='Role - Permission - Function' />
      <CardContent className='pt-0'>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} className='mb-4'>
          <Tab label='Phân quyền Role' />
          <Tab label='Permission - Function' />
          <Tab label='Quản lý Function' />
        </Tabs>

        {tab === 0 && (
          <>
            <Box className='flex items-center gap-3 mb-4 flex-wrap'>
              <FormControl size='small' sx={{ minWidth: 240 }}>
                <InputLabel>Vai trò</InputLabel>
                <Select value={selectedRoleName} label='Vai trò' onChange={event => setSelectedRoleName(event.target.value)}>
                  {roles.map(role => (
                    <MenuItem key={role.id} value={role.name}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant='outlined'
                disabled={saving || changedRoleIds.length === 0}
                onClick={() => setRoleMatrix({ ...roleMatrixOriginal })}
              >
                Hoàn tác
              </Button>
              <Button variant='contained' disabled={saving || changedRoleIds.length === 0} onClick={saveRoles}>
                {saving ? 'Đang lưu...' : 'Lưu phân quyền role'}
              </Button>
            </Box>
            {changedRoleIds.length > 0 && (
              <Alert severity='info' className='mb-3'>
                Có {changedRoleIds.length} thay đổi.
              </Alert>
            )}
            <div className='overflow-x-auto'>
              <table className='w-full text-sm border-collapse'>
                <thead>
                  <tr className='bg-action-hover'>
                    <th className='p-3 text-left min-w-[180px]'>Tên</th>
                    {RBAC_ACTION_ORDER.map(action => (
                      <th key={action} className='p-3 text-center min-w-[120px]'>
                        {RBAC_ACTION_LABELS[action]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {moduleRows.map((row, index) => (
                    <tr key={row.module} className={`border-t ${index % 2 ? 'bg-action-hover' : ''}`}>
                      <td className='p-3'>
                        <Typography variant='body2' className='font-semibold'>
                          {getModuleDisplayName(row.module)}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {row.module}
                        </Typography>
                      </td>
                      {RBAC_ACTION_ORDER.map(action => {
                        const supportedActions = getModuleSupportedActions(row.module)
                        const permission = row.actions[action]

                        if (!supportedActions.includes(action) || !permission) {
                          return (
                            <td key={`${row.module}-${action}`} className='text-center p-3'>
                              -
                            </td>
                          )
                        }

                        const checked = (roleMatrix[permission.permissionId] || []).includes(selectedRoleName)

                        return (
                          <td key={`${row.module}-${action}`} className='text-center p-3'>
                            <Checkbox
                              size='small'
                              checked={checked}
                              onChange={event => toggleRole(permission.permissionId, selectedRoleName, event.target.checked)}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 1 && (
          <>
            <Box className='flex items-center gap-3 mb-3 flex-wrap'>
              <FormControl size='small' sx={{ minWidth: 280 }}>
                <InputLabel>Function</InputLabel>
                <Select
                  value={selectedFunctionCode}
                  label='Function'
                  onChange={event => {
                    const item = functions.find(functionItem => functionItem.functionCode === event.target.value)

                    if (item) startEditFunction(item)
                  }}
                >
                  {functions.map(item => (
                    <MenuItem key={item.functionId} value={item.functionCode}>
                      {functionLabel(item)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant='outlined'
                disabled={saving || changedFunctionIds.length === 0}
                onClick={() => setFunctionMatrix({ ...functionMatrixOriginal })}
              >
                Hoàn tác
              </Button>
              <Button variant='contained' disabled={saving || changedFunctionIds.length === 0} onClick={saveFunctionMatrix}>
                {saving ? 'Đang lưu...' : 'Lưu gán Permission'}
              </Button>
            </Box>
            {changedFunctionIds.length > 0 && (
              <Alert severity='info' className='mb-3'>
                Có {changedFunctionIds.length} thay đổi.
              </Alert>
            )}
            <div className='overflow-x-auto'>
              <table className='w-full text-sm border-collapse'>
                <thead>
                  <tr className='bg-action-hover'>
                    <th className='p-3 text-left min-w-[120px]'>Action</th>
                    <th className='p-3 text-left min-w-[220px]'>Permission Code</th>
                    <th className='p-3 text-left min-w-[260px]'>Tên quyền</th>
                    <th className='p-3 text-center min-w-[120px]'>Bật/Tắt</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((permission, index) => {
                    const action = (permission.permissionCode.split('.').pop() || '-') as ActionKey | '-'
                    const moduleCode = getPermissionModuleFromCode(permission.permissionCode)
                    const checked = selectedFunctionCode
                      ? (functionMatrix[permission.permissionId] || []).includes(selectedFunctionCode)
                      : false

                    return (
                      <tr key={permission.permissionId} className={`border-t ${index % 2 ? 'bg-action-hover' : ''}`}>
                        <td className='p-3'>
                          <Typography variant='body2' className='font-semibold'>
                            {getModuleDisplayName(moduleCode)}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {RBAC_ACTION_LABELS[action as ActionKey] || action}
                          </Typography>
                        </td>
                        <td className='p-3'>{permission.permissionCode}</td>
                        <td className='p-3'>
                          <Typography variant='body2'>{permission.permissionName}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {getModuleDisplayName(moduleCode)} - {RBAC_ACTION_LABELS[action as ActionKey] || action}
                          </Typography>
                        </td>
                        <td className='p-3 text-center'>
                          <Checkbox
                            size='small'
                            disabled={!selectedFunctionCode}
                            checked={checked}
                            onChange={event => togglePermissionFunction(permission.permissionId, event.target.checked)}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 2 && (
          <>
            <Card variant='outlined' className='mb-4'>
              <CardHeader title={editingFunctionId ? 'Sửa Function' : 'Thêm Function'} />
              <CardContent className='pt-0'>
                <Box className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  <TextField
                    label='Tên function'
                    value={functionForm.name}
                    onChange={event => setFunctionForm(prev => ({ ...prev, name: event.target.value }))}
                  />
                  <TextField
                    label='Code'
                    value={functionForm.code}
                    onChange={event => setFunctionForm(prev => ({ ...prev, code: event.target.value }))}
                  />
                  <TextField
                    label='Module'
                    value={functionForm.module || ''}
                    onChange={event => setFunctionForm(prev => ({ ...prev, module: event.target.value }))}
                  />
                  <TextField
                    label='Module quyền để hiện menu'
                    value={functionForm.requiredPermissionModule || ''}
                    onChange={event => setFunctionForm(prev => ({ ...prev, requiredPermissionModule: event.target.value }))}
                  />
                  <TextField
                    label='Route (menu)'
                    value={functionForm.route || ''}
                    onChange={event => setFunctionForm(prev => ({ ...prev, route: event.target.value }))}
                  />
                  <TextField
                    label='Route API (ApiPattern)'
                    value={functionForm.apiPattern}
                    onChange={event => setFunctionForm(prev => ({ ...prev, apiPattern: event.target.value }))}
                  />
                  <TextField
                    label='Icon'
                    value={functionForm.icon || ''}
                    onChange={event => setFunctionForm(prev => ({ ...prev, icon: event.target.value }))}
                  />
                  <TextField
                    label='Thứ tự hiển thị'
                    type='number'
                    value={functionForm.displayOrder}
                    onChange={event => setFunctionForm(prev => ({ ...prev, displayOrder: Number(event.target.value || 0) }))}
                  />
                  <FormControl>
                    <InputLabel>HTTP Method</InputLabel>
                    <Select
                      value={functionForm.httpMethod || 'GET'}
                      label='HTTP Method'
                      onChange={event => setFunctionForm(prev => ({ ...prev, httpMethod: event.target.value }))}
                    >
                      {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => (
                        <MenuItem key={method} value={method}>
                          {method}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box className='flex items-center gap-4 mt-3 flex-wrap'>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={functionForm.isActive}
                        onChange={event => setFunctionForm(prev => ({ ...prev, isActive: event.target.checked }))}
                      />
                    }
                    label='Active'
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={functionForm.showOnMenu}
                        onChange={event => setFunctionForm(prev => ({ ...prev, showOnMenu: event.target.checked }))}
                      />
                    }
                    label='Có hiển thị trên menu'
                  />
                </Box>
                <Box className='flex gap-2 mt-3'>
                  <Button variant='contained' onClick={saveFunction}>
                    {editingFunctionId ? 'Lưu cập nhật' : 'Thêm mới'}
                  </Button>
                  <Button variant='outlined' onClick={resetFunctionForm}>
                    Làm mới
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <div className='overflow-x-auto'>
              <table className='w-full text-sm border-collapse'>
                <thead>
                  <tr className='bg-action-hover'>
                    <th className='p-3 text-left min-w-[220px]'>Tên function</th>
                    <th className='p-3 text-left min-w-[140px]'>Module quyền</th>
                    <th className='p-3 text-left min-w-[180px]'>Route</th>
                    <th className='p-3 text-left min-w-[120px]'>Icon</th>
                    <th className='p-3 text-left min-w-[120px]'>Trạng thái</th>
                    <th className='p-3 text-left min-w-[180px]'>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {functions.map((item, index) => (
                    <tr key={item.functionId} className={`border-t ${index % 2 ? 'bg-action-hover' : ''}`}>
                      <td className='p-3'>{functionLabel(item)}</td>
                      <td className='p-3'>{functionModule(item)}</td>
                      <td className='p-3'>{item.route || item.menuHref || '-'}</td>
                      <td className='p-3'>{item.icon || '-'}</td>
                      <td className='p-3'>{item.isActive ? 'Active' : 'Inactive'}</td>
                      <td className='p-3'>
                        <Box className='flex gap-2'>
                          <Button size='small' variant='outlined' onClick={() => startEditFunction(item)}>
                            Sửa
                          </Button>
                          <Button size='small' color='error' variant='outlined' onClick={() => removeFunction(item.functionId)}>
                            Xóa
                          </Button>
                        </Box>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default PermissionMatrix

