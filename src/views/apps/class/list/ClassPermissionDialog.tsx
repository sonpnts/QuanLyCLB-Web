'use client'

import { useState, useEffect } from 'react'

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

import type { ClassType } from '@/types/apps/classTypes'
import classService from '@/services/classService'
import { useNotification } from '@/contexts/notificationContext'
import { logger } from '@/utils/logger'

type Props = {
  open: boolean
  onClose: () => void
  classData: ClassType | null
}

const PERMISSIONS = [
  { code: 'TakeAttendance', label: 'Điểm danh' },
  { code: 'CollectPayment', label: 'Thu tiền' },
  { code: 'ManageStudents', label: 'Quản lý học viên' },
  { code: 'ViewReports', label: 'Xem báo cáo' }
]

const ClassPermissionDialog = ({ open, onClose, classData }: Props) => {
  const { showNotification } = useNotification()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // permissions[userId] = ['TakeAttendance', 'CollectPayment', ...]
  const [permissions, setPermissions] = useState<Record<string, string[]>>({})

  const assistantCoaches = classData?.coaches?.filter(c => !c.isLeadInstructor) || []

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!open || !classData?.id) return

      try {
        setLoading(true)
        const response = await classService.getClassPermissions(classData.id)
        
        if (response.success && response.data) {
          const permMap: Record<string, string[]> = {}
          
          assistantCoaches.forEach(coach => {
            permMap[coach.userId] = []
          })

          response.data.forEach((p: any) => {
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
        showNotification('Lỗi khi tải quyền', 'error')
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchPermissions()
    } else {
      // reset when closed
      setPermissions({})
    }
  }, [open, classData?.id])

  const handleTogglePermission = (userId: string, code: string) => {
    setPermissions(prev => {
      const userPerms = prev[userId] || []
      const newPerms = userPerms.includes(code)
        ? userPerms.filter(p => p !== code)
        : [...userPerms, code]
        
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
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>Phân quyền trợ giảng - {classData?.name}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box className='flex justify-center p-8'>
            <CircularProgress />
          </Box>
        ) : assistantCoaches.length === 0 ? (
          <Typography className='py-4 text-center'>
            Lớp học không có trợ giảng nào để phân quyền.
          </Typography>
        ) : (
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Trợ giảng</TableCell>
                  {PERMISSIONS.map(p => (
                    <TableCell key={p.code} align='center'>{p.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {assistantCoaches.map(coach => (
                  <TableRow key={coach.userId}>
                    <TableCell>{coach.fullName}</TableCell>
                    {PERMISSIONS.map(p => (
                      <TableCell key={p.code} align='center'>
                        <Checkbox
                          checked={(permissions[coach.userId] || []).includes(p.code)}
                          onChange={() => handleTogglePermission(coach.userId, p.code)}
                          disabled={saving}
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
        <Button onClick={onClose} disabled={saving}>Hủy</Button>
        {assistantCoaches.length > 0 && (
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
