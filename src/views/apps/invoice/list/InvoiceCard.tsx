'use client'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'

import classnames from 'classnames'

import CustomAvatar from '@/@core/components/mui/Avatar'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

type InvoiceSummary = {
  paymentCount: number
  totalRevenue: number
  totalTuition: number
  totalExamFees: number
}

type InvoiceStat = {
  title: string
  subtitle: string
  icon: string
}

type Props = {
  loading: boolean
  summary: InvoiceSummary
  dateFrom?: string
  dateTo?: string
  rangeLabel?: string
  stats?: InvoiceStat[]
}

const InvoiceCard = ({ loading, summary, dateFrom, dateTo, rangeLabel: customRangeLabel, stats: customStats }: Props) => {
  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'), { noSsr: true })
  const isBelowSmScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'), { noSsr: true })
  const rangeLabel = customRangeLabel || (dateFrom || dateTo ? `${dateFrom || '...'} - ${dateTo || '...'}` : 'Mới nhất')

  const defaultStats: InvoiceStat[] = [
    {
      title: loading ? '...' : String(summary.paymentCount),
      subtitle: dateFrom || dateTo ? 'Giao dịch trong khoảng' : 'Giao dịch mới nhất',
      icon: 'ri-file-list-3-line'
    },
    {
      title: loading ? '...' : formatCurrency(summary.totalRevenue),
      subtitle: 'Tổng doanh thu',
      icon: 'ri-wallet-line'
    },
    {
      title: loading ? '...' : formatCurrency(summary.totalTuition),
      subtitle: 'Học phí',
      icon: 'ri-money-dollar-circle-line'
    },
    {
      title: loading ? '...' : formatCurrency(summary.totalExamFees),
      subtitle: 'Lệ phí thi',
      icon: 'ri-shield-star-line'
    }
  ]

  const stats = customStats || defaultStats

  return (
    <Card>
      <CardContent>
        <Typography variant='body2' color='text.secondary' className='mbe-4'>
          {rangeLabel}
        </Typography>
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
