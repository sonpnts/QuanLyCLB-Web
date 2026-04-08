'use client'

import { useState, useRef } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import paymentService from '@/services/paymentService'

// Enum mapping cho backend
const PAYMENT_TYPE_MAP: Record<string, number> = {
  Tuition: 0,
  ExamFee: 1,
  Registration: 2,
  Other: 3
}

const PAYMENT_METHOD_MAP: Record<string, number> = {
  Cash: 0,
  BankTransfer: 1,
  Other: 2
}

interface Props {
  open: boolean
  studentId: string
  studentName: string
  amount: number
  paymentType: string
  classId?: string
  forMonth?: number
  forYear?: number
  examRegistrationId?: string
  description?: string
  onSuccess: () => void
  onClose: () => void
}

const CollectPaymentDialog = ({
  open,
  studentId,
  studentName,
  amount,
  paymentType,
  classId,
  forMonth,
  forYear,
  examRegistrationId,
  description,
  onSuccess,
  onClose
}: Props) => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()
  const [method, setMethod] = useState<'Cash' | 'BankTransfer'>('Cash')
  const [note, setNote] = useState('')
  const [transactionRef, setTransactionRef] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [transferProofUrl, setTransferProofUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setNote('')
    setTransactionRef('')
    setMethod('Cash')
    setTransferProofUrl(null)
    setPreviewUrl(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleMethodChange = (newMethod: 'Cash' | 'BankTransfer') => {
    setMethod(newMethod)
    if (newMethod === 'Cash') {
      setTransferProofUrl(null)
      setPreviewUrl(null)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showNotification('Vui lòng chọn file ảnh (JPG, PNG, ...)', 'error')
      return
    }

    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setTransferProofUrl(null)

    try {
      setUploading(true)
      const result = await paymentService.uploadTransferProof(file)
      if (result.success && result.data?.imageUrl) {
        setTransferProofUrl(result.data.imageUrl)
        showNotification('Upload ảnh thành công', 'success')
      } else {
        setTransferProofUrl(null)
        setPreviewUrl(null)
        showNotification(result.message || 'Upload ảnh thất bại', 'error')
      }
    } catch {
      setTransferProofUrl(null)
      setPreviewUrl(null)
      showNotification('Có lỗi khi upload ảnh', 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (method === 'BankTransfer' && !transferProofUrl) {
      showNotification('Vui lòng upload ảnh chụp màn hình chuyển khoản', 'error')
      return
    }

    try {
      setSaving(true)
      const result = await paymentService.createPayment({
        studentId,
        type: PAYMENT_TYPE_MAP[paymentType] ?? 3,
        amount,
        paymentDate: new Date().toISOString(),
        method: PAYMENT_METHOD_MAP[method] ?? 0,
        description: description || note || undefined,
        transactionRef: transactionRef || undefined,
        transferProofImageUrl: transferProofUrl || undefined,
        classId: classId || undefined,
        forMonth: forMonth || undefined,
        forYear: forYear || undefined,
        examRegistrationId: examRegistrationId || undefined,
        collectedByUserId: auth?.user?.id
      })

      if (result.success) {
        resetForm()
        onSuccess()
      } else {
        showNotification(result.message || 'Thu tiền thất bại', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Thu tiền — {studentName}</DialogTitle>
      <DialogContent className='flex flex-col gap-4 pt-2'>
        {/* Tóm tắt */}
        <Box className='rounded-lg p-3' sx={{ bgcolor: 'action.hover' }}>
          {description && (
            <Typography variant='body2' color='text.secondary' className='mb-1'>
              {description}
            </Typography>
          )}
          <Typography variant='h5' color='primary.main'>
            {amount.toLocaleString('vi-VN')}đ
          </Typography>
        </Box>

        <Divider />

        {/* Phương thức */}
        <Box>
          <Typography variant='body2' className='mb-1 font-medium'>
            Phương thức thanh toán
          </Typography>
          <RadioGroup
            row
            value={method}
            onChange={e => handleMethodChange(e.target.value as 'Cash' | 'BankTransfer')}
          >
            <FormControlLabel value='Cash' control={<Radio />} label='Tiền mặt' />
            <FormControlLabel value='BankTransfer' control={<Radio />} label='Chuyển khoản' />
          </RadioGroup>
        </Box>

        {method === 'BankTransfer' && (
          <>
            <TextField
              label='Mã giao dịch (tùy chọn)'
              size='small'
              fullWidth
              value={transactionRef}
              onChange={e => setTransactionRef(e.target.value)}
            />

            {/* Upload ảnh chuyển khoản - bắt buộc */}
            <Box>
              <Typography variant='body2' className='mb-2 font-medium'>
                Ảnh chụp màn hình chuyển khoản{' '}
                <Typography component='span' color='error' variant='body2'>*</Typography>
              </Typography>

              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {!previewUrl ? (
                <Button
                  variant='outlined'
                  size='small'
                  startIcon={<i className='ri-image-add-line' />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  Chọn ảnh chuyển khoản
                </Button>
              ) : (
                <Box>
                  <Box
                    component='img'
                    src={previewUrl}
                    alt='Ảnh chuyển khoản'
                    sx={{
                      width: '100%',
                      maxHeight: 220,
                      objectFit: 'contain',
                      borderRadius: 1,
                      border: '2px solid',
                      borderColor: transferProofUrl ? 'success.main' : uploading ? 'warning.main' : 'error.main'
                    }}
                  />
                  <Box className='flex items-center gap-2 mt-1'>
                    {uploading ? (
                      <Box className='flex items-center gap-1'>
                        <CircularProgress size={14} />
                        <Typography variant='caption' color='text.secondary'>Đang upload...</Typography>
                      </Box>
                    ) : transferProofUrl ? (
                      <Typography variant='caption' color='success.main'>
                        <i className='ri-checkbox-circle-line' /> Ảnh đã upload thành công
                      </Typography>
                    ) : (
                      <Typography variant='caption' color='error.main'>
                        <i className='ri-error-warning-line' /> Upload thất bại
                      </Typography>
                    )}
                    <Tooltip title='Chọn ảnh khác'>
                      <IconButton size='small' onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        <i className='ri-refresh-line text-sm' />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              )}
            </Box>
          </>
        )}

        <TextField
          label='Ghi chú'
          size='small'
          fullWidth
          multiline
          rows={2}
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving || uploading}>
          Hủy
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={saving || uploading || (method === 'BankTransfer' && !transferProofUrl)}
        >
          {saving ? <CircularProgress size={18} /> : `Thu ${amount.toLocaleString('vi-VN')}đ`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CollectPaymentDialog
