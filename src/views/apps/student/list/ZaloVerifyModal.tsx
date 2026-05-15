'use client'

import { useState } from 'react'

// MUI Imports
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

// Service
import studentService, { type ZaloUserInfo } from '@/services/studentService'
import { logger } from '@/utils/logger'

const ZALO_OA_LINK = process.env.NEXT_PUBLIC_ZALO_OA_LINK || null
const ZALO_QR_IMG = process.env.NEXT_PUBLIC_ZALO_QR_IMG || null

type Props = {
  open: boolean
  onClose: () => void
  defaultPhone?: string

  /** Gọi khi xác nhận liên kết — truyền user_id và số điện thoại về drawer cha */
  onConfirm: (userId: string, phone: string) => void
}

type VerifyState = 'idle' | 'loading' | 'not_follower' | 'confirmed' | 'error'

const ZaloVerifyModal = ({ open, onClose, defaultPhone = '', onConfirm }: Props) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))


  const [phone, setPhone]           = useState(defaultPhone)
  const [state, setState]           = useState<VerifyState>('idle')
  const [errMsg, setErrMsg]         = useState('')
  const [zaloUser, setZaloUser]     = useState<ZaloUserInfo | null>(null)
  const [copied, setCopied]         = useState(false)

  const handleClose = () => {
    setState('idle')
    setZaloUser(null)
    setErrMsg('')
    setPhone(defaultPhone)
    onClose()
  }

  const handleVerify = async () => {
    if (!phone.trim()) return

    setState('loading')
    setZaloUser(null)
    setErrMsg('')

    try {
      const result = await studentService.verifyZaloPhone(phone.trim())

      if (result.isFollower && result.data) {
        setZaloUser(result.data)
        setState('confirmed')
      } else {
        setErrMsg(result.message || 'Số điện thoại chưa quan tâm tài khoản Zalo OA.')
        setState('not_follower')
      }
    } catch (err) {
      logger.error('ZaloVerifyModal', 'handleVerify', err)
      setState('error')
      setErrMsg('Không thể kết nối tới máy chủ.')
    }
  }

  const handleCopyLink = () => {
    if (!ZALO_OA_LINK) return

    navigator.clipboard.writeText(ZALO_OA_LINK).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleConfirm = () => {
    if (zaloUser?.user_id) {
      onConfirm(zaloUser.user_id, phone.trim())
      handleClose()
    }
  }

  const avatarSrc = zaloUser?.avatars?.['240'] || zaloUser?.avatar || ''

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth='sm'
      fullWidth
      PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            component='img'
            src='https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg'
            alt='Zalo'
            sx={{ width: 28, height: 28 }}
          />
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            Xác thực Zalo
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size='small' sx={{ position: 'absolute', right: 12, top: 12 }}>
          <i className='ri-close-line text-xl' />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {/* Phone input + Verify button */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            fullWidth
            label='Số điện thoại'
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
            placeholder='Nhập số điện thoại Zalo...'
            disabled={state === 'loading'}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='ri-phone-line' />
                </InputAdornment>
              )
            }}
            size='small'
          />
          <Button
            variant='contained'
            onClick={handleVerify}
            disabled={!phone.trim() || state === 'loading'}
            sx={{ minWidth: 120, whiteSpace: 'nowrap' }}
            startIcon={
              state === 'loading' ? <CircularProgress size={16} color='inherit' /> : <i className='ri-search-2-line' />
            }
          >
            {state === 'loading' ? 'Đang kiểm tra...' : 'Kiểm tra'}
          </Button>
        </Box>

        {/* === NOT FOLLOWER === */}
        {state === 'not_follower' && (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mt: 1 }}>
            {/* Left: message + OA link */}
            <Box sx={{ flex: 1 }}>
              <Alert severity='warning' sx={{ mb: 2 }}>
                <Typography variant='body2' fontWeight={600} gutterBottom>
                  Số điện thoại chưa quan tâm tài khoản Zalo OA
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Học viên cần theo dõi trang Zalo OA của CLB để nhận thông báo.
                </Typography>
              </Alert>

              <Typography variant='body2' fontWeight={500} gutterBottom>
                Link theo dõi OA:
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1.5,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  mb: 2
                }}
              >
                <Typography
                  variant='body2'
                  sx={{ flex: 1, wordBreak: 'break-all', color: 'primary.main' }}
                  component='a'
                  href={ZALO_OA_LINK || '#'}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {ZALO_OA_LINK || 'Chưa cấu hình NEXT_PUBLIC_ZALO_OA_LINK'}
                </Typography>
                <Tooltip title={copied ? 'Đã sao chép!' : 'Sao chép link'} arrow>
                  <IconButton size='small' onClick={handleCopyLink} color={copied ? 'success' : 'default'} disabled={!ZALO_OA_LINK}>
                    <i className={copied ? 'ri-check-line' : 'ri-file-copy-line'} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Right: QR code */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                flexShrink: 0
              }}
            >
              {ZALO_QR_IMG ? (
                <>
                  <Box
                    component='img'
                    src={ZALO_QR_IMG}
                    alt='QR Code Zalo OA'
                    sx={{
                      width: { xs: '100%', sm: 160 },
                      maxWidth: 200,
                      height: 'auto',
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: 'divider'
                    }}
                  />
                  <Typography variant='caption' color='text.secondary' textAlign='center'>
                    Quét mã QR để theo dõi OA
                  </Typography>
                </>
              ) : (
                <Typography variant='caption' color='text.secondary' textAlign='center'>
                  Chưa cấu hình NEXT_PUBLIC_ZALO_QR_IMG
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* === ERROR === */}
        {state === 'error' && (
          <Alert severity='error' sx={{ mt: 1 }}>
            {errMsg || 'Đã xảy ra lỗi khi kiểm tra.'}
          </Alert>
        )}

        {/* === CONFIRMED (user found) === */}
        {state === 'confirmed' && zaloUser && (
          <Box sx={{ mt: 1 }}>
            <Alert severity='success' sx={{ mb: 2 }}>
              Số điện thoại đã liên kết với tài khoản Zalo OA!
            </Alert>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <Avatar
                src={avatarSrc}
                alt={zaloUser.display_name || '?'}
                sx={{ width: 64, height: 64, border: '2px solid', borderColor: 'primary.main' }}
              >
                {(zaloUser.display_name || '?').charAt(0)}
              </Avatar>
              <Box>
                <Typography variant='subtitle1' fontWeight={700}>
                  {zaloUser.display_name || '—'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Chip
                    label='Đã theo dõi OA'
                    size='small'
                    color='success'
                    icon={<i className='ri-check-double-line text-xs' />}
                  />
                </Box>
                <Typography variant='caption' color='text.disabled' sx={{ mt: 0.5, display: 'block' }}>
                  Nhấn <strong>Xác nhận liên kết</strong> để lưu thông tin Zalo cho học viên.
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button variant='outlined' onClick={handleClose}>
          Đóng
        </Button>
        {state === 'not_follower' && (
          <Button variant='contained' color='warning' onClick={() => setState('idle')}>
            Thử lại
          </Button>
        )}
        {state === 'confirmed' && zaloUser?.user_id && (
          <Button
            variant='contained'
            color='success'
            onClick={handleConfirm}
            startIcon={<i className='ri-save-line' />}
          >
            Xác nhận liên kết
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ZaloVerifyModal
