'use client'

// React Imports
import { useEffect, useState, useCallback } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'

// Type Imports
import type { SystemConfigType } from '@/types/apps/systemConfigTypes'

// Service Imports
import systemConfigService from '@/services/systemConfigService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'
import { formatDateTimeVN } from '@/utils/dateTime'

const CONFIG_DISPLAY: Record<string, string> = {
  timeLateness: 'Thời gian cho phép đi trễ (phút)',
  allowedRadiusMeters: 'Bán kính GPS tối đa (mét)',
  maxAbsenceDays: 'Số buổi vắng tối đa/tháng'
}

const SystemConfigView = () => {
  // States
  const [data, setData] = useState<SystemConfigType[]>([])
  const [loading, setLoading] = useState(false)

  // Add/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SystemConfigType | null>(null)
  const [formKeyName, setFormKeyName] = useState('')
  const [formValue, setFormValue] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { showNotification } = useNotification()

  // Load configs on mount
  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true)
      const response = await systemConfigService.getAll()

      if (response.success) {
        setData(response.data || [])
      } else {
        showNotification(response.message || 'Không thể tải cấu hình.', 'error')
      }
    } catch {
      showNotification('Đã có lỗi khi tải cấu hình hệ thống.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  useEffect(() => {
    loadConfigs()
  }, [loadConfigs])

  // Open Add dialog
  const handleAddClick = () => {
    setEditingItem(null)
    setFormKeyName('')
    setFormValue('')
    setFormDescription('')
    setDialogOpen(true)
  }

  // Open Edit dialog
  const handleEditClick = (item: SystemConfigType) => {
    setEditingItem(item)
    setFormKeyName(item.keyName)
    setFormValue(item.value)
    setFormDescription(item.description || '')
    setDialogOpen(true)
  }

  // Close dialog
  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingItem(null)
  }

  // Save (add or edit)
  const handleSave = async () => {
    if (!formKeyName.trim() || !formValue.trim()) {
      showNotification('Vui lòng nhập đầy đủ tên khóa và giá trị.', 'error')

      return
    }

    try {
      setSaving(true)
      const response = await systemConfigService.upsert(formKeyName.trim(), formValue.trim(), formDescription.trim() || undefined)

      if (response.success && response.data) {
        if (editingItem) {
          setData(prev => prev.map(item => (item.keyName === editingItem.keyName ? response.data! : item)))
          showNotification('Cập nhật cấu hình thành công.', 'success')
        } else {
          setData(prev => [...prev, response.data!])
          showNotification('Thêm cấu hình thành công.', 'success')
        }

        handleDialogClose()
      } else {
        showNotification(response.message || 'Không thể lưu cấu hình.', 'error')
      }
    } catch {
      showNotification('Đã có lỗi khi lưu cấu hình.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Open delete confirm
  const handleDeleteClick = (keyName: string) => {
    setDeleteId(keyName)
    setDeleteDialogOpen(true)
  }

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!deleteId) return

    try {
      setLoading(true)
      const response = await systemConfigService.delete(deleteId)

      if (response.success) {
        setData(prev => prev.filter(item => item.keyName !== deleteId))
        showNotification('Xóa cấu hình thành công.', 'success')
      } else {
        showNotification(response.message || 'Không thể xóa cấu hình.', 'error')
      }
    } catch {
      showNotification('Đã có lỗi khi xóa cấu hình.', 'error')
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
      setDeleteId(null)
    }
  }

  const formatDate = (dateStr?: string) => {
    return formatDateTimeVN(dateStr)
  }

  return (
    <>
      <Card>
        <CardHeader
          title='Cấu hình hệ thống'
          action={
            <Button variant='contained' onClick={handleAddClick} startIcon={<i className='ri-add-line' />}>
              Thêm cấu hình
            </Button>
          }
        />

        {loading && data.length === 0 ? (
          <Box className='flex justify-center items-center py-10'>
            <CircularProgress />
          </Box>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b'>
                  <th className='p-4 text-left'>
                    <Typography variant='subtitle2' className='font-semibold'>
                      Tên cấu hình
                    </Typography>
                  </th>
                  <th className='p-4 text-left'>
                    <Typography variant='subtitle2' className='font-semibold'>
                      Giá trị
                    </Typography>
                  </th>
                  <th className='p-4 text-left'>
                    <Typography variant='subtitle2' className='font-semibold'>
                      Mô tả
                    </Typography>
                  </th>
                  <th className='p-4 text-left'>
                    <Typography variant='subtitle2' className='font-semibold'>
                      Cập nhật lần cuối
                    </Typography>
                  </th>
                  <th className='p-4 text-left'>
                    <Typography variant='subtitle2' className='font-semibold'>
                      Thao tác
                    </Typography>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className='p-8 text-center'>
                      <Typography variant='body1' color='text.secondary'>
                        Chưa có cấu hình nào
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  data.map(item => (
                    <tr key={item.keyName} className='border-b hover:bg-action-hover'>
                      <td className='p-4'>
                        <Box>
                          <Typography variant='body2' className='font-medium'>
                            {item.keyName}
                            {/*{CONFIG_DISPLAY[item.keyName] || item.keyName}*/}
                          </Typography>
                          {CONFIG_DISPLAY[item.keyName] && (
                            <Typography variant='caption' color='text.secondary'>
                              {item.keyName}
                            </Typography>
                          )}
                        </Box>
                      </td>
                      <td className='p-4'>
                        <Typography variant='body2'>{item.value}</Typography>
                      </td>
                      <td className='p-4'>
                        <Typography variant='body2' color='text.secondary'>
                          {item.description || '-'}
                        </Typography>
                      </td>
                      <td className='p-4'>
                        <Typography variant='body2' color='text.secondary'>
                          {formatDate(item.updatedAt || item.createdAt)}
                        </Typography>
                      </td>
                      <td className='p-4'>
                        <Box className='flex items-center gap-1'>
                          <IconButton size='small' color='primary' onClick={() => handleEditClick(item)}>
                            <i className='ri-edit-line text-xl' />
                          </IconButton>
                          <IconButton size='small' color='error' onClick={() => handleDeleteClick(item.keyName)}>
                            <i className='ri-delete-bin-7-line text-xl' />
                          </IconButton>
                        </Box>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth='sm' fullWidth>
        <DialogTitle>{editingItem ? 'Sửa cấu hình' : 'Thêm cấu hình'}</DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-4 pt-4'>
            <TextField
              fullWidth
              label='Tên khóa (keyName)'
              value={formKeyName}
              onChange={e => setFormKeyName(e.target.value)}
              disabled={!!editingItem}
              required
              placeholder='vd: timeLateness'
              helperText={editingItem ? 'Tên khóa không thể thay đổi khi chỉnh sửa' : undefined}
            />
            <TextField
              fullWidth
              label='Giá trị'
              value={formValue}
              onChange={e => setFormValue(e.target.value)}
              required
              placeholder='Nhập giá trị...'
            />
            <TextField
              fullWidth
              label='Mô tả'
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder='Mô tả (tùy chọn)'
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} variant='contained' disabled={saving}>
            {saving ? 'Đang lưu...' : editingItem ? 'Cập nhật' : 'Thêm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa cấu hình{' '}
            <strong>{deleteId ? (CONFIG_DISPLAY[deleteId] || deleteId) : ''}</strong>? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleDeleteConfirm} color='error' variant='contained' disabled={loading}>
            {loading ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default SystemConfigView
