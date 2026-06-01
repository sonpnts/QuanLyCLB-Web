'use client'

import { useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'

import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import beltExamService from '@/services/beltExamService'
import type { ExamSessionType } from '@/types/apps/beltExamTypes'
import { examSessionStatusColors, examSessionStatusLabels } from '@/types/apps/beltExamTypes'

import BeltExamRegisterClassPanel from './BeltExamRegisterClassPanel'

const BeltExamRegisterView = () => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()
  const [sessions, setSessions] = useState<ExamSessionType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<ExamSessionType | null>(null)

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true)
        const result = await beltExamService.getOpenSessions()

        if (result.success) {
          setSessions(result.data || [])
        } else {
          showNotification(result.message || 'Không thể tải danh sách kỳ thi.', 'error')
        }
      } finally {
        setLoading(false)
      }
    }

    loadSessions()
  }, [showNotification])

  if (loading) {
    return (
      <Box className='flex justify-center items-center min-h-96'>
        <CircularProgress />
      </Box>
    )
  }

  if (selectedSession) {
    return (
      <BeltExamRegisterClassPanel
        session={selectedSession}
        coachId={auth?.user?.id ?? ''}
        onBack={() => setSelectedSession(null)}
      />
    )
  }

  return (
    <Box>
      <Typography variant='h5' className='mb-4'>
        Đăng ký thi cấp
      </Typography>

      {sessions.length === 0 ? (
        <Alert severity='info'>Hiện không có kỳ thi nào đang mở đăng ký.</Alert>
      ) : (
        <Grid container spacing={4}>
          {sessions.map(session => {
            const deadline = session.registrationDeadline ? new Date(session.registrationDeadline) : null
            const now = new Date()
            const daysLeft = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / 86400000) : null

            return (
              <Grid key={session.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card className='h-full flex flex-col'>
                  <CardHeader
                    title={session.name}
                    subheader={`Ngày thi: ${new Date(session.examDate).toLocaleDateString('vi-VN')}`}
                    action={
                      <Chip
                        label={examSessionStatusLabels[session.status] ?? session.status}
                        color={examSessionStatusColors[session.status] ?? 'default'}
                        size='small'
                        variant='tonal'
                      />
                    }
                  />
                  <CardContent className='flex flex-col gap-2 flex-1'>
                    {deadline && (
                      <Box className='flex items-center gap-2'>
                        <i className='ri-time-line' />
                        <Typography
                          variant='body2'
                          color={daysLeft !== null && daysLeft <= 3 ? 'error' : 'text.secondary'}
                        >
                          Hạn đăng ký: {deadline.toLocaleDateString('vi-VN')}
                          {daysLeft !== null && daysLeft >= 0 && <strong className='ml-1'>(còn {daysLeft} ngày)</strong>}
                          {daysLeft !== null && daysLeft < 0 && <strong className='ml-1 text-red-500'>Đã hết hạn</strong>}
                        </Typography>
                      </Box>
                    )}
                    {session.location && (
                      <Box className='flex items-center gap-2'>
                        <i className='ri-map-pin-line' />
                        <Typography variant='body2' color='text.secondary'>
                          {session.location}
                        </Typography>
                      </Box>
                    )}
                    <Box className='mt-auto pt-3'>
                      <Button
                        fullWidth
                        variant='contained'
                        onClick={() => setSelectedSession(session)}
                        disabled={daysLeft !== null && daysLeft < 0}
                      >
                        Đăng ký danh sách
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}
    </Box>
  )
}

export default BeltExamRegisterView
