'use client'

// React Imports
import { logger } from '@/utils/logger'
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

const MAX_ACCEPTABLE_ACCURACY = 50 // meters; chá»‰nh theo yÃªu cáº§u (vÃ­ dá»¥ 20, 50, 100)

const mapAttendanceError = (code?: number, fallback?: string, type: 'checkin' | 'checkout' = 'checkin') => {
  if (code === 4100) return 'Báº¡n Ä‘ang cÃ¡ch xa cÃ¢u láº¡c bá»™, vui lÃ²ng di chuyá»ƒn láº¡i gáº§n vÃ  thá»­ láº¡i.'
  if (code === 4101) return 'Báº¡n cáº§n cháº¥m cÃ´ng ra ca trÆ°á»›c trÆ°á»›c khi cháº¥m cÃ´ng vÃ o ca má»›i.'
  if (code === 4102) return 'KhÃ´ng tÃ¬m tháº¥y lÆ°á»£t cháº¥m cÃ´ng vÃ o Ä‘á»ƒ cháº¥m cÃ´ng ra. Vui lÃ²ng cháº¥m cÃ´ng vÃ o trÆ°á»›c.'

  return fallback || (type === 'checkin' ? 'Cháº¥m cÃ´ng vÃ o tháº¥t báº¡i.' : 'Cháº¥m cÃ´ng ra tháº¥t báº¡i.')
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
        const errorMsg = 'TrÃ¬nh duyá»‡t cá»§a báº¡n khÃ´ng há»— trá»£ Ä‘á»‹nh vá»‹.'

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

        // Náº¿u khÃ´ng cÃ³ thÃ´ng tin accuracy hoáº·c accuracy quÃ¡ lá»›n thÃ¬ tá»« chá»‘i
        if (!isFinite(accuracy) || accuracy > MAX_ACCEPTABLE_ACCURACY) {
          const errMsg = `Vá»‹ trÃ­ khÃ´ng Ä‘á»§ chÃ­nh xÃ¡c (accuracy: ${
            isFinite(accuracy) ? Math.round(accuracy) + ' m' : 'khÃ´ng xÃ¡c Ä‘á»‹nh'
          }). Vui lÃ²ng báº­t GPS / Wi-Fi hoáº·c di chuyá»ƒn ra ngoÃ i trá»i vÃ  thá»­ láº¡i.`

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
        let errorMessage = 'KhÃ´ng thá»ƒ láº¥y vá»‹ trÃ­.'

        // Narrow unknown error
        const e = err as { code?: number; name?: string; message?: string } | undefined

        if (e?.code === 1 || e?.name === 'PermissionDenied' || e?.name === 'NotAllowedError') {
          errorMessage =
            'Báº¡n Ä‘Ã£ tá»« chá»‘i quyá»n truy cáº­p vá»‹ trÃ­. Vui lÃ²ng cáº¥p quyá»n trong cÃ i Ä‘áº·t trÃ¬nh duyá»‡t vÃ  thá»­ láº¡i.'
          setPermissionDenied(true)
        } else if (e?.code === 2 || e?.name === 'PositionUnavailable') {
          errorMessage = 'KhÃ´ng thá»ƒ xÃ¡c Ä‘á»‹nh vá»‹ trÃ­. Vui lÃ²ng kiá»ƒm tra GPS/thiáº¿t bá»‹ vÃ  thá»­ láº¡i.'
        } else if (e?.code === 3 || e?.name === 'TimeoutError') {
          errorMessage = 'Háº¿t thá»i gian chá» khi láº¥y vá»‹ trÃ­. Vui lÃ²ng thá»­ láº¡i.'
        } else if (e?.message) {
          errorMessage = `Lá»—i khi láº¥y vá»‹ trÃ­: ${e.message}`
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
      showNotification('Báº¡n chÆ°a Ä‘Äƒng nháº­p.', 'error')

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
      showNotification(locationError ?? 'KhÃ´ng thá»ƒ láº¥y vá»‹ trÃ­ GPS chÃ­nh xÃ¡c. Vui lÃ²ng thá»­ láº¡i.', 'error')
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
        showNotification('Cháº¥m cÃ´ng vÃ o thÃ nh cÃ´ng!', 'success')

        // Clear stored location after success (optionally)
        setLocation(null)
      } else {
        showNotification(mapAttendanceError(response?.code, response?.message, 'checkin'), 'error')
      }
    } catch (err: unknown) {
      // Prefer notifying user instead of console.error (lint)
      showNotification('ÄÃ£ cÃ³ lá»—i khi cháº¥m cÃ´ng vÃ o.', 'error')
    } finally {
      setIsCheckingIn(false)
      setPendingAction(null)
    }
  }, [userId, currentTime, requestLocation, showNotification, locationError])

  // Handle check-out
  const handleCheckOut = useCallback(async () => {
    if (!userId) {
      showNotification('Báº¡n chÆ°a Ä‘Äƒng nháº­p.', 'error')

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
      showNotification(locationError ?? 'KhÃ´ng thá»ƒ láº¥y vá»‹ trÃ­ GPS chÃ­nh xÃ¡c. Vui lÃ²ng thá»­ láº¡i.', 'error')
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
        showNotification('Cháº¥m cÃ´ng ra thÃ nh cÃ´ng!', 'success')
        setLocation(null)
      } else {
        showNotification(mapAttendanceError(response?.code, response?.message, 'checkout'), 'error')
      }
    } catch (err: unknown) {
      showNotification('ÄÃ£ cÃ³ lá»—i khi cháº¥m cÃ´ng ra.', 'error')
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
          <CardHeader title='Cháº¥m cÃ´ng' className='p-4 sm:p-6' />
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
                      Vá»‹ trÃ­ GPS sáºµn sÃ ng Ä‘á»ƒ gá»­i
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
                      ? 'Äang láº¥y vá»‹ trÃ­...'
                      : isCheckingIn
                        ? 'Äang cháº¥m cÃ´ng vÃ o...'
                        : 'Cháº¥m cÃ´ng vÃ o'}
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
                      ? 'Äang láº¥y vá»‹ trÃ­...'
                      : isCheckingOut
                        ? 'Äang cháº¥m cÃ´ng ra...'
                        : 'Cháº¥m cÃ´ng ra'}
                  </Button>
                </Box>
              </Box>

              {/* Instructions */}
              <Box className='mt-2 sm:mt-4 text-center w-full max-w-md px-2'>
                <Typography variant='body2' color='text.secondary' className='text-xs sm:text-sm'>
                  <i className='ri-information-line mr-1 sm:mr-2' />
                  {permissionDenied
                    ? 'Báº¡n Ä‘Ã£ tá»« chá»‘i quyá»n truy cáº­p vá»‹ trÃ­. Nháº¥n "Cháº¥m cÃ´ng" láº¡i Ä‘á»ƒ thá»­ yÃªu cáº§u quyá»n má»™t láº§n ná»¯a. Náº¿u váº«n khÃ´ng Ä‘Æ°á»£c, vui lÃ²ng cáº¥p quyá»n trong cÃ i Ä‘áº·t trÃ¬nh duyá»‡t.'
                    : `Khi nháº¥n "Cháº¥m cÃ´ng", há»‡ thá»‘ng sáº½ yÃªu cáº§u quyá»n truy cáº­p vá»‹ trÃ­ (chá»‰ cháº¥p nháº­n GPS/Wi-Fi). Vá»‹ trÃ­ pháº£i cÃ³ Ä‘á»™ chÃ­nh xÃ¡c â‰¤ ${MAX_ACCEPTABLE_ACCURACY}m Ä‘á»ƒ Ä‘Æ°á»£c gá»­i.`}
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
