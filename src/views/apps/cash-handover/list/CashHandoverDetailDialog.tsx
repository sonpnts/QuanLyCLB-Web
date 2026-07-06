'use client'

import { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import type { CashHandoverType, CashHandoverInvoiceType } from '@/types/apps/cashHandoverTypes'
import { HandoverStatusLabel } from '@/types/apps/cashHandoverTypes'
import { formatDateTimeVN } from '@/utils/dateTime'
import cashHandoverService from '@/services/cashHandoverService'

type Props = {
  open: boolean
  data: CashHandoverType | null
  onClose: () => void
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const paymentMethodLabels: Record<number, string> = { 0: 'Tiền mặt', 1: 'Chuyển khoản', 2: 'Khác' }

const CashHandoverDetailDialog = ({ open, data, onClose }: Props) => {
  const [invoices, setInvoices] = useState<CashHandoverInvoiceType[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [showInvoices, setShowInvoices] = useState(false)

  useEffect(() => {
    if (!open) {
      setInvoices([])
      setShowInvoices(false)
    }
  }, [open])

  const loadInvoices = async () => {
    if (!data) return

    setLoadingInvoices(true)
    try {
      const response = await cashHandoverService.getInvoicesByHandover(data.id)
      if (response.success && response.data) {
        setInvoices(response.data)
      }
    } finally {
      setLoadingInvoices(false)
    }
  }

  const handleToggleInvoices = async () => {
    if (showInvoices) {
      setShowInvoices(false)
      return
    }

    if (invoices.length === 0) {
      await loadInvoices()
    }
    setShowInvoices(true)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='lg' fullScreen={false}>
      <DialogTitle>Chi tiết phiếu bàn giao tiền</DialogTitle>
      <DialogContent>
        {!data ? (
          <Typography>Không có dữ liệu.</Typography>
        ) : (
          <div className='flex flex-col gap-4'>
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>Người bàn giao</Typography>
                <Typography className='mt-1'>{data.instructorName || data.instructorId}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>Thời gian bàn giao</Typography>
                <Typography className='mt-1'>{formatDateTimeVN(data.handoverAt)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>Người tạo phiếu</Typography>
                <Typography className='mt-1'>{data.createdByUserName || data.createdByUserId || '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>Số lớp trong phiếu</Typography>
                <Typography className='mt-1'>{String(data.classCount || data.details.length || 0)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>Số tiền bàn giao</Typography>
                <Typography className='mt-1 font-semibold' color='success.main'>{formatCurrency(data.amountHandedOver)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>Bàn giao tiền mặt / Chuyển khoản</Typography>
                <Typography className='mt-1'>
                  {formatCurrency(data.amountHandedOverCashAmount)} / {formatCurrency(data.amountHandedOverBankTransferAmount)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>Tổng khoản trừ HLV</Typography>
                <Typography className='mt-1' color={data.totalDeductionAmount > 0 ? 'error.main' : 'text.secondary'}>
                  {data.totalDeductionAmount > 0 ? `-${formatCurrency(data.totalDeductionAmount)}` : 'Không có'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>Còn lại sau bàn giao</Typography>
                <Typography className='mt-1'>{formatCurrency(data.remainingAmountAfterHandover)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant='body2' color='text.secondary'>Trạng thái</Typography>
                <div className='mt-1'>
                  <Chip
                    label={HandoverStatusLabel[data.status] ?? data.status}
                    size='small'
                    color={data.status === 'Confirmed' ? 'success' : data.status === 'Rejected' ? 'error' : 'warning'}
                    variant='tonal'
                  />
                </div>
              </Grid>
              {data.status !== 'Pending' && data.confirmedByUserName && (
                <Grid item xs={12} sm={6}>
                  <Typography variant='body2' color='text.secondary'>Xác nhận bởi</Typography>
                  <Typography className='mt-1'>
                    {data.confirmedByUserName}
                    {data.confirmedAt && (
                      <Typography variant='caption' component='span' color='text.secondary' sx={{ ml: 1 }}>
                        ({formatDateTimeVN(data.confirmedAt)})
                      </Typography>
                    )}
                  </Typography>
                </Grid>
              )}
              {data.notes && (
                <Grid item xs={12}>
                  <Typography variant='body2' color='text.secondary'>Ghi chú</Typography>
                  <Typography className='mt-1'>{data.notes}</Typography>
                </Grid>
              )}
            </Grid>

            {/* Khoản trừ HLV */}
            {data.deductions.length > 0 && (
              <>
                <Divider />
                <div>
                  <Typography variant='subtitle2' className='font-semibold mb-2'>
                    Khoản giảm trừ HLV ({data.deductions.length} khoản — {formatCurrency(data.totalDeductionAmount)})
                  </Typography>
                  <div className='overflow-x-auto'>
                    <Table size='small' sx={{ minWidth: 300 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>STT</TableCell>
                          <TableCell>Mô tả</TableCell>
                          <TableCell align='right'>Số tiền</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.deductions.map((deduction, idx) => (
                          <TableRow key={deduction.id}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{deduction.description}</TableCell>
                            <TableCell align='right'>
                              <Typography color='error.main'>-{formatCurrency(deduction.amount)}</Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}

            {/* Chi tiết theo lớp */}
            {data.details.length > 0 && (
              <>
                <Divider />
                <div>
                  <Typography variant='subtitle2' className='font-semibold mb-2'>
                    Chi tiết theo lớp
                  </Typography>
                  <div className='overflow-x-auto'>
                    <Table size='small' sx={{ minWidth: 500 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Lớp</TableCell>
                          <TableCell align='right'>Tổng ghi nhận</TableCell>
                          <TableCell align='right'>Đã nộp trước</TableCell>
                          <TableCell align='right'>Khoản trừ</TableCell>
                          <TableCell align='right'>Bàn giao kỳ này</TableCell>
                          <TableCell align='right'>Còn lại</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.details.map(detail => (
                          <TableRow key={detail.classId}>
                            <TableCell>{detail.className}</TableCell>
                            <TableCell align='right'>{formatCurrency(detail.snapshotTotalAmount)}</TableCell>
                            <TableCell align='right'>{formatCurrency(detail.previousHandedOverAmount)}</TableCell>
                            <TableCell align='right'>
                              {detail.totalDeductionAmount > 0 ? (
                                <Typography color='error.main'>-{formatCurrency(detail.totalDeductionAmount)}</Typography>
                              ) : '—'}
                            </TableCell>
                            <TableCell align='right'>{formatCurrency(detail.amountHandedOver)}</TableCell>
                            <TableCell align='right'>{formatCurrency(detail.remainingAmountAfterHandover)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}

            {/* Danh sách biên lai */}
            <>
              <Divider />
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <Typography variant='subtitle2' className='font-semibold'>
                    Biên lai trong kỳ ({showInvoices ? invoices.length : '...'})
                  </Typography>
                  <Button size='small' variant='outlined' onClick={handleToggleInvoices}>
                    {showInvoices ? 'Ẩn' : 'Xem biên lai'}
                  </Button>
                </div>

                {showInvoices && (
                  <>
                    {loadingInvoices ? (
                      <LinearProgress sx={{ mb: 1 }} />
                    ) : invoices.length === 0 ? (
                      <Typography variant='body2' color='text.secondary'>
                        Không có biên lai nào trong kỳ này.
                      </Typography>
                    ) : (
                      <Box sx={{ overflowX: 'auto' }}>
                        <Table size='small' sx={{ minWidth: 700 }}>
                          <TableHead>
                            <TableRow>
                              <TableCell>Số biên lai</TableCell>
                              <TableCell>Học viên</TableCell>
                              <TableCell>Lớp</TableCell>
                              <TableCell>Ngày thu</TableCell>
                              <TableCell align='right'>Tổng gốc</TableCell>
                              <TableCell align='right'>Giảm trừ</TableCell>
                              <TableCell align='right'>Thực thu</TableCell>
                              <TableCell>Phương thức</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {invoices.map(inv => (
                              <TableRow key={inv.id} hover>
                                <TableCell>
                                  <Typography color='primary' fontWeight={500} variant='body2' noWrap>
                                    {inv.receiptNumber}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography noWrap>{inv.studentName || 'Khách lẻ'}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography noWrap>{inv.className || '-'}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography noWrap>
                                    {new Date(inv.paymentDate).toLocaleDateString('vi-VN')}
                                  </Typography>
                                </TableCell>
                                <TableCell align='right'>{formatCurrency(inv.totalAmount)}</TableCell>
                                <TableCell align='right'>
                                  {inv.discountAmount > 0 ? (
                                    <Typography color='warning.main'>-{formatCurrency(inv.discountAmount)}</Typography>
                                  ) : '—'}
                                </TableCell>
                                <TableCell align='right'>
                                  <Typography fontWeight={600}>{formatCurrency(inv.finalAmount)}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip label={paymentMethodLabels[inv.method] || '-'} size='small' variant='tonal' />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    )}
                  </>
                )}
              </div>
            </>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  )
}

export default CashHandoverDetailDialog
