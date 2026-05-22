'use client'

import type { ReactNode } from 'react'

import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import type { CashHandoverType } from '@/types/apps/cashHandoverTypes'
import { HandoverStatusLabel } from '@/types/apps/cashHandoverTypes'

type Props = {
  open: boolean
  data: CashHandoverType | null
  onClose: () => void
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const getOtherFeeAmount = (total: number, tuition: number, exam: number, products: number) =>
  Math.max(0, Number(total || 0) - Number(tuition || 0) - Number(exam || 0) - Number(products || 0))

const DetailRow = ({ label, value }: { label: string; value: string | ReactNode }) => (
  <Grid item xs={12} md={6}>
    <Typography variant='body2' color='text.secondary'>
      {label}
    </Typography>
    <Typography className='mt-1'>{value}</Typography>
  </Grid>
)

const CashHandoverDetailDialog = ({ open, data, onClose }: Props) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='lg'>
      <DialogTitle>Chi tiết phiếu bàn giao tiền</DialogTitle>
      <DialogContent>
        {!data ? (
          <Typography>Không có dữ liệu.</Typography>
        ) : (
          <div className='flex flex-col gap-4'>
            <Grid container spacing={3}>
              <DetailRow label='Người bàn giao' value={data.instructorName || data.instructorId} />
              <DetailRow label='Số lớp trong phiếu' value={String(data.classCount || data.details.length || 0)} />
              <DetailRow
                label='Thời gian bàn giao'
                value={data.handoverAt ? new Date(data.handoverAt).toLocaleString('vi-VN') : '-'}
              />
              <DetailRow label='Người tạo phiếu' value={data.createdByUserName || data.createdByUserId || '-'} />
              <DetailRow label='Học phí đã ghi nhận' value={formatCurrency(data.snapshotTuitionAmount)} />
              <DetailRow label='Lệ phí thi đã ghi nhận' value={formatCurrency(data.snapshotExamFeeAmount)} />
              <DetailRow label='Bán sản phẩm' value={formatCurrency(data.snapshotProductSalesAmount)} />
              <DetailRow
                label='Các khoản phí khác'
                value={formatCurrency(
                  getOtherFeeAmount(
                    data.snapshotTotalAmount,
                    data.snapshotTuitionAmount,
                    data.snapshotExamFeeAmount,
                    data.snapshotProductSalesAmount
                  )
                )}
              />
              <DetailRow label='Tổng ghi nhận' value={formatCurrency(data.snapshotTotalAmount)} />
              <DetailRow label='Số tiền đã nộp trước đó' value={formatCurrency(data.previousHandedOverAmount)} />
              <DetailRow label='Tổng khoản trừ' value={formatCurrency(data.totalDeductionAmount)} />
              <DetailRow label='Số tiền bàn giao' value={formatCurrency(data.amountHandedOver)} />
              <DetailRow label='Còn lại sau bàn giao' value={formatCurrency(data.remainingAmountAfterHandover)} />
              <DetailRow
                label='Trạng thái'
                value={
                  <Chip
                    label={HandoverStatusLabel[data.status] ?? data.status}
                    size='small'
                    color={
                      data.status === 'Confirmed' ? 'success' : data.status === 'Rejected' ? 'error' : 'warning'
                    }
                    variant='tonal'
                  />
                }
              />
              {data.status !== 'Pending' && (
                <>
                  <DetailRow label='Xác nhận bởi' value={data.confirmedByUserName || data.confirmedByUserId || '-'} />
                  <DetailRow
                    label='Thời gian xác nhận'
                    value={data.confirmedAt ? new Date(data.confirmedAt).toLocaleString('vi-VN') : '-'}
                  />
                </>
              )}
              <DetailRow label='Ghi chú' value={data.notes || '-'} />
            </Grid>

            <Divider />

            <div>
              <Typography variant='subtitle2' className='font-semibold mb-2'>
                Chi tiết theo lớp
              </Typography>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Lớp</TableCell>
                    <TableCell align='right'>Học phí</TableCell>
                    <TableCell align='right'>Lệ phí thi</TableCell>
                    <TableCell align='right'>Sản phẩm</TableCell>
                    <TableCell align='right'>Phí khác</TableCell>
                    <TableCell align='right'>Đã nộp trước đó</TableCell>
                    <TableCell align='right'>Khoản trừ</TableCell>
                    <TableCell align='right'>Bàn giao kỳ này</TableCell>
                    <TableCell align='right'>Còn lại</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.details.map(detail => (
                    <TableRow key={detail.classId}>
                      <TableCell>{detail.className}</TableCell>
                      <TableCell align='right'>{formatCurrency(detail.snapshotTuitionAmount)}</TableCell>
                      <TableCell align='right'>{formatCurrency(detail.snapshotExamFeeAmount)}</TableCell>
                      <TableCell align='right'>{formatCurrency(detail.snapshotProductSalesAmount)}</TableCell>
                      <TableCell align='right'>
                        {formatCurrency(
                          getOtherFeeAmount(
                            detail.snapshotTotalAmount,
                            detail.snapshotTuitionAmount,
                            detail.snapshotExamFeeAmount,
                            detail.snapshotProductSalesAmount
                          )
                        )}
                      </TableCell>
                      <TableCell align='right'>{formatCurrency(detail.previousHandedOverAmount)}</TableCell>
                      <TableCell align='right'>{formatCurrency(detail.totalDeductionAmount)}</TableCell>
                      <TableCell align='right'>{formatCurrency(detail.amountHandedOver)}</TableCell>
                      <TableCell align='right'>{formatCurrency(detail.remainingAmountAfterHandover)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {data.deductions.length > 0 && (
              <>
                <Divider />
                <div>
                  <Typography variant='subtitle2' className='font-semibold mb-2'>
                    Các khoản trừ
                  </Typography>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Mô tả</TableCell>
                        <TableCell align='right'>Số tiền</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.deductions.map(deduction => (
                        <TableRow key={deduction.id}>
                          <TableCell>{deduction.description}</TableCell>
                          <TableCell align='right'>{formatCurrency(deduction.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
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
