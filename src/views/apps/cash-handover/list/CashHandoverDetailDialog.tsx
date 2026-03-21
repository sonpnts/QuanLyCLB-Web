'use client'

import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import type { CashHandoverType } from '@/types/apps/cashHandoverTypes'

type Props = {
  open: boolean
  data: CashHandoverType | null
  onClose: () => void
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const DetailRow = ({ label, value }: { label: string; value: string }) => (
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
          <Grid container spacing={4}>
            <DetailRow label='Lớp' value={data.className || data.classId} />
            <DetailRow label='Huấn luyện viên' value={data.instructorName || data.instructorId} />
            <DetailRow
              label='Thời gian bàn giao'
              value={data.handoverAt ? new Date(data.handoverAt).toLocaleString('vi-VN') : '-'}
            />
            <DetailRow label='Người tạo phiếu' value={data.createdByUserName || data.createdByUserId || '-'} />
            <DetailRow label='Snapshot học phí' value={formatCurrency(data.snapshotTuitionAmount)} />
            <DetailRow label='Snapshot bán sản phẩm' value={formatCurrency(data.snapshotProductSalesAmount)} />
            <DetailRow label='Snapshot tổng' value={formatCurrency(data.snapshotTotalAmount)} />
            <DetailRow label='Đã bàn giao trước đó' value={formatCurrency(data.previousHandedOverAmount)} />
            <DetailRow label='Số tiền bàn giao kỳ này' value={formatCurrency(data.amountHandedOver)} />
            <DetailRow label='Còn lại sau bàn giao' value={formatCurrency(data.remainingAmountAfterHandover)} />
            <DetailRow label='Ghi chú' value={data.notes || '-'} />
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  )
}

export default CashHandoverDetailDialog
