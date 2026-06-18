import { useEffect, useRef, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import Logo from '@components/layout/shared/Logo-Invoice'

// Type Imports
import type { PaymentRecordType } from '@/types/apps/paymentTypes'
import { paymentMethodLabels, paymentTypeLabels } from '@/types/apps/paymentTypes'
import { formatDateTimeVN } from '@/utils/dateTime'
import { normalizePaymentMethod } from '@/utils/paymentMethod'
import { normalizePaymentType } from '@/utils/paymentType'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const DESIGN_WIDTH = 980

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

const formatDateTime = (dateStr: string) => formatDateTimeVN(dateStr)

type Props = {
  items: PaymentRecordType[]
  receiptNumber: string
  loading: boolean
}

const PreviewCard = ({ items, receiptNumber, loading }: Props) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [scaledHeight, setScaledHeight] = useState<number | null>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const card = cardRef.current

    if (!wrapper || !card) return

    const updateScale = () => {
      const nextScale = Math.min(1, wrapper.clientWidth / DESIGN_WIDTH)

      setScale(nextScale)
      setScaledHeight(card.offsetHeight * nextScale)
    }

    updateScale()

    const resizeObserver = new ResizeObserver(() => updateScale())

    resizeObserver.observe(wrapper)

    return () => resizeObserver.disconnect()
  }, [items.length, loading])

  if (loading) {
    return (
      <Card className='previewCard'>
        <CardContent sx={{ p: 6 }}>
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
        <CardContent sx={{ p: 6 }}>
          <Typography textAlign='center' color='text.secondary' p={6}>
            Không tìm thấy biên lai.
          </Typography>
        </CardContent>
      </Card>
    )
  }

  const firstItem = items[0]
  const totalAmount = firstItem?.invoiceFinalAmount !== undefined && firstItem?.invoiceFinalAmount !== null
    ? firstItem.invoiceFinalAmount
    : items.reduce((sum, item) => sum + item.amount, 0)
  const totalDiscount = firstItem?.invoiceDiscountAmount !== undefined && firstItem?.invoiceDiscountAmount !== null
    ? firstItem.invoiceDiscountAmount
    : items.reduce((sum, item) => sum + (item.discountAmount ?? 0), 0)
  const originalTotal = firstItem?.invoiceTotalAmount !== undefined && firstItem?.invoiceTotalAmount !== null
    ? firstItem.invoiceTotalAmount
    : items.reduce((sum, item) => sum + (item.originalAmount ?? item.amount), 0)

  return (
    <Box ref={wrapperRef} sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ height: scaledHeight ? `${scaledHeight}px` : 'auto' }}>
        <Box
          sx={{
            width: `${DESIGN_WIDTH}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left'
          }}
        >
          <Card className='previewCard' id='print-card' ref={cardRef}>
            <CardContent sx={{ p: 6 }}>
              <Box display='flex' flexDirection='column' gap={4}>
                <Box sx={{ p: 4, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Box display='flex' justifyContent='space-between' alignItems='flex-start' gap={4} flexWrap='nowrap'>
                    <Box display='flex' flexDirection='column' gap={2} minWidth={0}>
                      <Box display='flex' alignItems='center'>
                        <Logo />
                      </Box>
                    </Box>
                    <Box display='flex' flexDirection='column' gap={1} sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <Typography variant='h5' color='primary' sx={{ fontWeight: 700 }}>
                        BIÊN LAI THU TIỀN
                      </Typography>
                      <Typography color='text.secondary' variant='body2'>
                        Số biên lai:{' '}
                        <strong style={{ color: 'var(--mui-palette-text-primary)' }}>{receiptNumber}</strong>
                      </Typography>
                      <Typography color='text.secondary' variant='body2'>
                        Ngày thu:{' '}
                        <strong style={{ color: 'var(--mui-palette-text-primary)' }}>
                          {formatDateTime(firstItem.paymentDate)}
                        </strong>
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box display='flex' gap={6} flexWrap='nowrap'>
                  <Box flex={1} minWidth={0}>
                    <Box display='flex' flexDirection='column' gap={2}>
                      <Typography className='font-medium' color='text.primary'>
                        Thông tin học viên:
                      </Typography>
                      <Box display='flex' flexDirection='column' gap={1}>
                        <Typography noWrap>
                          <span className='text-textSecondary'>Họ tên: </span>
                          <strong>{firstItem.studentName || '—'}</strong>
                        </Typography>
                        <Typography noWrap>
                          <span className='text-textSecondary'>Lớp: </span>
                          {firstItem.className || '—'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box flex={1} minWidth={0}>
                    <Box display='flex' flexDirection='column' gap={2}>
                      <Typography className='font-medium' color='text.primary'>
                        Thông tin thanh toán:
                      </Typography>
                      <Box display='flex' flexDirection='column' gap={1}>
                        <Typography noWrap>
                          <span className='text-textSecondary'>Phương thức: </span>
                          {paymentMethodLabels[normalizePaymentMethod(firstItem.method, 0)] ?? '—'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                  <table className={tableStyles.table} style={{ tableLayout: 'fixed', width: '100%' }}>
                    <thead>
                      <tr className='border-be'>
                        <th className='!bg-transparent' style={{ width: '38%' }}>
                          Mô tả
                        </th>
                        <th className='!bg-transparent' style={{ width: '18%' }}>
                          Loại thu
                        </th>
                        <th className='!bg-transparent text-right' style={{ width: '14%' }}>
                          Số tiền gốc
                        </th>
                        <th className='!bg-transparent text-right' style={{ width: '14%' }}>
                          Giảm giá
                        </th>
                        <th className='!bg-transparent text-right' style={{ width: '16%' }}>
                          Thực thu
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => {
                        const paymentType = normalizePaymentType(item.type, 3)

                        const description =
                          item.description ||
                          (paymentType === 0 && item.forMonth && item.forYear
                            ? `Học phí tháng ${item.forMonth}/${item.forYear}${item.className ? ` — ${item.className}` : ''}`
                            : paymentType === 1
                              ? `Lệ phí thi cấp${item.className ? ` — ${item.className}` : ''}`
                              : item.productName || paymentTypeLabels[paymentType])

                        return (
                          <tr key={item.id ?? index}>
                            <td>
                              <Typography
                                color='text.primary'
                                sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                              >
                                {description}
                              </Typography>
                            </td>
                            <td>
                              <Typography
                                color='text.secondary'
                                sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                              >
                                {paymentTypeLabels[paymentType] ?? String(item.type)}
                              </Typography>
                            </td>
                            <td className='text-right'>
                              <Typography color='text.secondary' noWrap>
                                {formatCurrency(item.originalAmount ?? item.amount)}
                              </Typography>
                            </td>
                            <td className='text-right'>
                              <Typography color={item.discountAmount ? 'error' : 'text.secondary'} noWrap>
                                {item.discountAmount ? `- ${formatCurrency(item.discountAmount)}` : '—'}
                              </Typography>
                            </td>
                            <td className='text-right'>
                              <Typography color='text.primary' className='font-medium' noWrap>
                                {formatCurrency(item.amount)}
                              </Typography>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </Box>

                <Box display='flex' justifyContent='flex-end'>
                  <Box minWidth={260} display='flex' flexDirection='column' gap={1}>
                    {totalDiscount > 0 && (
                      <>
                        <Box display='flex' alignItems='center' justifyContent='space-between' gap={4}>
                          <Typography color='text.secondary' noWrap>
                            Tổng gốc:
                          </Typography>
                          <Typography color='text.primary' noWrap>
                            {formatCurrency(originalTotal)}
                          </Typography>
                        </Box>
                        <Box display='flex' alignItems='center' justifyContent='space-between' gap={4}>
                          <Typography color='text.secondary' noWrap>
                            Tổng giảm:
                          </Typography>
                          <Typography color='error' noWrap>
                            - {formatCurrency(totalDiscount)}
                          </Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                      </>
                    )}
                    <Box display='flex' alignItems='center' justifyContent='space-between' gap={4}>
                      <Typography className='font-medium' color='text.primary' noWrap>
                        Tổng thực thu:
                      </Typography>
                      <Typography variant='h6' color='primary' noWrap>
                        {formatCurrency(totalAmount)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {firstItem.transferProofImageUrl && (
                  <>
                    <Divider className='border-dashed' />
                    <Box>
                      <Typography className='font-medium' color='text.primary' mb={2}>
                        Ảnh minh chứng chuyển khoản:
                      </Typography>
                      <Box
                        component='img'
                        className='previewCard__transfer-proof'
                        src={firstItem.transferProofImageUrl}
                        alt='Minh chứng chuyển khoản'
                        sx={{
                          display: 'block',
                          maxWidth: 400,
                          maxHeight: 400,
                          objectFit: 'contain',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1
                        }}
                      />
                    </Box>
                  </>
                )}

                <Divider className='border-dashed' />

                <Box display='flex' justifyContent='space-between' gap={6} flexWrap='nowrap' sx={{ mt: 2 }}>
                  <Box flex={1} textAlign='center'>
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        whiteSpace: 'nowrap'
                      }}
                      color='text.primary'
                    >
                      NGƯỜI NỘP TIỀN
                    </Typography>

                    <Box className='previewCard__signature-space' sx={{ height: 90 }} />

                    <Divider />
                    <Typography
                      sx={{
                        mt: 1,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      color='text.primary'
                    >
                      {firstItem.studentName || '—'}
                    </Typography>
                  </Box>

                  <Box flex={1} textAlign='center'>
                    <Typography
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        whiteSpace: 'nowrap'
                      }}
                      color='text.primary'
                    >
                      NGƯỜI THU
                    </Typography>

                    <Box className='previewCard__signature-space' sx={{ height: 90 }} />

                    <Divider />
                    <Typography
                      sx={{
                        mt: 1,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      color='text.primary'
                    >
                      {firstItem.collectedByUserName || '—'}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant='body2' color='text.secondary' textAlign='center' sx={{ whiteSpace: 'nowrap' }}>
                  Lưu ý: Học phí đã đóng không được hoàn lại và chỉ được bảo lưu 01 lần theo quy định của câu lạc bộ.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}

export default PreviewCard
