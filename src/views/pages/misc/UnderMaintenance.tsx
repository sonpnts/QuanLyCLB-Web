'use client'

// React Imports
import { useEffect, useState, useCallback, useRef } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'

// Type Imports
import type { Mode } from '@core/types'

// Component Imports
import Illustrations from '@components/Illustrations'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'

// Util Imports
import { pingServer, redirectToDashboard, setMaintenanceMode } from '@/utils/connectionMonitor'

const PING_INTERVAL_MS = 5000

const UnderMaintenance = ({ mode }: { mode: Mode }) => {
  const [isPinging, setIsPinging] = useState(false)
  const [serverOnline, setServerOnline] = useState<boolean | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const darkImg = '/images/pages/misc-mask-dark.png'
  const lightImg = '/images/pages/misc-mask-light.png'
  const miscBackground = useImageVariant(mode, lightImg, darkImg)

  const checkServer = useCallback(async () => {
    setIsPinging(true)
    try {
      const ok = await pingServer(8000)
      setServerOnline(ok)

      if (ok) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        setTimeout(() => redirectToDashboard(), 800)
      }
    } catch {
      setServerOnline(false)
    } finally {
      setIsPinging(false)
    }
  }, [])

  useEffect(() => {
    setMaintenanceMode(true)
    checkServer()

    intervalRef.current = setInterval(checkServer, PING_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkServer])

  const statusLabel = serverOnline === null ? 'Đang kiểm tra...' : serverOnline ? 'Máy chủ hoạt động' : 'Máy chủ ngoại tuyến'
  const statusColor = serverOnline === null ? 'default' : serverOnline ? 'success' : 'error'

  return (
    <div className='flex items-center justify-center min-bs-[100dvh] relative p-6 overflow-x-hidden'>
      <div className='flex items-center flex-col text-center gap-6'>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: -2
          }}
        >
          <Chip
            label={statusLabel}
            color={statusColor as any}
            size='small'
            variant='outlined'
            sx={{ fontWeight: 600 }}
          />
          {isPinging && <CircularProgress size={16} />}
        </Box>

        <div className='flex flex-col gap-2 is-[90vw] sm:is-[unset]'>
          <Typography variant='h4'>Hệ thống đang bảo trì! 🚧</Typography>
          <Typography>Máy chủ đang ngoại tuyến. Hệ thống sẽ tự động quay lại trang chủ khi kết nối được khôi phục.</Typography>
        </div>

        <img
          alt='maintenance-illustration'
          src='/images/illustrations/characters/6.png'
          className='object-cover bs-[300px] md:bs-[350px] lg:bs-[400px]'
        />

        <Button href={'/'} component={Link} variant='contained' size='large'>
          Về trang chủ
        </Button>
      </div>
      <Illustrations maskImg={{ src: miscBackground }} />
    </div>
  )
}

export default UnderMaintenance
