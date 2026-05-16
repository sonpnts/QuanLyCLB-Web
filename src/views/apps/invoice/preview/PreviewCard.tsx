// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import Logo from '@components/layout/shared/Logo-Invoice'

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
            Không tìm thấy biên lai.
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
                  {/*<div>*/}
                  {/*  <Typography color='text.primary' className='font-medium'>*/}
                  {/*    Câu lạc bộ*/}
                  {/*  </Typography>*/}
                  {/*  <Typography color='text.secondary' variant='body2'>*/}
                  {/*    Hệ thống quản lý câu lạc bộ*/}
                  {/*  </Typography>*/}
                  {/*</div>*/}
                </div>
                <div className='flex flex-col gap-2'>
                  <Typography variant='h5' color='primary'>
                    BIÊN LAI THU TIỀN
                  </Typography>
                  <Typography color='text.secondary' variant='body2'>
                    Số biên lai: <strong className='text-text-primary'>{receiptNumber}</strong>
                  </Typography>
                  <Typography color='text.secondary' variant='body2'>
                    Ngày thu: <strong className='text-text-primary'>{formatDateTime(firstItem.paymentDate)}</strong>
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
                    Thông tin học viên:
                  </Typography>
                  <div className='flex flex-col gap-1'>
                    <Typography>
                      <span className='text-textSecondary'>Họ tên: </span>
                      <strong>{firstItem.studentName || '—'}</strong>
                    </Typography>
                    {firstItem.className && (
                      <Typography>
                        <span className='text-textSecondary'>Lớp: </span>
                        {firstItem.className}
                      </Typography>
                    )}
                  </div>
                </div>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <div className='flex flex-col gap-3'>
                  <Typography className='font-medium' color='text.primary'>
                    Thông tin thanh toán:
                  </Typography>
                  <div className='flex flex-col gap-1'>
                    <Typography>
                      <span className='text-textSecondary'>Phương thức: </span>
                      {paymentMethodLabels[normalizePaymentMethod(firstItem.method, 0)] ?? '—'}
                    </Typography>
                    {firstItem.transactionRef && (
                      <Typography>
                        <span className='text-textSecondary'>Mã GD: </span>
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
                    <th className='!bg-transparent'>Mô tả</th>
                    <th className='!bg-transparent'>Loại thu</th>
                    <th className='!bg-transparent text-right'>Số tiền gốc</th>
                    <th className='!bg-transparent text-right'>Giảm giá</th>
                    <th className='!bg-transparent text-right'>Thực thu</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const desc =
                      item.description ||
                      (normalizePaymentType(item.type, 3) === 0 && item.forMonth && item.forYear
                        ? `Học phí tháng ${item.forMonth}/${item.forYear}${item.className ? ` — ${item.className}` : ''}`
                        : normalizePaymentType(item.type, 3) === 1
                          ? `Lệ phí thi cấp${item.className ? ` — ${item.className}` : ''}`
                          : item.productName || paymentTypeLabels[normalizePaymentType(item.type, 3)])

                    return (
                      <tr key={item.id ?? idx}>
                        <td>
                          <Typography color='text.primary'>{desc}</Typography>
                        </td>
                        <td>
                          <Typography color='text.secondary'>
                            {paymentTypeLabels[normalizePaymentType(item.type, 3)] ?? String(item.type)}
                          </Typography>
                        </td>
                        <td className='text-right'>
                          <Typography color='text.secondary'>
                            {formatCurrency(item.originalAmount ?? item.amount)}
                          </Typography>
                        </td>
                        <td className='text-right'>
                          <Typography color={item.discountAmount ? 'error' : 'text.secondary'}>
                            {item.discountAmount ? `- ${formatCurrency(item.discountAmount)}` : '—'}
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
                      <Typography color='text.secondary'>Tổng gốc:</Typography>
                      <Typography color='text.primary'>{formatCurrency(originalTotal)}</Typography>
                    </div>
                    <div className='flex items-center justify-between'>
                      <Typography color='text.secondary'>Tổng giảm:</Typography>
                      <Typography color='error'>- {formatCurrency(totalDiscount)}</Typography>
                    </div>
                    <Divider className='mlb-2' />
                  </>
                )}
                <div className='flex items-center justify-between'>
                  <Typography className='font-medium' color='text.primary'>
                    Tổng thực thu:
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
                  Ảnh minh chứng chuyển khoản:
                </Typography>
                <Box
                  component='img'
                  src={firstItem.transferProofImageUrl}
                  alt='Minh chứng chuyển khoản'
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
            <Box display='flex' justifyContent='space-between' gap={6} sx={{ mt: 4 }}>
              <Box flex={1} textAlign='center'>
                <Typography
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1
                  }}
                  color='text.primary'
                >
                  NGƯỜI NỘP TIỀN
                </Typography>

                <Box sx={{ height: 90 }} />

                <Divider />

                {/* Optional tên người nộp */}
                {/* <Typography sx={{ mt: 1, fontWeight: 600 }}>
        {firstItem.studentName || '—'}
      </Typography> */}
              </Box>

              <Box flex={1} textAlign='center'>
                <Typography
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1
                  }}
                  color='text.primary'
                >
                  NGƯỜI THU
                </Typography>

                <Box sx={{ height: 90 }} />

                <Divider />

                <Typography
                  sx={{
                    mt: 1,
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                  color='text.primary'
                >
                  {firstItem.collectedByUserName || '—'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }}>
            {/*<Typography variant='body2' color='text.secondary' textAlign='center'>*/}
            {/*  Biên lai này là chứng từ hợp lệ cho khoản thu từ hệ thống quản lý câu lạc bộ.*/}
            {/*</Typography>*/}
            <Typography variant='body2' color='text.secondary' textAlign='center'>
              Khoản phí đã thanh toán sẽ không được hoàn lại và chỉ được bảo lưu 1 lần.
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default PreviewCard
