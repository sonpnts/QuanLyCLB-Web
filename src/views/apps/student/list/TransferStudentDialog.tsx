'use client'

import { useEffect, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Box from '@mui/material/Box'

import type { StudentType } from '@/types/apps/studentTypes'
import type { ClassType } from '@/types/apps/classTypes'
import classService from '@/services/classService'
import classTransferService from '@/services/classTransferService'
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  onClose: () => void
  student: StudentType | null
  onTransferred?: () => void
}

const TransferStudentDialog = ({ open, onClose, student, onTransferred }: Props) => {
  const [transferFromClassId, setTransferFromClassId] = useState('')
  const [transferToClassId, setTransferToClassId] = useState('')
  const [transferReason, setTransferReason] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)
  const [availableClasses, setAvailableClasses] = useState<ClassType[]>([])

  const { showNotification } = useNotification()

  const studentClasses: any[] = (student as any)?.classes || []
  const activeStudentClasses = studentClasses.filter((c: any) => c.status === 0 || c.status === 'Active')
  const currentClassIds = activeStudentClasses.map((c: any) => c.classId || c.id)

  useEffect(() => {
    if (open && student) {
      const firstActiveClass = activeStudentClasses[0]
      setTransferFromClassId(firstActiveClass?.classId || firstActiveClass?.id || '')
      setTransferToClassId('')
      setTransferReason('')

      const loadClasses = async () => {
        const response = await classService.getClasses({ isActive: true, pageSize: 1000 })
        if (response.success && response.data) {
          setAvailableClasses(response.data)
        }
      }
      loadClasses()
    }
  }, [open, student])

  const handleSubmitTransfer = async () => {
    if (!student?.id || !transferFromClassId || !transferToClassId || !transferReason.trim()) return
    try {
      setTransferLoading(true)
      const response = await classTransferService.createClassTransfer({
        studentId: student.id,
        fromClassId: transferFromClassId,
        toClassId: transferToClassId,
        reason: transferReason.trim()
      })
      if (response.success) {
        showNotification('Yêu cầu chuyển lớp đã được gửi thành công.', 'success')
        onTransferred?.()
        onClose()
      } else {
        showNotification(response.message || 'Không thể gửi yêu cầu chuyển lớp.', 'error')
      }
    } catch {
      showNotification('Đã có lỗi khi gửi yêu cầu chuyển lớp.', 'error')
    } finally {
      setTransferLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Chuyển lớp học viên</DialogTitle>
      <DialogContent>
        <Box className='flex flex-col gap-4 pt-2'>
          <FormControl fullWidth>
            <InputLabel>Từ lớp</InputLabel>
            <Select label='Từ lớp' value={transferFromClassId} onChange={e => setTransferFromClassId(e.target.value)}>
              {activeStudentClasses.length > 0
                ? activeStudentClasses.map((c: any) => (
                    <MenuItem key={c.classId || c.id} value={c.classId || c.id}>
                      {c.className || 'Lớp không xác định'}
                    </MenuItem>
                  ))
                : availableClasses.map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Đến lớp</InputLabel>
            <Select label='Đến lớp' value={transferToClassId} onChange={e => setTransferToClassId(e.target.value)}>
              {availableClasses
                .filter(c => !currentClassIds.includes(c.id))
                .map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label='Lý do'
            value={transferReason}
            onChange={e => setTransferReason(e.target.value)}
            multiline
            rows={3}
            required
            placeholder='Nhập lý do chuyển lớp...'
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={transferLoading}>
          Hủy
        </Button>
        <Button
          onClick={handleSubmitTransfer}
          variant='contained'
          disabled={transferLoading || !transferFromClassId || !transferToClassId || !transferReason.trim()}
        >
          {transferLoading ? 'Đang gửi...' : 'Xác nhận chuyển lớp'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TransferStudentDialog
