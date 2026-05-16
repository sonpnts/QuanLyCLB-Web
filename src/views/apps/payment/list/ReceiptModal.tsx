'use client'

import { useState, useEffect } from 'react'
import TextField from '@mui/material/TextField'
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

import { useAuth } from '@/contexts/authContext'
import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'
import { apiClient } from '@/utils/apiClient'
import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { PaymentRecordType, paymentTypeLabels, paymentMethodLabels } from '@/types/apps/paymentTypes'
import { toast } from 'react-toastify'
import paymentService from '@/services/paymentService'

type ReceiptModalProps = {
  open: boolean
  receiptNumber: string | null
  onClose: () => void
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const ReceiptModal = ({ open, receiptNumber, onClose }: ReceiptModalProps) => {
  const { auth } = useAuth()
  const isAdmin = hasPermission(auth?.permissions, 'Payment.Collect.ManageAll') || hasAdminRole(auth?.roles)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<PaymentRecordType[]>([])
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, { originalAmount: number; amount: number }>>({})
  const [saving, setSaving] = useState(false)

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
      setEditing(false)
      setDraft({})
    }
  }, [open, receiptNumber])

  if (!open) return null

  const firstItem = items.length > 0 ? items[0] : null
  const totalAmount = items.reduce((sum, current) => sum + current.amount, 0)
  const isReceiptInactive = items.length > 0 && items.every(x => x.isActive === false)

  const beginEdit = () => {
    const nextDraft: Record<string, { originalAmount: number; amount: number }> = {}
    for (const it of items) {
      nextDraft[it.id] = {
        originalAmount: Number(it.originalAmount ?? it.amount ?? 0),
        amount: Number(it.amount ?? 0)
      }
    }
    setDraft(nextDraft)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setDraft({})
  }

  const reload = async () => {
    if (!receiptNumber) return
    setLoading(true)
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.payments.byReceipt(receiptNumber))
      if (res.data.isSuccess) {
        setItems(res.data.data)
      } else {
        toast.error(res.data.message || 'Không thể tải chi tiết biên lai')
      }
    } catch {
      toast.error('Lỗi khi tải chi tiết biên lai')
    } finally {
      setLoading(false)
    }
  }

  const saveEdits = async () => {
    if (!isAdmin) return
    if (!firstItem) return

    try {
      setSaving(true)

      const changed = items.filter(it => {
        const d = draft[it.id]
        if (!d) return false
        return Number(d.amount) !== Number(it.amount) || Number(d.originalAmount) !== Number(it.originalAmount)
      })

      for (const it of changed) {
        const d = draft[it.id]
        const res = await paymentService.updatePayment(it.id, {
          type: it.type,
          amount: Number(d.amount || 0),
          originalAmount: Number(d.originalAmount || 0),
          paymentDate: it.paymentDate,
          method: it.method,
          description: it.description || '',
          transactionRef: it.transactionRef || undefined,
          receiptNumber: it.receiptNumber || undefined,
          classId: it.classId || undefined,
          productId: it.productId || undefined,
          forMonth: it.forMonth || undefined,
          forYear: it.forYear || undefined,
          transferProofImageUrl: it.transferProofImageUrl || undefined,
          collectedByUserId: it.collectedByUserId || undefined,
          isActive: it.isActive !== false
        })

        if (!res.success) {
          throw new Error(res.message || 'update failed')
        }
      }

      toast.success('Đã cập nhật biên lai')
      setEditing(false)
      setDraft({})
      await reload()
    } catch {
      toast.error('Không thể cập nhật biên lai')
    } finally {
      setSaving(false)
    }
  }

  const cancelReceipt = async () => {
    if (!isAdmin) return
    if (!firstItem) return
    if (items.length === 0) return

    const ok = window.confirm('Hủy biên lai này? Biên lai sẽ không tính vào thống kê và coi như chưa thu.')
    if (!ok) return

    try {
      setSaving(true)
      for (const it of items) {
        const res = await paymentService.updatePayment(it.id, {
          type: it.type,
          amount: it.amount,
          originalAmount: Number(it.originalAmount ?? it.amount ?? 0),
          paymentDate: it.paymentDate,
          method: it.method,
          description: it.description || '',
          transactionRef: it.transactionRef || undefined,
          receiptNumber: it.receiptNumber || undefined,
          classId: it.classId || undefined,
          productId: it.productId || undefined,
          forMonth: it.forMonth || undefined,
          forYear: it.forYear || undefined,
          transferProofImageUrl: it.transferProofImageUrl || undefined,
          collectedByUserId: it.collectedByUserId || undefined,
          isActive: false
        })

        if (!res.success) {
          throw new Error(res.message || 'cancel failed')
        }
      }

      toast.success('Đã hủy biên lai')
      await reload()
    } catch {
      toast.error('Không thể hủy biên lai')
    } finally {
      setSaving(false)
    }
  }

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
              {isReceiptInactive && (
                <Box mb={4}>
                  <Typography color='error' fontWeight={600}>
                    Biên lai đã bị hủy (inactive)
                  </Typography>
                </Box>
              )}
              <Box mb={4}>
                <Typography variant='subtitle2' color='textSecondary'>Học viên</Typography>
                <Typography variant='body1' fontWeight={500}>{firstItem?.studentName}</Typography>
              </Box>
              <Box mb={4}>
                <Typography variant='subtitle2' color='textSecondary'>Người thu tiền</Typography>
                <Typography variant='body1'>{firstItem?.collectedByUserName || '-'}</Typography>
              </Box>
              <Box mb={4}>
                <Typography variant='subtitle2' color='textSecondary'>Người tạo</Typography>
                <Typography variant='body1'>{firstItem?.createdByUserName || '-'}</Typography>
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
                      <TableCell align='right'>Tiền gốc</TableCell>
                      <TableCell align='right'>Thực thu</TableCell>
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
                        <TableCell align='right'>
                          {editing ? (
                            <TextField
                              size='small'
                              type='number'
                              inputProps={{ min: 0 }}
                              value={draft[item.id]?.originalAmount ?? item.originalAmount ?? item.amount}
                              onChange={e =>
                                setDraft(prev => ({
                                  ...prev,
                                  [item.id]: {
                                    originalAmount: Number(e.target.value || 0),
                                    amount: prev[item.id]?.amount ?? item.amount
                                  }
                                }))
                              }
                              sx={{ width: 140 }}
                            />
                          ) : (
                            formatCurrency(item.originalAmount ?? item.amount)
                          )}
                        </TableCell>
                        <TableCell align='right'>
                          {editing ? (
                            <TextField
                              size='small'
                              type='number'
                              inputProps={{ min: 0 }}
                              value={draft[item.id]?.amount ?? item.amount}
                              onChange={e =>
                                setDraft(prev => ({
                                  ...prev,
                                  [item.id]: {
                                    originalAmount: prev[item.id]?.originalAmount ?? item.originalAmount ?? item.amount,
                                    amount: Number(e.target.value || 0)
                                  }
                                }))
                              }
                              sx={{ width: 140 }}
                            />
                          ) : (
                            formatCurrency(item.amount)
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align='right'><Typography fontWeight='bold'>Tổng cộng:</Typography></TableCell>
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
        {isAdmin && !editing && (
          <Button onClick={beginEdit} disabled={loading || saving || items.length === 0} variant='outlined' color='warning'>
            Chỉnh sửa
          </Button>
        )}
        {isAdmin && editing && (
          <>
            <Button onClick={cancelEdit} disabled={saving} variant='outlined'>
              Hủy chỉnh sửa
            </Button>
            <Button onClick={saveEdits} disabled={saving} variant='contained' color='warning'>
              Lưu
            </Button>
          </>
        )}
        {isAdmin && !editing && !isReceiptInactive && (
          <Button onClick={cancelReceipt} disabled={loading || saving || items.length === 0} variant='contained' color='error'>
            Hủy biên lai
          </Button>
        )}
        <Button onClick={onClose} variant='outlined'>Đóng</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReceiptModal
