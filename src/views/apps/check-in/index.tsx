'use client'

// React Imports
import { useState, useEffect, useCallback } from 'react'

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

const MAX_ACCEPTABLE_ACCURACY = 50 // meters; chỉnh theo yêu cầu (ví dụ 20, 50, 100)

const mapAttendanceError = (code?: number, fallback?: string, type: 'checkin' | 'checkout' = 'checkin') => {
  if (code === 4100) return 'Bạn đang cách xa câu lạc bộ, vui lòng di chuyển lại gần và thử lại.'
  if (code === 4101) return 'Bạn cần chấm công ra ca trước trước khi chấm công vào ca mới.'
  if (code === 4102) return 'Không tìm thấy lượt chấm công vào để chấm công ra. Vui lòng chấm công vào trước.'

  return fallback || (type === 'checkin' ? 'Chấm công vào thất bại.' : 'Chấm công ra thất bại.')
}

const CheckInView = () => {
  // Hooks / Context
  const { auth } = useAuth()
  const { showNotification } = useNotification()
  const userId = auth?.user?.id ?? null

  // States
  const [currentTime, setCurrentTime] = useState<Date>(getVietnamNow())
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [pendingAction, setPendingAction] = useState<'checkin' | 'checkout' | null>(null)

  // Update current time every second (Vietnam timezone)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getVietnamNow())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Request location permission and get position (strict: require accuracy <= MAX_ACCEPTABLE_ACCURACY)
  const requestLocation = useCallback(
    async (): Promise<{ latitude: number; longitude: number; accuracy: number } | null> => {
      setIsRequestingLocation(true)
      setLocationError(null)
      setPermissionDenied(false)

      if (!navigator.geolocation) {
        const errorMsg = 'Trình duyệt của bạn không hỗ trợ định vị.'

        setLocationError(errorMsg)
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

        // Nếu không có thông tin accuracy hoặc accuracy quá lớn thì từ chối
        if (!isFinite(accuracy) || accuracy > MAX_ACCEPTABLE_ACCURACY) {
          const errMsg = `Vị trí không đủ chính xác (accuracy: ${
            isFinite(accuracy) ? Math.round(accuracy) + ' m' : 'không xác định'
          }). Vui lòng bật GPS / Wi-Fi hoặc di chuyển ra ngoài trời và thử lại.`

          setLocationError(errMsg)
          setIsRequestingLocation(false)

          return null
        }

        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy
        }

        setLocation({ latitude: locationData.latitude, longitude: locationData.longitude })
        setLocationError(null)
        setPermissionDenied(false)
        setIsRequestingLocation(false)

        return locationData
      } catch (err: unknown) {
        let errorMessage = 'Không thể lấy vị trí.'

        // Narrow unknown error
        const e = err as { code?: number; name?: string; message?: string } | undefined

        if (e?.code === 1 || e?.name === 'PermissionDenied' || e?.name === 'NotAllowedError') {
          errorMessage =
            'Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt trình duyệt và thử lại.'
          setPermissionDenied(true)
        } else if (e?.code === 2 || e?.name === 'PositionUnavailable') {
          errorMessage = 'Không thể xác định vị trí. Vui lòng kiểm tra GPS/thiết bị và thử lại.'
        } else if (e?.code === 3 || e?.name === 'TimeoutError') {
          errorMessage = 'Hết thời gian chờ khi lấy vị trí. Vui lòng thử lại.'
        } else if (e?.message) {
          errorMessage = `Lỗi khi lấy vị trí: ${e.message}`
        }

        setLocationError(errorMessage)
        setIsRequestingLocation(false)

        return null
      }
    },
    [] // stable: no external deps required
  )

  // Handle check-in
  const handleCheckIn = useCallback(async () => {
    if (!userId) {
      showNotification('Bạn chưa đăng nhập.', 'error')

      return
    }

    // Capture the displayed current time immediately (snapshot) - Vietnam timezone
    const timestamp = toVietnamISOString(currentTime)

    // Reset states and mark pending action
    setPermissionDenied(false)
    setLocationError(null)
    setPendingAction('checkin')

    // Request location (strict)
    const currentLocation = await requestLocation()

    if (!currentLocation) {
      showNotification(locationError ?? 'Không thể lấy vị trí GPS chính xác. Vui lòng thử lại.', 'error')
      setPendingAction(null)

      return
    }

    setIsCheckingIn(true)

    try {
      const checkInData: CheckInRequest = {
        // userId is automatically extracted from JWT token by backend
        // Use the captured timestamp (value displayed to user) instead of new Date()
        checkedInAt: timestamp,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      }

      const response = await attendanceService.checkIn(checkInData)

      if (response?.success) {
        showNotification('Chấm công vào thành công!', 'success')

        // Clear stored location after success (optionally)
        setLocation(null)
      } else {
        showNotification(mapAttendanceError(response?.code, response?.message, 'checkin'), 'error')
      }
    } catch (err: unknown) {
      // Prefer notifying user instead of console.error (lint)
      showNotification('Đã có lỗi khi chấm công vào.', 'error')
    } finally {
      setIsCheckingIn(false)
      setPendingAction(null)
    }
  }, [userId, currentTime, requestLocation, showNotification, locationError])

  // Handle check-out
  const handleCheckOut = useCallback(async () => {
    if (!userId) {
      showNotification('Bạn chưa đăng nhập.', 'error')

      return
    }

    // Capture the displayed current time immediately (snapshot) - Vietnam timezone
    const timestamp = toVietnamISOString(currentTime)

    // Reset states and mark pending action
    setPermissionDenied(false)
    setLocationError(null)
    setPendingAction('checkout')

    // Request location (strict)
    const currentLocation = await requestLocation()

    if (!currentLocation) {
      showNotification(locationError ?? 'Không thể lấy vị trí GPS chính xác. Vui lòng thử lại.', 'error')
      setPendingAction(null)

      return
    }

    setIsCheckingOut(true)

    try {
      const checkOutData: CheckOutRequest = {
        // Use the captured timestamp (value displayed to user) - Vietnam timezone
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
    } catch (err: unknown) {
      showNotification('Đã có lỗi khi chấm công ra.', 'error')
    } finally {
      setIsCheckingOut(false)
      setPendingAction(null)
    }
  }, [userId, currentTime, requestLocation, showNotification, locationError])

  // Format time
  const formatTime = (date: Date) =>
    date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

  // Format date
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
              {/* Current Date and Time */}
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

              {/* Location Status */}
              <Box className='w-full max-w-md'>
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

                {/* Action Buttons */}
                <Box className='flex flex-col gap-3 sm:gap-4'>
                  {/* Check-in Button */}
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

                  {/* Check-out Button */}
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

              {/* Instructions */}
              <Box className='mt-2 sm:mt-4 text-center w-full max-w-md px-2'>
                <Typography variant='body2' color='text.secondary' className='text-xs sm:text-sm'>
                  <i className='ri-information-line mr-1 sm:mr-2' />
                  {permissionDenied
                    ? 'Bạn đã từ chối quyền truy cập vị trí. Nhấn "Chấm công" lại để thử yêu cầu quyền một lần nữa. Nếu vẫn không được, vui lòng cấp quyền trong cài đặt trình duyệt.'
                    : `Khi nhấn "Chấm công", hệ thống sẽ yêu cầu quyền truy cập vị trí (chỉ chấp nhận GPS/Wi-Fi). Vị trí phải có độ chính xác ≤ ${MAX_ACCEPTABLE_ACCURACY}m để được gửi.`}
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
