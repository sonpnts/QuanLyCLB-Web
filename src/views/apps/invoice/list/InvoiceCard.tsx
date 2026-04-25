'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import CircularProgress from '@mui/material/CircularProgress'
import type { Theme } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import CustomAvatar from '@/@core/components/mui/Avatar'

// Type & Service Imports
import type { MonthlyReportType } from '@/types/apps/paymentTypes'
import paymentService from '@/services/paymentService'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

const InvoiceCard = () => {
  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const isBelowSmScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))
  const [report, setReport] = useState<MonthlyReportType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()

    paymentService
      .getMonthlyReport(now.getFullYear(), now.getMonth() + 1)
      .then(res => {
        if (res.success && res.data) setReport(res.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    {
      title: loading ? '…' : String(report?.paymentCount ?? 0),
      subtitle: 'Giao dịch tháng này',
      icon: 'ri-file-list-3-line'
    },
    {
      title: loading ? '…' : formatCurrency(report?.totalRevenue ?? 0),
      subtitle: 'Tổng doanh thu',
      icon: 'ri-wallet-line'
    },
    {
      title: loading ? '…' : formatCurrency(report?.totalTuition ?? 0),
      subtitle: 'Học phí',
      icon: 'ri-money-dollar-circle-line'
    },
    {
      title: loading ? '…' : formatCurrency(report?.totalExamFees ?? 0),
      subtitle: 'Lệ phí thi',
      icon: 'ri-shield-star-line'
    }
  ]

  return (
    <Card>
      <CardContent>
        {loading ? (
          <div className='flex justify-center p-4'>
            <CircularProgress size={24} />
          </div>
        ) : (
          <Grid container spacing={6}>
            {stats.map((item, index) => (
              <Grid
                size={{ xs: 12, sm: 6, md: 3 }}
                key={index}
                className='sm:[&:nth-of-type(odd)>div]:pie-6 sm:[&:nth-of-type(odd)>div]:border-ie md:[&:not(:last-child)>div]:pie-6 md:[&:not(:last-child)>div]:border-ie'
              >
                <div className='flex justify-between'>
                  <div className='flex flex-col'>
                    <Typography variant='h4'>{item.title}</Typography>
                    <Typography>{item.subtitle}</Typography>
                  </div>
                  <CustomAvatar variant='rounded' size={42}>
                    <i className={classnames('text-[26px]', item.icon)} />
                  </CustomAvatar>
                </div>
                {isBelowMdScreen && !isBelowSmScreen && index < stats.length - 2 && (
                  <Divider
                    className={classnames('mbs-6', {
                      'mie-6': index % 2 === 0
                    })}
                  />
                )}
                {isBelowSmScreen && index < stats.length - 1 && <Divider className='mbs-6' />}
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  )
}

export default InvoiceCard
