'use client'

import { useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Divider from '@mui/material/Divider'
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
  title = 'Liên kết Zalo',
  message = 'Học viên chưa liên kết Zalo để nhận thông báo đóng học phí. Vui lòng liên kết hoặc bỏ qua.',
  skipLabel = 'Bỏ qua',
  linkLabel = 'Liên kết ngay',
  onClose,
  onSkip,
  onLinked
}: Props) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
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
      showNotification('Đã cập nhật liên kết Zalo thành công!', 'success')
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
        fullWidth
        maxWidth='sm'
        open={open}
        onClose={saving ? undefined : onClose}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ p: 0 }}>
          {/* Header with Zalo icon */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #0068FF 0%, #004ACC 100%)',
              px: { xs: 3, sm: 4 },
              pt: { xs: 3, sm: 4 },
              pb: { xs: 2.5, sm: 3 },
              textAlign: 'center'
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1.5
              }}
            >
              <img
                src='https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg'
                alt='Zalo'
                style={{ width: 32, height: 32, filter: 'brightness(0) invert(1)' }}
              />
            </Box>
            <Typography variant='h5' sx={{ color: '#fff', fontWeight: 600, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              {title}
            </Typography>
          </Box>

          {/* Content */}
          <DialogContent sx={{ px: { xs: 3, sm: 4 }, pt: { xs: 2.5, sm: 3 }, pb: 2 }}>
            {hasLinkedZalo ? (
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: 'success.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  <i className='ri-check-line' style={{ fontSize: 28, color: theme.palette.success.main }} />
                </Box>
                <Typography variant='body1' sx={{ fontWeight: 500, color: 'success.main' }}>
                  Học viên đã liên kết Zalo
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                  Không cần thực hiện thêm thao tác nào.
                </Typography>
              </Box>
            ) : (
              <>
                {/* Student info card */}
                {student && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50',
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'grey.700' : 'grey.200'
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        bgcolor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Typography variant='h6' sx={{ color: 'primary.main', fontWeight: 600 }}>
                        {student.fullName?.charAt(0)?.toUpperCase() || '?'}
                      </Typography>
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant='subtitle2' sx={{ fontWeight: 600 }} noWrap>
                        {student.fullName}
                      </Typography>
                      {student.phoneNumber && (
                        <Typography variant='body2' color='text.secondary' noWrap>
                          {student.phoneNumber}
                        </Typography>
                      )}
                    </Box>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: 'warning.light',
                        color: 'warning.contrastText',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Chưa liên kết
                    </Box>
                  </Box>
                )}

                {/* Message */}
                <Typography variant='body1' sx={{ mb: 2, lineHeight: 1.7, color: 'text.primary' }}>
                  {message}
                </Typography>

                {/* Info note */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'info.light',
                    color: 'info.contrastText',
                    '& .ri-information-line': { fontSize: 20, mt: 0.25, flexShrink: 0 }
                  }}
                >
                  <i className='ri-information-line' />
                  <Typography variant='body2' sx={{ lineHeight: 1.6 }}>
                    Sau khi liên kết, học viên sẽ nhận được thông báo xác nhận học phí qua Zalo OA.
                  </Typography>
                </Box>
              </>
            )}
          </DialogContent>

          <Divider />

          {/* Actions */}
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              justifyContent: 'flex-end',
              px: { xs: 3, sm: 4 },
              py: 2
            }}
          >
            <Button
              variant='outlined'
              onClick={handleSkip}
              disabled={saving}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
            >
              {skipLabel}
            </Button>
            <Button
              variant='contained'
              onClick={() => setVerifyOpen(true)}
              disabled={saving || hasLinkedZalo || !student}
              startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='ri-links-line' />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                bgcolor: '#0068FF',
                '&:hover': { bgcolor: '#004ACC' }
              }}
            >
              {linkLabel}
            </Button>
          </Box>
        </Box>
      </Dialog>

      <ZaloVerifyModal open={verifyOpen} onClose={() => !saving && setVerifyOpen(false)} defaultPhone={student?.phoneNumber || ''} onConfirm={handleConfirmLink} />
    </>
  )
}

export default StudentZaloLinkPromptDialog
