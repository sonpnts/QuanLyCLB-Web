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
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth='md'
      fullWidth
      scroll='paper'
      sx={{ '& .MuiDialog-paper': { borderRadius: fullScreen ? 0 : 3, maxHeight: fullScreen ? '100dvh' : '90dvh' } }}
    >
      {/* Header */}
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
        <Stack direction='row' spacing={1.5} alignItems='center'>
          <Box
            component='img'
            src='https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg'
            alt='Zalo'
            sx={{ width: 28, height: 28 }}
          />
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            Xác thực Zalo
          </Typography>
        </Stack>
        <IconButton onClick={handleClose} size='small'>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </DialogTitle>

      {/* Body */}
      <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, py: { xs: 2, sm: 3 }, flex: '1 1 0', overflow: 'auto' }}>
        <Stack spacing={{ xs: 2.5, sm: 3 }}>
          {/* Info banner */}
          <Alert severity='info' variant='outlined' sx={{ py: 0.75 }}>
            Nhập SĐT học viên để kiểm tra đã theo dõi Zalo OA chưa.
          </Alert>

          {/* Input row */}
          <Paper variant='outlined' sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Typography variant='subtitle2' sx={{ mb: 1.5, fontWeight: 600 }}>
              Số điện thoại học viên
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'stretch' }}>
              <TextField
                fullWidth
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                placeholder='Nhập SĐT Zalo...'
                disabled={state === 'loading'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='ri-phone-line text-xl' />
                    </InputAdornment>
                  )
                }}
                size='small'
              />
              <Button
                variant='contained'
                onClick={handleVerify}
                disabled={!phone.trim() || state === 'loading'}
                sx={{ minWidth: { sm: 140 }, whiteSpace: 'nowrap', textTransform: 'none' }}
                startIcon={
                  state === 'loading' ? <CircularProgress size={16} color='inherit' /> : <i className='ri-search-2-line' />
                }
              >
                {state === 'loading' ? 'Đang kiểm tra...' : 'Kiểm tra'}
              </Button>
            </Stack>
          </Paper>

          {/* Not follower */}
          {state === 'not_follower' && (
            <Paper variant='outlined' sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Stack spacing={2.5}>
                <Alert severity='warning' variant='filled' sx={{ py: 1 }}>
                  Số điện thoại chưa theo dõi Zalo OA
                </Alert>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
                  {/* Link section */}
                  <Stack spacing={1.5} sx={{ flex: 1 }}>
                    <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                      Hướng dẫn
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Học viên cần theo dõi trang Zalo OA của CLB để nhận thông báo học phí, lịch tập, và các thông báo quan trọng khác.
                    </Typography>

                    <Box>
                      <Typography variant='caption' color='text.secondary' sx={{ mb: 0.5, display: 'block' }}>
                        Link theo dõi OA:
                      </Typography>
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
                        <Tooltip title={copied ? 'Đã sao chép' : 'Sao chép link'} arrow>
                          <span>
                            <Button
                              variant={copied ? 'contained' : 'outlined'}
                              color={copied ? 'success' : 'primary'}
                              size='small'
                              onClick={handleCopyLink}
                              disabled={!ZALO_OA_LINK}
                              startIcon={<i className={copied ? 'ri-check-line' : 'ri-file-copy-line'} />}
                            >
                              {copied ? 'Đã copy' : 'Copy link'}
                            </Button>
                          </span>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Stack>

                  {/* QR section */}
                  <Paper
                    variant='outlined'
                    sx={{
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      flexShrink: 0,
                      width: { xs: '100%', md: 200 }
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
                            maxWidth: 160,
                            height: 'auto',
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        />
                        <Typography variant='caption' color='text.secondary' textAlign='center'>
                          Quét mã QR theo dõi OA
                        </Typography>
                      </>
                    ) : (
                      <Typography variant='caption' color='text.secondary' textAlign='center' sx={{ py: 2 }}>
                        Chưa cấu hình QR
                      </Typography>
                    )}
                  </Paper>
                </Stack>
              </Stack>
            </Paper>
          )}

          {/* Error */}
          {state === 'error' && (
            <Alert severity='error' variant='filled' sx={{ py: 1 }}>
              {errMsg || 'Đã xảy ra lỗi khi kiểm tra.'}
            </Alert>
          )}

          {/* Confirmed */}
          {state === 'confirmed' && zaloUser && (
            <Stack spacing={2}>
              <Alert severity='success' variant='filled' sx={{ py: 1 }}>
                Số điện thoại đã liên kết với tài khoản Zalo OA
              </Alert>

              <Paper
                variant='outlined'
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  gap: 2.5,
                  p: { xs: 2, sm: 2.5 }
                }}
              >
                <Avatar
                  src={avatarSrc}
                  alt={zaloUser.display_name || '?'}
                  sx={{ width: 72, height: 72, border: '2px solid', borderColor: 'success.main' }}
                >
                  {(zaloUser.display_name || '?').charAt(0)}
                </Avatar>
                <Stack spacing={0.5} sx={{ flex: 1 }}>
                  <Typography variant='h6' sx={{ fontWeight: 700 }}>
                    {zaloUser.display_name || '—'}
                  </Typography>
                  <Chip
                    label='Đã theo dõi OA'
                    size='small'
                    color='success'
                    icon={<i className='ri-check-double-line text-xs' />}
                  />
                </Stack>
              </Paper>

              <Button
                variant='contained'
                color='success'
                size='large'
                onClick={handleConfirm}
                fullWidth
                startIcon={<i className='ri-save-line' />}
                sx={{ textTransform: 'none', fontWeight: 600, py: 1.5 }}
              >
                Xác nhận liên kết
              </Button>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      {/* Footer */}
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
        <Button variant='outlined' onClick={handleClose} sx={{ textTransform: 'none', px: 4 }}>
          Đóng
        </Button>
        {state === 'not_follower' && (
          <Button
            variant='contained'
            color='warning'
            onClick={() => setState('idle')}
            sx={{ textTransform: 'none', px: 4 }}
          >
            Thử lại
          </Button>
        )}
      </Box>
    </Dialog>
  )
}

export default ZaloVerifyModal
