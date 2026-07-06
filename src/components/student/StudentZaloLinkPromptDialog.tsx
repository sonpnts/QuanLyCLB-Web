'use client'

import { useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import { useNotification } from '@/contexts/notificationContext'
import studentService from '@/services/studentService'
import type { StudentType } from '@/types/apps/studentTypes'
import ZaloVerifyModal from '@/views/apps/student/list/ZaloVerifyModal'
import { logger } from '@/utils/logger'

type PromptStudent = Pick<StudentType, 'id' | 'fullName' | 'phoneNumber' | 'userIdZalo'>

type Props = {
  open: boolean
  student: PromptStudent | null
  title?: string
  message?: string
  skipLabel?: string
  linkLabel?: string
  onClose: () => void
  onSkip?: () => void
  onLinked?: (student: StudentType) => void
}

const StudentZaloLinkPromptDialog = ({
  open,
  student,
  title = 'Thêm liên kết Zalo',
  message = 'Hãy thêm liên kết Zalo để gửi thông báo xác nhận. Chọn không sẽ không gửi thông báo.',
  skipLabel = 'Để sau',
  linkLabel = 'Thêm liên kết Zalo',
  onClose,
  onSkip,
  onLinked
}: Props) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const { showNotification } = useNotification()
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const hasLinkedZalo = useMemo(() => Boolean(student?.userIdZalo?.trim()), [student?.userIdZalo])

  const handleSkip = () => {
    if (saving) return
    onSkip?.()
    onClose()
  }

  const handleConfirmLink = async (userId: string, phone: string) => {
    if (!student?.id) return
    try {
      setSaving(true)
      const response = await studentService.updateStudentZalo(student.id, userId, phone)
      if (!response.success || !response.data) {
        showNotification(response.message || 'Không thể lưu liên kết Zalo.', 'error')
        return
      }
      showNotification('Đã cập nhật liên kết Zalo.', 'success')
      onLinked?.(response.data)
      setVerifyOpen(false)
      onClose()
    } catch (error) {
      logger.error('StudentZaloLinkPromptDialog', 'handleConfirmLink', error)
      showNotification('Đã có lỗi khi lưu liên kết Zalo.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog fullScreen={fullScreen} fullWidth maxWidth='xs' open={open} onClose={saving ? undefined : onClose}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          {hasLinkedZalo ? (
            <Alert severity='success'>Học viên này đã có liên kết Zalo.</Alert>
          ) : (
            <>
              <Alert severity='warning' sx={{ mb: 2 }}>
                {student?.fullName ? `Học viên ${student.fullName} chưa có UserIdZalo.` : 'Học viên này chưa có UserIdZalo.'}
              </Alert>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>{message}</Typography>
              {student?.phoneNumber && (
                <Typography variant='body2' color='text.secondary'>
                  Số điện thoại: <strong>{student.phoneNumber}</strong>
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogContent dividers sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button variant='outlined' onClick={handleSkip} disabled={saving}>
            {skipLabel}
          </Button>
          <Button variant='contained' onClick={() => setVerifyOpen(true)} disabled={saving || hasLinkedZalo || !student}
            startIcon={saving ? <CircularProgress size={16} color='inherit' /> : undefined}>
            {linkLabel}
          </Button>
        </DialogContent>
      </Dialog>

      <ZaloVerifyModal open={verifyOpen} onClose={() => !saving && setVerifyOpen(false)} defaultPhone={student?.phoneNumber || ''} onConfirm={handleConfirmLink} />
    </>
  )
}

export default StudentZaloLinkPromptDialog
