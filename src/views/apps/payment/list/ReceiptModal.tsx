'use client'

import { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import { apiClient } from '@/utils/apiClient'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { PaymentRecordType, paymentTypeLabels, paymentMethodLabels } from '@/types/apps/paymentTypes'
import { toast } from 'react-toastify'

type ReceiptModalProps = {
  open: boolean
  receiptNumber: string | null
  onClose: () => void
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const ReceiptModal = ({ open, receiptNumber, onClose }: ReceiptModalProps) => {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<PaymentRecordType[]>([])

  useEffect(() => {
    if (open && receiptNumber) {
      const fetchReceipt = async () => {
        setLoading(true)
        try {
          const res = await apiClient.get<any>(API_ENDPOINTS.payments.byReceipt(receiptNumber))
          if (res.data.isSuccess) {
            setItems(res.data.data)
          } else {
            toast.error(res.data.message || 'Không thể tải chi tiết biên lai')
          }
        } catch (error) {
          toast.error('Lỗi khi tải chi tiết biên lai')
        } finally {
          setLoading(false)
        }
      }
      fetchReceipt()
    } else {
      setItems([])
    }
  }, [open, receiptNumber])

  if (!open) return null

  const firstItem = items.length > 0 ? items[0] : null
  const totalAmount = items.reduce((sum, current) => sum + current.amount, 0)

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <Typography variant='h5'>Chi tiết Biên lai: {receiptNumber}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display='flex' justifyContent='center' p={4}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Typography textAlign='center' color='textSecondary'>Không tìm thấy dữ liệu biên lai.</Typography>
        ) : (
          <Grid container spacing={6}>
            <Grid item xs={12} md={firstItem?.transferProofImageUrl ? 7 : 12}>
              <Box mb={4}>
                <Typography variant='subtitle2' color='textSecondary'>Học viên</Typography>
                <Typography variant='body1' fontWeight={500}>{firstItem?.studentName}</Typography>
              </Box>
              <Box mb={4}>
                <Typography variant='subtitle2' color='textSecondary'>Người thu tiền</Typography>
                <Typography variant='body1'>{firstItem?.collectedByUserName || '-'}</Typography>
              </Box>
              <Box mb={4}>
                <Typography variant='subtitle2' color='textSecondary'>Phương thức</Typography>
                <Typography variant='body1'>{firstItem?.method !== undefined ? paymentMethodLabels[firstItem.method] : '-'}</Typography>
              </Box>
              <Box mb={4}>
                <Typography variant='subtitle2' color='textSecondary'>Ngày thanh toán</Typography>
                <Typography variant='body1'>
                  {firstItem?.paymentDate ? new Date(firstItem.paymentDate).toLocaleString('vi-VN') : '-'}
                </Typography>
              </Box>

              <Typography variant='h6' mt={6} mb={2}>Các hạng mục thu</Typography>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mô tả</TableCell>
                      <TableCell>Loại</TableCell>
                      <TableCell align='right'>Số tiền</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.description || 
                           (item.type === 0 ? `Học phí ${item.forMonth}/${item.forYear}` :
                            item.type === 1 ? 'Lệ phí thi' : 'Khác')}
                        </TableCell>
                        <TableCell>{paymentTypeLabels[item.type]}</TableCell>
                        <TableCell align='right'>{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} align='right'><Typography fontWeight='bold'>Tổng cộng:</Typography></TableCell>
                      <TableCell align='right'><Typography fontWeight='bold' color='primary'>{formatCurrency(totalAmount)}</Typography></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            {firstItem?.transferProofImageUrl && (
              <Grid item xs={12} md={5}>
                <Typography variant='h6' mb={2}>Ảnh minh chứng (Chuyển khoản)</Typography>
                <Divider sx={{ mb: 4 }} />
                <Box 
                  component='img'
                  src={firstItem.transferProofImageUrl}
                  alt='Transfer Proof'
                  sx={{
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain',
                    border: '1px solid #e0e0e0',
                    borderRadius: 1
                  }}
                />
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant='outlined'>Đóng</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReceiptModal
