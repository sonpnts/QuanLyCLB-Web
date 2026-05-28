'use client'

import { useMemo } from 'react'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'

type GoogleResourceBlockedDialogProps = {
  open: boolean
  onClose: () => void
  onReload?: () => void
}

const detectEmbeddedBrowserName = (userAgent: string) => {
  const normalizedUserAgent = userAgent.toLowerCase()

  if (normalizedUserAgent.includes('zalo')) return 'Zalo'
  if (normalizedUserAgent.includes('fban') || normalizedUserAgent.includes('fbav') || normalizedUserAgent.includes('messenger')) return 'Facebook'
  if (normalizedUserAgent.includes('instagram')) return 'Instagram'
  if (normalizedUserAgent.includes('line')) return 'LINE'
  if (normalizedUserAgent.includes('tiktok')) return 'TikTok'

  return null
}

const GoogleResourceBlockedDialog = ({ open, onClose, onReload }: GoogleResourceBlockedDialogProps) => {
  const embeddedBrowserName = useMemo(() => {
    if (typeof navigator === 'undefined') return null

    return detectEmbeddedBrowserName(navigator.userAgent)
  }, [])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
      <DialogTitle>Không tải được đăng nhập Google</DialogTitle>
      <DialogContent>
        <Alert severity='warning' className='mb-4'>
          Không thể tải tài nguyên Google cần thiết để đăng nhập.
        </Alert>

        {embeddedBrowserName ? (
          <Typography variant='body2' className='mb-3'>
            Bạn đang mở trang trong trình duyệt của {embeddedBrowserName}. Kiểu trình duyệt nhúng này thường chặn tài nguyên Google nên
            đăng nhập Google sẽ không hoạt động.
          </Typography>
        ) : (
          <Typography variant='body2' className='mb-3'>
            Trình duyệt hoặc mạng hiện tại đang chặn tài nguyên Google nên trang không thể mở phần đăng nhập Google.
          </Typography>
        )}

        <Typography variant='body2' className='mb-2'>
          Vui lòng mở lại liên kết này bằng Chrome, Safari hoặc trình duyệt mặc định của thiết bị.
        </Typography>

        <Typography variant='body2'>
          Nếu đang mở trong Zalo hoặc Facebook, hãy chọn <strong>Mở bằng trình duyệt</strong> rồi thử đăng nhập lại.
        </Typography>
      </DialogContent>
      <DialogActions>
        {onReload && (
          <Button variant='outlined' onClick={onReload}>
            Tải lại trang
          </Button>
        )}
        <Button variant='contained' onClick={onClose}>
          Đã hiểu
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default GoogleResourceBlockedDialog
