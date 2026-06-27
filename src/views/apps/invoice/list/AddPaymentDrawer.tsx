'use client'

import { useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import AppBar from '@mui/material/AppBar'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'

import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import classService from '@/services/classService'
import paymentService, { type ExamFeeOptionType, type TuitionQuoteType } from '@/services/paymentService'
import productService from '@/services/productService'
import type { ClassType } from '@/types/apps/classTypes'
import type { PaymentRecordType } from '@/types/apps/paymentTypes'
import type { ProductType } from '@/types/apps/productTypes'
import type { StudentType } from '@/types/apps/studentTypes'
import { hasPermission } from '@/utils/permissionUtils'
import { hasAdminRole } from '@/utils/roleUtils'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<PaymentRecordType[]>>
  mode?: 'normal' | 'replacement'
}

type AddOnProductItem = {
  id: string
  productId: string
  quantity: number
}

type TuitionMonthItem = {
  id: string
  month: number
  year: number
}

const PAYMENT_TYPE_TUITION = 0
const PAYMENT_TYPE_EXAM_FEE = 1
const PAYMENT_TYPE_PRODUCT = 6

const PAYMENT_METHOD_CASH = 0
const PAYMENT_METHOD_BANK_TRANSFER = 1

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const createEmptyAddOnProduct = (): AddOnProductItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  productId: '',
  quantity: 1
})

const createTuitionMonthItem = (month = new Date().getMonth() + 1, year = new Date().getFullYear()): TuitionMonthItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  month,
  year
})

