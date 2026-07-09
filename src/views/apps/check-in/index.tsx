'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

import Link from 'next/link'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'

import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'

import attendanceService, { type CheckInRequest, type CheckOutRequest } from '@/services/attendanceService'
import { getVietnamNow, toVietnamISOString, formatDateTimeVN } from '@/utils/dateTime'

const MAX_ACCEPTABLE_ACCURACY = 50

type LocationPermissionState = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported'

interface RecentAttendance {
  id: string
  checkedInAt: string
  latitude: number
  longitude: number
  attendanceType: number
  branchId: string | null
  branchName: string | null
  address: string | null
}

interface SuccessPopupData {
  open: boolean
  type: 'checkin' | 'checkout'
  time: string
  branchName: string | null
  latitude: number
  longitude: number
}

const mapAttendanceError = (code?: number, fallback?: string, type: 'checkin' | 'checkout' = 'checkin') => {
  if (code === 4100) return 'Bạn đang cách xa câu lạc bộ, vui lòng di chuyển lại gần và thử lại.'
  if (code === 4101) return 'Bạn cần chấm công ra ca trước trước khi chấm công vào ca mới.'
  if (code === 4102) return 'Không tìm thấy lượt chấm công vào để chấm công ra. Vui lòng chấm công vào trước.'

  return fallback || (type === 'checkin' ? 'Chấm công vào thất bại.' : 'Chấm công ra thất bại.')
}

