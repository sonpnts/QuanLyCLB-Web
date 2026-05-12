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

import type { ClassType } from '@/types/apps/classTypes'
import classService, { type ClassPermissionCatalogItem } from '@/services/classService'
import { useNotification } from '@/contexts/notificationContext'
import { logger } from '@/utils/logger'

type Props = {
  open: boolean
  onClose: () => void
  classData: ClassType | null
}

const ClassPermissionDialog = ({ open, onClose, classData }: Props) => {
  const { showNotification } = useNotification()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [catalog, setCatalog] = useState<ClassPermissionCatalogItem[]>([])

  // permissions[userId] = ['TakeAttendance', 'CollectPayment', ...]
  const [permissions, setPermissions] = useState<Record<string, string[]>>({})

  const assistantCoaches = useMemo(() => {
    const nonLeadCoaches = classData?.coaches?.filter(c => !c.isLeadInstructor) || []
    const assistants = classData?.assistants || []
    const map = new Map<string, (typeof nonLeadCoaches)[number]>()
    nonLeadCoaches.forEach(item => map.set(item.userId, item))
    assistants.forEach(item => map.set(item.userId, item))
    return Array.from(map.values())
  }, [classData?.coaches, classData?.assistants])

  useEffect(() => {
    const fetchData = async () => {
      if (!open || !classData?.id) return

      try {
        setLoading(true)
        const [catalogResponse, permissionResponse] = await Promise.all([
          classService.getClassPermissionCatalog(),
          classService.getClassPermissions(classData.id)
        ])

        if (catalogResponse.success && Array.isArray(catalogResponse.data)) {
          setCatalog(catalogResponse.data)
        } else {
          setCatalog([])
        }

        if (permissionResponse.success && permissionResponse.data) {
          const permMap: Record<string, string[]> = {}

          assistantCoaches.forEach(coach => {
            permMap[coach.userId] = []
          })

          permissionResponse.data.forEach((p: any) => {
            if (permMap[p.userId]) {
              permMap[p.userId].push(p.permissionCode)
            } else {
              permMap[p.userId] = [p.permissionCode]
            }
          })

          setPermissions(permMap)
        }
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
  }, [open, classData?.id, assistantCoaches, showNotification])

  const handleTogglePermission = (userId: string, code: string) => {
    setPermissions(prev => {
      const userPerms = prev[userId] || []
      const newPerms = userPerms.includes(code) ? userPerms.filter(p => p !== code) : [...userPerms, code]

      return {
        ...prev,
        [userId]: newPerms
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
                  {catalog.map(p => (
                    <TableCell key={p.code} align='center'>
                      <Box className='flex flex-col items-center gap-1'>
                        <span>{p.name}</span>
                        {p.leadCoachOnly && <Chip size='small' color='warning' label='Chỉ HLV chính' />}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {assistantCoaches.map(coach => (
                  <TableRow key={coach.userId}>
                    <TableCell>{coach.fullName}</TableCell>
                    {catalog.map(p => (
                      <TableCell key={p.code} align='center'>
                        <Checkbox
                          checked={(permissions[coach.userId] || []).includes(p.code)}
                          onChange={() => handleTogglePermission(coach.userId, p.code)}
                          disabled={saving || p.leadCoachOnly}
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
          Hủy
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
    </Dialog>
  )
}

export default ClassPermissionDialog
