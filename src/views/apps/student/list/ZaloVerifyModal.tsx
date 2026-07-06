'use client'

import { useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
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
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import studentService, { type ZaloUserInfo } from '@/services/studentService'
import { logger } from '@/utils/logger'

const ZALO_OA_LINK = process.env.NEXT_PUBLIC_ZALO_OA_LINK || null
const ZALO_QR_IMG = process.env.NEXT_PUBLIC_ZALO_QR_IMG || null

type Props = {
  open: boolean
  onClose: () => void
  defaultPhone?: string
  onConfirm: (userId: string, phone: string) => void
}

type VerifyState = 'idle' | 'loading' | 'not_follower' | 'confirmed' | 'error'

const ZaloVerifyModal = ({ open, onClose, defaultPhone = '', onConfirm }: Props) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const [phone, setPhone] = useState(defaultPhone)
  const [state, setState] = useState<VerifyState>('idle')
  const [errMsg, setErrMsg] = useState('')
  const [zaloUser, setZaloUser] = useState<ZaloUserInfo | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return

    setPhone(defaultPhone)
    setState('idle')
    setErrMsg('')
    setZaloUser(null)
    setCopied(false)
  }, [defaultPhone, open])

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
      scroll='paper'
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          minHeight: { xs: '100dvh', sm: 'auto' },
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1.5, pr: 6 }}>
        <Stack direction='row' spacing={1.25} alignItems='center'>
          <Box
            component='img'
            src='https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg'
            alt='Zalo'
            sx={{ width: { xs: 24, sm: 28 }, height: { xs: 24, sm: 28 } }}
          />
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            Xác thực Zalo
          </Typography>
        </Stack>
        <IconButton onClick={handleClose} size='small' sx={{ position: 'absolute', right: 12, top: 12 }}>
          <i className='ri-close-line text-xl' />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 }, flex: '1 1 0', overflow: 'auto' }}>
        <Stack spacing={2.5}>
          <Alert severity='info' sx={{ alignItems: 'flex-start' }}>
            Nhập số điện thoại học viên để kiểm tra tài khoản đó đã theo dõi Zalo OA của CLB hay chưa.
          </Alert>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems='stretch'>
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
              size={fullScreen ? 'medium' : 'small'}
            />
            <Button
              variant='contained'
              onClick={handleVerify}
              disabled={!phone.trim() || state === 'loading'}
              fullWidth={fullScreen}
              sx={{ minWidth: { sm: 136 }, whiteSpace: 'nowrap', minHeight: { xs: 48, sm: 40 } }}
              startIcon={
                state === 'loading' ? <CircularProgress size={16} color='inherit' /> : <i className='ri-search-2-line' />
              }
            >
              {state === 'loading' ? 'Đang kiểm tra...' : 'Kiểm tra'}
            </Button>
          </Stack>

          {state === 'not_follower' && (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Stack spacing={2} sx={{ flex: 1 }}>
                <Alert severity='warning'>
                  <Typography variant='body2' fontWeight={600} gutterBottom>
                    Số điện thoại chưa quan tâm tài khoản Zalo OA
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Học viên cần theo dõi trang Zalo OA của CLB để nhận thông báo.
                  </Typography>
                </Alert>

                <Typography variant='body2' fontWeight={500}>
                  Link theo dõi OA
                </Typography>
                <Paper variant='outlined' sx={{ p: 1.5 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <Link
                      underline='hover'
                      variant='body2'
                      sx={{ flex: 1, wordBreak: 'break-word' }}
                      href={ZALO_OA_LINK || '#'}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      {ZALO_OA_LINK || 'Chưa cấu hình NEXT_PUBLIC_ZALO_OA_LINK'}
                    </Link>
                    <Tooltip title={copied ? 'Đã sao chép' : 'Sao chép link'} arrow>
                      <span>
                        <Button
                          variant={copied ? 'contained' : 'outlined'}
                          color={copied ? 'success' : 'primary'}
                          onClick={handleCopyLink}
                          disabled={!ZALO_OA_LINK}
                          fullWidth={fullScreen}
                          startIcon={<i className={copied ? 'ri-check-line' : 'ri-file-copy-line'} />}
                        >
                          {copied ? 'Đã sao chép' : 'Sao chép link'}
                        </Button>
                      </span>
                    </Tooltip>
                  </Stack>
                </Paper>
              </Stack>

              <Paper
                variant='outlined'
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  flexShrink: 0,
                  width: { xs: '100%', md: 220 }
                }}
              >
                {ZALO_QR_IMG ? (
                  <>
                    <Box
                      component='img'
                      src={ZALO_QR_IMG}
                      alt='QR Code Zalo OA'
                      sx={{
                        width: '100%',
                        maxWidth: { xs: 220, md: 180 },
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
              </Paper>
            </Stack>
          )}

          {state === 'error' && <Alert severity='error'>{errMsg || 'Đã xảy ra lỗi khi kiểm tra.'}</Alert>}

          {state === 'confirmed' && zaloUser && (
            <Stack spacing={2}>
              <Alert severity='success'>Số điện thoại đã liên kết với tài khoản Zalo OA.</Alert>

              <Paper
                variant='outlined'
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  gap: 2,
                  p: 2,
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
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant='subtitle1' fontWeight={700}>
                    {zaloUser.display_name || '—'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
                    <Chip
                      label='Đã theo dõi OA'
                      size='small'
                      color='success'
                      icon={<i className='ri-check-double-line text-xs' />}
                    />
                  </Box>
                </Box>
              </Paper>

              <Button
                variant='contained'
                color='success'
                onClick={handleConfirm}
                startIcon={<i className='ri-save-line' />}
                fullWidth
                sx={{ minHeight: 48 }}
              >
                Xác nhận liên kết
              </Button>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          pb: { xs: 2.5, sm: 2 },
          pt: 0,
          gap: 1
        }}
      >
        <Button
          variant='outlined'
          onClick={handleClose}
          sx={{ flex: 1, minHeight: { xs: 48, sm: 40 } }}
        >
          Đóng
        </Button>
        {state === 'not_follower' && (
          <Button
            variant='contained'
            color='warning'
            onClick={() => setState('idle')}
            sx={{ flex: 1, minHeight: { xs: 48, sm: 40 } }}
          >
            Thử lại
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ZaloVerifyModal
