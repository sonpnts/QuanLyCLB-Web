'use client'

import { useEffect, useRef, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import paymentService, { type ExamFeeOptionType, type TuitionQuoteType } from '@/services/paymentService'
import oneTimeFeeService from '@/services/oneTimeFeeService'
import type { OneTimeFeeOptionType } from '@/types/apps/oneTimeFeeTypes'

const PAYMENT_TYPE_MAP: Record<string, number> = {
  Tuition: 0,
  ExamFee: 1,
  Registration: 2,
  Other: 3,
  FacilityFee: 4,
  CodeChangeFee: 5,
  ProductPurchase: 6
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
  tuitionAmount?: number
  tuitionForMonth?: number
  tuitionForYear?: number
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
  tuitionAmount,
  tuitionForMonth,
  tuitionForYear,
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

  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [discountReason, setDiscountReason] = useState('')
  const [tuitionQuote, setTuitionQuote] = useState<TuitionQuoteType | null>(null)
  const [includeTuition, setIncludeTuition] = useState(false)
  const [loadingExamOptions, setLoadingExamOptions] = useState(false)
  const [examFeeOptions, setExamFeeOptions] = useState<ExamFeeOptionType[]>([])
  const [includeExamFee, setIncludeExamFee] = useState(false)
  const [selectedExamRegistrationId, setSelectedExamRegistrationId] = useState('')
  const [oneTimeFeeOptions, setOneTimeFeeOptions] = useState<OneTimeFeeOptionType[]>([])
  const [selectedOneTimeFees, setSelectedOneTimeFees] = useState<Record<string, boolean>>({})

  const resetForm = () => {
    setNote('')
    setTransactionRef('')
    setMethod('Cash')
    setTransferProofUrl(null)
    setPreviewUrl(null)
    setDiscountAmount(0)
    setDiscountReason('')
    setTuitionQuote(null)
    setExamFeeOptions([])
    setIncludeExamFee(false)
    setSelectedExamRegistrationId('')
    setIncludeTuition(false)
    setOneTimeFeeOptions([])
    setSelectedOneTimeFees({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  useEffect(() => {
    let ignore = false

    const loadTuitionQuote = async () => {
      if (!open || paymentType !== 'Tuition' || !classId || !forMonth || !forYear) {
        if (!ignore) {
          setTuitionQuote(null)
        }

        return
      }

      try {
        const res = await paymentService.getTuitionQuote(classId, studentId, forMonth, forYear)

        if (ignore) return

        setTuitionQuote(res.success ? res.data || null : null)
      } catch {
        if (!ignore) {
          setTuitionQuote(null)
        }
      }
    }

    const loadExamFeeOptions = async () => {
      if (!open || paymentType !== 'Tuition' || !classId) return

      try {
        setLoadingExamOptions(true)
        const res = await paymentService.getExamFeeOptions(classId, studentId)

        if (ignore) return

        const options = res.success && res.data ? res.data : []

        setExamFeeOptions(options)

        const suggested = options.find(option => option.isSuggested) || null
        const shouldInclude = Boolean(suggested)

        setIncludeExamFee(shouldInclude)
        setSelectedExamRegistrationId(shouldInclude ? suggested!.registrationId : options[0]?.registrationId || '')
      } catch {
        if (!ignore) {
          setExamFeeOptions([])
          setIncludeExamFee(false)
          setSelectedExamRegistrationId('')
        }
      } finally {
        if (!ignore) setLoadingExamOptions(false)
      }
    }

    loadTuitionQuote()
    loadExamFeeOptions()

    return () => {
      ignore = true
    }
  }, [open, paymentType, classId, studentId, forMonth, forYear])

  useEffect(() => {
    let ignore = false

    const loadOneTimeFeeOptions = async () => {
      if (!open || !classId) return

      const res = await oneTimeFeeService.getOptions(studentId, classId)

      if (ignore) return

      const options = res.success && res.data ? res.data : []

      setOneTimeFeeOptions(options)

      const selected: Record<string, boolean> = {}

      for (const option of options) selected[option.feeCode] = true
      setSelectedOneTimeFees(selected)
    }

    loadOneTimeFeeOptions()

    return () => {
      ignore = true
    }
  }, [open, classId, studentId])

  useEffect(() => {
    if (!open || paymentType !== 'ExamFee') return
    setIncludeTuition(Boolean(tuitionAmount && tuitionAmount > 0))
  }, [open, paymentType, tuitionAmount])

  const handleMethodChange = (newMethod: 'Cash' | 'BankTransfer') => {
    setMethod(newMethod)

    if (newMethod === 'Cash') {
      setTransferProofUrl(null)
      setPreviewUrl(null)
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

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

  const selectedExamFeeAmount =
    paymentType === 'Tuition' && includeExamFee
      ? Number(examFeeOptions.find(option => option.registrationId === selectedExamRegistrationId)?.feeAmount || 0)
      : 0

  const selectedOneTimeFeeAmount = oneTimeFeeOptions.reduce((sum, option) => {
    return sum + (selectedOneTimeFees[option.feeCode] ? Number(option.amount || 0) : 0)
  }, 0)

  const baseTuitionAmount =
    paymentType === 'Tuition'
      ? Number(tuitionQuote?.finalAmount ?? amount ?? 0)
      : Number(tuitionAmount || 0)

  const selectedTuitionAmount = paymentType === 'ExamFee' && includeTuition ? baseTuitionAmount : 0
  const isOneTimeFeeOnly = Number(amount || 0) <= 0 && selectedOneTimeFeeAmount > 0
  const primaryAmount = paymentType === 'Tuition' ? baseTuitionAmount : Number(amount || 0)
  const grossAmount = primaryAmount + selectedExamFeeAmount + selectedTuitionAmount + selectedOneTimeFeeAmount
  const hasTuitionLine = paymentType === 'Tuition' || (paymentType === 'ExamFee' && includeTuition)
  const netAmount = hasTuitionLine ? Math.max(0, grossAmount - Number(discountAmount || 0)) : grossAmount

  const handleSubmit = async () => {
    if (discountAmount > 0 && !hasTuitionLine) {
      showNotification('Giảm trừ chỉ áp dụng cho học phí.', 'error')
      
return
    }

    if (discountAmount > 0 && !discountReason.trim()) {
      showNotification('Vui lòng nhập lý do giảm trừ', 'error')
      
return
    }

    if (method === 'BankTransfer' && !transferProofUrl) {
      showNotification('Vui lòng upload ảnh chụp màn hình chuyển khoản', 'error')
      
return
    }

    if (Number(amount || 0) <= 0 && selectedOneTimeFeeAmount <= 0) {
      showNotification('Vui lòng chọn ít nhất một khoản phí cần thu.', 'error')
      
return
    }

    try {
      setSaving(true)

      const basePayload = {
        studentId,
        paymentDate: new Date().toISOString(),
        method: PAYMENT_METHOD_MAP[method] ?? 0,
        transactionRef: transactionRef || undefined,
        transferProofImageUrl: transferProofUrl || undefined,
        collectedByUserId: auth?.user?.id
      }

      const shouldBulkForTuition =
        paymentType === 'Tuition' && includeExamFee && !!selectedExamRegistrationId && (examFeeOptions ?? []).length > 0

      const shouldBulkForExamFee = paymentType === 'ExamFee' && includeTuition && !!tuitionAmount && tuitionAmount > 0

      const oneTimeFeeItems = oneTimeFeeOptions
        .filter(option => Boolean(selectedOneTimeFees[option.feeCode]))
        .map(option => {
          const typeKey = option.feeCode === 'CSVC' ? 'FacilityFee' : 'CodeChangeFee'

          
return {
            type: PAYMENT_TYPE_MAP[typeKey] ?? 3,
            classId: classId || undefined,
            amount: Number(option.amount || 0),
            description: option.feeName
          }
        })

      const shouldBulkForOneTimeFees = oneTimeFeeItems.length > 0

      const result = shouldBulkForTuition
        ? await paymentService.createBulkPayment({
            ...basePayload,
            items: [
              {
                type: PAYMENT_TYPE_MAP.Tuition,
                classId: classId || undefined,
                forMonth: forMonth || undefined,
                forYear: forYear || undefined,
                description: description || note || undefined,
                discountAmount: discountAmount > 0 ? discountAmount : undefined,
                discountReason: discountAmount > 0 ? discountReason.trim() : undefined
              },
              {
                type: PAYMENT_TYPE_MAP.ExamFee,
                classId: classId || undefined,
                examRegistrationId: selectedExamRegistrationId,
                description: 'Lệ phí thi'
              },
              ...oneTimeFeeItems
            ]
          })
        : shouldBulkForExamFee
          ? await paymentService.createBulkPayment({
              ...basePayload,
              items: [
                {
                  type: PAYMENT_TYPE_MAP.Tuition,
                  classId: classId || undefined,
                  forMonth: tuitionForMonth || forMonth || undefined,
                  forYear: tuitionForYear || forYear || undefined,
                  description: `Học phí tháng ${tuitionForMonth || forMonth}/${tuitionForYear || forYear}`,
                  discountAmount: discountAmount > 0 ? discountAmount : undefined,
                  discountReason: discountAmount > 0 ? discountReason.trim() : undefined
                },
                {
                  type: PAYMENT_TYPE_MAP.ExamFee,
                  classId: classId || undefined,
                  examRegistrationId: examRegistrationId || undefined,
                  description: description || note || 'Lệ phí thi'
                },
                ...oneTimeFeeItems
              ]
            })
          : shouldBulkForOneTimeFees && isOneTimeFeeOnly
            ? await paymentService.createBulkPayment({
                ...basePayload,
                items: oneTimeFeeItems
              })
            : shouldBulkForOneTimeFees
              ? await paymentService.createBulkPayment({
                  ...basePayload,
                  items: [
                    {
                      type: PAYMENT_TYPE_MAP[paymentType] ?? 3,
                      classId: classId || undefined,
                      forMonth: forMonth || undefined,
                      forYear: forYear || undefined,
                      examRegistrationId: examRegistrationId || undefined,
                      amount: Number(amount || 0),
                      description: description || note || undefined,
                      discountAmount: hasTuitionLine && discountAmount > 0 ? discountAmount : undefined,
                      discountReason: hasTuitionLine && discountAmount > 0 ? discountReason.trim() : undefined
                    },
                    ...oneTimeFeeItems
                  ]
                })
              : await paymentService.createPayment({
                  studentId,
                  type: PAYMENT_TYPE_MAP[paymentType] ?? 3,
                  amount,
                  discountAmount: hasTuitionLine && discountAmount > 0 ? discountAmount : undefined,
                  discountReason: hasTuitionLine && discountAmount > 0 ? discountReason.trim() : undefined,
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
      <DialogTitle>{`Thu tiền - ${studentName}`}</DialogTitle>
      <DialogContent className='flex flex-col gap-4 pt-2'>
        <Box className='rounded-lg p-3' sx={{ bgcolor: 'action.hover' }}>
          {description && (
            <Typography variant='body2' color='text.secondary' className='mb-1'>
              {description}
            </Typography>
          )}
          <Typography variant='h5' color='primary.main'>
            {netAmount.toLocaleString('vi-VN')}đ
          </Typography>
        </Box>

        <Divider />

        {paymentType === 'ExamFee' && tuitionAmount && tuitionAmount > 0 && (
          <Box>
            <FormControlLabel
              control={<Checkbox checked={includeTuition} onChange={event => setIncludeTuition(event.target.checked)} />}
              label={`Thu học phí tháng ${tuitionForMonth || forMonth}/${tuitionForYear || forYear} (${Number(tuitionAmount).toLocaleString('vi-VN')}đ)`}
            />
          </Box>
        )}

        {paymentType === 'Tuition' && examFeeOptions.length > 0 && (
          <Box>
            <Box className='flex items-center justify-between gap-2 flex-wrap'>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeExamFee}
                    onChange={event => setIncludeExamFee(event.target.checked)}
                    disabled={loadingExamOptions}
                  />
                }
                label='Thu lệ phí thi'
              />
              {loadingExamOptions && (
                <Box className='flex items-center gap-2'>
                  <CircularProgress size={16} />
                  <Typography variant='caption' color='text.secondary'>
                    Đang tải...
                  </Typography>
                </Box>
              )}
            </Box>

            {includeExamFee && (
              <FormControl size='small' fullWidth sx={{ mt: 1 }}>
                <InputLabel>Kỳ thi</InputLabel>
                <Select
                  label='Kỳ thi'
                  value={selectedExamRegistrationId}
                  onChange={event => setSelectedExamRegistrationId(String(event.target.value))}
                >
                  {examFeeOptions.map(option => (
                    <MenuItem key={option.registrationId} value={option.registrationId}>
                      {option.examSessionName} - {option.targetBeltLevelName} ({Number(option.feeAmount).toLocaleString('vi-VN')}đ)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        )}

        {oneTimeFeeOptions.length > 0 && (
          <Box>
            <Typography variant='body2' className='mb-1 font-medium'>
              Phí 1 lần
            </Typography>
            {oneTimeFeeOptions.map(option => (
              <FormControlLabel
                key={option.feeCode}
                control={
                  <Checkbox
                    checked={Boolean(selectedOneTimeFees[option.feeCode])}
                    onChange={event => setSelectedOneTimeFees(prev => ({ ...prev, [option.feeCode]: event.target.checked }))}
                  />
                }
                label={`${option.feeName} (${Number(option.amount).toLocaleString('vi-VN')}đ)`}
              />
            ))}
          </Box>
        )}

        {hasTuitionLine && (
          <Box>
            <Typography variant='body2' className='mb-1 font-medium'>
              Giảm trừ
            </Typography>
            <TextField
              label='Số tiền giảm'
              size='small'
              fullWidth
              type='number'
              inputProps={{ min: 0 }}
              value={discountAmount}
              onChange={event => setDiscountAmount(Number(event.target.value))}
              InputProps={{ endAdornment: <InputAdornment position='end'>VND</InputAdornment> }}
            />
            <TextField
              label='Lý do giảm trừ'
              size='small'
              fullWidth
              value={discountReason}
              onChange={event => setDiscountReason(event.target.value)}
              required={discountAmount > 0}
              sx={{ mt: 2 }}
              helperText={discountAmount > 0 ? 'Bắt buộc khi có giảm trừ' : undefined}
            />
          </Box>
        )}

        <Box>
          <Typography variant='body2' className='mb-1 font-medium'>
            Phương thức thanh toán
          </Typography>
          <RadioGroup row value={method} onChange={event => handleMethodChange(event.target.value as 'Cash' | 'BankTransfer')}>
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
              onChange={event => setTransactionRef(event.target.value)}
            />

            <Box>
              <Typography variant='body2' className='mb-2 font-medium'>
                Ảnh chụp màn hình chuyển khoản <Typography component='span' color='error' variant='body2'>*</Typography>
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
          onChange={event => setNote(event.target.value)}
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
          {saving ? <CircularProgress size={18} /> : `Thu ${netAmount.toLocaleString('vi-VN')}đ`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CollectPaymentDialog
