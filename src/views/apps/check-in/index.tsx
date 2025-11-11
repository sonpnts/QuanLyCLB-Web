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
import attendanceService, { type CheckInRequest } from '@/services/attendanceService'

const CheckInView = () => {
  // States
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Hooks
  const { auth } = useAuth()
  const { showNotification } = useNotification()

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Request location permission - trả về location data hoặc null
  const requestLocation = useCallback(async (): Promise<{ latitude: number; longitude: number } | null> => {
    setIsRequestingLocation(true)
    setLocationError(null)
    setPermissionDenied(false)

    if (!navigator.geolocation) {
      const errorMsg = 'Trình duyệt của bạn không hỗ trợ định vị.'

      setLocationError(errorMsg)
      showNotification(errorMsg, 'error')
      setIsRequestingLocation(false)

      return null
    }

    // Try using Permissions API to detect status and trigger prompt if possible
    try {
      // If supported, check permission status first
      // Note: Some browsers may not support navigator.permissions
      // We still call geolocation API below to actually trigger the prompt
      if (typeof navigator.permissions !== 'undefined') {
        try {
          // @ts-ignore - TS cannot narrow names union here cleanly
          const status: PermissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName })

          if (status.state === 'denied') {
            // Still attempt a request (most browsers won't reprompt), then show guidance
          }
        } catch {}
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        })
      })

      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }

      setLocation(locationData)
      setPermissionDenied(false)
      showNotification('Đã lấy vị trí thành công.', 'success')
      setIsRequestingLocation(false)

      return locationData
    } catch (error: any) {
      let errorMessage = 'Không thể lấy vị trí.'

      if (error.code === 1) {
        // Permission denied - user từ chối quyền
        errorMessage = 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt trình duyệt và thử lại.'
        setPermissionDenied(true)
      } else if (error.code === 2) {
        errorMessage = 'Không thể xác định vị trí. Vui lòng kiểm tra kết nối mạng và thử lại.'
      } else if (error.code === 3) {
        errorMessage = 'Hết thời gian chờ khi lấy vị trí. Vui lòng thử lại.'
      }

      setLocationError(errorMessage)
      showNotification(errorMessage, 'error')
      setIsRequestingLocation(false)

      return null
    }
  }, [showNotification])

  // Handle check-in - tự động check và xin quyền trước khi điểm danh
  const handleCheckIn = useCallback(async () => {
    if (!auth?.user?.id) {
      showNotification('Bạn chưa đăng nhập.', 'error')

      return
    }

    // Nếu đã bị từ chối quyền trước đó, reset và thử lại
    if (permissionDenied) {
      setPermissionDenied(false)
      setLocationError(null)
    }

    // Tự động request location nếu chưa có hoặc đã bị từ chối
    let currentLocation = location

    if (!currentLocation || permissionDenied) {
      currentLocation = await requestLocation()

      // Nếu không được cấp quyền (user từ chối), thông báo lỗi và dừng
      if (!currentLocation) {
        // permissionDenied đã được set trong requestLocation
        // locationError đã được set và hiển thị
        return
      }
    }

    setIsCheckingIn(true)

    try {
      const checkInData: CheckInRequest = {
        userId: auth.user.id,
        checkedInAt: new Date().toISOString(),
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      }

      const response = await attendanceService.checkIn(checkInData)

      if (response.success) {
        showNotification('Điểm danh thành công!', 'success')

        // Giữ location để user có thể điểm danh lại nếu cần
      } else {
        showNotification(response.message || 'Điểm danh thất bại.', 'error')
      }
    } catch (error) {
      console.error('Error checking in:', error)
      showNotification('Đã có lỗi khi điểm danh.', 'error')
    } finally {
      setIsCheckingIn(false)
    }
  }, [auth?.user?.id, location, permissionDenied, requestLocation, showNotification])

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Grid container spacing={{ xs: 4, sm: 6 }}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader title='Điểm danh' className='p-4 sm:p-6' />
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

                {location && !permissionDenied && (
                  <Alert severity='success' className='mb-4'>
                    <Typography variant='body2' className='font-medium text-xs sm:text-sm'>
                      Vị trí đã được lấy thành công
                    </Typography>
                    <Typography variant='body2' color='text.secondary' className='text-xs sm:text-sm break-all'>
                      Kinh độ: {location.latitude.toFixed(6)}
                      <br />
                      Vĩ độ: {location.longitude.toFixed(6)}
                    </Typography>
                  </Alert>
                )}

                {/* Action Button - Tự động check và xin quyền */}
                <Box className='flex flex-col gap-3 sm:gap-4'>
                  <Button
                    variant='contained'
                    size='large'
                    onClick={handleCheckIn}
                    disabled={isCheckingIn || isRequestingLocation}
                    startIcon={
                      isCheckingIn || isRequestingLocation ? (
                        <CircularProgress size={20} color='inherit' />
                      ) : (
                        <i className='ri-checkbox-circle-line' />
                      )
                    }
                    fullWidth
                    sx={{
                      minHeight: { xs: '48px', sm: '56px' },
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    {isRequestingLocation ? 'Đang lấy vị trí...' : isCheckingIn ? 'Đang điểm danh...' : 'Điểm danh'}
                  </Button>
                </Box>
              </Box>

              {/* Instructions */}
              <Box className='mt-2 sm:mt-4 text-center w-full max-w-md px-2'>
                <Typography variant='body2' color='text.secondary' className='text-xs sm:text-sm'>
                  <i className='ri-information-line mr-1 sm:mr-2' />
                  {permissionDenied
                    ? 'Bạn đã từ chối quyền truy cập vị trí. Nhấn "Điểm danh" lại để thử yêu cầu quyền một lần nữa. Nếu vẫn không được, vui lòng cấp quyền trong cài đặt trình duyệt.'
                    : 'Khi nhấn "Điểm danh", hệ thống sẽ tự động kiểm tra và yêu cầu quyền truy cập vị trí nếu chưa có. Vị trí sẽ được gửi kèm theo khi bạn điểm danh.'}
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
