'use client'

import { useState, useEffect, useMemo } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'

import type { ClassType } from '@/types/apps/classTypes'
import classService, { type ClassPermissionCatalogItem } from '@/services/classService'
import menuService from '@/services/menuService'
import zaloLinkService from '@/services/zaloLinkService'
import { useNotification } from '@/contexts/notificationContext'
import { logger } from '@/utils/logger'
import type { VerticalMenuDataType } from '@/types/menuTypes'

type Props = {
  open: boolean
  onClose: () => void
  classData: ClassType | null
}

type AccessDialogState = {
  open: boolean
  userId: string
  fullName: string
  phoneNumber?: string | null
  email?: string | null
}

const ClassPermissionDialog = ({ open, onClose, classData }: Props) => {
  const { showNotification } = useNotification()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [catalog, setCatalog] = useState<ClassPermissionCatalogItem[]>([])
  const [accessDialog, setAccessDialog] = useState<AccessDialogState | null>(null)
  const [accessLoading, setAccessLoading] = useState(false)
  const [effectivePermissions, setEffectivePermissions] = useState<string[]>([])
  const [menuTree, setMenuTree] = useState<VerticalMenuDataType[]>([])
  const [zaloLookupText, setZaloLookupText] = useState('')
  const [permissions, setPermissions] = useState<Record<string, string[]>>({})

  const assistantCoaches = useMemo(() => {
    const nonLeadCoaches = classData?.coaches?.filter(c => !c.isLeadInstructor) || []
    const assistants = classData?.assistants || []
    const map = new Map<string, (typeof nonLeadCoaches)[number]>()

    nonLeadCoaches.forEach(item => map.set(item.userId, item))
    assistants.forEach(item => map.set(item.userId, item))
    
return Array.from(map.values())
  }, [classData?.assistants, classData?.coaches])

  useEffect(() => {
    const fetchData = async () => {
      if (!open || !classData?.id) return

      try {
        setLoading(true)

        const catalogResponse = await classService.getClassPermissionCatalog()

        if (catalogResponse.success && Array.isArray(catalogResponse.data)) {
          setCatalog(catalogResponse.data)
        } else {
          setCatalog([])
        }

        const permMap: Record<string, string[]> = {}

        await Promise.all(
          assistantCoaches.map(async coach => {
            const effectiveRes = await classService.getClassPermissionsForUser(classData.id, coach.userId)

            permMap[coach.userId] =
              effectiveRes.success && Array.isArray(effectiveRes.data)
                ? effectiveRes.data
                : (catalogResponse.data || []).map(item => item.code)
          })
        )

        setPermissions(permMap)
      } catch (error) {
        logger.error('ClassPermissionDialog', 'Error fetching permissions', error)
        showNotification('Lỗi khi tải dữ liệu phân quyền', 'error')
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchData()
    } else {
      setPermissions({})
      setCatalog([])
    }
  }, [assistantCoaches, classData?.id, open, showNotification])

  const handleTogglePermission = (userId: string, code: string) => {
    setPermissions(prev => {
      const userPerms = prev[userId] || []
      const nextPerms = userPerms.includes(code) ? userPerms.filter(p => p !== code) : [...userPerms, code]

      return {
        ...prev,
        [userId]: nextPerms
      }
    })
  }

  const handleSave = async () => {
    if (!classData?.id) return

    try {
      setSaving(true)

      for (const coach of assistantCoaches) {
        const perms = permissions[coach.userId] || []

        await classService.updateClassPermissions(classData.id, coach.userId, perms)
      }

      showNotification('Cập nhật phân quyền thành công', 'success')
      onClose()
    } catch (error) {
      logger.error('ClassPermissionDialog', 'Error saving permissions', error)
      showNotification('Lỗi khi lưu phân quyền', 'error')
    } finally {
      setSaving(false)
    }
  }

  const openAccessDialog = async (coach: any) => {
    if (!classData?.id) return

    setAccessDialog({
      open: true,
      userId: coach.userId,
      fullName: coach.fullName,
      phoneNumber: coach.phoneNumber,
      email: coach.email
    })
    setAccessLoading(true)
    setEffectivePermissions([])
    setMenuTree([])
    setZaloLookupText('')

    try {
      const [permRes, menuRes] = await Promise.all([
        classService.getClassPermissionsForUser(classData.id, coach.userId),
        menuService.getMenuByUser(coach.userId)
      ])

      setEffectivePermissions(permRes.success ? permRes.data || [] : [])
      setMenuTree(menuRes.success ? menuRes.data || [] : [])
    } catch (error) {
      logger.error('ClassPermissionDialog', 'Error loading assistant access details', error)
    } finally {
      setAccessLoading(false)
    }
  }

  const lookupZaloByPhone = async () => {
    const phone = accessDialog?.phoneNumber?.trim()

    if (!phone) return

    try {
      setAccessLoading(true)
      const res = await zaloLinkService.lookupStudent({ phoneNumber: phone })

      if (res.success && res.data) {
        setZaloLookupText(`${res.data.studentName} (${res.data.studentCode}) - UserIdZalo: ${res.data.userIdZalo || '-'}`)
      } else {
        setZaloLookupText(res.message || 'Không tìm thấy học viên theo SĐT.')
      }
    } finally {
      setAccessLoading(false)
    }
  }

  const renderMenuTree = (items: VerticalMenuDataType[], level = 0) => (
    <List dense disablePadding>
      {items.map((it: any, idx: number) => {
        const children = (it as any).children as VerticalMenuDataType[] | undefined
        const href = (it as any).href as string | undefined
        const label = it.label

        return (
          <Box key={`${level}_${idx}_${label}`}>
            <ListItem sx={{ pl: 2 + level * 2 }}>
              <ListItemText
                primary={
                  <span>
                    {label}
                    {href ? <span className='text-textSecondary'> — {href}</span> : null}
                  </span>
                }
              />
            </ListItem>
            {children && children.length > 0 ? renderMenuTree(children, level + 1) : null}
          </Box>
        )
      })}
    </List>
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth>
      <DialogTitle>Phân quyền trợ giảng/HLV phụ - {classData?.name}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box className='flex justify-center p-8'>
            <CircularProgress />
          </Box>
        ) : assistantCoaches.length === 0 ? (
          <Typography className='py-4 text-center'>Lớp hiện không có HLV phụ hoặc trợ giảng để phân quyền.</Typography>
        ) : catalog.length === 0 ? (
          <Typography className='py-4 text-center'>Chưa có danh mục quyền lớp. Vui lòng kiểm tra backend.</Typography>
        ) : (
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Huấn luyện viên / Trợ giảng</TableCell>
                  {catalog.map(permission => (
                    <TableCell key={permission.code} align='center'>
                      <Box className='flex flex-col items-center gap-1'>
                        <span>{permission.name}</span>
                        {permission.leadCoachOnly && <Chip size='small' color='warning' label='Chỉ HLV chính' />}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {assistantCoaches.map(coach => (
                  <TableRow key={coach.userId}>
                    <TableCell>
                      <Box className='flex items-center justify-between gap-2'>
                        <Box>
                          <Typography className='font-medium'>{coach.fullName}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {coach.phoneNumber || '—'}
                            {coach.email ? ` • ${coach.email}` : ''}
                          </Typography>
                        </Box>
                        <Tooltip title='Xem Zalo/Quyền/Menu'>
                          <IconButton size='small' onClick={() => openAccessDialog(coach)}>
                            <i className='ri-eye-line' />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    {catalog.map(permission => (
                      <TableCell key={permission.code} align='center'>
                        <Checkbox
                          checked={(permissions[coach.userId] || []).includes(permission.code)}
                          onChange={() => handleTogglePermission(coach.userId, permission.code)}
                          disabled={saving || permission.leadCoachOnly}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Huỷ
        </Button>
        {assistantCoaches.length > 0 && catalog.length > 0 && (
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={saving || loading}
            startIcon={saving ? <CircularProgress size={20} color='inherit' /> : null}
          >
            Lưu thay đổi
          </Button>
        )}
      </DialogActions>

      <Dialog open={Boolean(accessDialog?.open)} onClose={() => setAccessDialog(null)} maxWidth='md' fullWidth>
        <DialogTitle>Chi tiết truy cập</DialogTitle>
        <DialogContent dividers>
          {!accessDialog ? null : (
            <Box className='space-y-4'>
              <Box>
                <Typography variant='subtitle1' className='font-medium'>
                  {accessDialog.fullName}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {accessDialog.phoneNumber || '—'}
                  {accessDialog.email ? ` • ${accessDialog.email}` : ''}
                </Typography>
              </Box>

              <Box>
                <Box className='flex items-center justify-between gap-2'>
                  <Typography variant='subtitle2'>Zalo (tra cứu theo SĐT nếu có)</Typography>
                  <Button size='small' variant='outlined' onClick={lookupZaloByPhone} disabled={accessLoading || !accessDialog.phoneNumber}>
                    Tra cứu
                  </Button>
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  {zaloLookupText || '—'}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant='subtitle2'>Quyền hiệu lực trong lớp</Typography>
                {accessLoading ? (
                  <Box className='py-2'>
                    <CircularProgress size={18} />
                  </Box>
                ) : effectivePermissions.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    Không có quyền hoặc chưa cấu hình.
                  </Typography>
                ) : (
                  <Box className='flex flex-wrap gap-2 pt-2'>
                    {effectivePermissions.map(permission => (
                      <Chip key={permission} label={permission} size='small' variant='tonal' />
                    ))}
                  </Box>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant='subtitle2'>Cây menu theo role (Admin xem)</Typography>
                {accessLoading ? (
                  <Box className='py-2'>
                    <CircularProgress size={18} />
                  </Box>
                ) : menuTree.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    Không tải được menu hoặc user không có menu.
                  </Typography>
                ) : (
                  <Box className='pt-1'>{renderMenuTree(menuTree)}</Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccessDialog(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}

export default ClassPermissionDialog
