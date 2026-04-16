'use client'

import { useState, useEffect } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Checkbox from '@mui/material/Checkbox'
import Autocomplete from '@mui/material/Autocomplete'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'

import paymentService, { BulkPaymentItemRequest } from '@/services/paymentService'
import classService from '@/services/classService'
import studentService from '@/services/studentService'
import type { ClassType } from '@/types/apps/classTypes'
import type { StudentType } from '@/types/apps/studentTypes'

// Types of Items: 0 = Tuition, 1 = ExamFee, 2 = Registration, 3 = Other
type CartItem = {
  id: string
  type: number
  name: string
  amount: number
  classId?: string
  examRegistrationId?: string
  forMonth?: number
  forYear?: number
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

const CollectPayment = () => {
  const router = useRouter()
  // Search State
  const [classes, setClasses] = useState<ClassType[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  
  const [students, setStudents] = useState<StudentType[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Debt State
  const [loadingDebts, setLoadingDebts] = useState(false)
  const [availableItems, setAvailableItems] = useState<CartItem[]>([])
  
  // Selection
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])

  // Custom Item Form
  const [customName, setCustomName] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [customType, setCustomType] = useState<number>(3) // 3 = Other
  
  // Payment Form
  const [paymentMethod, setPaymentMethod] = useState<number>(0) // 0 Cash, 1 Transfer
  const [transferImage, setTransferImage] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch classes on load
  useEffect(() => {
    let mounted = true
    const fetchClasses = async () => {
      const res = await classService.getClasses()
      if (mounted && res.success && res.data) {
        setClasses(res.data)
      }
    }
    fetchClasses()
    return () => { mounted = false }
  }, [])

  // Fetch students when class changes
  useEffect(() => {
    if (!selectedClassId) {
      setStudents([])
      setSelectedStudent(null)
      return
    }

    let mounted = true
    const fetchStudents = async () => {
      if (mounted) setLoadingStudents(true)
      const res = await classService.getClassStudents(selectedClassId)
      if (mounted && res.success && res.data) {
        setStudents(res.data.map(x => x.student!))
      }
      if (mounted) setLoadingStudents(false)
    }

    fetchStudents()
    return () => { mounted = false }
  }, [selectedClassId])

  // Fetch debts when student is selected
  useEffect(() => {
    if (!selectedStudent || !selectedClassId) {
      setAvailableItems([])
      setSelectedItemIds([])
      return
    }

    let mounted = true
    const fetchDebts = async () => {
      if (mounted) setLoadingDebts(true)
      try {
        const items: CartItem[] = []

        // 1. Fetch current month tuition
        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()

        const tRes = await paymentService.getTuitionQuote(selectedClassId, selectedStudent.id, currentMonth, currentYear)
        if (tRes.success && tRes.data) {
          if (!tRes.data.alreadyPaid) {
            items.push({
              id: `tuition-${currentMonth}-${currentYear}`,
              type: 0,
              name: `Học phí tháng ${currentMonth}/${currentYear}`,
              amount: tRes.data.finalAmount,
              classId: selectedClassId,
              forMonth: currentMonth,
              forYear: currentYear
            })
          }
        }

        // 2. Fetch unpaid exam fees
        const eRes = await paymentService.getExamFeeOptions(selectedClassId, selectedStudent.id)
        if (eRes.success && eRes.data) {
          eRes.data.forEach(exam => {
            items.push({
              id: `exam-${exam.registrationId}`,
              type: 1, // ExamFee
              name: `Lệ phí thi: ${exam.examSessionName} (Lên ${exam.targetBeltLevelName})`,
              amount: exam.feeAmount,
              classId: selectedClassId,
              examRegistrationId: exam.registrationId
            })
          })
        }

        if (mounted) {
          setAvailableItems(items)
          // Auto select all by default
          setSelectedItemIds(items.map(i => i.id))
        }
      } catch (error) {
        if (mounted) toast.error('Lỗi khi tải công nợ')
      } finally {
        if (mounted) setLoadingDebts(false)
      }
    }

    fetchDebts()
    return () => { mounted = false }
  }, [selectedStudent, selectedClassId])

  const handleAddCustomItem = () => {
    if (!customName || !customAmount) return
    const amount = Number(customAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Số tiền không hợp lệ')
      return
    }

    const newItem: CartItem = {
      id: `custom-${Date.now()}`,
      type: customType,
      name: customName,
      amount: amount
    }

    setAvailableItems([...availableItems, newItem])
    setSelectedItemIds([...selectedItemIds, newItem.id])
    
    // Reset form
    setCustomName('')
    setCustomAmount('')
    setCustomType(3)
  }

  const handleRemoveCustomItem = (id: string) => {
    setAvailableItems(availableItems.filter(i => i.id !== id))
    setSelectedItemIds(selectedItemIds.filter(i => i !== id))
  }

  const handleSubmit = async () => {
    if (!selectedStudent) {
      toast.error('Vui lòng chọn học viên')
      return
    }

    if (selectedItemIds.length === 0) {
      toast.error('Chưa chọn khoản thu nào')
      return
    }

    const selectedItems = availableItems.filter(i => selectedItemIds.includes(i.id))

    if (paymentMethod === 1 && !transferImage) {
      toast.error('Vui lòng đính kèm ảnh chụp uy nhiệm chi')
      return
    }

    setIsSubmitting(true)
    try {
      let imageUrl = undefined

      // Upload image if transfer
      if (paymentMethod === 1 && transferImage) {
        const uploadRes = await paymentService.uploadTransferProof(transferImage)
        if (!uploadRes.success || !uploadRes.data?.imageUrl) {
          toast.error('Lỗi upload ảnh minh chứng: ' + uploadRes.message)
          setIsSubmitting(false)
          return
        }
        imageUrl = uploadRes.data.imageUrl
      }

      // Build payload
      const payloadItems: BulkPaymentItemRequest[] = selectedItems.map(item => ({
        type: item.type,
        amount: item.amount,
        description: item.name,
        classId: item.classId,
        examRegistrationId: item.examRegistrationId,
        forMonth: item.forMonth,
        forYear: item.forYear
      }))

      const payload = {
        studentId: selectedStudent.id,
        paymentDate: new Date().toISOString(),
        method: paymentMethod,
        transferProofImageUrl: imageUrl,
        items: payloadItems
      }

      const res = await paymentService.createBulkPayment(payload)
      if (res.success) {
        toast.success('Thu tiền thành công!')
        router.push('/apps/finance/payments/list')
      } else {
        toast.error(res.message || 'Lỗi khi tạo hóa đơn')
      }
    } catch (error: any) {
      toast.error('Lỗi hệ thống: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalAmount = availableItems
    .filter(i => selectedItemIds.includes(i.id))
    .reduce((sum, item) => sum + item.amount, 0)

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title='Giao dịch Thu tiền' />
          <Divider />
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label='Khu vực / Lớp học'
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                >
                  <MenuItem value=''>-- Chọn Lớp --</MenuItem>
                  {classes.map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={students}
                  loading={loadingStudents}
                  getOptionLabel={option => `${option.fullName} - ${option.code || ''}`}
                  value={selectedStudent}
                  onChange={(event, newValue) => setSelectedStudent(newValue)}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='Tìm Học viên'
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingStudents ? <CircularProgress color='inherit' size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                  disabled={!selectedClassId}
                />
              </Grid>
            </Grid>

            <Box mt={6}>
              <Typography variant='h6' mb={4}>Danh sách khoản nợ / Hạng mục thu</Typography>
              {loadingDebts ? (
                <Box display='flex' justifyContent='center' p={4}><CircularProgress /></Box>
              ) : availableItems.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding='checkbox'>
                          <Checkbox 
                            checked={selectedItemIds.length === availableItems.length}
                            indeterminate={selectedItemIds.length > 0 && selectedItemIds.length < availableItems.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedItemIds(availableItems.map(i => i.id))
                              else setSelectedItemIds([])
                            }}
                          />
                        </TableCell>
                        <TableCell>Nội dung</TableCell>
                        <TableCell align='right'>Số tiền</TableCell>
                        <TableCell align='center'>Xóa</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {availableItems.map(item => (
                        <TableRow key={item.id} hover selected={selectedItemIds.includes(item.id)}>
                          <TableCell padding='checkbox'>
                            <Checkbox 
                              checked={selectedItemIds.includes(item.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedItemIds([...selectedItemIds, item.id])
                                else setSelectedItemIds(selectedItemIds.filter(id => id !== item.id))
                              }}
                            />
                          </TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell align='right'>
                            <Typography fontWeight={500}>{formatCurrency(item.amount)}</Typography>
                          </TableCell>
                          <TableCell align='center'>
                            {item.id.toString().startsWith('custom-') ? (
                              <IconButton color='error' size='small' onClick={() => handleRemoveCustomItem(item.id)}>
                                <i className='ri-delete-bin-7-line' />
                              </IconButton>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color='textSecondary' align='center' sx={{ py: 4 }}>
                  {selectedStudent ? 'Học viên không có khoản nợ nào' : 'Vui lòng chọn học viên để xem dữ liệu'}
                </Typography>
              )}
            </Box>

            {/* Custom Item Form */}
            {selectedStudent && (
              <Box mt={6} p={4} sx={{ backgroundColor: 'action.hover', borderRadius: 1 }}>
                <Typography variant='subtitle2' mb={3}>+ Thêm khoản thu phụ</Typography>
                <Grid container spacing={3} alignItems='flex-start'>
                  <Grid item xs={12} sm={4}>
                    <TextField 
                      fullWidth size='small' label='Tên khoản thu' 
                      value={customName} onChange={e => setCustomName(e.target.value)} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField 
                      fullWidth size='small' label='Số tiền' type='number' 
                      value={customAmount} onChange={e => setCustomAmount(e.target.value)} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField 
                      fullWidth size='small' select label='Loại thu' 
                      value={customType} onChange={e => setCustomType(Number(e.target.value))}
                    >
                      <MenuItem value={3}>Khác</MenuItem>
                      <MenuItem value={2}>Tiền Nhập học / Đăng ký</MenuItem>
                      <MenuItem value={0}>Học phí (Nợ ngoài)</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button variant='outlined' fullWidth onClick={handleAddCustomItem} disabled={!customName || !customAmount}>
                      Thêm
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title='Tổng Kết Hóa Đơn' />
          <Divider />
          <CardContent>
            <Box mb={6} display='flex' justifyContent='space-between' alignItems='center'>
              <Typography variant='h6'>Tổng Tiền:</Typography>
              <Typography variant='h4' color='primary' fontWeight='bold'>
                {formatCurrency(totalAmount)}
              </Typography>
            </Box>

            <Typography variant='subtitle2' mb={2}>Hình thức thanh toán</Typography>
            <TextField 
              fullWidth select size='small' sx={{ mb: 4 }}
              value={paymentMethod} onChange={e => setPaymentMethod(Number(e.target.value))}
            >
              <MenuItem value={0}>Tiền Mặt (Cash)</MenuItem>
              <MenuItem value={1}>Chuyển Khoản (Bank Transfer)</MenuItem>
            </TextField>

            {paymentMethod === 1 && (
              <Box mb={4}>
                <Typography variant='body2' mb={1}>Ảnh Ủy nhiệm chi *</Typography>
                <Button variant='outlined' component='label' fullWidth sx={{ mb: 2 }}>
                  Tải lên Biên lai Chuyển khoản
                  <input type='file' hidden accept='image/*' onChange={e => {
                    if (e.target.files && e.target.files[0]) setTransferImage(e.target.files[0])
                  }} />
                </Button>
                {transferImage && (
                   <Typography variant='caption' color='success.main' display='block' textAlign='center'>
                     Đã chọn tệp: {transferImage.name}
                   </Typography>
                )}
              </Box>
            )}

            <Button 
              variant='contained' 
              color='success' 
              size='large' 
              fullWidth 
              disabled={!selectedStudent || selectedItemIds.length === 0 || isSubmitting || (paymentMethod === 1 && !transferImage)}
              onClick={handleSubmit}
              startIcon={isSubmitting ? <CircularProgress size={20} color='inherit' /> : <i className='ri-money-dollar-circle-line' />}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Thu Tiền'}
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default CollectPayment
