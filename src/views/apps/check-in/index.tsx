'use client'

// React Imports
import { useState, useEffect, useCallback, useRef } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

// Component Imports
import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'

// Service Imports
import attendanceService, { type CheckInRequest, type CheckOutRequest } from '@/services/attendanceService'
import { getVietnamNow, toVietnamISOString } from '@/utils/dateTime'

const MAX_ACCEPTABLE_ACCURACY = 50

type LocationPermissionState = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported'

const mapAttendanceError = (code?: number, fallback?: string, type: 'checkin' | 'checkout' = 'checkin') => {
  if (code === 4100) return 'Bạn đang cách xa câu lạc bộ, vui lòng di chuyển lại gần và thử lại.'
  if (code === 4101) return 'Bạn cần chấm công ra ca trước trước khi chấm công vào ca mới.'
  if (code === 4102) return 'Không tìm thấy lượt chấm công vào để chấm công ra. Vui lòng chấm công vào trước.'

  return fallback || (type === 'checkin' ? 'Chấm công vào thất bại.' : 'Chấm công ra thất bại.')
}

const CheckInView = () => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()
  const userId = auth?.user?.id ?? null

  const [currentTime, setCurrentTime] = useState<Date>(getVietnamNow())
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [pendingAction, setPendingAction] = useState<'checkin' | 'checkout' | 'prepare' | null>(null)
  const [locationPermissionState, setLocationPermissionState] = useState<LocationPermissionState>('unknown')
  const [isSecureContextReady, setIsSecureContextReady] = useState(true)
  const locationErrorRef = useRef<string | null>(null)

  const updateLocationError = useCallback((message: string | null) => {
    locationErrorRef.current = message
    setLocationError(message)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getVietnamNow())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const refreshLocationPermissionState = useCallback(async () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return
    }

    const hasSecureContext = window.isSecureContext

    setIsSecureContextReady(hasSecureContext)

    if (!navigator.geolocation) {
      setLocationPermissionState('unsupported')

      return
    }

    if (!hasSecureContext) {
      setLocationPermissionState('unsupported')

      return
    }

    if (!navigator.permissions?.query) {
      setLocationPermissionState(previous => (previous === 'denied' || previous === 'granted' ? previous : 'unknown'))

      return
    }

    try {
      const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName })

      setLocationPermissionState(status.state as LocationPermissionState)
    } catch {
      setLocationPermissionState(previous => (previous === 'denied' || previous === 'granted' ? previous : 'unknown'))
    }
  }, [])

  useEffect(() => {
    refreshLocationPermissionState()

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void refreshLocationPermissionState()
      }
    }

    const handleFocus = () => {
      void refreshLocationPermissionState()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refreshLocationPermissionState])

  const requestLocation = useCallback(async (): Promise<{ latitude: number; longitude: number; accuracy: number } | null> => {
    setIsRequestingLocation(true)
    updateLocationError(null)
    setPermissionDenied(false)

    if (!navigator.geolocation) {
      updateLocationError('Trình duyệt của bạn không hỗ trợ định vị. Vui lòng mở bằng Chrome hoặc Safari mới nhất.')
      setLocationPermissionState('unsupported')
      setIsRequestingLocation(false)

      return null
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      updateLocationError('Trang chưa chạy ở chế độ an toàn (HTTPS). Vui lòng truy cập lại qua HTTPS.')
      setLocationPermissionState('unsupported')
      setIsRequestingLocation(false)

      return null
    }

    let permissionState: LocationPermissionState = 'unknown'

    if (navigator.permissions?.query) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName })

        permissionState = status.state as LocationPermissionState
        setLocationPermissionState(permissionState)

        if (permissionState === 'denied') {
          updateLocationError(
            'Trình duyệt đang chặn quyền vị trí. Vui lòng mở Cài đặt trình duyệt → Vị trí → Cho phép, sau đó tải lại trang.'
          )
          setPermissionDenied(true)
          setIsRequestingLocation(false)

          return null
        }
      } catch {
        // navigator.permissions.query không hỗ trợ trên một số mobile browser
        // Tiếp tục gọi getCurrentPosition để trigger prompt
      }
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        })
      })

      const accuracy = position.coords.accuracy ?? Infinity

      if (!isFinite(accuracy) || accuracy > MAX_ACCEPTABLE_ACCURACY) {
        updateLocationError(
          `Vị trí chưa đủ chính xác (${isFinite(accuracy) ? `${Math.round(accuracy)}m` : 'không xác định'}). Vui lòng tắt/mở lại GPS hoặc di chuyển ra nơi thoáng hơn rồi thử lại.`
        )
        setIsRequestingLocation(false)

        return null
      }

      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy
      }

      setLocation({ latitude: locationData.latitude, longitude: locationData.longitude })
      updateLocationError(null)
      setPermissionDenied(false)
      setLocationPermissionState('granted')
      setIsRequestingLocation(false)

      return locationData
    } catch (err: unknown) {
      let errorMessage = 'Không thể lấy vị trí hiện tại.'
      const error = err as { code?: number; name?: string; message?: string } | undefined

      if (error?.code === 1 || error?.name === 'PermissionDenied' || error?.name === 'NotAllowedError') {
        const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)

        errorMessage = isMobile
          ? 'Quyền vị trí chưa được cấp. Vui lòng vào Cài đặt trình duyệt → Vị trí → Cho phép, rồi tải lại trang này.'
          : 'Trình duyệt chưa được cấp quyền vị trí. Vui lòng bấm vào biểu tượng khóa 🔒 bên trái thanh địa chỉ, chọn "Cho phép" cho Vị trí, rồi tải lại trang.'
        setPermissionDenied(true)
        setLocationPermissionState('denied')
      } else if (error?.code === 2 || error?.name === 'PositionUnavailable') {
        errorMessage = 'Thiết bị chưa xác định được vị trí. Vui lòng bật GPS, Wi-Fi hoặc mạng di động rồi thử lại.'
      } else if (error?.code === 3 || error?.name === 'TimeoutError') {
        errorMessage = 'Hết thời gian chờ lấy vị trí. Vui lòng đứng ở nơi sóng tốt hơn và thử lại.'
      } else if (error?.message) {
        errorMessage = `Lỗi khi lấy vị trí: ${error.message}`
      }

      updateLocationError(errorMessage)
      setIsRequestingLocation(false)

      return null
    }
  }, [updateLocationError])

  const handleCheckIn = useCallback(async () => {
    if (!userId) {
      showNotification('Bạn chưa đăng nhập.', 'error')

      return
    }

    const timestamp = toVietnamISOString(currentTime)

    setPermissionDenied(false)
    updateLocationError(null)
    setPendingAction('checkin')

    const currentLocation = await requestLocation()

    if (!currentLocation) {
      showNotification(locationErrorRef.current ?? 'Không thể lấy vị trí GPS chính xác. Vui lòng thử lại.', 'error')
      setPendingAction(null)

      return
    }

    setIsCheckingIn(true)

    try {
      const checkInData: CheckInRequest = {
        checkedInAt: timestamp,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      }

      const response = await attendanceService.checkIn(checkInData)

      if (response?.success) {
        showNotification('Chấm công vào thành công!', 'success')
        setLocation(null)
      } else {
        showNotification(mapAttendanceError(response?.code, response?.message, 'checkin'), 'error')
      }
    } catch {
      showNotification('Đã có lỗi khi chấm công vào.', 'error')
    } finally {
      setIsCheckingIn(false)
      setPendingAction(null)
    }
  }, [currentTime, requestLocation, showNotification, updateLocationError, userId])

  const handleCheckOut = useCallback(async () => {
    if (!userId) {
      showNotification('Bạn chưa đăng nhập.', 'error')

      return
    }

    const timestamp = toVietnamISOString(currentTime)

    setPermissionDenied(false)
    updateLocationError(null)
    setPendingAction('checkout')

    const currentLocation = await requestLocation()

    if (!currentLocation) {
      showNotification(locationErrorRef.current ?? 'Không thể lấy vị trí GPS chính xác. Vui lòng thử lại.', 'error')
      setPendingAction(null)

      return
    }

    setIsCheckingOut(true)

    try {
      const checkOutData: CheckOutRequest = {
        checkedOutAt: timestamp,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      }

      const response = await attendanceService.checkOut(checkOutData)

      if (response?.success) {
        showNotification('Chấm công ra thành công!', 'success')
        setLocation(null)
      } else {
        showNotification(mapAttendanceError(response?.code, response?.message, 'checkout'), 'error')
      }
    } catch {
      showNotification('Đã có lỗi khi chấm công ra.', 'error')
    } finally {
      setIsCheckingOut(false)
      setPendingAction(null)
    }
  }, [currentTime, requestLocation, showNotification, updateLocationError, userId])

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

  const formatDate = (date: Date) =>
    date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

  return (
    <Grid container spacing={{ xs: 4, sm: 6 }}>
      <Grid size={{ xs: 12 }}>
        <Card sx={{ position: 'relative' }}>
          {isRequestingLocation && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                bgcolor: 'rgba(255,255,255,0.7)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                zIndex: 10,
                borderRadius: 1
              }}
            >
              <CircularProgress size={48} />
              <Typography variant='body2' color='text.secondary'>
                Đang lấy vị trí GPS...
              </Typography>
            </Box>
          )}
          <CardHeader title='Chấm công' className='p-4 sm:p-6' />
          <CardContent className='p-4 sm:p-6'>
            <Box className='flex flex-col items-center gap-4 sm:gap-6 py-4 sm:py-6'>
              <Box className='text-center w-full'>
                <Typography
                  variant='h4'
                  className='mb-2 font-bold text-3xl sm:text-4xl'
                  sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}
                >
                  {formatTime(currentTime)}
                </Typography>
                <Typography variant='body1' color='text.secondary' className='capitalize text-sm sm:text-base'>
                  {formatDate(currentTime)}
                </Typography>
              </Box>

              <Box className='w-full max-w-md'>
                {!isSecureContextReady && (
                  <Alert severity='error' className='mb-4 text-xs sm:text-sm'>
                    Trang chưa chạy HTTPS. Vui lòng truy cập lại qua HTTPS để chấm công.
                  </Alert>
                )}

                {locationError && (
                  <Alert severity={permissionDenied ? 'error' : 'warning'} className='mb-4 text-xs sm:text-sm'>
                    {locationError}
                  </Alert>
                )}

                {locationPermissionState === 'denied' && !locationError && (
                  <Alert severity='error' className='mb-4 text-xs sm:text-sm'>
                    Quyền vị trí bị chặn. Vui lòng vào cài đặt trình duyệt → Vị trí → Cho phép, rồi tải lại trang.
                  </Alert>
                )}

                <Box className='flex flex-col gap-3 sm:gap-4'>
                  <Button
                    variant='contained'
                    color='primary'
                    size='large'
                    onClick={handleCheckIn}
                    disabled={isCheckingIn || isCheckingOut || isRequestingLocation}
                    startIcon={
                      isCheckingIn || (isRequestingLocation && pendingAction === 'checkin') ? (
                        <CircularProgress size={20} color='inherit' />
                      ) : (
                        <i className='ri-login-circle-line' />
                      )
                    }
                    fullWidth
                    sx={{
                      minHeight: { xs: '56px', sm: '64px' },
                      fontSize: { xs: '1rem', sm: '1.125rem' }
                    }}
                  >
                    {isRequestingLocation && pendingAction === 'checkin'
                      ? 'Đang lấy vị trí...'
                      : isCheckingIn
                        ? 'Đang chấm công vào...'
                        : 'Chấm công vào'}
                  </Button>

                  <Button
                    variant='contained'
                    color='secondary'
                    size='large'
                    onClick={handleCheckOut}
                    disabled={isCheckingIn || isCheckingOut || isRequestingLocation}
                    startIcon={
                      isCheckingOut || (isRequestingLocation && pendingAction === 'checkout') ? (
                        <CircularProgress size={20} color='inherit' />
                      ) : (
                        <i className='ri-logout-circle-line' />
                      )
                    }
                    fullWidth
                    sx={{
                      minHeight: { xs: '56px', sm: '64px' },
                      fontSize: { xs: '1rem', sm: '1.125rem' }
                    }}
                  >
                    {isRequestingLocation && pendingAction === 'checkout'
                      ? 'Đang lấy vị trí...'
                      : isCheckingOut
                        ? 'Đang chấm công ra...'
                        : 'Chấm công ra'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default CheckInView
