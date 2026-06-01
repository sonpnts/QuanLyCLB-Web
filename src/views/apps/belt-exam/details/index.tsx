'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

const BeltExamDetails = ({ id }: { id: string }) => {
  const router = useRouter()

  useEffect(() => {
    router.replace(`/apps/belt-exam/${id}/admin`)
  }, [id, router])

  return (
    <Box className='flex flex-col items-center justify-center gap-3 py-16'>
      <CircularProgress />
      <Typography color='text.secondary'>Đang chuyển sang màn quản lý kỳ thi.</Typography>
    </Box>
  )
}

export default BeltExamDetails
