'use client'

import { useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
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
    <Dialog fullScreen={fullScreen} fullWidth maxWidth='sm' open={open} onClose={handleClose}>
      <DialogTitle>
        <Stack direction='row' spacing={1} alignItems='center' justifyContent='space-between'>
          <Stack direction='row' spacing={1} alignItems='center'>
            <Box
              component='img'
              src='https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg'
              alt='Zalo'
              sx={{ width: 24, height: 24 }}
            />
            <Typography variant='h6'>Xác thực Zalo</Typography>
          </Stack>
          <IconButton onClick={handleClose} size='small'>
            <i className='ri-close-line' />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity='info'>Nhập SĐT học viên để kiểm tra đã theo dõi Zalo OA chưa.</Alert>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label='Số điện thoại'
                size='small'
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                placeholder='Nhập SĐT Zalo...'
                disabled={state === 'loading'}

                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='ri-phone-line' />
                    </InputAdornment>
                  )
                }}
              />
            </Box>

            <Button
              variant='contained'
              onClick={handleVerify}
              disabled={!phone.trim() || state === 'loading'}
              startIcon={
                state === 'loading' ? (
                  <CircularProgress size={30} color='inherit' />
                ) : (
                  <i className='ri-search-2-line' />
                )
              }
            >
              {state === 'loading' ? 'Đang...' : 'Kiểm tra'}
            </Button>
          </Stack>

          {state === 'not_follower' && (
            <Stack spacing={2}>
              <Alert severity='warning'>
                <Typography variant='body2' fontWeight={600}>
                  Số điện thoại chưa theo dõi Zalo OA
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Học viên cần theo dõi trang Zalo OA của CLB để nhận thông báo.
                </Typography>
              </Alert>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Stack spacing={1} sx={{ flex: 1 }}>
                  <Typography variant='subtitle2'>Link theo dõi OA</Typography>
                  <Paper variant='outlined' sx={{ p: 1.5 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                      <Link
                        underline='hover'
                        variant='body2'
                        sx={{ wordBreak: 'break-all', flex: 1 }}
                        href={ZALO_OA_LINK || '#'}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        {ZALO_OA_LINK || 'Chưa cấu hình link'}
                      </Link>
                      <Tooltip title={copied ? 'Đã sao chép' : 'Sao chép'} arrow>
                        <span>
                          <Button
                            size='small'
                            variant={copied ? 'contained' : 'outlined'}
                            color={copied ? 'success' : 'primary'}
                            onClick={handleCopyLink}
                            disabled={!ZALO_OA_LINK}
                            startIcon={<i className={copied ? 'ri-check-line' : 'ri-file-copy-line'} />}
                          >
                            {copied ? 'Đã copy' : 'Copy'}
                          </Button>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Paper>
                </Stack>

                <Paper variant='outlined' sx={{ p: 2, textAlign: 'center', flexShrink: 0 }}>
                  {ZALO_QR_IMG ? (
                    <>
                      <Box
                        component='img'
                        src={ZALO_QR_IMG}
                        alt='QR Code Zalo OA'
                        sx={{ width: 160, height: 160, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                      />
                      <Typography variant='caption' color='text.secondary' display='block' mt={1}>
                        Quét mã QR theo dõi OA
                      </Typography>
                    </>
                  ) : (
                    <Typography variant='caption' color='text.secondary'>
                      Chưa cấu hình QR
                    </Typography>
                  )}
                </Paper>
              </Stack>
            </Stack>
          )}

          {state === 'error' && <Alert severity='error'>{errMsg || 'Đã xảy ra lỗi.'}</Alert>}

          {state === 'confirmed' && zaloUser && (
            <Stack spacing={2}>
              <Alert severity='success'>Số điện thoại đã liên kết với Zalo OA.</Alert>

              <Paper variant='outlined' sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Avatar src={avatarSrc} alt={zaloUser.display_name || '?'} sx={{ width: 56, height: 56 }}>
                  {(zaloUser.display_name || '?').charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant='subtitle1' fontWeight={600}>
                    {zaloUser.display_name || '—'}
                  </Typography>
                  <Chip
                    label='Đã theo dõi OA'
                    size='small'
                    color='success'
                    icon={<i className='ri-check-double-line text-xs' />}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Paper>

              <Button
                variant='contained'
                color='success'
                fullWidth
                onClick={handleConfirm}
                startIcon={<i className='ri-save-line' />}
              >
                Xác nhận liên kết
              </Button>
            </Stack>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}

export default ZaloVerifyModal
