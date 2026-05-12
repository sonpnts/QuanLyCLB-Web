// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Type Imports
import type { PaymentRecordType } from '@/types/apps/paymentTypes'
import { paymentTypeLabels, paymentMethodLabels } from '@/types/apps/paymentTypes'
import { normalizePaymentMethod } from '@/utils/paymentMethod'
import { normalizePaymentType } from '@/utils/paymentType'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import './print.css'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

type Props = {
  items: PaymentRecordType[]
  receiptNumber: string
  loading: boolean
}

const PreviewCard = ({ items, receiptNumber, loading }: Props) => {
  if (loading) {
    return (
      <Card className='previewCard'>
        <CardContent className='sm:!p-12'>
          <Box display='flex' justifyContent='center' p={8}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card className='previewCard'>
        <CardContent className='sm:!p-12'>
          <Typography textAlign='center' color='text.secondary' p={6}>
            KhÃ´ng tÃ¬m tháº¥y biÃªn lai.
          </Typography>
        </CardContent>
      </Card>
    )
  }

  const firstItem = items[0]
  const totalAmount = items.reduce((sum, i) => sum + i.amount, 0)
  const totalDiscount = items.reduce((sum, i) => sum + (i.discountAmount ?? 0), 0)
  const originalTotal = items.reduce((sum, i) => sum + (i.originalAmount ?? i.amount), 0)

  return (
    <Card className='previewCard'>
      <CardContent className='sm:!p-12'>
        <Grid container spacing={6}>
          {/* Header */}
          <Grid size={{ xs: 12 }}>
            <div className='p-6 bg-actionHover rounded'>
              <div className='flex justify-between gap-y-4 flex-col sm:flex-row'>
                <div className='flex flex-col gap-4'>
                  <div className='flex items-center'>
                    <Logo />
                  </div>
                  <div>
                    <Typography color='text.primary' className='font-medium'>
                      CÃ¢u láº¡c bá»™
                    </Typography>
                    <Typography color='text.secondary' variant='body2'>
                      Há»‡ thá»‘ng quáº£n lÃ½ cÃ¢u láº¡c bá»™
                    </Typography>
                  </div>
                </div>
                <div className='flex flex-col gap-2'>
                  <Typography variant='h5' color='primary'>
                    BIÃŠN LAI THU TIá»€N
                  </Typography>
                  <Typography color='text.secondary' variant='body2'>
                    Sá»‘ biÃªn lai: <strong className='text-text-primary'>{receiptNumber}</strong>
                  </Typography>
                  <Typography color='text.secondary' variant='body2'>
                    NgÃ y thu: <strong className='text-text-primary'>{formatDateTime(firstItem.paymentDate)}</strong>
                  </Typography>
                  <Typography color='text.secondary' variant='body2'>
                    NgÆ°á»i thu: <strong className='text-text-primary'>{firstItem.collectedByUserName || 'â€”'}</strong>
                  </Typography>
                </div>
              </div>
            </div>
          </Grid>

          {/* Student & Payment Info */}
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <div className='flex flex-col gap-3'>
                  <Typography className='font-medium' color='text.primary'>
                    ThÃ´ng tin há»c viÃªn:
                  </Typography>
                  <div className='flex flex-col gap-1'>
                    <Typography>
                      <span className='text-textSecondary'>Há» tÃªn: </span>
                      <strong>{firstItem.studentName || 'â€”'}</strong>
                    </Typography>
                    {firstItem.className && (
                      <Typography>
                        <span className='text-textSecondary'>Lá»›p: </span>
                        {firstItem.className}
                      </Typography>
                    )}
                  </div>
                </div>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <div className='flex flex-col gap-3'>
                  <Typography className='font-medium' color='text.primary'>
                    ThÃ´ng tin thanh toÃ¡n:
                  </Typography>
                  <div className='flex flex-col gap-1'>
                    <Typography>
                      <span className='text-textSecondary'>PhÆ°Æ¡ng thá»©c: </span>
                      {paymentMethodLabels[normalizePaymentMethod(firstItem.method, 0)] ?? 'â€”'}
                    </Typography>
                    {firstItem.transactionRef && (
                      <Typography>
                        <span className='text-textSecondary'>MÃ£ GD: </span>
                        {firstItem.transactionRef}
                      </Typography>
                    )}
                  </div>
                </div>
              </Grid>
            </Grid>
          </Grid>

          {/* Items Table */}
          <Grid size={{ xs: 12 }}>
            <div className='overflow-x-auto border rounded'>
              <table className={tableStyles.table}>
                <thead>
                  <tr className='border-be'>
                    <th className='!bg-transparent'>MÃ´ táº£</th>
                    <th className='!bg-transparent'>Loáº¡i thu</th>
                    <th className='!bg-transparent text-right'>Sá»‘ tiá»n gá»‘c</th>
                    <th className='!bg-transparent text-right'>Giáº£m giÃ¡</th>
                    <th className='!bg-transparent text-right'>Thá»±c thu</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const desc =
                      item.description ||
                      (normalizePaymentType(item.type, 3) === 0 && item.forMonth && item.forYear
                        ? `Há»c phÃ­ thÃ¡ng ${item.forMonth}/${item.forYear}${item.className ? ` â€” ${item.className}` : ''}`
                        : normalizePaymentType(item.type, 3) === 1
                          ? `Lá»‡ phÃ­ thi cáº¥p${item.className ? ` â€” ${item.className}` : ''}`
                          : item.productName || paymentTypeLabels[normalizePaymentType(item.type, 3)])

                    return (
                      <tr key={item.id ?? idx}>
                        <td>
                          <Typography color='text.primary'>{desc}</Typography>
                        </td>
                        <td>
                          <Typography color='text.secondary'>{paymentTypeLabels[normalizePaymentType(item.type, 3)] ?? String(item.type)}</Typography>
                        </td>
                        <td className='text-right'>
                          <Typography color='text.secondary'>
                            {formatCurrency(item.originalAmount ?? item.amount)}
                          </Typography>
                        </td>
                        <td className='text-right'>
                          <Typography color={item.discountAmount ? 'error' : 'text.secondary'}>
                            {item.discountAmount ? `- ${formatCurrency(item.discountAmount)}` : 'â€”'}
                          </Typography>
                        </td>
                        <td className='text-right'>
                          <Typography color='text.primary' className='font-medium'>
                            {formatCurrency(item.amount)}
                          </Typography>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Grid>

          {/* Totals */}
          <Grid size={{ xs: 12 }}>
            <div className='flex justify-end'>
              <div className='min-is-[220px] flex flex-col gap-1'>
                {totalDiscount > 0 && (
                  <>
                    <div className='flex items-center justify-between'>
                      <Typography color='text.secondary'>Tá»•ng gá»‘c:</Typography>
                      <Typography color='text.primary'>{formatCurrency(originalTotal)}</Typography>
                    </div>
                    <div className='flex items-center justify-between'>
                      <Typography color='text.secondary'>Tá»•ng giáº£m:</Typography>
                      <Typography color='error'>- {formatCurrency(totalDiscount)}</Typography>
                    </div>
                    <Divider className='mlb-2' />
                  </>
                )}
                <div className='flex items-center justify-between'>
                  <Typography className='font-medium' color='text.primary'>
                    Tá»•ng thá»±c thu:
                  </Typography>
                  <Typography variant='h6' color='primary'>
                    {formatCurrency(totalAmount)}
                  </Typography>
                </div>
              </div>
            </div>
          </Grid>

          {/* Transfer proof image */}
          {firstItem.transferProofImageUrl && (
            <>
              <Grid size={{ xs: 12 }}>
                <Divider className='border-dashed' />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography className='font-medium' color='text.primary' mb={2}>
                  áº¢nh minh chá»©ng chuyá»ƒn khoáº£n:
                </Typography>
                <Box
                  component='img'
                  src={firstItem.transferProofImageUrl}
                  alt='Minh chá»©ng chuyá»ƒn khoáº£n'
                  sx={{
                    maxWidth: 400,
                    maxHeight: 400,
                    objectFit: 'contain',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                />
              </Grid>
            </>
          )}

          {/* Footer note */}
          <Grid size={{ xs: 12 }}>
            <Divider className='border-dashed' />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant='body2' color='text.secondary' textAlign='center'>
              BiÃªn lai nÃ y lÃ  chá»©ng tá»« há»£p lá»‡ cho khoáº£n thu tá»« há»‡ thá»‘ng quáº£n lÃ½ cÃ¢u láº¡c bá»™.
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default PreviewCard

