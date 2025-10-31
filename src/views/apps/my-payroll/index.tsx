'use client'

// React Imports
import { useEffect, useState, useCallback } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'

// Service Imports
import payrollService from '@/services/payrollService'
import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'

const MyPayrollView = () => {
  // States
  const [payroll, setPayroll] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  // Hooks
  const { auth } = useAuth()
  const { showNotification } = useNotification()

  // Load latest payroll
  const loadPayroll = useCallback(async () => {
    if (!auth?.user?.id) return

    try {
      setLoading(true)
      // Get payrolls for the current user (coach)
      const response = await payrollService.getPayrollByCoach(auth.user.id)

      if (response.success && response.data) {
        // Get the latest payroll (most recent month)
        const payrolls = response.data
        if (payrolls && payrolls.length > 0) {
          // Sort by month/year descending and get the first one
          const sorted = payrolls.sort((a: any, b: any) => {
            // Sort by generated date or month/year
            const dateA = a.generatedAt || a.createdDate || ''
            const dateB = b.generatedAt || b.createdDate || ''
            return dateB.localeCompare(dateA)
          })
          setPayroll(sorted[0])
        }
      } else {
        showNotification(response.message || 'Không thể tải bảng lương.', 'error')
      }
    } catch (error) {
      console.error('Error loading payroll:', error)
      showNotification('Đã có lỗi khi tải bảng lương.', 'error')
    } finally {
      setLoading(false)
    }
  }, [auth?.user?.id, showNotification])

  useEffect(() => {
    loadPayroll()
  }, [loadPayroll])

  if (loading) {
    return (
      <Box className='flex items-center justify-center min-h-[400px]'>
        <CircularProgress />
      </Box>
    )
  }

  if (!payroll) {
    return (
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader title='Bảng lương' />
            <CardContent>
              <Box className='text-center py-12'>
                <i className='ri-money-dollar-circle-line text-6xl text-textDisabled mb-4' />
                <Typography variant='body1' color='text.secondary'>
                  Chưa có bảng lương nào
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '0'
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <Grid container spacing={{ xs: 4, sm: 6 }}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardHeader
            title='Bảng lương'
            subheader={`Tháng ${payroll.month}/${payroll.year}`}
            className='p-4 sm:p-6'
            subheaderTypographyProps={{
              className: 'text-xs sm:text-sm'
            }}
          />
          <CardContent className='p-4 sm:p-6'>
            <Box className='flex flex-col gap-4 sm:gap-6'>
              {/* Payroll Header Info */}
              <Box className='p-3 sm:p-4 border rounded bg-background'>
                <Grid container spacing={{ xs: 3, sm: 4 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant='body2' color='text.secondary' className='mb-1 text-xs sm:text-sm'>
                      Tháng/Năm
                    </Typography>
                    <Typography variant='h6' className='font-semibold text-base sm:text-lg'>
                      {payroll.month}/{payroll.year}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant='body2' color='text.secondary' className='mb-1 text-xs sm:text-sm'>
                      Ngày tạo
                    </Typography>
                    <Typography variant='body1' className='font-medium text-sm sm:text-base'>
                      {formatDate(payroll.generatedAt || payroll.createdDate)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Payroll Details */}
              <Box>
                <Typography variant='h6' className='mb-3 sm:mb-4 font-semibold text-base sm:text-lg'>
                  Chi tiết bảng lương
                </Typography>

                <Box className='flex flex-col gap-3 sm:gap-4'>
                  {/* Basic Salary Info */}
                  {payroll.totalHours !== undefined && (
                    <Box className='flex justify-between items-center p-3 border rounded'>
                      <Typography variant='body1' className='text-sm sm:text-base'>
                        Tổng số giờ:
                      </Typography>
                      <Typography variant='body1' className='font-medium text-sm sm:text-base'>
                        {payroll.totalHours} giờ
                      </Typography>
                    </Box>
                  )}

                  {payroll.totalSessions !== undefined && (
                    <Box className='flex justify-between items-center p-3 border rounded'>
                      <Typography variant='body1' className='text-sm sm:text-base'>
                        Tổng số buổi:
                      </Typography>
                      <Typography variant='body1' className='font-medium text-sm sm:text-base'>
                        {payroll.totalSessions} buổi
                      </Typography>
                    </Box>
                  )}

                  {payroll.hourlyRate !== undefined && (
                    <Box className='flex justify-between items-center p-3 border rounded'>
                      <Typography variant='body1' className='text-sm sm:text-base'>
                        Mức lương/giờ:
                      </Typography>
                      <Typography variant='body1' className='font-medium text-sm sm:text-base break-words text-right'>
                        {formatCurrency(payroll.hourlyRate)}
                      </Typography>
                    </Box>
                  )}

                  <Divider />

                  {/* Total Amount */}
                  <Box className='flex justify-between items-center p-3 sm:p-4 border rounded bg-primaryLight'>
                    <Typography variant='h6' className='font-semibold text-base sm:text-lg'>
                      Tổng lương:
                    </Typography>
                    <Typography
                      variant='h5'
                      className='font-bold text-primary text-lg sm:text-xl break-words text-right'
                    >
                      {formatCurrency(payroll.totalAmount)}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Additional Info */}
              {(payroll.notes || payroll.description) && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant='subtitle2' className='mb-2 font-medium text-sm sm:text-base'>
                      Ghi chú:
                    </Typography>
                    <Typography variant='body2' color='text.secondary' className='text-xs sm:text-sm break-words'>
                      {payroll.notes || payroll.description}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default MyPayrollView
