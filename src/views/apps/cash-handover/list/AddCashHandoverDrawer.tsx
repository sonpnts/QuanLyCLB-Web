'use client'

import { useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { CashHandoverType, LateTuitionStudentType } from '@/types/apps/cashHandoverTypes'
import type { UsersType } from '@/types/apps/userTypes'
import type { InstructorClassCollectionType, InvoiceSummaryType } from '@/types/apps/financeTypes'
import cashHandoverService from '@/services/cashHandoverService'
import type { CreateDeductionRequest } from '@/services/cashHandoverService'
import userService from '@/services/userService'
import financeService from '@/services/financeService'
import ReceiptPreviewDialog from '@/views/apps/invoice/preview/ReceiptPreviewDialog'
import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'
import { hasAdminRole } from '@/utils/roleUtils'
import { hasPermission } from '@/utils/permissionUtils'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<CashHandoverType[]>>
  presetInstructorId?: string
}

type DeductionRow = {
  tempId: string
  description: string
  amount: string
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const paymentMethodLabels: Record<number, string> = { 0: 'Tiền mặt', 1: 'Chuyển khoản', 2: 'Khác' }

const AddCashHandoverDrawer = ({ open, handleClose, setData, presetInstructorId }: Props) => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()
  const isAdmin = hasPermission(auth?.permissions, 'CashHandover.ManageAll') || hasAdminRole(auth?.roles)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [instructors, setInstructors] = useState<UsersType[]>([])
  const [collections, setCollections] = useState<InstructorClassCollectionType[]>([])
  const [lateStudents, setLateStudents] = useState<LateTuitionStudentType[]>([])
  const [showLateStudents, setShowLateStudents] = useState(false)
  const [deductions, setDeductions] = useState<DeductionRow[]>([])
  const [invoiceListOpen, setInvoiceListOpen] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedClassName, setSelectedClassName] = useState('')
  const [classInvoices, setClassInvoices] = useState<InvoiceSummaryType[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewReceiptNumber, setPreviewReceiptNumber] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    instructorId: presetInstructorId || auth?.user.id || '',
    notes: ''
  })

  useEffect(() => {
    if (!open) return
    setFormData(prev => ({
      ...prev,
      instructorId: presetInstructorId || prev.instructorId || auth?.user.id || ''
    }))
  }, [open, presetInstructorId, auth?.user.id])

  useEffect(() => {
    let mounted = true

    const loadReferences = async () => {
      try {
        if (isAdmin) {
          const instructorRes = await userService.getCoaches()
          if (mounted && instructorRes.success && instructorRes.data) {
            setInstructors(instructorRes.data)
            setFormData(prev => ({
              ...prev,
              instructorId: prev.instructorId || auth?.user.id || instructorRes.data?.[0]?.id || ''
            }))
          }
        } else if (mounted) {
          setInstructors([])
          setFormData(prev => ({ ...prev, instructorId: auth?.user.id || '' }))
        }
      } catch {
        if (mounted) showNotification('Không thể tải dữ liệu ban đầu.', 'error')
      }
    }

    if (open) loadReferences()
    return () => { mounted = false }
  }, [open, auth?.user.id, showNotification, isAdmin])

  useEffect(() => {
    let mounted = true

    const loadCollections = async () => {
      if (!open) return
      setLoading(true)
      try {
        const response = formData.instructorId
          ? await financeService.getClassCollectionsByInstructor(formData.instructorId)
          : await financeService.getMyClassCollections()
        if (mounted && response.success && response.data) {
          setCollections(response.data)
        } else if (mounted) {
          setCollections([])
        }
      } catch {
        if (mounted) setCollections([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadCollections()
    return () => { mounted = false }
  }, [open, formData.instructorId])

  useEffect(() => {
    let mounted = true

    const loadLateStudents = async () => {
      if (!open || !formData.instructorId) return
      try {
        const response = await cashHandoverService.getLateTuitionStudents({ instructorId: formData.instructorId })
        if (mounted && response.success && response.data) {
          setLateStudents(response.data)
        } else if (mounted) {
          setLateStudents([])
        }
      } catch {
        if (mounted) setLateStudents([])
      }
    }

    loadLateStudents()
    return () => { mounted = false }
  }, [open, formData.instructorId])

  const totalDeductionAmount = useMemo(
    () => deductions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [deductions]
  )

  const totalAvailableToHandover = useMemo(
    () => collections.reduce((sum, item) => sum + Number(item.availableToHandover || 0), 0),
    [collections]
  )

  const totalAfterDeduction = useMemo(
    () => Math.max(0, totalAvailableToHandover - totalDeductionAmount),
    [totalAvailableToHandover, totalDeductionAmount]
  )

  const totalCashAvailableToHandover = useMemo(
    () => collections.reduce((sum, item) => sum + Number(item.cashAvailableToHandover || 0), 0),
    [collections]
  )

  const totalBankTransferAvailableToHandover = useMemo(
    () => collections.reduce((sum, item) => sum + Number(item.bankTransferAvailableToHandover || 0), 0),
    [collections]
  )

  const addDeductionRow = () => {
    setDeductions(prev => [...prev, { tempId: crypto.randomUUID(), description: '', amount: '' }])
  }

  const removeDeductionRow = (tempId: string) => {
    setDeductions(prev => prev.filter(item => item.tempId !== tempId))
  }

  const updateDeductionRow = (tempId: string, field: 'description' | 'amount', value: string) => {
    setDeductions(prev => prev.map(item => (item.tempId === tempId ? { ...item, [field]: value } : item)))
  }

  const resetAndClose = () => {
    setFormData({ instructorId: auth?.user.id || '', notes: '' })
    setCollections([])
    setLateStudents([])
    setDeductions([])
    setShowLateStudents(false)
    handleClose()
  }

  const getValidDeductions = (): CreateDeductionRequest[] | null => {
    const validRows: CreateDeductionRequest[] = []
    for (const item of deductions) {
      const amount = Number(item.amount)
      if (!item.description.trim() || amount <= 0) {
        showNotification('Khoản trừ phải có mô tả và số tiền hợp lệ.', 'error')
        return null
      }
      validRows.push({ description: item.description.trim(), amount })
    }
    return validRows
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.instructorId) {
      showNotification('Vui lòng chọn người bàn giao.', 'error')
      return
    }
    if (collections.length === 0 || totalAvailableToHandover <= 0) {
      showNotification('Hiện không có lớp nào còn tiền để bàn giao.', 'warning')
      return
    }
    const validDeductions = getValidDeductions()
    if (validDeductions === null) return

    try {
      setSaving(true)
      const response = await cashHandoverService.createCashHandover({
        instructorId: formData.instructorId,
        notes: formData.notes.trim() || undefined,
        deductions: validDeductions.length > 0 ? validDeductions : undefined
      })
      if (!response.success || !response.data) {
        showNotification(response.message || 'Không thể tạo phiếu bàn giao.', 'error')
        return
      }
      setData(prev => [response.data!, ...prev])
      showNotification('Tạo phiếu bàn giao tiền thành công.', 'success')
      resetAndClose()
    } catch {
      showNotification('Đã có lỗi khi tạo phiếu bàn giao.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleViewInvoices = async (classId: string, className: string) => {
    setSelectedClassId(classId)
    setSelectedClassName(className)
    setInvoiceListOpen(true)
    setLoadingInvoices(true)
    try {
      const response = formData.instructorId
        ? await financeService.getClassInvoices(formData.instructorId, classId)
        : await financeService.getMyClassInvoices(classId)
      if (response.success && response.data) {
        setClassInvoices(response.data)
      } else {
        setClassInvoices([])
      }
    } catch {
      setClassInvoices([])
    } finally {
      setLoadingInvoices(false)
    }
  }

  return (
    <>
      <Drawer
        open={open}
        anchor='right'
        variant='temporary'
        onClose={resetAndClose}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: { xs: 360, sm: 560 } } }}
      >
        <div className='flex items-center justify-between pli-5 plb-4'>
          <Typography variant='h5'>Tạo phiếu bàn giao tiền</Typography>
          <IconButton size='small' onClick={resetAndClose}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />

        <div className='p-5 overflow-y-auto'>
          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            {isAdmin && (
              <FormControl fullWidth>
                <InputLabel>Người bàn giao</InputLabel>
                <Select
                  label='Người bàn giao'
                  value={formData.instructorId}
                  onChange={event => setFormData(prev => ({ ...prev, instructorId: event.target.value }))}
                >
                  {instructors.map(item => (
                    <MenuItem key={item.id} value={item.id}>{item.fullName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Summary */}
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, bgcolor: 'action.hover' }}>
              <Typography variant='subtitle2' className='mb-2 font-semibold'>Tổng quan</Typography>

              <Box display='flex' justifyContent='space-between' mb={1}>
                <Typography variant='body2' color='text.secondary'>Tổng tiền đã thu (final):</Typography>
                <Typography variant='body2' className='font-medium'>
                  {formatCurrency(collections.reduce((s, c) => s + Number(c.totalCollectedToDate || 0), 0))}
                </Typography>
              </Box>
              <Box display='flex' justifyContent='space-between' mb={1}>
                <Typography variant='body2' color='text.secondary'>Đã giảm trừ:</Typography>
                <Typography variant='body2' color='warning.main'>
                  -{formatCurrency(collections.reduce((s, c) => s + Number(c.totalDiscountAmount || 0), 0))}
                </Typography>
              </Box>
              <Box display='flex' justifyContent='space-between' mb={1}>
                <Typography variant='body2' color='text.secondary'>Giảm trừ HLV:</Typography>
                <Typography variant='body2' color='warning.main'>
                  -{formatCurrency(collections.reduce((s, c) => s + Number(c.totalManualDiscountAmount || 0), 0))}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box display='flex' justifyContent='space-between' mb={0.5}>
                <Typography variant='body2' color='text.secondary'>TM cần bàn giao:</Typography>
                <Typography variant='body2' className='font-semibold' color='success.main'>
                  {formatCurrency(totalCashAvailableToHandover)}
                </Typography>
              </Box>
              <Box display='flex' justifyContent='space-between'>
                <Typography variant='body2' color='text.secondary'>CK:</Typography>
                <Typography variant='body2'>{formatCurrency(totalBankTransferAvailableToHandover)}</Typography>
              </Box>

              {totalDeductionAmount > 0 && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Box display='flex' justifyContent='space-between'>
                    <Typography variant='body2' className='font-medium'>Tổng cần bàn giao:</Typography>
                    <Typography variant='body2' className='font-semibold' color='warning.main'>
                      {formatCurrency(totalAfterDeduction)}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>

            {/* Class list */}
            <Box>
              <div className='flex items-center justify-between mb-2'>
                <Typography variant='subtitle2' className='font-semibold'>Theo lớp</Typography>
                <Chip label={`${collections.length} lớp`} size='small' color='primary' />
              </div>

              {collections.length === 0 ? (
                <Typography variant='body2' color='text.secondary'>Không có dữ liệu.</Typography>
              ) : (
                <div className='flex flex-col gap-2'>
                  {collections.map(item => (
                    <Box key={item.classId} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                      <Box display='flex' justifyContent='space-between' alignItems='flex-start'>
                        <Box>
                          <Typography className='font-medium'>{item.className}</Typography>
                          <Typography variant='caption' color='text.secondary'>
                            {item.invoiceCount} biên lai
                          </Typography>
                        </Box>
                        <Box textAlign='right'>
                          <Typography variant='body2' className='font-semibold' color='success.main'>
                            {formatCurrency(item.availableToHandover)}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            TM {formatCurrency(item.cashAvailableToHandover)} | CK {formatCurrency(item.bankTransferAvailableToHandover)}
                          </Typography>
                        </Box>
                      </Box>
                      <Box display='flex' justifyContent='space-between' mt={1}>
                        <Box display='flex' gap={1}>
                          {item.totalDiscountAmount > 0 && (
                            <Chip label={`Giảm: ${formatCurrency(item.totalDiscountAmount)}`} size='small' color='warning' variant='outlined' />
                          )}
                          {item.totalManualDiscountAmount > 0 && (
                            <Chip label={`HLV: ${formatCurrency(item.totalManualDiscountAmount)}`} size='small' color='warning' variant='outlined' />
                          )}
                        </Box>
                        <Button size='small' variant='outlined' onClick={() => handleViewInvoices(item.classId, item.className || '')}>
                          Xem biên lai
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </div>
              )}
            </Box>

            {/* Late students */}
            {lateStudents.length > 0 && (
              <Box>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Typography variant='subtitle2' className='font-semibold'>Học viên chậm học phí</Typography>
                    <Chip label={lateStudents.length} size='small' color='warning' />
                  </div>
                  <Button type='button' size='small' onClick={() => setShowLateStudents(prev => !prev)} variant='text'>
                    {showLateStudents ? 'Ẩn' : 'Xem'}
                  </Button>
                </div>
                {showLateStudents && (
                  <Table size='small' sx={{ mt: 1 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Học viên</TableCell>
                        <TableCell>Lớp</TableCell>
                        <TableCell align='right'>Số ngày</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lateStudents.map(item => (
                        <TableRow key={`${item.studentId}-${item.classId}`}>
                          <TableCell>{item.studentName}</TableCell>
                          <TableCell>{item.className}</TableCell>
                          <TableCell align='right'>
                            <Chip label={`${item.daysSinceLastPayment} ngày`} size='small' color={item.daysSinceLastPayment > 60 ? 'error' : 'warning'} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>
            )}

            {/* Deductions */}
            <Box>
              <div className='flex items-center justify-between mb-2'>
                <Typography variant='subtitle2' className='font-semibold'>Khoản trừ</Typography>
                <Button type='button' size='small' startIcon={<i className='ri-add-line' />} onClick={addDeductionRow}>Thêm</Button>
              </div>
              {deductions.length === 0 && (
                <Typography variant='body2' color='text.secondary'>Chưa có khoản trừ.</Typography>
              )}
              {deductions.map(item => (
                <div key={item.tempId} className='flex gap-2 mb-2 items-center'>
                  <TextField size='small' label='Mô tả' value={item.description} onChange={event => updateDeductionRow(item.tempId, 'description', event.target.value)} sx={{ flex: 2 }} />
                  <TextField size='small' label='Số tiền' type='number' value={item.amount} onChange={event => updateDeductionRow(item.tempId, 'amount', event.target.value)} sx={{ flex: 1 }} />
                  <IconButton size='small' color='error' onClick={() => removeDeductionRow(item.tempId)}>
                    <i className='ri-delete-bin-line' />
                  </IconButton>
                </div>
              ))}
            </Box>

            <TextField label='Ghi chú' multiline rows={2} value={formData.notes} onChange={event => setFormData(prev => ({ ...prev, notes: event.target.value }))} />

            <div className='flex items-center gap-3 flex-wrap'>
              <Button type='submit' variant='contained' disabled={loading || saving || totalAvailableToHandover <= 0}>
                {saving ? 'Đang xử lý...' : `Tạo phiếu bàn giao ${formatCurrency(totalAfterDeduction > 0 ? totalAfterDeduction : totalAvailableToHandover)}`}
              </Button>
              <Button type='button' variant='outlined' color='error' onClick={resetAndClose}>Hủy</Button>
            </div>
          </form>
        </div>
      </Drawer>

      {/* Invoice list dialog */}
      <Dialog open={invoiceListOpen} onClose={() => setInvoiceListOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Typography variant='h6'>Biên lai - {selectedClassName}</Typography>
            <IconButton size='small' onClick={() => setInvoiceListOpen(false)}>
              <i className='ri-close-line' />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loadingInvoices ? (
            <LinearProgress />
          ) : classInvoices.length === 0 ? (
            <Typography color='text.secondary' textAlign='center' py={4}>Không có biên lai nào.</Typography>
          ) : (
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Số biên lai</TableCell>
                  <TableCell>Học viên</TableCell>
                  <TableCell>Ngày thu</TableCell>
                  <TableCell align='right'>Tổng gốc</TableCell>
                  <TableCell align='right'>Giảm trừ</TableCell>
                  <TableCell align='right'>Thực thu</TableCell>
                  <TableCell>Phương thức</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classInvoices.map(inv => (
                  <TableRow key={inv.receiptNumber} hover sx={{ cursor: 'pointer' }} onClick={() => {
                    setPreviewReceiptNumber(inv.receiptNumber)
                    setPreviewOpen(true)
                  }}>
                    <TableCell>
                      <Typography color='primary' fontWeight={500} variant='body2'>{inv.receiptNumber}</Typography>
                    </TableCell>
                    <TableCell>{inv.studentName}</TableCell>
                    <TableCell>{new Date(inv.paymentDate).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell align='right'>{formatCurrency(inv.totalAmount)}</TableCell>
                    <TableCell align='right'>
                      {inv.discountAmount > 0 ? (
                        <Typography color='warning.main'>-{formatCurrency(inv.discountAmount)}</Typography>
                      ) : '—'}
                    </TableCell>
                    <TableCell align='right'>
                      <Typography fontWeight={600}>{formatCurrency(inv.finalAmount)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={paymentMethodLabels[inv.method] || '-'} size='small' variant='tonal' />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <ReceiptPreviewDialog
        open={previewOpen}
        receiptNumber={previewReceiptNumber}
        onClose={() => {
          setPreviewOpen(false)
          setPreviewReceiptNumber(null)
        }}
      />
    </>
  )
}

export default AddCashHandoverDrawer
