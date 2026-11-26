'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@mui/material/styles'

import { useAuth } from '@/contexts/authContext'
import {
  isWebPushPopupEnabled,
  isWebPushSupported,
  isStandaloneMode,
  getDeviceInfo,
  subscribeDeviceToPush,
  checkIsDeviceSubscribed,
  isPopupDismissedInSession,
  setPopupDismissedInSession
} from '@/utils/webPush'

export const WebPushOnboardingPopup: React.FC = () => {
  const theme = useTheme()
  const { isAuthenticated, isInitialized } = useAuth()

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>('desktop')
  const [deviceInfo, setDeviceInfo] = useState(getDeviceInfo())
  const [isStandalone, setIsStandalone] = useState(false)

  // Evaluation of display conditions
  const evaluatePopupEligibility = useCallback(async () => {
    // 1. Strict env check: only when strictly equals string "true"
    if (!isWebPushPopupEnabled()) {
      return
    }

    // 2. User must be authenticated
    if (!isAuthenticated) {
      return
    }

    // 3. User must not have dismissed popup in this session
    if (isPopupDismissedInSession()) {
      return
    }

    // 4. Browser must support Web Push
    if (!isWebPushSupported()) {
      return
    }

    // 5. Check if already subscribed
    const isSubscribed = await checkIsDeviceSubscribed()
    if (isSubscribed) {
      return
    }

    // Determine device info and standalone mode
    const info = getDeviceInfo()
    const standalone = isStandaloneMode()

    setDeviceInfo(info)
    setIsStandalone(standalone)

    if (info.platform === 'ios') {
      setActiveTab('ios')
    } else if (info.platform === 'android') {
      setActiveTab('android')
    } else {
      setActiveTab('desktop')
    }

    // Delay slightly after login so UI renders smoothly
    const timer = setTimeout(() => {
      setOpen(true)
    }, 1200)

    return () => clearTimeout(timer)
  }, [isAuthenticated])

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      evaluatePopupEligibility()
    }
  }, [isInitialized, isAuthenticated, evaluatePopupEligibility])

  // Handle "Bật thông báo"
  const handleEnablePush = async () => {
    setLoading(true)
    setErrorMessage(null)

    // For iOS, if not running in standalone mode, guide user to add to home screen first
    if (deviceInfo.platform === 'ios' && !isStandalone) {
      setLoading(false)
      setShowGuide(true)
      setActiveTab('ios')
      setErrorMessage(
        'Trên iPhone/iPad, vui lòng làm theo hướng dẫn bên dưới để "Thêm vào Màn hình chính" trước khi bật thông báo.'
      )
      return
    }

    try {
      const result = await subscribeDeviceToPush()
      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          setOpen(false)
        }, 2500)
      } else {
        setErrorMessage(result.message)
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi bật thông báo.')
    } finally {
      setLoading(false)
    }
  }

  // Handle "Để sau"
  const handleDismissLater = () => {
    setPopupDismissedInSession()
    setOpen(false)
  }

  if (!open) return null

  return (
    <Dialog
      open={open}
      onClose={handleDismissLater}
      maxWidth='sm'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              width: 44,
              height: 44
            }}
          >
            <i className='ri-notification-3-line' style={{ fontSize: '1.5rem' }} />
          </Avatar>
          <Box>
            <Typography variant='h6' fontWeight={700}>
              Nhận thông báo từ CMIS
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              Tấn Đạt Taekwondo Club
            </Typography>
          </Box>
        </Box>
        <IconButton size='small' onClick={handleDismissLater} disabled={loading}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {success ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                bgcolor: 'success.light',
                color: 'success.main',
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2
              }}
            >
              <i className='ri-checkbox-circle-fill' style={{ fontSize: '2.5rem' }} />
            </Avatar>
            <Typography variant='h6' color='success.main' fontWeight={700} gutterBottom>
              Thiết lập thành công!
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Thiết bị của bạn đã được kết nối để nhận các thông báo quan trọng về lịch học, điểm danh và học phí.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant='body2' color='text.secondary'>
              Bật thông báo để nhận các thông báo quan trọng từ câu lạc bộ <strong>đã đóng website</strong> hoặc{' '}
              <strong>không mở trình duyệt</strong>.
            </Typography>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: '1px dashed',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <i
                  className={
                    deviceInfo.platform === 'ios'
                      ? 'ri-apple-fill'
                      : deviceInfo.platform === 'android'
                        ? 'ri-android-fill'
                        : 'ri-computer-line'
                  }
                  style={{ fontSize: '1.6rem', color: theme.palette.primary.main }}
                />
                <Box>
                  <Typography variant='body2' fontWeight={600}>
                    {deviceInfo.deviceName} • {deviceInfo.browserName}
                  </Typography>
                  {/*<Typography variant='caption' color='text.secondary'>*/}
                  {/*  {deviceInfo.platform === 'ios'*/}
                  {/*    ? isStandalone*/}
                  {/*      ? 'Chế độ Ứng dụng màn hình chính'*/}
                  {/*      : 'Yêu cầu thêm vào Màn hình chính'*/}
                  {/*    : 'Hỗ trợ Web Push trực tiếp'}*/}
                  {/*</Typography>*/}
                </Box>
              </Box>
              <Chip
                size='small'
                label={deviceInfo.platform === 'ios' && !isStandalone ? 'Cần thao tác' : 'Sẵn sàng'}
                color={deviceInfo.platform === 'ios' && !isStandalone ? 'warning' : 'primary'}
                variant='tonal'
              />
            </Box>

            {errorMessage && (
              <Alert severity='warning' sx={{ mt: 1 }}>
                {errorMessage}
              </Alert>
            )}

            {/* Expandable Guide */}
            <Box>
              <Button
                size='small'
                variant='text'
                color='secondary'
                onClick={() => setShowGuide(prev => !prev)}
                startIcon={<i className={showGuide ? 'ri-arrow-up-s-line' : 'ri-question-line'} />}
                sx={{ px: 0, textTransform: 'none' }}
              >
                {showGuide ? 'Ẩn hướng dẫn chi tiết' : 'Xem hướng dẫn theo từng thiết bị'}
              </Button>

              <Collapse in={showGuide}>
                <Box
                  sx={{
                    mt: 1.5,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Tabs
                    value={activeTab}
                    onChange={(_, val) => setActiveTab(val)}
                    variant='fullWidth'
                    sx={{ minHeight: 36, mb: 2 }}
                  >
                    <Tab value='desktop' label='Máy tính' sx={{ minHeight: 36, py: 0.5, fontSize: '0.8rem' }} />
                    <Tab value='android' label='Android' sx={{ minHeight: 36, py: 0.5, fontSize: '0.8rem' }} />
                    <Tab value='ios' label='iPhone / iPad' sx={{ minHeight: 36, py: 0.5, fontSize: '0.8rem' }} />
                  </Tabs>

                  {activeTab === 'desktop' && (
                    <Box
                      sx={{
                        fontSize: '0.85rem',
                        color: 'text.secondary',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                      }}
                    >
                      <Typography variant='body2' fontWeight={600} color='text.primary'>
                        Hướng dẫn trên máy tính (Chrome, Edge, Firefox):
                      </Typography>
                      <div>
                        1. Bấm nút <strong>"Bật thông báo"</strong> bên dưới.
                      </div>
                      <div>
                        2. Trình duyệt sẽ hiển thị hộp thoại hỏi{' '}
                        <em>"{window?.location?.hostname || 'Website'} muốn gửi thông báo cho bạn"</em>.
                      </div>
                      <div>
                        3. Chọn <strong>"Cho phép" (Allow)</strong> để hoàn tất.
                      </div>
                    </Box>
                  )}

                  {activeTab === 'android' && (
                    <Box
                      sx={{
                        fontSize: '0.85rem',
                        color: 'text.secondary',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                      }}
                    >
                      <Typography variant='body2' fontWeight={600} color='text.primary'>
                        Hướng dẫn trên điện thoại Android:
                      </Typography>
                      <div>
                        1. Bấm nút <strong>"Bật thông báo"</strong> bên dưới.
                      </div>
                      <div>
                        2. Khi xuất hiện thông báo xin quyền ở dưới màn hình hoặc thanh địa chỉ, bấm{' '}
                        <strong>"Cho phép"</strong>.
                      </div>
                      <div>3. Không cần cài ứng dụng hay thêm vào màn hình chính.</div>
                    </Box>
                  )}

                  {activeTab === 'ios' && (
                    <Box
                      sx={{
                        fontSize: '0.85rem',
                        color: 'text.secondary',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1
                      }}
                    >
                      <Typography variant='body2' fontWeight={600} color='text.primary'>
                        Hướng dẫn trên iPhone/iPad (iOS 16.4 trở lên):
                      </Typography>
                      <div>
                        1. Mở website bằng trình duyệt <strong>Safari</strong>.
                      </div>
                      <div>
                        2. Bấm vào nút <strong>Chia sẻ (biểu tượng hình vuông có mũi tên hướng lên)</strong> ở thanh
                        công cụ Safari.
                      </div>
                      <div>
                        3. Cuộn xuống và chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.
                      </div>
                      <div>
                        4. Trở về màn hình chính, mở website từ biểu tượng <strong>CMIS</strong> vừa tạo.
                      </div>
                      <div>
                        5. Đăng nhập và bấm <strong>"Bật thông báo"</strong> để cấp quyền.
                      </div>


                      {/* Video hướng dẫn (YouTube Shorts - tỉ lệ dọc 9:16) */}
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          maxWidth: 315,
                          aspectRatio: '9 / 16',
                          mx: 'auto',
                          mt: 1,
                          borderRadius: 1,
                          overflow: 'hidden',
                          bgcolor: 'black'
                        }}
                      >
                        <iframe
                          src='https://www.youtube.com/embed/6_kJ7Lak2gQ?autoplay=1&mute=1&loop=1&playlist=6_kJ7Lak2gQ&rel=0&playsinline=1'
                          title='Video hướng dẫn iOS'
                          allow='autoplay; encrypted-media; picture-in-picture'
                          allowFullScreen
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 0
                          }}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1, justifyContent: 'space-between' }}>
        <Button
          variant='text'
          color='secondary'
          onClick={handleDismissLater}
          disabled={loading || success}
          sx={{ textTransform: 'none' }}
        >
          Để sau
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={handleEnablePush}
          disabled={loading || success}
          startIcon={
            loading ? <CircularProgress size={16} color='inherit' /> : <i className='ri-notification-3-line' />
          }
          sx={{ px: 3, textTransform: 'none', fontWeight: 600 }}
        >
          {loading ? 'Đang kích hoạt...' : 'Bật thông báo'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default WebPushOnboardingPopup
