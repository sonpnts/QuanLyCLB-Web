'use client'

import { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { toast } from 'react-toastify'

import { API_ENDPOINTS } from '@/constants/apiEndpoints'
import { useAuth } from '@/contexts/authContext'
import paymentService from '@/services/paymentService'
import type { PaymentRecordType, ReceiptZnsStatusType } from '@/types/apps/paymentTypes'
import { paymentMethodLabels, paymentTypeLabels } from '@/types/apps/paymentTypes'
import { apiClient } from '@/utils/apiClient'
import { formatDateTimeVN } from '@/utils/dateTime'
import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'

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
  const [znsStatus, setZnsStatus] = useState<ReceiptZnsStatusType | null>(null)
  const [znsLoading, setZnsLoading] = useState(false)
  const [znsRetrying, setZnsRetrying] = useState(false)

  const fetchReceiptZnsStatus = async (currentReceiptNumber: string, retryIfMissing = false) => {
    setZnsLoading(true)

    try {
      let latestStatus: ReceiptZnsStatusType | null = null
      const totalAttempts = retryIfMissing ? 4 : 1

      for (let attempt = 0; attempt < totalAttempts; attempt++) {
        const response = await apiClient.get<any>(API_ENDPOINTS.payments.receiptZnsStatus(currentReceiptNumber))

        if (response.data?.isSuccess) {
          latestStatus = response.data.data as ReceiptZnsStatusType
          setZnsStatus(latestStatus)

          if (latestStatus.hasLog || !retryIfMissing) {
            return
          }
        } else {
          latestStatus = null
          setZnsStatus(null)
        }

        if (retryIfMissing && attempt < totalAttempts - 1) {
          await new Promise(resolve => window.setTimeout(resolve, 900))
        }
      }

      if (!latestStatus) {
        setZnsStatus(null)
      }
    } catch {
      setZnsStatus(null)
    } finally {
      setZnsLoading(false)
    }
  }

  useEffect(() => {
    if (!open || !receiptNumber) {
      setItems([])
      setEditing(false)
      setDraft({})
      setZnsStatus(null)

      return
    }

    const fetchReceipt = async () => {
      setLoading(true)

      try {
        const response = await apiClient.get<any>(API_ENDPOINTS.payments.byReceipt(receiptNumber))

        if (response.data.isSuccess) {
          setItems(response.data.data)
        } else {
          toast.error(response.data.message || 'Không thể tải chi tiết biên lai.')
        }
      } catch {
        toast.error('Lỗi khi tải chi tiết biên lai.')
      } finally {
        setLoading(false)
      }
    }

    fetchReceipt()
  }, [open, receiptNumber])

  useEffect(() => {
    if (!open || !receiptNumber) {
      setZnsStatus(null)

      return
    }

    void fetchReceiptZnsStatus(receiptNumber, true)
  }, [open, receiptNumber])

  if (!open) return null

  const firstItem = items.length > 0 ? items[0] : null
  const totalAmount = items.reduce((sum, current) => sum + current.amount, 0)
  const isReceiptInactive = items.length > 0 && items.every(item => item.isActive === false)

  const beginEdit = () => {
    const nextDraft: Record<string, { originalAmount: number; amount: number }> = {}

    for (const item of items) {
      nextDraft[item.id] = {
        originalAmount: Number(item.originalAmount ?? item.amount ?? 0),
        amount: Number(item.amount ?? 0)
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
      const response = await apiClient.get<any>(API_ENDPOINTS.payments.byReceipt(receiptNumber))

      if (response.data.isSuccess) {
        setItems(response.data.data)
      } else {
        toast.error(response.data.message || 'Không thể tải chi tiết biên lai.')
      }
    } catch {
      toast.error('Lỗi khi tải chi tiết biên lai.')
    } finally {
      setLoading(false)
    }
  }

  const saveEdits = async () => {
    if (!isAdmin || !firstItem) return

    try {
      setSaving(true)

      const changed = items.filter(item => {
        const currentDraft = draft[item.id]

        if (!currentDraft) return false

        return (
          Number(currentDraft.amount) !== Number(item.amount) ||
          Number(currentDraft.originalAmount) !== Number(item.originalAmount)
        )
      })

      for (const item of changed) {
        const currentDraft = draft[item.id]

        const response = await paymentService.updatePayment(item.id, {
          type: item.type,
          amount: Number(currentDraft.amount || 0),
          originalAmount: Number(currentDraft.originalAmount || 0),
          paymentDate: item.paymentDate,
          method: item.method,
          description: item.description || '',
          transactionRef: item.transactionRef || undefined,
          receiptNumber: item.receiptNumber || undefined,
          classId: item.classId || undefined,
          productId: item.productId || undefined,
          forMonth: item.forMonth || undefined,
          forYear: item.forYear || undefined,
          transferProofImageUrl: item.transferProofImageUrl || undefined,
          collectedByUserId: item.collectedByUserId || undefined,
          isActive: item.isActive !== false
        })

        if (!response.success) {
          throw new Error(response.message || 'Update failed')
        }
      }

      toast.success('Đã cập nhật biên lai.')
      setEditing(false)
      setDraft({})
      await reload()
    } catch {
      toast.error('Không thể cập nhật biên lai.')
    } finally {
      setSaving(false)
    }
  }

  const cancelReceipt = async () => {
    if (!isAdmin || !firstItem || items.length === 0) return

    const confirmed = window.confirm('Hủy biên lai này? Biên lai sẽ không còn tính vào thống kê và coi như chưa thu.')

    if (!confirmed) return

    try {
      setSaving(true)

      for (const item of items) {
        const response = await paymentService.updatePayment(item.id, {
          type: item.type,
          amount: item.amount,
          originalAmount: Number(item.originalAmount ?? item.amount ?? 0),
          paymentDate: item.paymentDate,
          method: item.method,
          description: item.description || '',
          transactionRef: item.transactionRef || undefined,
          receiptNumber: item.receiptNumber || undefined,
          classId: item.classId || undefined,
          productId: item.productId || undefined,
          forMonth: item.forMonth || undefined,
          forYear: item.forYear || undefined,
          transferProofImageUrl: item.transferProofImageUrl || undefined,
          collectedByUserId: item.collectedByUserId || undefined,
          isActive: false
        })

        if (!response.success) {
          throw new Error(response.message || 'Cancel failed')
        }
      }

      toast.success('Đã hủy biên lai.')
      await reload()
    } catch {
      toast.error('Không thể hủy biên lai.')
    } finally {
      setSaving(false)
    }
  }

  const retryZns = async () => {
    if (!receiptNumber || !znsStatus?.canRetry) return

    try {
      setZnsRetrying(true)

      const response = await apiClient.post<any>(API_ENDPOINTS.payments.receiptZnsRetry(receiptNumber))

      if (response.data?.isSuccess) {
        await fetchReceiptZnsStatus(receiptNumber)
        toast.success(response.data.message || 'Đã gửi lại thông báo Zalo.')
      } else {
        toast.error(response.data?.message || 'Không thể gửi lại thông báo Zalo.')
      }
    } catch {
      toast.error('Lỗi khi gửi lại thông báo Zalo.')
    } finally {
      setZnsRetrying(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>
        <Typography variant='h5'>Chi tiết biên lai: {receiptNumber}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display='flex' justifyContent='center' p={4}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Typography textAlign='center' color='text.secondary'>
            Không tìm thấy dữ liệu biên lai.
          </Typography>
        ) : (
          <Grid container spacing={6}>
            <Grid item xs={12} md={firstItem?.transferProofImageUrl ? 7 : 12}>
              {isReceiptInactive && (
                <Box mb={4}>
                  <Typography color='error' fontWeight={600}>
                    Biên lai đã bị hủy.
                  </Typography>
                </Box>
              )}

              <Box mb={4}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Trạng thái Zalo
                </Typography>
                {znsLoading ? (
                  <Box display='flex' alignItems='center' gap={2} mt={1}>
                    <CircularProgress size={18} />
                    <Typography variant='body2'>Đang kiểm tra trạng thái gửi...</Typography>
                  </Box>
                ) : !znsStatus?.hasLog ? (
                  <Typography variant='body1'>Chưa có lịch sử gửi Zalo.</Typography>
                ) : (
                  <Box display='flex' flexDirection='column' gap={1} mt={1}>
                    <Box display='flex' alignItems='center' gap={2} flexWrap='wrap'>
                      <Chip
                        size='small'
                        color={znsStatus.isSent ? 'success' : 'error'}
                        label={znsStatus.isSent ? 'Đã gửi' : 'Gửi thất bại'}
                      />
                      <Typography variant='body2'>Status: {znsStatus.status}</Typography>
                      {znsStatus.sentAtUtc && (
                        <Typography variant='body2'>Lúc gửi: {formatDateTimeVN(znsStatus.sentAtUtc)}</Typography>
                      )}
                    </Box>
                    {znsStatus.errorMessage && (
                      <Typography variant='body2' color={znsStatus.isSent ? 'text.secondary' : 'error'}>
                        {znsStatus.errorMessage}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>

              <Box mb={4}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Học viên
                </Typography>
                <Typography variant='body1' fontWeight={500}>
                  {firstItem?.studentName}
                </Typography>
              </Box>

              <Box mb={4}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Lớp
                </Typography>
                <Typography variant='body1'>{firstItem?.className || '-'}</Typography>
              </Box>

              <Box mb={4}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Người thu tiền
                </Typography>
                <Typography variant='body1'>{firstItem?.collectedByUserName || '-'}</Typography>
              </Box>

              <Box mb={4}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Người tạo
                </Typography>
                <Typography variant='body1'>{firstItem?.createdByUserName || '-'}</Typography>
              </Box>

              <Box mb={4}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Phương thức
                </Typography>
                <Typography variant='body1'>
                  {firstItem?.method !== undefined ? paymentMethodLabels[firstItem.method] : '-'}
                </Typography>
              </Box>

              <Box mb={4}>
                <Typography variant='subtitle2' color='text.secondary'>
                  Ngày thanh toán
                </Typography>
                <Typography variant='body1'>{formatDateTimeVN(firstItem?.paymentDate)}</Typography>
              </Box>

              <Typography variant='h6' mt={6} mb={2}>
                Các hạng mục thu
              </Typography>
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
                            (item.type === 0
                              ? `Học phí ${item.forMonth}/${item.forYear}`
                              : item.type === 1
                                ? 'Lệ phí thi'
                                : 'Khác')}
                        </TableCell>
                        <TableCell>{paymentTypeLabels[item.type]}</TableCell>
                        <TableCell align='right'>
                          {editing ? (
                            <TextField
                              size='small'
                              type='number'
                              inputProps={{ min: 0 }}
                              value={draft[item.id]?.originalAmount ?? item.originalAmount ?? item.amount}
                              onChange={event =>
                                setDraft(prev => ({
                                  ...prev,
                                  [item.id]: {
                                    originalAmount: Number(event.target.value || 0),
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
                              onChange={event =>
                                setDraft(prev => ({
                                  ...prev,
                                  [item.id]: {
                                    originalAmount: prev[item.id]?.originalAmount ?? item.originalAmount ?? item.amount,
                                    amount: Number(event.target.value || 0)
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
                      <TableCell colSpan={3} align='right'>
                        <Typography fontWeight='bold'>Tổng cộng:</Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography fontWeight='bold' color='primary'>
                          {formatCurrency(totalAmount)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {firstItem?.transferProofImageUrl && (
              <Grid item xs={12} md={5}>
                <Typography variant='h6' mb={2}>
                  Ảnh minh chứng chuyển khoản
                </Typography>
                <Divider sx={{ mb: 4 }} />
                <Box
                  component='img'
                  src={firstItem.transferProofImageUrl}
                  alt='Ảnh minh chứng chuyển khoản'
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
        {znsStatus?.canRetry && (
          <Button onClick={retryZns} disabled={znsRetrying || loading} variant='contained' color='info'>
            Gửi lại Zalo
          </Button>
        )}
        <Button onClick={onClose} variant='outlined'>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReceiptModal
