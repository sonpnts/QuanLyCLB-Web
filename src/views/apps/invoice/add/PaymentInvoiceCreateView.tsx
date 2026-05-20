'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import classService from '@/services/classService'
import oneTimeFeeService from '@/services/oneTimeFeeService'
import paymentService, { type ExamFeeOptionType, type TuitionQuoteType } from '@/services/paymentService'
import productService from '@/services/productService'
import studentService from '@/services/studentService'
import StudentZaloLinkPromptDialog from '@/components/student/StudentZaloLinkPromptDialog'
import type { ClassType } from '@/types/apps/classTypes'
import type { OneTimeFeeOptionType } from '@/types/apps/oneTimeFeeTypes'
import type { ProductType } from '@/types/apps/productTypes'
import type { StudentType } from '@/types/apps/studentTypes'
import { clearPaymentInvoiceDraft, readPaymentInvoiceDraft } from '@/utils/paymentDraft'
import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'
import type { ClassUserAssignment } from '@/types/apps/classTypes'

const PAYMENT_TYPE_TUITION = 0
const PAYMENT_TYPE_EXAM_FEE = 1
const PAYMENT_TYPE_BUY_PRODUCT = 3
const PAYMENT_TYPE_FACILITY_FEE = 4
const PAYMENT_TYPE_CODE_CHANGE_FEE = 5
const PAYMENT_TYPE_OTHER = 6
const SUPPORTED_ONE_TIME_FEE_CODES = new Set(['CSVC', 'CODE_CHANGE'])

const PAYMENT_METHOD_CASH = 0
const PAYMENT_METHOD_BANK_TRANSFER = 1

const YEARS = Array.from({ length: 4 }, (_, index) => new Date().getFullYear() - 1 + index)

type ProductRow = {
  id: string
  productId: string
  quantity: number
}

type OtherFeeRow = {
  id: string
  description: string
  amount: number
}

const createRowId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const PaymentInvoiceCreateView = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { auth } = useAuth()
  const { showNotification } = useNotification()

  const draftKey = searchParams.get('draft') || ''
  const mode = searchParams.get('mode') || 'create'
  const isReplacementMode = mode === 'replacement'
  const isAdmin = useMemo(
    () => hasPermission(auth?.permissions, 'Payment.Collect.ManageAll') || hasAdminRole(auth?.roles),
    [auth?.permissions, auth?.roles]
  )

  const [loadingInit, setLoadingInit] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [classes, setClasses] = useState<ClassType[]>([])
  const [students, setStudents] = useState<StudentType[]>([])
  const [products, setProducts] = useState<ProductType[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)
  const [tuitionQuote, setTuitionQuote] = useState<TuitionQuoteType | null>(null)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [examFeeOptions, setExamFeeOptions] = useState<ExamFeeOptionType[]>([])
  const [loadingExamOptions, setLoadingExamOptions] = useState(false)
  const [oneTimeFeeOptions, setOneTimeFeeOptions] = useState<OneTimeFeeOptionType[]>([])
  const [loadingOneTimeFees, setLoadingOneTimeFees] = useState(false)
  const [selectedOneTimeFees, setSelectedOneTimeFees] = useState<Record<string, boolean>>({})
  const [productRows, setProductRows] = useState<ProductRow[]>([])
  const [otherFeeRows, setOtherFeeRows] = useState<OtherFeeRow[]>([])
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [draftInfo, setDraftInfo] = useState<ReturnType<typeof readPaymentInvoiceDraft>>(null)
  const [zaloPromptOpen, setZaloPromptOpen] = useState(false)
  const initializedDraftRef = useRef(false)
  const tuitionTouchedRef = useRef(false)
  const examTouchedRef = useRef(false)

  const [form, setForm] = useState({
    classId: '',
    studentId: '',
    collectedByUserId: '',
    method: PAYMENT_METHOD_CASH,
    note: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    tuitionEnabled: false,
    discountAmount: '',
    discountReason: '',
    examEnabled: false,
    selectedExamRegistrationId: ''
  })

  useEffect(() => {
    setDraftInfo(readPaymentInvoiceDraft(draftKey))
  }, [draftKey])

  useEffect(() => {
    const loadInit = async () => {
      try {
        setLoadingInit(true)
        const [classRes, productRes] = await Promise.all([
          isAdmin ? classService.getClasses({ isActive: true, pageSize: 1000 }) : classService.getClassesByUserId(auth?.user?.id || ''),
          productService.getProducts({ pageSize: 300, isActive: true })
        ])

        setClasses((classRes.data || []).filter(item => item.isActive !== false))
        setProducts((productRes.data || []).filter(item => item.isActive))
      } finally {
        setLoadingInit(false)
      }
    }

    if (auth?.user?.id) {
      loadInit()
    }
  }, [auth?.user?.id, isAdmin])

  useEffect(() => {
    if (!draftInfo || initializedDraftRef.current || loadingInit) return

    initializedDraftRef.current = true
    setForm(prev => ({
      ...prev,
      classId: draftInfo.classId || prev.classId,
      studentId: draftInfo.studentId || prev.studentId,
      collectedByUserId: auth?.user?.id || prev.collectedByUserId,
      month: draftInfo.forMonth || prev.month,
      year: draftInfo.forYear || prev.year,
      tuitionEnabled: draftInfo.initialMode === 'tuition',
      examEnabled: draftInfo.initialMode === 'exam'
    }))
  }, [auth?.user?.id, draftInfo, loadingInit])

  useEffect(() => {
    if (!auth?.user?.id) return
    if (form.collectedByUserId) return

    setForm(prev => ({ ...prev, collectedByUserId: auth.user.id }))
  }, [auth?.user?.id, form.collectedByUserId])

  useEffect(() => {
    const loadStudents = async () => {
      if (!form.classId) {
        setStudents([])
        setSelectedStudent(null)
        return
      }

      const response = await studentService.getStudents({ classId: form.classId, pageSize: 1000 })
      const rows = response.data || []

      setStudents(rows)

      if (form.studentId) {
        setSelectedStudent(rows.find(item => item.id === form.studentId) || null)
      } else {
        setSelectedStudent(null)
      }
    }

    loadStudents()
  }, [form.classId, form.studentId])

  useEffect(() => {
    tuitionTouchedRef.current = false
    setTuitionQuote(null)
    setForm(prev => ({
      ...prev,
      tuitionEnabled: false,
      discountAmount: '',
      discountReason: ''
    }))
  }, [form.classId, form.studentId])

  useEffect(() => {
    examTouchedRef.current = false
    setForm(prev => ({
      ...prev,
      examEnabled: false,
      selectedExamRegistrationId: ''
    }))
  }, [form.classId, form.studentId])

  useEffect(() => {
    const loadTuitionQuote = async () => {
      if (!form.classId || !form.studentId) {
        setTuitionQuote(null)
        return
      }

      try {
        setLoadingQuote(true)
        const response = await paymentService.getTuitionQuote(
          form.classId,
          form.studentId,
          form.month,
          form.year,
          undefined
        )

        if (response.success && response.data) {
          setTuitionQuote(response.data)

          if (!form.discountAmount && Number(response.data.suggestedDiscountAmount || 0) > 0) {
            setForm(prev => ({ ...prev, discountAmount: String(response.data!.suggestedDiscountAmount) }))
          }

          if (!tuitionTouchedRef.current && !response.data.alreadyPaid) {
            setForm(prev => ({ ...prev, tuitionEnabled: true }))
          }
        } else {
          setTuitionQuote(null)
          if (!tuitionTouchedRef.current) {
            setForm(prev => ({ ...prev, tuitionEnabled: false }))
          }
        }
      } catch {
        setTuitionQuote(null)
        if (!tuitionTouchedRef.current) {
          setForm(prev => ({ ...prev, tuitionEnabled: false }))
        }
      } finally {
        setLoadingQuote(false)
      }
    }

    loadTuitionQuote()
  }, [form.classId, form.studentId, form.month, form.year, form.discountAmount])

  useEffect(() => {
    const loadExamOptions = async () => {
      if (!form.classId || !form.studentId) {
        setExamFeeOptions([])
        setForm(prev => ({
          ...prev,
          examEnabled: false,
          selectedExamRegistrationId: ''
        }))
        return
      }

      try {
        setLoadingExamOptions(true)
        const response = await paymentService.getExamFeeOptions(form.classId, form.studentId)
        const options = response.data || []

        setExamFeeOptions(options)

        const defaultRegistrationId = options.find(item => item.isSuggested)?.registrationId || options[0]?.registrationId || ''

        setForm(prev => {
          const hasCurrentSelection = options.some(item => item.registrationId === prev.selectedExamRegistrationId)
          const nextSelectedExamRegistrationId = hasCurrentSelection ? prev.selectedExamRegistrationId : defaultRegistrationId

          return {
            ...prev,
            selectedExamRegistrationId: nextSelectedExamRegistrationId,
            examEnabled: options.length > 0 ? true : false
          }
        })
      } finally {
        setLoadingExamOptions(false)
      }
    }

    loadExamOptions()
  }, [form.classId, form.studentId, form.selectedExamRegistrationId])

  useEffect(() => {
    const loadOneTimeFees = async () => {
      if (!form.classId || !form.studentId) {
        setOneTimeFeeOptions([])
        setSelectedOneTimeFees({})
        return
      }

      try {
        setLoadingOneTimeFees(true)
        const response = await oneTimeFeeService.getOptions(form.studentId, form.classId)
        const options = (response.data || []).filter(item => SUPPORTED_ONE_TIME_FEE_CODES.has(String(item.feeCode || '').toUpperCase()))

        setOneTimeFeeOptions(options)
        setSelectedOneTimeFees(prev => {
          const next: Record<string, boolean> = {}

          for (const option of options) {
            next[option.feeCode] = prev[option.feeCode] ?? true
          }

          return next
        })
      } finally {
        setLoadingOneTimeFees(false)
      }
    }

    loadOneTimeFees()
  }, [form.classId, form.studentId, draftInfo?.initialMode])

  useEffect(() => {
    return () => {
      if (proofPreview) {
        URL.revokeObjectURL(proofPreview)
      }
    }
  }, [proofPreview])

  const selectedExamOption = useMemo(
    () => examFeeOptions.find(item => item.registrationId === form.selectedExamRegistrationId) || null,
    [examFeeOptions, form.selectedExamRegistrationId]
  )

  const selectedClass = useMemo(
    () => classes.find(item => item.id === form.classId) || null,
    [classes, form.classId]
  )

  const collectorOptions = useMemo(() => {
    const currentUserId = auth?.user?.id
    const currentUserName = auth?.user?.fullName || auth?.user?.email || 'Người dùng hiện tại'
    const map = new Map<string, string>()

    if (currentUserId) {
      map.set(currentUserId, currentUserName)
    }

    const addAssignment = (assignment?: ClassUserAssignment[]) => {
      ;(assignment || []).forEach(item => {
        if (!map.has(item.userId)) {
          map.set(item.userId, item.fullName)
        }
      })
    }

    addAssignment(selectedClass?.coaches)
    addAssignment(selectedClass?.assistants)

    return Array.from(map.entries()).map(([id, fullName]) => ({ id, fullName }))
  }, [auth?.user?.email, auth?.user?.fullName, auth?.user?.id, selectedClass])

  const selectedOneTimeItems = useMemo(
    () => oneTimeFeeOptions.filter(item => selectedOneTimeFees[item.feeCode]),
    [oneTimeFeeOptions, selectedOneTimeFees]
  )

  const productTotal = useMemo(
    () =>
      productRows.reduce((sum, row) => {
        const product = products.find(item => item.id === row.productId)
        if (!product) return sum

        return sum + Number(product.unitPrice || 0) * Number(row.quantity || 0)
      }, 0),
    [productRows, products]
  )

  const otherFeeTotal = useMemo(
    () => otherFeeRows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [otherFeeRows]
  )

  const oneTimeFeeTotal = useMemo(
    () => selectedOneTimeItems.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [selectedOneTimeItems]
  )

  const tuitionOriginalAmount = Number(tuitionQuote?.monthlyFee || 0)
  const discountAmount = Number(form.discountAmount || 0)
  const tuitionNetAmount = Math.max(0, tuitionOriginalAmount - discountAmount)
  const examFeeAmount = Number(selectedExamOption?.feeAmount || 0)
  const studentHasZalo = Boolean(selectedStudent?.userIdZalo?.trim())
  const shouldSendZaloConfirmation = form.tuitionEnabled && tuitionNetAmount > 0

  const grandTotal =
    (form.tuitionEnabled ? tuitionNetAmount : 0) +
    (form.examEnabled ? examFeeAmount : 0) +
    oneTimeFeeTotal +
    productTotal +
    otherFeeTotal

  const addProductRow = () => {
    setProductRows(prev => [...prev, { id: createRowId(), productId: '', quantity: 1 }])
  }

  const updateProductRow = (id: string, payload: Partial<ProductRow>) => {
    setProductRows(prev => prev.map(row => (row.id === id ? { ...row, ...payload } : row)))
  }

  const removeProductRow = (id: string) => {
    setProductRows(prev => prev.filter(row => row.id !== id))
  }

  const addOtherFeeRow = () => {
    setOtherFeeRows(prev => [...prev, { id: createRowId(), description: '', amount: 0 }])
  }

  const updateOtherFeeRow = (id: string, payload: Partial<OtherFeeRow>) => {
    setOtherFeeRows(prev => prev.map(row => (row.id === id ? { ...row, ...payload } : row)))
  }

  const removeOtherFeeRow = (id: string) => {
    setOtherFeeRows(prev => prev.filter(row => row.id !== id))
  }

  const handleProofFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showNotification('Vui lòng chọn file ảnh cho minh chứng chuyển khoản.', 'error')
      return
    }

    if (proofPreview) {
      URL.revokeObjectURL(proofPreview)
    }

    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
  }

  const buildItems = () => {
    const items: Array<{
      type: number
      classId?: string
      amount?: number
      description?: string
      forMonth?: number
      forYear?: number
      examRegistrationId?: string
      productId?: string
      discountAmount?: number
      discountReason?: string
    }> = []

    if (form.tuitionEnabled) {
      items.push({
        type: PAYMENT_TYPE_TUITION,
        classId: form.classId,
        forMonth: form.month,
        forYear: form.year,
        description: `Học phí tháng ${form.month}/${form.year}`,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        discountReason: discountAmount > 0 ? form.discountReason.trim() : undefined
      })
    }

    if (form.examEnabled && form.selectedExamRegistrationId) {
      items.push({
        type: PAYMENT_TYPE_EXAM_FEE,
        classId: form.classId,
        examRegistrationId: form.selectedExamRegistrationId,
        description: 'Lệ phí thi cấp'
      })
    }

    for (const item of selectedOneTimeItems) {
      const normalizedFeeCode = String(item.feeCode || '').toUpperCase()

      items.push({
        type: normalizedFeeCode === 'CSVC' ? PAYMENT_TYPE_FACILITY_FEE : PAYMENT_TYPE_CODE_CHANGE_FEE,
        classId: form.classId,
        amount: Number(item.amount || 0),
        description: item.feeName
      })
    }

    for (const row of productRows) {
      const quantity = Math.max(1, Number(row.quantity || 1))
      const product = products.find(item => item.id === row.productId)

      if (!product) continue

      for (let index = 0; index < quantity; index += 1) {
        items.push({
          type: PAYMENT_TYPE_BUY_PRODUCT,
          classId: form.classId,
          productId: row.productId,
          description: product.name
        })
      }
    }

    for (const row of otherFeeRows) {
      if (!row.description.trim() || Number(row.amount || 0) <= 0) continue

      items.push({
        type: PAYMENT_TYPE_OTHER,
        classId: form.classId,
        amount: Number(row.amount),
        description: row.description.trim()
      })
    }

    return items
  }

  const submitPayment = async (items: ReturnType<typeof buildItems>, effectiveCollectorId: string, sendZaloConfirmation: boolean) => {
    try {
      setSubmitting(true)

      let transferProofImageUrl: string | undefined

      if (form.method === PAYMENT_METHOD_BANK_TRANSFER && proofFile) {
        setUploading(true)
        const uploadResponse = await paymentService.uploadTransferProof(proofFile)
        setUploading(false)

        if (!uploadResponse.success || !uploadResponse.data?.imageUrl) {
          showNotification(uploadResponse.message || 'Upload ảnh chuyển khoản thất bại.', 'error')
          return
        }

        transferProofImageUrl = uploadResponse.data.imageUrl
      }

      if (items.length === 1) {
        const single = items[0]
        const response = await paymentService.createPayment({
          studentId: form.studentId,
          classId: single.classId,
          type: single.type,
          amount: single.amount,
          description: single.description,
          forMonth: single.forMonth,
          forYear: single.forYear,
          examRegistrationId: single.examRegistrationId,
          productId: single.productId,
          discountAmount: single.discountAmount,
          discountReason: single.discountReason,
          paymentDate: new Date().toISOString(),
          method: form.method,
          transferProofImageUrl,
          collectedByUserId: effectiveCollectorId,
          sendZaloConfirmation
        })

        if (!response.success || !response.data?.receiptNumber) {
          showNotification(response.message || 'Tạo phiếu thu thất bại.', 'error')
          return
        }

        clearPaymentInvoiceDraft(draftKey)
        router.push(`/apps/invoice/preview/${encodeURIComponent(response.data.receiptNumber)}`)
        return
      }

      const bulkResponse = await paymentService.createBulkPayment({
        studentId: form.studentId,
        paymentDate: new Date().toISOString(),
        method: form.method,
        transferProofImageUrl,
        collectedByUserId: effectiveCollectorId,
        sendZaloConfirmation,
        items
      })

      const createdRows = Array.isArray(bulkResponse.data) ? bulkResponse.data : []
      const receiptNumber = createdRows[0]?.receiptNumber

      if (!bulkResponse.success || !receiptNumber) {
        showNotification(bulkResponse.message || 'Tạo phiếu thu thất bại.', 'error')
        return
      }

      clearPaymentInvoiceDraft(draftKey)
      router.push(`/apps/invoice/preview/${encodeURIComponent(receiptNumber)}`)
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  const handleSubmit = async (sendZaloOverride?: boolean) => {
    const effectiveCollectorId = isAdmin ? form.collectedByUserId || auth?.user?.id : auth?.user?.id

    if (!effectiveCollectorId) {
      showNotification('Không xác định được người thu tiền.', 'error')
      return
    }

    if (!form.classId) {
      showNotification('Vui lòng chọn lớp hiện tại.', 'error')
      return
    }

    if (!form.studentId) {
      showNotification('Vui lòng chọn học viên.', 'error')
      return
    }

    if (form.tuitionEnabled) {
      if (!tuitionQuote) {
        showNotification('Chưa tải được học phí tháng này.', 'error')
        return
      }

      if (tuitionQuote.alreadyPaid) {
        showNotification('Học phí tháng này đã thanh toán, không thể thu trùng.', 'error')
        return
      }
    }

    if (discountAmount > 0 && !form.tuitionEnabled) {
      showNotification('Giảm trừ chỉ áp dụng cho học phí.', 'error')
      return
    }

    if (discountAmount > 0 && !form.discountReason.trim()) {
      showNotification('Vui lòng nhập lý do giảm trừ.', 'error')
      return
    }

    if (form.examEnabled && !form.selectedExamRegistrationId) {
      showNotification('Vui lòng chọn đăng ký thi cấp.', 'error')
      return
    }

    for (const row of productRows) {
      if (!row.productId) {
        showNotification('Vui lòng chọn sản phẩm.', 'error')
        return
      }

      if (Number(row.quantity || 0) < 1) {
        showNotification('Số lượng sản phẩm phải lớn hơn hoặc bằng 1.', 'error')
        return
      }
    }

    for (const row of otherFeeRows) {
      if ((row.description.trim() && Number(row.amount || 0) <= 0) || (!row.description.trim() && Number(row.amount || 0) > 0)) {
        showNotification('Khoản phí khác cần đủ mô tả và số tiền hợp lệ.', 'error')
        return
      }
    }

    const items = buildItems()

    if (items.length === 0) {
      showNotification('Vui lòng chọn ít nhất một khoản thu.', 'error')
      return
    }

    if (form.method === PAYMENT_METHOD_BANK_TRANSFER && !proofFile) {
      showNotification('Chuyển khoản bắt buộc có ảnh minh chứng.', 'error')
      return
    }

    if (sendZaloOverride === undefined && shouldSendZaloConfirmation && !studentHasZalo) {
      setZaloPromptOpen(true)
      return
    }

    await submitPayment(items, effectiveCollectorId, sendZaloOverride ?? (shouldSendZaloConfirmation && studentHasZalo))
  }

  return (
    <Stack spacing={4}>
      <Box className='flex items-center justify-between gap-3 flex-wrap'>
        <div>
          <Typography variant='h4'>Tạo phiếu thu</Typography>
          <Typography variant='body2' color='text.secondary'>
            Chọn học viên và các khoản cần thu trong cùng một biên lai.
          </Typography>
        </div>
        <Button variant='outlined' onClick={() => router.push('/apps/payment/collect')} startIcon={<i className='ri-arrow-left-line' />}>
          Quay lại trang thu tiền
        </Button>
      </Box>

      {loadingInit ? (
        <Box className='flex justify-center p-10'>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={4}>
              <Card>
                <CardHeader title='Thông tin chung' />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Lớp hiện tại</InputLabel>
                        <Select
                          label='Lớp hiện tại'
                          value={form.classId}
                          onChange={event =>
                            setForm(prev => ({
                              ...prev,
                              classId: String(event.target.value),
                              studentId: ''
                            }))
                          }
                        >
                          {classes.map(item => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.code ? `${item.code} - ${item.name}` : item.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Học viên</InputLabel>
                        <Select
                          label='Học viên'
                          value={form.studentId}
                          disabled={!form.classId}
                          onChange={event => {
                            const studentId = String(event.target.value)
                            const matched = students.find(item => item.id === studentId) || null

                            setSelectedStudent(matched)
                            setForm(prev => ({ ...prev, studentId }))
                          }}
                        >
                          {students.map(item => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.fullName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: isAdmin ? 4 : 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>Phương thức</InputLabel>
                        <Select
                          label='Phương thức'
                          value={String(form.method)}
                          onChange={event => setForm(prev => ({ ...prev, method: Number(event.target.value) }))}
                        >
                          <MenuItem value={String(PAYMENT_METHOD_CASH)}>Tiền mặt</MenuItem>
                          <MenuItem value={String(PAYMENT_METHOD_BANK_TRANSFER)}>Chuyển khoản</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    {isAdmin ? (
                      <Grid size={{ xs: 12, md: 4 }}>
                        <FormControl fullWidth>
                          <InputLabel>Người thu</InputLabel>
                          <Select
                            label='Người thu'
                            value={form.collectedByUserId}
                            onChange={event => setForm(prev => ({ ...prev, collectedByUserId: String(event.target.value) }))}
                          >
                            {collectorOptions.map(item => (
                              <MenuItem key={item.id} value={item.id}>
                                {item.fullName}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    ) : null}
                    <Grid size={{ xs: 12, md: isAdmin ? 12 : 12 }}>
                      <TextField fullWidth label='Ghi chú chung' value={form.note} onChange={event => setForm(prev => ({ ...prev, note: event.target.value }))} />
                    </Grid>
                    {form.method === PAYMENT_METHOD_BANK_TRANSFER && (
                      <Grid size={{ xs: 12 }}>
                        <Stack spacing={2}>
                          <Button component='label' variant='outlined' startIcon={uploading ? <CircularProgress size={16} /> : <i className='ri-image-add-line' />}>
                            Chọn ảnh minh chứng
                            <input hidden type='file' accept='image/*' onChange={handleProofFileChange} />
                          </Button>
                          {proofPreview && (
                            <Box component='img' src={proofPreview} alt='Minh chứng chuyển khoản' sx={{ width: 220, maxWidth: '100%', borderRadius: 1 }} />
                          )}
                        </Stack>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title='Học phí tháng' />
                <CardContent>
                  <Stack spacing={3}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.tuitionEnabled}
                          onChange={event => {
                            tuitionTouchedRef.current = true
                            setForm(prev => ({ ...prev, tuitionEnabled: event.target.checked }))
                          }}
                        />
                      }
                      label='Thu học phí tháng'
                    />
                    {form.tuitionEnabled && (
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <FormControl fullWidth>
                            <InputLabel>Tháng</InputLabel>
                            <Select label='Tháng' value={String(form.month)} onChange={event => setForm(prev => ({ ...prev, month: Number(event.target.value) }))}>
                              {Array.from({ length: 12 }, (_, index) => index + 1).map(month => (
                                <MenuItem key={month} value={String(month)}>
                                  Tháng {month}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <FormControl fullWidth>
                            <InputLabel>Năm</InputLabel>
                            <Select label='Năm' value={String(form.year)} onChange={event => setForm(prev => ({ ...prev, year: Number(event.target.value) }))}>
                              {YEARS.map(year => (
                                <MenuItem key={year} value={String(year)}>
                                  {year}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField fullWidth label='Giảm trừ' type='number' value={form.discountAmount} onChange={event => setForm(prev => ({ ...prev, discountAmount: event.target.value }))} />
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField fullWidth label='Lý do giảm trừ' value={form.discountReason} onChange={event => setForm(prev => ({ ...prev, discountReason: event.target.value }))} />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          {loadingQuote ? (
                            <Alert severity='info'>Đang tính học phí...</Alert>
                          ) : tuitionQuote ? (
                            <Stack spacing={1}>
                              <Typography>Học phí gốc: {formatCurrency(Number(tuitionQuote.monthlyFee || 0))}</Typography>
                              {Number(tuitionQuote.suggestedDiscountAmount || 0) > 0 && (
                                <Typography color='warning.main'>Giảm trừ gợi ý: {formatCurrency(Number(tuitionQuote.suggestedDiscountAmount || 0))}</Typography>
                              )}
                              <Typography color='primary.main' fontWeight={700}>
                                Số tiền thu: {formatCurrency(tuitionNetAmount)}
                              </Typography>
                              {tuitionQuote.alreadyPaid && <Alert severity='warning'>Học phí tháng này đã thanh toán.</Alert>}
                            </Stack>
                          ) : (
                            <Alert severity='info'>Chọn lớp và học viên để tính học phí.</Alert>
                          )}
                        </Grid>
                      </Grid>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title='Lệ phí thi cấp' />
                <CardContent>
                  <Stack spacing={3}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.examEnabled}
                          onChange={event => {
                            examTouchedRef.current = true
                            setForm(prev => ({ ...prev, examEnabled: event.target.checked }))
                          }}
                        />
                      }
                      label='Thu lệ phí thi cấp'
                    />
                    {form.examEnabled && (
                      <>
                        <FormControl fullWidth>
                          <InputLabel>Danh sách thi cấp</InputLabel>
                          <Select
                            label='Danh sách thi cấp'
                            value={form.selectedExamRegistrationId}
                            onChange={event => setForm(prev => ({ ...prev, selectedExamRegistrationId: String(event.target.value) }))}
                          >
                            {loadingExamOptions ? (
                              <MenuItem value=''>Đang tải...</MenuItem>
                            ) : examFeeOptions.length === 0 ? (
                              <MenuItem value=''>Không có đăng ký thi cấp hợp lệ</MenuItem>
                            ) : (
                              examFeeOptions.map(item => (
                                <MenuItem key={item.registrationId} value={item.registrationId}>
                                  {item.examSessionName} - {item.targetBeltLevelName} - {formatCurrency(Number(item.feeAmount || 0))}
                                </MenuItem>
                              ))
                            )}
                          </Select>
                        </FormControl>
                        {selectedExamOption && <Alert severity='info'>Mức thu lệ phí thi: {formatCurrency(examFeeAmount)}</Alert>}
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title='Các loại phí cần thu' />
                <CardContent>
                  {loadingOneTimeFees ? (
                    <Alert severity='info'>Đang tải danh sách phí 1 lần...</Alert>
                  ) : oneTimeFeeOptions.length === 0 ? (
                    <Alert severity='success'>Học viên hiện không còn phí 1 lần nào chưa đóng.</Alert>
                  ) : (
                    <Stack spacing={2}>
                      {oneTimeFeeOptions.map(option => (
                        <Paper key={option.feeCode} variant='outlined' className='p-3'>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={Boolean(selectedOneTimeFees[option.feeCode])}
                                onChange={event =>
                                  setSelectedOneTimeFees(prev => ({
                                    ...prev,
                                    [option.feeCode]: event.target.checked
                                  }))
                                }
                              />
                            }
                            label={`${option.feeName} - ${formatCurrency(Number(option.amount || 0))}`}
                          />
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader
                  title='Mua sản phẩm'
                  action={
                    <Button variant='outlined' size='small' onClick={addProductRow} startIcon={<i className='ri-add-line' />}>
                      Thêm sản phẩm
                    </Button>
                  }
                />
                <CardContent>
                  {productRows.length === 0 ? (
                    <Alert severity='info'>Chưa có sản phẩm nào được chọn.</Alert>
                  ) : (
                    <Stack spacing={3}>
                      {productRows.map(row => {
                        const product = products.find(item => item.id === row.productId)
                        const rowTotal = Number(product?.unitPrice || 0) * Number(row.quantity || 0)

                        return (
                          <Grid container spacing={3} key={row.id} alignItems='center'>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <FormControl fullWidth>
                                <InputLabel>Sản phẩm</InputLabel>
                                <Select label='Sản phẩm' value={row.productId} onChange={event => updateProductRow(row.id, { productId: String(event.target.value) })}>
                                  {products.map(item => (
                                    <MenuItem key={item.id} value={item.id}>
                                      {item.name} - {formatCurrency(Number(item.unitPrice || 0))}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                              <TextField fullWidth label='Số lượng' type='number' value={row.quantity} onChange={event => updateProductRow(row.id, { quantity: Number(event.target.value) })} />
                            </Grid>
                            <Grid size={{ xs: 10, md: 2 }}>
                              <Typography color='primary.main' fontWeight={600}>
                                {formatCurrency(rowTotal)}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 2, md: 1 }}>
                              <IconButton color='error' onClick={() => removeProductRow(row.id)}>
                                <i className='ri-delete-bin-line' />
                              </IconButton>
                            </Grid>
                          </Grid>
                        )
                      })}
                    </Stack>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader
                  title='Phí khác'
                  action={
                    <Button variant='outlined' size='small' onClick={addOtherFeeRow} startIcon={<i className='ri-add-line' />}>
                      Thêm khoản phí
                    </Button>
                  }
                />
                <CardContent>
                  {otherFeeRows.length === 0 ? (
                    <Alert severity='info'>Chưa có khoản phí khác nào.</Alert>
                  ) : (
                    <Stack spacing={3}>
                      {otherFeeRows.map(row => (
                        <Grid container spacing={3} key={row.id} alignItems='center'>
                          <Grid size={{ xs: 12, md: 7 }}>
                            <TextField fullWidth label='Mô tả khoản thu' value={row.description} onChange={event => updateOtherFeeRow(row.id, { description: event.target.value })} />
                          </Grid>
                          <Grid size={{ xs: 10, md: 4 }}>
                            <TextField fullWidth label='Số tiền' type='number' value={row.amount} onChange={event => updateOtherFeeRow(row.id, { amount: Number(event.target.value) })} />
                          </Grid>
                          <Grid size={{ xs: 2, md: 1 }}>
                            <IconButton color='error' onClick={() => removeOtherFeeRow(row.id)}>
                              <i className='ri-delete-bin-line' />
                            </IconButton>
                          </Grid>
                        </Grid>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Card>
              <CardHeader title='Tổng hợp biên lai' />
              <CardContent>
                <Stack spacing={2}>
                  <Paper variant='outlined' className='p-4'>
                    <Stack spacing={1.5}>
                      <Typography variant='subtitle1' className='font-medium'>
                        Thông tin học viên
                      </Typography>
                      <div className='flex items-center justify-between gap-3'>
                        <Typography color='text.secondary'>Họ tên</Typography>
                        <Typography fontWeight={600} className='text-right'>
                          {selectedStudent?.fullName || '-'}
                        </Typography>
                      </div>
                      <div className='flex items-center justify-between gap-3'>
                        <Typography color='text.secondary'>Cấp đai hiện tại</Typography>
                        <Typography className='text-right'>{selectedStudent?.beltLevelName || '-'}</Typography>
                      </div>
                      <div className='flex items-center justify-between gap-3'>
                        <Typography color='text.secondary'>Lớp học</Typography>
                        <Typography className='text-right'>{selectedClass?.name || draftInfo?.className || '-'}</Typography>
                      </div>
                    </Stack>
                  </Paper>
                  <div className='flex items-center justify-between'>
                    <Typography color='text.secondary'>Học phí</Typography>
                    <Typography>{form.tuitionEnabled ? formatCurrency(tuitionNetAmount) : '-'}</Typography>
                  </div>
                  <div className='flex items-center justify-between'>
                    <Typography color='text.secondary'>Lệ phí thi cấp</Typography>
                    <Typography>{form.examEnabled ? formatCurrency(examFeeAmount) : '-'}</Typography>
                  </div>
                  <div className='flex items-center justify-between'>
                    <Typography color='text.secondary'>Phí 1 lần</Typography>
                    <Typography>{oneTimeFeeTotal > 0 ? formatCurrency(oneTimeFeeTotal) : '-'}</Typography>
                  </div>
                  <div className='flex items-center justify-between'>
                    <Typography color='text.secondary'>Sản phẩm</Typography>
                    <Typography>{productTotal > 0 ? formatCurrency(productTotal) : '-'}</Typography>
                  </div>
                  <div className='flex items-center justify-between'>
                    <Typography color='text.secondary'>Phí khác</Typography>
                    <Typography>{otherFeeTotal > 0 ? formatCurrency(otherFeeTotal) : '-'}</Typography>
                  </div>
                  <Divider />
                  <div className='flex items-center justify-between'>
                    <Typography variant='h6'>Tổng thu</Typography>
                    <Typography variant='h5' color='primary.main'>
                      {formatCurrency(grandTotal)}
                    </Typography>
                  </div>
                  <Button
                    fullWidth
                    variant='contained'
                    size='large'
                    disabled={submitting || buildItems().length === 0}
                    onClick={() => void handleSubmit()}
                    startIcon={submitting ? <CircularProgress size={18} color='inherit' /> : <i className='ri-secure-payment-line' />}
                  >
                    Tạo biên lai
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <StudentZaloLinkPromptDialog
        open={zaloPromptOpen}
        student={selectedStudent}
        skipLabel='Không gửi'
        message='Hãy thêm liên kết Zalo để thông báo xác nhận. Chọn không sẽ không gửi thông báo xác nhận cho phiếu thu này.'
        onClose={() => setZaloPromptOpen(false)}
        onSkip={() => {
          setZaloPromptOpen(false)
          void handleSubmit(false)
        }}
        onLinked={updatedStudent => {
          setStudents(prev => prev.map(item => (item.id === updatedStudent.id ? updatedStudent : item)))
          setSelectedStudent(updatedStudent)
          setZaloPromptOpen(false)
          void handleSubmit(true)
        }}
      />
    </Stack>
  )
}

export default PaymentInvoiceCreateView



