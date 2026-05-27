'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

import { toast } from 'react-toastify'

import beltExamService from '@/services/beltExamService'
import type { ExamSessionType } from '@/types/apps/beltExamTypes'
import { examSessionStatusObj } from '@/types/apps/beltExamTypes'
import RegistrationListTable from './RegistrationListTable'
import AddStudentsDrawer from './AddStudentsDrawer'

const BeltExamDetails = ({ id }: { id: string }) => {
  const router = useRouter()
  const [session, setSession] = useState<ExamSessionType | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmitSession = async () => {
    if (!confirm('Bạn có chắc chắn muốn chốt danh sách thi? Những học viên CHƯA ĐÓNG LỆ PHÍ sẽ tự động bị loại khỏi danh sách.')) return

    setSubmitting(true)

    try {
      const res = await beltExamService.submitExamSession(id)

      if (res.success) {
        toast.success(res.message || 'Chốt danh sách thành công!')
        fetchSession()
        handleRefresh()
      } else {
        toast.error(res.message || 'Có lỗi xảy ra khi chốt danh sách.')
      }
    } catch (error) {
      console.error(error)
      toast.error('Lỗi kết nối máy chủ.')
    } finally {
      setSubmitting(false)
    }
  }

  const fetchSession = async () => {
    setLoading(true)

    try {
      const res = await beltExamService.getExamSessionById(id)

      if (res.success && res.data) {
        setSession(res.data)
      } else {
        router.replace('/apps/belt-exam')
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin kỳ thi:', error)
      router.replace('/apps/belt-exam')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, refreshTrigger])

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!session) return null

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title={<Typography variant='h5'>Kỳ thi: {session.name}</Typography>}
            action={
              <Box display='flex' gap={2}>
                <Chip
                  label={session.status}
                  color={examSessionStatusObj[session.status]}
                  variant='tonal'
                />
                {session.status === 'Draft' && (
                  <>
                    <Button variant='contained' onClick={() => setDrawerOpen(true)}>
                      <i className='ri-add-line' /> Thêm Võ sinh
                    </Button>
                    <Button variant='contained' color='success' disabled={submitting} onClick={handleSubmitSession}>
                      <i className='ri-check-line' /> {submitting ? 'Đang xử lý...' : 'Chốt Danh sách'}
                    </Button>
                  </>
                )}
                <Button variant='outlined' color='secondary' onClick={() => router.push('/apps/belt-exam')}>
                  Quay lại
                </Button>
              </Box>
            }
          />
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={4}>
                <Typography variant='body2' color='textSecondary'>Ngày thi</Typography>
                <Typography fontWeight={500}>{new Date(session.examDate).toLocaleDateString('vi-VN')}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant='body2' color='textSecondary'>Địa điểm</Typography>
                <Typography fontWeight={500}>{session.location || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant='body2' color='textSecondary'>Mô tả</Typography>
                <Typography fontWeight={500}>{session.description || '-'}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12}>
        <RegistrationListTable sessionId={id} sessionStatus={session.status} refreshTrigger={refreshTrigger} />
      </Grid>

      {session.status === 'Draft' && (
        <AddStudentsDrawer
          open={drawerOpen}
          handleClose={() => setDrawerOpen(false)}
          sessionId={id}
          onSuccess={handleRefresh}
        />
      )}
    </Grid>
  )
}

export default BeltExamDetails
