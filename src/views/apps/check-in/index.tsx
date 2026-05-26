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
import AlertTitle from '@mui/material/AlertTitle'

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
    await refreshLocationPermissionState()

    if (!navigator.geolocation) {
      updateLocationError('Trình duyệt của bạn không hỗ trợ định vị. Vui lòng mở bằng Chrome hoặc Safari mới nhất.')
      setLocationPermissionState('unsupported')
      setIsRequestingLocation(false)

      return null
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      updateLocationError('Trình duyệt đang chặn quyền vị trí vì trang chưa chạy ở chế độ an toàn (HTTPS hoặc localhost).')
      setLocationPermissionState('unsupported')
      setIsRequestingLocation(false)

      return null
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
          `Vị trí chưa đủ chính xác (${isFinite(accuracy) ? `${Math.round(accuracy)}m` : 'không xác định'}). Vui lòng bật GPS chính xác, Wi-Fi hoặc di chuyển ra nơi thoáng hơn rồi thử lại.`
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
        errorMessage =
          'Trình duyệt đang chưa được cấp quyền vị trí. Vui lòng bật quyền vị trí của trình duyệt rồi thử lại.'
        setPermissionDenied(true)
        setLocationPermissionState('denied')
      } else if (error?.code === 2 || error?.name === 'PositionUnavailable') {
        errorMessage = 'Thiết bị chưa xác định được vị trí. Vui lòng kiểm tra GPS, Wi-Fi hoặc mạng di động rồi thử lại.'
      } else if (error?.code === 3 || error?.name === 'TimeoutError') {
        errorMessage = 'Hết thời gian chờ lấy vị trí. Vui lòng đứng ở nơi sóng tốt hơn và thử lại.'
      } else if (error?.message) {
        errorMessage = `Lỗi khi lấy vị trí: ${error.message}`
      }

      updateLocationError(errorMessage)
      setIsRequestingLocation(false)

      return null
    }
  }, [refreshLocationPermissionState, updateLocationError])

  const handlePrepareLocation = useCallback(async () => {
    setPendingAction('prepare')

    const currentLocation = await requestLocation()

    if (currentLocation) {
      showNotification('Đã lấy vị trí thành công. Bạn có thể chấm công ngay bây giờ.', 'success')
    } else {
      showNotification(
        locationErrorRef.current ?? 'Vui lòng bật quyền vị trí của trình duyệt rồi thử lại.',
        permissionDenied ? 'warning' : 'error'
      )
    }

    setPendingAction(null)
  }, [permissionDenied, requestLocation, showNotification])

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
        <Card>
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
                    <AlertTitle className='font-semibold'>Không thể yêu cầu quyền vị trí</AlertTitle>
                    Trình duyệt chỉ cho phép lấy vị trí trên trang an toàn như HTTPS hoặc localhost. Nếu đang mở bằng link
                    lạ trong Zalo/Facebook, vui lòng mở lại bằng Chrome hoặc Safari.
                  </Alert>
                )}

                {locationPermissionState === 'denied' && (
                  <Alert severity='warning' className='mb-4 text-xs sm:text-sm'>
                    <AlertTitle className='font-semibold'>Vui lòng bật quyền vị trí của trình duyệt</AlertTitle>
                    Trên điện thoại, hãy bấm biểu tượng ổ khóa hoặc menu cạnh thanh địa chỉ, tìm mục <strong>Vị trí</strong>{' '}
                    và chọn <strong>Cho phép</strong>, sau đó quay lại trang này để thử lại.
                  </Alert>
                )}

                {(locationPermissionState === 'prompt' || locationPermissionState === 'unknown') && !locationError && (
                  <Alert severity='info' className='mb-4 text-xs sm:text-sm'>
                    Nếu điện thoại chưa hiện yêu cầu quyền vị trí, hãy bấm <strong>Kiểm tra / bật quyền vị trí</strong> ở
                    dưới để trình duyệt mở lại yêu cầu quyền.
                  </Alert>
                )}

                {locationError && (
                  <Alert severity={permissionDenied ? 'error' : 'warning'} className='mb-4 text-xs sm:text-sm'>
                    {locationError}
                  </Alert>
                )}

                {location && !locationError && (
                  <Alert severity='success' className='mb-4'>
                    <Typography variant='body2' className='font-medium text-xs sm:text-sm'>
                      Vị trí GPS sẵn sàng để gửi
                    </Typography>
                    <Typography variant='body2' color='text.secondary' className='text-xs sm:text-sm break-all'>
                      Latitude: {location.latitude.toFixed(6)}
                      <br />
                      Longitude: {location.longitude.toFixed(6)}
                    </Typography>
                  </Alert>
                )}

                <Box className='flex flex-col gap-3 sm:gap-4'>
                  <Button
                    variant='outlined'
                    color='info'
                    size='large'
                    onClick={handlePrepareLocation}
                    disabled={isCheckingIn || isCheckingOut || isRequestingLocation}
                    startIcon={
                      isRequestingLocation && pendingAction === 'prepare' ? (
                        <CircularProgress size={20} color='inherit' />
                      ) : (
                        <i className='ri-map-pin-user-line' />
                      )
                    }
                    fullWidth
                    sx={{
                      minHeight: { xs: '48px', sm: '56px' },
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    {isRequestingLocation && pendingAction === 'prepare'
                      ? 'Đang kiểm tra quyền vị trí...'
                      : 'Kiểm tra / bật quyền vị trí'}
                  </Button>

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
                      minHeight: { xs: '48px', sm: '56px' },
                      fontSize: { xs: '0.875rem', sm: '1rem' }
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
                      minHeight: { xs: '48px', sm: '56px' },
                      fontSize: { xs: '0.875rem', sm: '1rem' }
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

              <Box className='mt-2 sm:mt-4 text-center w-full max-w-md px-2'>
                <Typography variant='body2' color='text.secondary' className='text-xs sm:text-sm'>
                  <i className='ri-information-line mr-1 sm:mr-2' />
                  {locationPermissionState === 'denied'
                    ? 'Trình duyệt đang chặn quyền vị trí. Sau khi bật lại quyền vị trí trong cài đặt trình duyệt, hãy quay lại và thử chấm công lại.'
                    : `Khi chấm công, hệ thống vẫn dùng logic cũ: lấy GPS hiện tại và chỉ gửi khi độ chính xác nhỏ hơn hoặc bằng ${MAX_ACCEPTABLE_ACCURACY}m.`}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default CheckInView
