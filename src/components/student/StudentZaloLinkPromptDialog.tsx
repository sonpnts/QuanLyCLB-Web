'use client'

import { useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
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
      <Dialog
        open={open}
        onClose={saving ? undefined : onClose}
        maxWidth='sm'
        fullWidth
        fullScreen={fullScreen}
        scroll='paper'
        sx={{ '& .MuiDialog-paper': { borderRadius: fullScreen ? 0 : 3, maxHeight: fullScreen ? '100dvh' : '90dvh' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1.5,
            pt: { xs: 2, sm: 2.5 },
            px: { xs: 2.5, sm: 3.5 }
          }}
        >
          <Box component='span' sx={{ fontWeight: 600 }}>{title}</Box>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, py: { xs: 2, sm: 3 } }}>
          {hasLinkedZalo ? (
            <Alert severity='success' variant='outlined' sx={{ py: 1 }}>
              Học viên này đã có liên kết Zalo.
            </Alert>
          ) : (
            <Stack spacing={2}>
              <Alert severity='warning' variant='filled' sx={{ py: 1 }}>
                {student?.fullName ? `Học viên ${student.fullName} chưa có UserIdZalo.` : 'Học viên này chưa có UserIdZalo.'}
              </Alert>
              <Typography variant='body1' color='text.secondary' sx={{ lineHeight: 1.6 }}>
                {message}
              </Typography>
              {student?.phoneNumber ? (
                <Typography variant='body2' color='text.secondary'>
                  Số điện thoại hiện tại: <strong>{student.phoneNumber}</strong>
                </Typography>
              ) : null}
            </Stack>
          )}
        </DialogContent>

        <Box
          sx={{
            px: { xs: 2.5, sm: 3.5 },
            pb: { xs: 2.5, sm: 3 },
            pt: 1.5,
            display: 'flex',
            gap: 1.5,
            justifyContent: 'flex-end',
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Button variant='outlined' onClick={handleSkip} disabled={saving} sx={{ textTransform: 'none', px: 4 }}>
            {skipLabel}
          </Button>
          <Button
            variant='contained'
            onClick={() => setVerifyOpen(true)}
            disabled={saving || hasLinkedZalo || !student}
            sx={{ textTransform: 'none', px: 4 }}
          >
            {saving ? <CircularProgress size={18} color='inherit' sx={{ mr: 1 }} /> : linkLabel}
          </Button>
        </Box>
      </Dialog>

      <ZaloVerifyModal
        open={verifyOpen}
        onClose={() => !saving && setVerifyOpen(false)}
        defaultPhone={student?.phoneNumber || ''}
        onConfirm={handleConfirmLink}
      />
    </>
  )
}

export default StudentZaloLinkPromptDialog
