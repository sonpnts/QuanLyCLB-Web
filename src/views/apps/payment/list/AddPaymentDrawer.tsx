'use client'

import { useEffect, useMemo, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'

import type { ClassType } from '@/types/apps/classTypes'
import type { PaymentRecordType } from '@/types/apps/paymentTypes'
import type { ProductType } from '@/types/apps/productTypes'
import type { StudentType } from '@/types/apps/studentTypes'
import classService from '@/services/classService'
import paymentService, { type ExamFeeOptionType, type TuitionQuoteType } from '@/services/paymentService'
import productService from '@/services/productService'
import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<PaymentRecordType[]>>
}

const PAYMENT_TYPE_TUITION = 0
const PAYMENT_TYPE_EXAM_FEE = 1
const PAYMENT_TYPE_PRODUCT = 3

const PAYMENT_METHOD_CASH = 0
const PAYMENT_METHOD_BANK_TRANSFER = 1

const AddPaymentDrawer = ({ open, handleClose, setData }: Props) => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()

  const isAdmin = useMemo(() => {
    const roles = auth?.roles || []

    return roles.includes('Admin') || roles.includes('Administrator')
  }, [auth?.roles])

  const [classes, setClasses] = useState<ClassType[]>([])
  const [students, setStudents] = useState<StudentType[]>([])
  const [products, setProducts] = useState<ProductType[]>([])
  const [examFeeOptions, setExamFeeOptions] = useState<ExamFeeOptionType[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null)
  const [selectedExamOptionId, setSelectedExamOptionId] = useState('')
  const [tuitionQuote, setTuitionQuote] = useState<TuitionQuoteType | null>(null)

  const [loadingInit, setLoadingInit] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [loadingExamOptions, setLoadingExamOptions] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [proofImageFile, setProofImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    classId: '',
    studentId: '',
    type: PAYMENT_TYPE_TUITION,
    paymentDate: new Date().toISOString().split('T')[0],
    method: PAYMENT_METHOD_CASH,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
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

  const originalAmount = useMemo(() => {
    if (formData.type === PAYMENT_TYPE_TUITION) return Number(tuitionQuote?.monthlyFee || 0)
    if (formData.type === PAYMENT_TYPE_EXAM_FEE) return Number(selectedExamOption?.feeAmount || 0)
    if (formData.type === PAYMENT_TYPE_PRODUCT) return Number(selectedProduct?.unitPrice || 0)

    return 0
  }, [formData.type, selectedExamOption?.feeAmount, selectedProduct?.unitPrice, tuitionQuote?.monthlyFee])

  const discountAmount = Number(formData.discountAmount || 0)
  const finalAmount = Math.max(0, originalAmount - discountAmount)

  const resetForm = () => {
    setStudents([])
    setExamFeeOptions([])
    setSelectedStudent(null)
    setSelectedProduct(null)
    setSelectedExamOptionId('')
    setTuitionQuote(null)
    setProofImageFile(null)
    setFormData({
      classId: '',
      studentId: '',
      type: PAYMENT_TYPE_TUITION,
      paymentDate: new Date().toISOString().split('T')[0],
      method: PAYMENT_METHOD_CASH,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      productId: '',
      examRegistrationId: '',
      discountAmount: '',
      discountReason: '',
      description: ''
    })
  }

  useEffect(() => {
    const loadInitData = async () => {
      setLoadingInit(true)

      try {
        const [classRes, productRes] = await Promise.all([
          classService.getClasses({ pageSize: 300 }),
          productService.getProducts({ pageSize: 300, isActive: true })
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
      } catch (error) {
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
    const loadStudentsByClass = async () => {
      if (!formData.classId) {
        setStudents([])
        setSelectedStudent(null)
        setFormData(prev => ({ ...prev, studentId: '' }))

        return
      }

      setLoadingStudents(true)

      try {
        const response = await classService.getClassStudents(formData.classId)

        if (response.success && response.data) {
          setStudents(response.data)
        } else {
          setStudents([])
          showNotification(response.message || 'Không thể tải danh sách học viên của lớp.', 'error')
        }
      } catch (error) {
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
    const loadTuitionQuote = async () => {
      if (formData.type !== PAYMENT_TYPE_TUITION || !formData.classId || !formData.studentId) {
        setTuitionQuote(null)

        return
      }

      setLoadingQuote(true)

      try {
        const response = await paymentService.getTuitionQuote(
          formData.classId,
          formData.studentId,
          formData.month,
          formData.year,
          formData.paymentDate
        )

        if (response.success && response.data) {
          setTuitionQuote(response.data)
        } else {
          setTuitionQuote(null)
          showNotification(response.message || 'Không thể tính học phí.', 'error')
        }
      } catch (error) {
        setTuitionQuote(null)
        showNotification('Không thể tính học phí.', 'error')
      } finally {
        setLoadingQuote(false)
      }
    }

    if (open) {
      loadTuitionQuote()
    }
  }, [formData.classId, formData.studentId, formData.month, formData.year, formData.paymentDate, formData.type, open, showNotification])

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
      } catch (error) {
        setExamFeeOptions([])
        showNotification('Không tìm thấy danh sách thi cấp chưa đóng phí.', 'error')
      } finally {
        setLoadingExamOptions(false)
      }
    }

    if (open) {
      loadExamFeeOptions()
    }
  }, [formData.classId, formData.studentId, formData.type, open, showNotification])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.classId) {
      showNotification('Vui lòng chọn lớp hiện tại.', 'error')

      return
    }

    if (!formData.studentId) {
      showNotification('Vui lòng chọn học viên.', 'error')

      return
    }

    if (formData.type === PAYMENT_TYPE_TUITION && tuitionQuote?.alreadyPaid) {
      showNotification('Học phí tháng này đã thanh toán, không thể tạo thu trùng.', 'error')

      return
    }

    if (formData.type === PAYMENT_TYPE_EXAM_FEE && !selectedExamOptionId) {
      showNotification('Vui lòng chọn đăng ký thi cấp để đóng phí.', 'error')

      return
    }

    if (formData.type === PAYMENT_TYPE_PRODUCT && !formData.productId) {
      showNotification('Vui lòng chọn sản phẩm.', 'error')

      return
    }

    if (discountAmount > 0 && !formData.discountReason.trim()) {
      showNotification('Nếu có giảm trừ bắt buộc nhập lý do.', 'error')

      return
    }

    if (discountAmount > originalAmount) {
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

      const response = await paymentService.createPayment({
        studentId: formData.studentId,
        classId: formData.classId,
        type: formData.type,
        amount: originalAmount,
        paymentDate: formData.paymentDate,
        method: formData.method,
        forMonth: formData.type === PAYMENT_TYPE_TUITION ? formData.month : undefined,
        forYear: formData.type === PAYMENT_TYPE_TUITION ? formData.year : undefined,
        productId: formData.type === PAYMENT_TYPE_PRODUCT ? formData.productId : undefined,
        examRegistrationId: formData.type === PAYMENT_TYPE_EXAM_FEE ? selectedExamOptionId : undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        discountReason: discountAmount > 0 ? formData.discountReason.trim() : undefined,
        transferProofImageUrl,
        description: formData.description.trim() || undefined
      })

      if (response.success && response.data) {
        setData(prev => [response.data!, ...prev])
        showNotification('Tạo thanh toán thành công.', 'success')
        resetForm()
        handleClose()
      } else {
        showNotification(response.message || 'Không thể tạo thanh toán.', 'error')
      }
    } catch (error) {
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
              Chọn theo luồng: Lớp hiện tại - Học viên - Loại thanh toán.
            </Typography>

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Lớp hiện tại *</InputLabel>
                  <Select
                    label='Lớp hiện tại *'
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
                      label='Học viên *'
                      placeholder='Tìm theo tên học viên'
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
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        type: Number(e.target.value),
                        productId: '',
                        examRegistrationId: ''
                      }))
                    }
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
                <>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label='Tháng'
                      type='number'
                      inputProps={{ min: 1, max: 12 }}
                      value={formData.month}
                      onChange={e => setFormData(prev => ({ ...prev, month: Number(e.target.value) }))}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label='Năm'
                      type='number'
                      value={formData.year}
                      onChange={e => setFormData(prev => ({ ...prev, year: Number(e.target.value) }))}
                    />
                  </Grid>
                </>
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
                            {item.examSessionName} - {item.targetBeltLevelName}
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
                          {item.name} - {item.unitPrice.toLocaleString('vi-VN')} VND
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Số tiền gốc'
                  value={loadingQuote ? 'Đang tính...' : originalAmount.toLocaleString('vi-VN')}
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Số tiền giảm'
                  type='number'
                  value={formData.discountAmount}
                  onChange={e => setFormData(prev => ({ ...prev, discountAmount: e.target.value }))}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label='Số tiền thu'
                  value={finalAmount.toLocaleString('vi-VN')}
                  InputProps={{ readOnly: true }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label='Lý do giảm trừ'
                  value={formData.discountReason}
                  onChange={e => setFormData(prev => ({ ...prev, discountReason: e.target.value }))}
                  required={discountAmount > 0}
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
                    <Button component='label' variant='outlined'>
                      Upload ảnh chuyển khoản
                      <input
                        hidden
                        type='file'
                        accept='image/*'
                        onChange={e => setProofImageFile(e.target.files?.[0] || null)}
                      />
                    </Button>
                    <Typography variant='body2' color='text.secondary'>
                      {proofImageFile?.name || 'Chưa chọn ảnh'}
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

            {formData.type === PAYMENT_TYPE_TUITION && tuitionQuote?.alreadyPaid && (
              <Typography color='error.main'>Học phí tháng này đã thanh toán, hệ thống sẽ không cho phép thu thêm.</Typography>
            )}

            <Box className='flex items-center gap-3'>
              <Button
                type='submit'
                variant='contained'
                disabled={loadingSubmit || loadingQuote || (formData.type === PAYMENT_TYPE_TUITION && !!tuitionQuote?.alreadyPaid)}
              >
                {loadingSubmit ? 'Đang tạo...' : 'Tạo thanh toán'}
              </Button>
              <Button variant='outlined' color='secondary' onClick={handleClose}>
                Hủy
              </Button>
            </Box>
          </Stack>
        )}
      </Box>
    </Dialog>
  )
}

export default AddPaymentDrawer