const AddPaymentDrawer = ({ open, handleClose, setData, mode = 'normal' }: Props) => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()

  const isAdmin = useMemo(
    () => hasPermission(auth?.permissions, 'Payment.Collect.ManageAll') || hasAdminRole(auth?.roles),
    [auth?.permissions, auth?.roles]
  )

  const [classes, setClasses] = useState<ClassType[]>([])
  const [students, setStudents] = useState<StudentType[]>([])
  const [products, setProducts] = useState<ProductType[]>([])
  const [collectors, setCollectors] = useState<{ id: string; fullName: string }[]>([])
  const [examFeeOptions, setExamFeeOptions] = useState<ExamFeeOptionType[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null)
  const [selectedExamOptionId, setSelectedExamOptionId] = useState('')
  const [tuitionMonths, setTuitionMonths] = useState<TuitionMonthItem[]>([createTuitionMonthItem()])
  const [tuitionQuotes, setTuitionQuotes] = useState<Record<string, TuitionQuoteType | null>>({})

  const [loadingInit, setLoadingInit] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [loadingExamOptions, setLoadingExamOptions] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [proofImageFile, setProofImageFile] = useState<File | null>(null)
  const [addOnProducts, setAddOnProducts] = useState<AddOnProductItem[]>([])

  const [formData, setFormData] = useState({
    classId: '',
    coachId: '',
    collectedByUserId: '',
    studentId: '',
    type: PAYMENT_TYPE_TUITION,
    paymentDate: new Date().toISOString().split('T')[0],
    method: PAYMENT_METHOD_CASH,
    productId: '',
    examRegistrationId: '',
    discountAmount: '',
    discountReason: '',
    description: ''
  })

  const selectedExamOption = useMemo(
    () => examFeeOptions.find(x => x.registrationId === selectedExamOptionId) || null,
    [examFeeOptions, selectedExamOptionId]
  )

  const tuitionMonthSummaries = useMemo(
    () =>
      tuitionMonths.map(item => ({
        item,
        quote: tuitionQuotes[item.id] || null
      })),
    [tuitionMonths, tuitionQuotes]
  )

  const originalAmount = useMemo(() => {
    if (formData.type === PAYMENT_TYPE_TUITION) {
      return tuitionMonthSummaries.reduce((sum, entry) => sum + Number(entry.quote?.monthlyFee || 0), 0)
    }

    if (formData.type === PAYMENT_TYPE_EXAM_FEE) return Number(selectedExamOption?.feeAmount || 0)
    if (formData.type === PAYMENT_TYPE_PRODUCT) return Number(selectedProduct?.unitPrice || 0)

    return 0
  }, [formData.type, selectedExamOption?.feeAmount, selectedProduct?.unitPrice, tuitionMonthSummaries])

  const payableAmount = useMemo(() => {
    if (formData.type === PAYMENT_TYPE_TUITION) {
      return tuitionMonthSummaries.reduce((sum, entry) => sum + Number(entry.quote?.finalAmount || 0), 0)
    }

    return originalAmount
  }, [formData.type, originalAmount, tuitionMonthSummaries])

  const discountAmount = Number(formData.discountAmount || 0)
  const finalAmount = Math.max(0, payableAmount - discountAmount)

  const addOnProductsAmount = useMemo(
    () =>
      addOnProducts.reduce((sum, item) => {
        const product = products.find(x => x.id === item.productId)

        if (!product) return sum

        return sum + product.unitPrice * item.quantity
      }, 0),
    [addOnProducts, products]
  )

  const totalCollectAmount = finalAmount + addOnProductsAmount

  const resetForm = () => {
    setStudents([])
    setExamFeeOptions([])
    setSelectedStudent(null)
    setSelectedProduct(null)
    setSelectedExamOptionId('')
    setTuitionMonths([createTuitionMonthItem()])
    setTuitionQuotes({})
    setProofImageFile(null)
    setAddOnProducts([])
    setFormData({
      classId: '',
      coachId: '',
      collectedByUserId: '',
      studentId: '',
      type: PAYMENT_TYPE_TUITION,
      paymentDate: new Date().toISOString().split('T')[0],
      method: PAYMENT_METHOD_CASH,
      productId: '',
      examRegistrationId: '',
      discountAmount: '',
      discountReason: '',
      description: ''
    })
  }

  const addAddOnProductRow = () => {
    setAddOnProducts(prev => [...prev, createEmptyAddOnProduct()])
  }

  const removeAddOnProductRow = (rowId: string) => {
    setAddOnProducts(prev => prev.filter(x => x.id !== rowId))
  }

  const updateAddOnProductRow = (rowId: string, payload: Partial<AddOnProductItem>) => {
    setAddOnProducts(prev => prev.map(item => (item.id === rowId ? { ...item, ...payload } : item)))
  }

  const addTuitionMonthRow = () => {
    setTuitionMonths(prev => {
      const lastRow = prev[prev.length - 1]

      if (!lastRow) return [createTuitionMonthItem()]

      const nextMonth = lastRow.month === 12 ? 1 : lastRow.month + 1
      const nextYear = lastRow.month === 12 ? lastRow.year + 1 : lastRow.year

      return [...prev, createTuitionMonthItem(nextMonth, nextYear)]
    })
  }

  const removeTuitionMonthRow = (rowId: string) => {
    setTuitionMonths(prev => (prev.length === 1 ? prev : prev.filter(x => x.id !== rowId)))
    setTuitionQuotes(prev => {
      const next = { ...prev }

      delete next[rowId]

      return next
    })
  }

  const updateTuitionMonthRow = (rowId: string, payload: Partial<Omit<TuitionMonthItem, 'id'>>) => {
    setTuitionMonths(prev => prev.map(item => (item.id === rowId ? { ...item, ...payload } : item)))
  }

  useEffect(() => {
    const loadInitData = async () => {
      setLoadingInit(true)

      try {
        const [classRes, productRes] = await Promise.all([
          classService.getClasses({ isActive: true, pageSize: 1000 }),
          productService.getSaleOptions()
        ])

        if (classRes.success && classRes.data) {
          const filteredClasses = isAdmin
            ? classRes.data
            : classRes.data.filter(
                item =>
                  item.instructorId === auth?.user.id ||
                  (Array.isArray(item.coachIds) && item.coachIds.includes(auth?.user.id || ''))
              )

          setClasses(filteredClasses)
        }

        if (productRes.success && productRes.data) {
          setProducts(productRes.data.filter(item => item.isActive))
        }
      } catch {
        showNotification('Không thể tải dữ liệu tạo thanh toán.', 'error')
      } finally {
        setLoadingInit(false)
      }
    }

    if (open) {
      loadInitData()
    } else {
      resetForm()
    }
  }, [open, auth?.user.id, isAdmin, showNotification])

  useEffect(() => {
    const loadCollectors = async () => {
      if (!open || !isAdmin || mode !== 'replacement') return

      try {
        const userService = (await import('@/services/userService')).default
        const res = await userService.getUsers({ IsActive: true, PageSize: 1000 })
        const rows = (res.data || []).map(u => ({ id: u.id, fullName: u.fullName || u.email || u.id }))

        setCollectors(rows)
      } catch {
        setCollectors([])
      }
    }

    loadCollectors()
  }, [open, isAdmin, mode])

  useEffect(() => {
    if (!open || mode !== 'replacement' || !formData.classId) return

    const cls = classes.find(x => x.id === formData.classId)
    const leadId =
      cls?.leadInstructorId ||
      cls?.instructorId ||
      cls?.coaches?.find(c => c.isLeadInstructor)?.userId ||
      cls?.coaches?.[0]?.userId ||
      ''

    setFormData(prev => {
      const nextCoachId = prev.coachId || leadId || ''
      const nextCollectorId = prev.collectedByUserId || nextCoachId || auth?.user?.id || ''

      return { ...prev, coachId: nextCoachId, collectedByUserId: nextCollectorId }
    })
  }, [open, mode, formData.classId, classes, auth?.user?.id])

  useEffect(() => {
    const loadStudentsByClass = async () => {
      if (!formData.classId) {
        setStudents([])
        setSelectedStudent(null)
        setFormData(prev => ({ ...prev, studentId: '' }))

        return
      }

      setLoadingStudents(true)

      try {
        const response = await classService.getClassStudents(formData.classId, { pageNumber: 1, pageSize: 5000 })

        if (response.success && response.data) {
          setStudents(response.data.records || [])
        } else {
          setStudents([])
          showNotification(response.message || 'Không thể tải danh sách học viên của lớp.', 'error')
        }
      } catch {
        setStudents([])
        showNotification('Không thể tải danh sách học viên của lớp.', 'error')
      } finally {
        setLoadingStudents(false)
      }
    }

    if (open) {
      loadStudentsByClass()
    }
  }, [formData.classId, open, showNotification])

  useEffect(() => {
    let ignore = false

    const loadTuitionQuotes = async () => {
      if (formData.type !== PAYMENT_TYPE_TUITION || !formData.classId || !formData.studentId) {
        if (!ignore) {
          setTuitionQuotes({})
        }

        return
      }

      setLoadingQuote(true)

      try {
        const quoteEntries = await Promise.all(
          tuitionMonths.map(async item => {
            const response = await paymentService.getTuitionQuote(
              formData.classId,
              formData.studentId,
              item.month,
              item.year,
              formData.paymentDate
            )

            return [item.id, response.success ? response.data || null : null] as const
          })
        )

        if (ignore) return

        const nextQuotes: Record<string, TuitionQuoteType | null> = {}

        for (const [itemId, quote] of quoteEntries) {
          nextQuotes[itemId] = quote
        }

        setTuitionQuotes(nextQuotes)
      } catch {
        if (!ignore) {
          setTuitionQuotes({})
        }
      } finally {
        if (!ignore) {
          setLoadingQuote(false)
        }
      }
    }

    if (open) {
      void loadTuitionQuotes()
    }

    return () => {
      ignore = true
    }
  }, [formData.classId, formData.studentId, formData.paymentDate, formData.type, open, tuitionMonths])

  useEffect(() => {
    const loadExamFeeOptions = async () => {
      if (formData.type !== PAYMENT_TYPE_EXAM_FEE || !formData.classId || !formData.studentId) {
        setExamFeeOptions([])
        setSelectedExamOptionId('')

        return
      }

      setLoadingExamOptions(true)

      try {
        const response = await paymentService.getExamFeeOptions(formData.classId, formData.studentId)

        if (response.success && response.data) {
          setExamFeeOptions(response.data)
        } else {
          setExamFeeOptions([])
          showNotification(response.message || 'Không tìm thấy danh sách thi cấp chưa đóng phí.', 'error')
        }
      } catch {
        setExamFeeOptions([])
        showNotification('Không tìm thấy danh sách thi cấp chưa đóng phí.', 'error')
      } finally {
        setLoadingExamOptions(false)
      }
    }

    if (open) {
      void loadExamFeeOptions()
    }
  }, [formData.classId, formData.studentId, formData.type, open, showNotification])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const collectedByUserId = mode === 'replacement' ? formData.collectedByUserId || '' : auth?.user?.id

    if (!collectedByUserId) {
      showNotification('Không xác định được người thu tiền, vui lòng đăng nhập lại.', 'error')

      return
    }

    if (!formData.classId) {
      showNotification('Vui lòng chọn lớp hiện tại.', 'error')

      return
    }

    if (mode === 'replacement' && !formData.coachId) {
      showNotification('Vui lòng chọn coach của lớp.', 'error')

      return
    }

    if (!formData.studentId) {
      if (formData.type !== PAYMENT_TYPE_PRODUCT) {
        showNotification('Khách lẻ chỉ hỗ trợ thanh toán khi mua sản phẩm.', 'error')

        return
      }
    }

    if (formData.type === PAYMENT_TYPE_TUITION) {
      const currentYear = new Date().getFullYear()
      const duplicatePeriods = new Set<string>()

      for (const row of tuitionMonths) {
        if (row.month < 1 || row.month > 12) {
          showNotification('Tháng không hợp lệ (1-12).', 'error')

          return
        }

        if (row.year < currentYear - 2 || row.year > currentYear + 1) {
          showNotification('Năm không hợp lệ.', 'error')

          return
        }

        const periodKey = `${row.month}/${row.year}`

        if (duplicatePeriods.has(periodKey)) {
          showNotification(`Đã chọn trùng học phí tháng ${periodKey}.`, 'error')

          return
        }

        duplicatePeriods.add(periodKey)
      }

      if (loadingQuote) {
        showNotification('Đang tính học phí, vui lòng chờ xong rồi tạo biên lai.', 'error')

        return
      }

      for (const entry of tuitionMonthSummaries) {
        if (!entry.quote) {
          showNotification(`Không thể tính học phí tháng ${entry.item.month}/${entry.item.year}.`, 'error')

          return
        }

        if (entry.quote.alreadyPaid) {
          showNotification(`Học phí tháng ${entry.item.month}/${entry.item.year} đã thanh toán, không thể tạo thu trùng.`, 'error')

          return
        }
      }

      if (discountAmount > 0 && tuitionMonths.length > 1) {
        showNotification('Giảm trừ thủ công chỉ hỗ trợ khi thu 1 tháng học phí trong một biên lai.', 'error')

        return
      }
    }

    if (formData.type === PAYMENT_TYPE_EXAM_FEE && !selectedExamOptionId) {
      showNotification('Vui lòng chọn đăng ký thi cấp để đóng phí.', 'error')

      return
    }

    if (formData.type === PAYMENT_TYPE_PRODUCT && !formData.productId) {
      showNotification('Vui lòng chọn sản phẩm.', 'error')

      return
    }

    for (const row of addOnProducts) {
      if (!row.productId) {
        showNotification('Vui lòng chọn sản phẩm cho phần thu kèm.', 'error')

        return
      }

      if (!Number.isFinite(row.quantity) || row.quantity < 1) {
        showNotification('Số lượng sản phẩm thu kèm phải lớn hơn hoặc bằng 1.', 'error')

        return
      }
    }

    if (discountAmount > 0 && !formData.discountReason.trim()) {
      showNotification('Nếu có giảm trừ bắt buộc nhập lý do.', 'error')

      return
    }

    if (discountAmount > payableAmount) {
      showNotification('Số tiền giảm không được lớn hơn số tiền gốc.', 'error')

      return
    }

    if (formData.method === PAYMENT_METHOD_BANK_TRANSFER && !proofImageFile) {
      showNotification('Thanh toán chuyển khoản bắt buộc upload ảnh minh chứng.', 'error')

      return
    }

    try {
      setLoadingSubmit(true)

      let transferProofImageUrl: string | undefined

      if (formData.method === PAYMENT_METHOD_BANK_TRANSFER && proofImageFile) {
        const uploadRes = await paymentService.uploadTransferProof(proofImageFile)

        if (!uploadRes.success || !uploadRes.data?.imageUrl) {
          showNotification(uploadRes.message || 'Upload ảnh chuyển khoản thất bại.', 'error')
          setLoadingSubmit(false)

          return
        }

        transferProofImageUrl = uploadRes.data.imageUrl
      }

      const hasAddOnProducts = addOnProducts.length > 0
      const tuitionItems =
        formData.type === PAYMENT_TYPE_TUITION
          ? tuitionMonths.map((item, index) => ({
              type: PAYMENT_TYPE_TUITION,
              classId: formData.classId,
              forMonth: item.month,
              forYear: item.year,
              description: formData.description.trim()
                ? `Học phí tháng ${item.month}/${item.year} - ${formData.description.trim()}`
                : `Học phí tháng ${item.month}/${item.year}`,
              discountAmount: discountAmount > 0 && index === 0 ? discountAmount : undefined,
              discountReason: discountAmount > 0 && index === 0 ? formData.discountReason.trim() : undefined
            }))
          : []

      const addOnItems = addOnProducts.flatMap(item => {
        const product = products.find(x => x.id === item.productId)
        const description = product ? `Thu kèm sản phẩm: ${product.name}` : 'Thu kèm sản phẩm'

        return Array.from({ length: item.quantity }).map(() => ({
          type: PAYMENT_TYPE_PRODUCT,
          classId: formData.classId,
          productId: item.productId,
          description
        }))
      })

      if (hasAddOnProducts || tuitionItems.length > 1) {
        const baseItem = {
          type: formData.type,
          amount: originalAmount,
          description: formData.description.trim() || undefined,
          classId: formData.classId,
          productId: formData.type === PAYMENT_TYPE_PRODUCT ? formData.productId : undefined,
          examRegistrationId: formData.type === PAYMENT_TYPE_EXAM_FEE ? selectedExamOptionId : undefined,
          discountAmount: discountAmount > 0 ? discountAmount : undefined,
          discountReason: discountAmount > 0 ? formData.discountReason.trim() : undefined
        }

        const bulkResponse = await paymentService.createBulkPayment({
          studentId: formData.studentId || null,
          paymentDate: formData.paymentDate,
          method: formData.method,
          transferProofImageUrl,
          collectedByUserId,
          items:
            formData.type === PAYMENT_TYPE_TUITION
              ? [...tuitionItems, ...addOnItems]
              : [baseItem, ...addOnItems]
        })

        if (bulkResponse.success) {
          const createdRows = Array.isArray(bulkResponse.data) ? bulkResponse.data : []

          setData(prev => [...createdRows, ...prev])
          showNotification('Tạo thanh toán thành công.', 'success')
          resetForm()
          handleClose()
        } else {
          showNotification(bulkResponse.message || 'Không thể tạo thanh toán.', 'error')
        }

        return
      }

      const firstTuitionMonth = tuitionMonths[0]
      const response = await paymentService.createPayment({
        studentId: formData.studentId || null,
        classId: formData.classId,
        type: formData.type,
        amount: originalAmount,
        paymentDate: formData.paymentDate,
        method: formData.method,
        forMonth: formData.type === PAYMENT_TYPE_TUITION ? firstTuitionMonth?.month : undefined,
        forYear: formData.type === PAYMENT_TYPE_TUITION ? firstTuitionMonth?.year : undefined,
        productId: formData.type === PAYMENT_TYPE_PRODUCT ? formData.productId : undefined,
        examRegistrationId: formData.type === PAYMENT_TYPE_EXAM_FEE ? selectedExamOptionId : undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        discountReason: discountAmount > 0 ? formData.discountReason.trim() : undefined,
        transferProofImageUrl,
        description: formData.description.trim() || undefined,
        collectedByUserId
      })

      if (response.success && response.data) {
        setData(prev => [response.data!, ...prev])
        showNotification('Tạo thanh toán thành công.', 'success')
        resetForm()
        handleClose()
      } else {
        showNotification(response.message || 'Không thể tạo thanh toán.', 'error')
      }
    } catch {
      showNotification('Đã có lỗi khi tạo thanh toán.', 'error')
    } finally {
      setLoadingSubmit(false)
    }
  }

  return (
    <Dialog fullScreen open={open} onClose={handleClose}>
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton edge='start' color='inherit' onClick={handleClose} aria-label='close'>
            <i className='ri-close-line' />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant='h6'>
            Tạo thanh toán
          </Typography>
          <Button color='inherit' onClick={handleClose}>
            Đóng
          </Button>
        </Toolbar>
      </AppBar>

      <Toolbar />

      <Box component='form' onSubmit={handleSubmit} sx={{ p: { xs: 2, md: 4 } }}>
        {loadingInit ? (
          <Box className='flex justify-center items-center p-10'>
            <CircularProgress size={26} />
          </Box>
        ) : (
          <Stack spacing={4}>
            <Typography variant='body2' color='text.secondary'>
              Chọn theo luồng: Lớp hiện tại {'->'} Học viên {'->'} Loại thanh toán.
            </Typography>

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Lớp *</InputLabel>
                  <Select
                    label='Lớp *'
                    value={formData.classId}
                    onChange={e => setFormData(prev => ({ ...prev, classId: String(e.target.value), studentId: '' }))}
                  >
                    {classes.map(cls => (
                      <MenuItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </MenuItem>
                    ))}
                  </Select>

                </FormControl>
              </Grid>

              {mode === 'replacement' && (
                <>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth disabled={!formData.classId}>
                      <InputLabel>Coach lớp *</InputLabel>
                      <Select
                        label='Coach lớp *'
                        value={formData.coachId}
                        onChange={e => {
                          const coachId = String(e.target.value)

                          setFormData(prev => ({
                            ...prev,
                            coachId,
                            collectedByUserId: prev.collectedByUserId || coachId
                          }))
                        }}
                      >
                        {(classes.find(c => c.id === formData.classId)?.coaches || []).map(c => (
                          <MenuItem key={c.userId} value={c.userId}>
                            {c.fullName}
                            {c.isLeadInstructor ? ' (HLV chính)' : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth disabled={!formData.classId}>
                      <InputLabel>Người thu *</InputLabel>
                      <Select
                        label='Người thu *'
                        value={formData.collectedByUserId}
                        onChange={e => setFormData(prev => ({ ...prev, collectedByUserId: String(e.target.value) }))}
                      >
                        {collectors.map(u => (
                          <MenuItem key={u.id} value={u.id}>
                            {u.fullName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}

              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={students}
                  loading={loadingStudents}
                  value={selectedStudent}
                  disabled={!formData.classId}
                  getOptionLabel={option => option.fullName || ''}
                  onChange={(_, value) => {
                    setSelectedStudent(value)
                    setFormData(prev => ({ ...prev, studentId: value?.id || '' }))
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label={formData.type === PAYMENT_TYPE_PRODUCT ? 'Học viên (Mặc định: Khách lẻ)' : 'Học viên *'}
                      placeholder={formData.type === PAYMENT_TYPE_PRODUCT ? 'Tìm theo tên học viên (bỏ trống nếu là khách lẻ)' : 'Tìm theo tên học viên'}
                      helperText={!formData.classId ? 'Cần chọn lớp trước khi chọn học viên' : undefined}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Loại thanh toán *</InputLabel>
                  <Select
                    label='Loại thanh toán *'
                    value={String(formData.type)}
                    onChange={e => {
                      const nextType = Number(e.target.value)

                      setFormData(prev => ({
                        ...prev,
                        type: nextType,
                        productId: '',
                        examRegistrationId: '',
                        discountAmount: '',
                        discountReason: ''
                      }))

                      if (nextType !== PAYMENT_TYPE_TUITION) {
                        setTuitionMonths([createTuitionMonthItem()])
                        setTuitionQuotes({})
                      }
                    }}
                  >
                    <MenuItem value={String(PAYMENT_TYPE_TUITION)}>Học phí tháng</MenuItem>
                    <MenuItem value={String(PAYMENT_TYPE_EXAM_FEE)}>Lệ phí cấp</MenuItem>
                    <MenuItem value={String(PAYMENT_TYPE_PRODUCT)}>Mua sản phẩm</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type='date'
                  label='Ngày thanh toán'
                  InputLabelProps={{ shrink: true }}
                  value={formData.paymentDate}
                  onChange={e => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                />
              </Grid>

              {formData.type === PAYMENT_TYPE_TUITION && (
                <Grid size={{ xs: 12 }}>
                  <Paper variant='outlined' sx={{ p: 2 }}>
                    <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
                      <Typography variant='subtitle2'>Các tháng học phí</Typography>
                      <Button size='small' variant='outlined' onClick={addTuitionMonthRow}>
                        + Thêm học phí tháng
                      </Button>
                    </Stack>

                    <Stack spacing={2}>
                      {tuitionMonths.map((row, index) => {
                        const quote = tuitionQuotes[row.id]

                        return (
                          <Grid container spacing={2} key={row.id}>
                            <Grid size={{ xs: 12, md: 3 }}>
                              <TextField
                                fullWidth
                                label='Tháng *'
                                type='number'
                                inputProps={{ min: 1, max: 12 }}
                                value={row.month}
                                onChange={e => updateTuitionMonthRow(row.id, { month: Number(e.target.value) })}
                                error={row.month < 1 || row.month > 12}
                                helperText={row.month < 1 || row.month > 12 ? 'Tháng phải từ 1-12' : `Dòng học phí ${index + 1}`}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                              <TextField
                                fullWidth
                                label='Năm *'
                                type='number'
                                value={row.year}
                                onChange={e => updateTuitionMonthRow(row.id, { year: Number(e.target.value) })}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 5 }}>
                              <TextField
                                fullWidth
                                label='Tạm tính'
                                value={
                                  loadingQuote
                                    ? 'Đang tính...'
                                    : quote
                                      ? formatVND(Number(quote.finalAmount || 0))
                                      : 'Chưa có dữ liệu'
                                }
                                InputProps={{ readOnly: true }}
                                helperText={
                                  quote?.alreadyPaid
                                    ? 'Tháng này đã thanh toán'
                                    : quote?.suggestedDiscountAmount
                                      ? `Có giảm trừ duyệt sẵn: ${formatVND(Number(quote.suggestedDiscountAmount || 0))}`
                                      : undefined
                                }
                              />
                            </Grid>
                            <Grid size={{ xs: 12, md: 1 }} sx={{ display: 'flex', alignItems: 'center' }}>
                              <IconButton
                                color='error'
                                onClick={() => removeTuitionMonthRow(row.id)}
                                disabled={tuitionMonths.length === 1}
                              >
                                <i className='ri-delete-bin-6-line' />
                              </IconButton>
                            </Grid>
                          </Grid>
                        )
                      })}
                    </Stack>

                    {discountAmount > 0 && tuitionMonths.length > 1 && (
                      <Alert severity='info' sx={{ mt: 2 }}>
                        Giảm trừ thủ công chỉ áp dụng khi thu một tháng trong một biên lai.
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              )}

              {formData.type === PAYMENT_TYPE_EXAM_FEE && (
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Danh sách thi cấp *</InputLabel>
                    <Select
                      label='Danh sách thi cấp *'
                      value={selectedExamOptionId}
                      onChange={e => setSelectedExamOptionId(String(e.target.value))}
                    >
                      {loadingExamOptions ? (
                        <MenuItem value=''>Đang tải...</MenuItem>
                      ) : examFeeOptions.length === 0 ? (
                        <MenuItem value=''>Không có đăng ký thi cấp chưa nộp phí</MenuItem>
                      ) : (
                        examFeeOptions.map(item => (
                          <MenuItem key={item.registrationId} value={item.registrationId}>
                            {item.examSessionName} - {item.targetBeltLevelName} ({formatVND(item.feeAmount)})
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {formData.type === PAYMENT_TYPE_PRODUCT && (
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>Sản phẩm *</InputLabel>
                    <Select
                      label='Sản phẩm *'
                      value={formData.productId}
                      onChange={e => {
                        const newProductId = String(e.target.value)
                        const product = products.find(item => item.id === newProductId) || null

                        setSelectedProduct(product)
                        setFormData(prev => ({ ...prev, productId: newProductId }))
                      }}
                    >
                      {products.map(item => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.name} - {formatVND(item.unitPrice)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <Paper variant='outlined' sx={{ p: 2 }}>
                  <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 1 }}>
                    <Typography variant='subtitle2'>Sản phẩm thu kèm</Typography>
                    <Button size='small' variant='outlined' onClick={addAddOnProductRow}>
                      + Thêm sản phẩm
                    </Button>
                  </Stack>

                  {addOnProducts.length === 0 ? (
                    <Typography variant='body2' color='text.secondary'>
                      Chưa có sản phẩm thu kèm.
                    </Typography>
                  ) : (
                    <Stack spacing={2}>
                      {addOnProducts.map((row, index) => {
                        const selected = products.find(x => x.id === row.productId)
                        const lineAmount = selected ? selected.unitPrice * row.quantity : 0

                        return (
                          <Grid container spacing={2} key={row.id}>
                            <Grid size={{ xs: 12, md: 6 }}>
                              <FormControl fullWidth>
                                <InputLabel>{`Sản phẩm #${index + 1}`}</InputLabel>
                                <Select
                                  label={`Sản phẩm #${index + 1}`}
                                  value={row.productId}
                                  onChange={e => updateAddOnProductRow(row.id, { productId: String(e.target.value) })}
                                >
                                  {products.map(item => (
                                    <MenuItem key={item.id} value={item.id}>
                                      {item.name} - {formatVND(item.unitPrice)}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>

                            <Grid size={{ xs: 6, md: 2 }}>
                              <TextField
                                fullWidth
                                type='number'
                                label='SL'
                                inputProps={{ min: 1 }}
                                value={row.quantity}
                                onChange={e =>
                                  updateAddOnProductRow(row.id, {
                                    quantity: Math.max(1, Number(e.target.value || 1))
                                  })
                                }
                              />
                            </Grid>

                            <Grid size={{ xs: 6, md: 3 }}>
                              <TextField fullWidth label='Tiền dòng' value={formatVND(lineAmount)} InputProps={{ readOnly: true }} />
                            </Grid>

                            <Grid size={{ xs: 12, md: 1 }} sx={{ display: 'flex', alignItems: 'center' }}>
                              <IconButton color='error' onClick={() => removeAddOnProductRow(row.id)}>
                                <i className='ri-delete-bin-6-line' />
                              </IconButton>
                            </Grid>
                          </Grid>
                        )
                      })}
                    </Stack>
                  )}
                </Paper>
              </Grid>

              {formData.type === PAYMENT_TYPE_TUITION && formData.classId && formData.studentId && (
                <Grid size={{ xs: 12 }}>
                  {loadingQuote ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={18} />
                      <Typography variant='body2' color='text.secondary'>
                        Đang tính học phí...
                      </Typography>
                    </Box>
                  ) : (
                    <Paper variant='outlined' sx={{ p: 2 }}>
                      <Typography variant='subtitle2' gutterBottom>
                        Thông tin học phí theo biên lai
                      </Typography>
                      <Divider sx={{ mb: 1 }} />
                      <Stack spacing={1}>
                        {tuitionMonthSummaries.map(({ item, quote }) => (
                          <Box key={item.id} sx={{ borderRadius: 1, border: theme => `1px solid ${theme.palette.divider}`, p: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                              <Typography variant='body2' fontWeight='bold'>
                                Tháng {item.month}/{item.year}
                              </Typography>
                              <Typography variant='body2' color={quote?.alreadyPaid ? 'warning.main' : 'success.main'} fontWeight='medium'>
                                {quote ? formatVND(quote.finalAmount) : 'Chưa tính được'}
                              </Typography>
                            </Box>

                            {quote && (
                              <Stack spacing={0.5} sx={{ mt: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant='body2' color='text.secondary'>
                                    Học phí gốc:
                                  </Typography>
                                  <Typography variant='body2'>{formatVND(quote.monthlyFee)}</Typography>
                                </Box>
                                {quote.suggestedDiscountAmount > 0 && (
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant='body2' color='text.secondary'>
                                      Giảm trừ duyệt sẵn:
                                    </Typography>
                                    <Typography variant='body2' color='warning.main'>
                                      -{formatVND(quote.suggestedDiscountAmount)}
                                    </Typography>
                                  </Box>
                                )}
                              </Stack>
                            )}

                            {!quote && (
                              <Alert severity='error' sx={{ mt: 1 }}>
                                Không thể tính học phí cho tháng này.
                              </Alert>
                            )}

                            {quote?.alreadyPaid && (
                              <Alert severity='warning' sx={{ mt: 1 }}>
                                Học phí tháng này đã được thanh toán.
                              </Alert>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  )}
                </Grid>
              )}

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Số tiền gốc'
                  value={loadingQuote ? 'Đang tính...' : formatVND(originalAmount)}
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Số tiền giảm'
                  type='number'
                  inputProps={{ min: 0 }}
                  value={formData.discountAmount}
                  onChange={e => setFormData(prev => ({ ...prev, discountAmount: e.target.value }))}
                  InputProps={{
                    endAdornment: <InputAdornment position='end'>VND</InputAdornment>
                  }}
                  error={discountAmount > payableAmount}
                  helperText={discountAmount > payableAmount ? 'Không được lớn hơn số tiền gốc' : undefined}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Số tiền thu'
                  value={formatVND(finalAmount)}
                  InputProps={{ readOnly: true }}
                  sx={{ '& .MuiInputBase-input': { color: 'success.main', fontWeight: 'bold' } }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label='Tiền sản phẩm thu kèm'
                  value={formatVND(addOnProductsAmount)}
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label='Tổng thu học viên cần đóng'
                  value={formatVND(totalCollectAmount)}
                  InputProps={{ readOnly: true }}
                  sx={{ '& .MuiInputBase-input': { color: 'primary.main', fontWeight: 'bold' } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label='Lý do giảm trừ'
                  value={formData.discountReason}
                  onChange={e => setFormData(prev => ({ ...prev, discountReason: e.target.value }))}
                  required={discountAmount > 0}
                  helperText={discountAmount > 0 ? 'Bắt buộc khi có giảm trừ' : undefined}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Phương thức thanh toán</InputLabel>
                  <Select
                    label='Phương thức thanh toán'
                    value={String(formData.method)}
                    onChange={e => setFormData(prev => ({ ...prev, method: Number(e.target.value) }))}
                  >
                    <MenuItem value={String(PAYMENT_METHOD_CASH)}>Tiền mặt</MenuItem>
                    <MenuItem value={String(PAYMENT_METHOD_BANK_TRANSFER)}>Chuyển khoản</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {formData.method === PAYMENT_METHOD_BANK_TRANSFER && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack direction='row' spacing={2} alignItems='center'>
                    <Button component='label' variant='outlined' color={proofImageFile ? 'success' : 'primary'}>
                      {proofImageFile ? 'Đổi ảnh minh chứng' : 'Upload ảnh chuyển khoản *'}
                      <input hidden type='file' accept='image/*' onChange={e => setProofImageFile(e.target.files?.[0] || null)} />
                    </Button>
                    <Typography variant='body2' color={proofImageFile ? 'success.main' : 'text.secondary'}>
                      {proofImageFile ? `Da chon: ${proofImageFile.name}` : 'Chưa chọn ảnh'}
                    </Typography>
                  </Stack>
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label='Ghi chú'
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>
            </Grid>

            <Box className='flex justify-end gap-3'>
              <Button variant='outlined' color='secondary' onClick={handleClose} disabled={loadingSubmit}>
                Hủy
              </Button>
              <Button type='submit' variant='contained' disabled={loadingSubmit}>
                {loadingSubmit ? <CircularProgress size={18} color='inherit' /> : `Tạo biên lai ${formatVND(totalCollectAmount)}`}
              </Button>
            </Box>
          </Stack>
        )}
      </Box>
    </Dialog>
  )
}

export default AddPaymentDrawer
