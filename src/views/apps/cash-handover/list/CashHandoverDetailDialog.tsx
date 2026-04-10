'use client'

import type { ReactNode } from 'react'

import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Button from '@mui/material/Button'
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>Chi tiết phiếu bàn giao tiền</DialogTitle>
      <DialogContent>
        {!data ? (
          <Typography>Không có dữ liệu.</Typography>
        ) : (
          <div className='flex flex-col gap-4'>
            <Grid container spacing={3}>
              <DetailRow label='Lớp' value={data.className || data.classId} />
              <DetailRow label='Huấn luyện viên' value={data.instructorName || data.instructorId} />
              <DetailRow
                label='Thời gian bàn giao'
                value={data.handoverAt ? new Date(data.handoverAt).toLocaleString('vi-VN') : '-'}
              />
              <DetailRow label='Người tạo phiếu' value={data.createdByUserName || data.createdByUserId || '-'} />
              <DetailRow label='Học phí đã thu' value={formatCurrency(data.snapshotTuitionAmount)} />
              <DetailRow label='Bán sản phẩm' value={formatCurrency(data.snapshotProductSalesAmount)} />
              <DetailRow label='Tổng đã thu' value={formatCurrency(data.snapshotTotalAmount)} />
              <DetailRow label='Đã bàn giao trước' value={formatCurrency(data.previousHandedOverAmount)} />
              <DetailRow label='Tổng khoản trừ' value={formatCurrency(data.totalDeductionAmount)} />
              <DetailRow label='Số tiền bàn giao' value={formatCurrency(data.amountHandedOver)} />
              <DetailRow label='Còn lại sau bàn giao' value={formatCurrency(data.remainingAmountAfterHandover)} />
              <DetailRow
                label='Trạng thái'
                value={
                  <Chip
                    label={HandoverStatusLabel[data.status] ?? data.status}
                    size='small'
                    color={data.status === 'Confirmed' ? 'success' : 'warning'}
                    variant='tonal'
                  />
                }
              />
              {data.status === 'Confirmed' && (
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

            {data.deductions && data.deductions.length > 0 && (
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
                      {data.deductions.map(d => (
                        <TableRow key={d.id}>
                          <TableCell>{d.description}</TableCell>
                          <TableCell align='right'>{formatCurrency(d.amount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Tổng</TableCell>
                        <TableCell align='right' sx={{ fontWeight: 600, color: 'error.main' }}>
                          {formatCurrency(data.totalDeductionAmount)}
                        </TableCell>
                      </TableRow>
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