const AttendanceType = {
  CheckIn: 0,
  CheckOut: 1
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

  const [recentAttendances, setRecentAttendances] = useState<RecentAttendance[]>([])
  const [loadingRecent, setLoadingRecent] = useState(false)

  const [successPopup, setSuccessPopup] = useState<SuccessPopupData>({
    open: false,
    type: 'checkin',
    time: '',
    branchName: null,
    latitude: 0,
    longitude: 0
  })

  const updateLocationError = useCallback((message: string | null) => {
    locationErrorRef.current = message
    setLocationError(message)
  }, [])

  const loadRecentAttendances = useCallback(async () => {
    setLoadingRecent(true)
    try {
      const response = await attendanceService.getMyRecentAttendance(5)
      if (response.success && response.data) {
        setRecentAttendances(response.data)
      }
    } catch {
    } finally {
      setLoadingRecent(false)
    }
  }, [])

  useEffect(() => {
    loadRecentAttendances()
  }, [loadRecentAttendances])

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
        setSuccessPopup({
          open: true,
          type: 'checkin',
          time: formatDateTimeVN(response.data?.checkedInAt || timestamp),
          branchName: response.data?.branchName || null,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        })
        setLocation(null)
        loadRecentAttendances()
      } else {
        showNotification(mapAttendanceError(response?.code, response?.message, 'checkin'), 'error')
      }
    } catch {
      showNotification('Đã có lỗi khi chấm công vào.', 'error')
    } finally {
      setIsCheckingIn(false)
      setPendingAction(null)
    }
  }, [currentTime, requestLocation, showNotification, updateLocationError, userId, loadRecentAttendances])

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
        setSuccessPopup({
          open: true,
          type: 'checkout',
          time: formatDateTimeVN(response.data?.checkedOutAt || timestamp),
          branchName: response.data?.branchName || null,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        })
        setLocation(null)
        loadRecentAttendances()
      } else {
        showNotification(mapAttendanceError(response?.code, response?.message, 'checkout'), 'error')
      }
    } catch {
      showNotification('Đã có lỗi khi chấm công ra.', 'error')
    } finally {
      setIsCheckingOut(false)
      setPendingAction(null)
    }
  }, [currentTime, requestLocation, showNotification, updateLocationError, userId, loadRecentAttendances])

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

  const formatRecordTime = (value: string) => formatDateTimeVN(value)

  const isLatestIncompleteCheckIn = useCallback(() => {
    if (recentAttendances.length === 0) return false
    const latest = recentAttendances[0]
    return latest.attendanceType === AttendanceType.CheckIn
  }, [recentAttendances])

  return (
    <>
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

                  {isLatestIncompleteCheckIn() && (
                    <Alert severity='info' className='mb-4 text-xs sm:text-sm'>
                      Bạn đang có lượt chấm công vào chưa hoàn thành. Vui lòng chấm công ra trước khi chấm công vào mới.
                    </Alert>
                  )}

                  <Box className='flex flex-col gap-3 sm:gap-4'>
                    <Button
                      variant='contained'
                      color='primary'
                      size='large'
                      onClick={handleCheckIn}
                      disabled={isCheckingIn || isCheckingOut || isRequestingLocation || isLatestIncompleteCheckIn()}
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
                      disabled={isCheckingIn || isCheckingOut || isRequestingLocation || !isLatestIncompleteCheckIn()}
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

                    <Button
                      component={Link}
                      href='/apps/attendance/instructor-history'
                      variant='outlined'
                      size='large'
                      fullWidth
                      startIcon={<i className='ri-history-line' />}
                      sx={{
                        minHeight: { xs: '48px', sm: '56px' },
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      Xem lịch sử chấm công
                    </Button>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader title='5 lượt chấm công gần nhất' className='p-4 sm:p-6' />
            <CardContent className='p-4 sm:p-6'>
              {loadingRecent ? (
                <Box className='flex items-center justify-center py-6'>
                  <CircularProgress size={24} />
                </Box>
              ) : recentAttendances.length === 0 ? (
                <Typography color='text.secondary' textAlign='center' py={2}>
                  Chưa có lượt chấm công nào.
                </Typography>
              ) : (
                <div className='overflow-x-auto'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>STT</TableCell>
                        <TableCell>Loại</TableCell>
                        <TableCell>Thời gian</TableCell>
                        <TableCell>Địa điểm</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentAttendances.map((record, index) => (
                        <TableRow key={record.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Chip
                              label={record.attendanceType === AttendanceType.CheckIn ? 'Vào' : 'Ra'}
                              color={record.attendanceType === AttendanceType.CheckIn ? 'primary' : 'secondary'}
                              size='small'
                              variant='tonal'
                            />
                          </TableCell>
                          <TableCell>{formatRecordTime(record.checkedInAt)}</TableCell>
                          <TableCell>
                            <Tooltip title={record.branchName || 'Không xác định'}>
                              <Typography variant='body2' noWrap sx={{ maxWidth: 200 }}>
                                {record.branchName || 'Không xác định'}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={successPopup.open} onClose={() => setSuccessPopup(prev => ({ ...prev, open: false }))} maxWidth='sm' fullWidth>
        <DialogTitle>
          <Stack direction='row' alignItems='center' spacing={1}>
            <i
              className='ri-check-line'
              style={{ fontSize: 24, color: successPopup.type === 'checkin' ? '#4caf50' : '#2196f3' }}
            />
            <Typography variant='h6'>
              {successPopup.type === 'checkin' ? 'Chấm công vào thành công!' : 'Chấm công ra thành công!'}
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Divider sx={{ mb: 3 }} />
          <Stack spacing={2}>
            <Box>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Thời gian
              </Typography>
              <Typography variant='body1' fontWeight={600}>
                {successPopup.time}
              </Typography>
            </Box>

            <Box>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Cơ sở
              </Typography>
              <Typography variant='body1' fontWeight={600}>
                {successPopup.branchName || 'Không xác định'}
              </Typography>
            </Box>

            <Box>
              <Typography variant='body2' color='text.secondary' gutterBottom>
                Vị trí
              </Typography>
              <Typography variant='body2'>
                Vĩ độ: {successPopup.latitude.toFixed(6)}, Kinh độ: {successPopup.longitude.toFixed(6)}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setSuccessPopup(prev => ({ ...prev, open: false }))}
            variant='contained'
            autoFocus
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default CheckInView
