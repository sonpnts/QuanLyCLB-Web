'use client'

import { useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
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
import type { InstructorClassCollectionType } from '@/types/apps/financeTypes'
import cashHandoverService from '@/services/cashHandoverService'
import type { CreateDeductionRequest } from '@/services/cashHandoverService'
import userService from '@/services/userService'
import financeService from '@/services/financeService'
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

const AddCashHandoverDrawer = ({ open, handleClose, setData, presetInstructorId }: Props) => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()
  const isAdmin = hasPermission(auth?.permissions, 'CashHandover.ManageAll') || hasAdminRole(auth?.roles)

  const [loading, setLoading] = useState(false)
  const [instructors, setInstructors] = useState<UsersType[]>([])
  const [collections, setCollections] = useState<InstructorClassCollectionType[]>([])
  const [lateStudents, setLateStudents] = useState<LateTuitionStudentType[]>([])
  const [showLateStudents, setShowLateStudents] = useState(false)
  const [expandedClassIds, setExpandedClassIds] = useState<string[]>([])
  const [deductions, setDeductions] = useState<DeductionRow[]>([])

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

    return () => {
      mounted = false
    }
  }, [open, auth?.user.id, showNotification, isAdmin])

  useEffect(() => {
    let mounted = true

    const loadCollections = async () => {
      if (!open) return

      try {
        const response = formData.instructorId
          ? await financeService.getClassCollectionsByInstructor(formData.instructorId)
          : await financeService.getMyClassCollections()

        if (mounted && response.success && response.data) {
          setCollections(response.data.filter(item => item.availableToHandover > 0))
        } else if (mounted) {
          setCollections([])
        }
      } catch {
        if (mounted) setCollections([])
      }
    }

    loadCollections()

    return () => {
      mounted = false
    }
  }, [open, formData.instructorId])

  useEffect(() => {
    let mounted = true

    const loadLateStudents = async () => {
      if (!open || !formData.instructorId) return

      try {
        const response = await cashHandoverService.getLateTuitionStudents({
          instructorId: formData.instructorId
        })

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

    return () => {
      mounted = false
    }
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

  const aggregatedBreakdown = useMemo(() => {
    const map = new Map<string, { key: string; label: string; amount: number }>()

    collections.forEach(item => {
      item.breakdown.forEach(detail => {
        const current = map.get(detail.key)

        if (current) {
          current.amount += Number(detail.amount || 0)
        } else {
          map.set(detail.key, {
            key: detail.key,
            label: detail.label,
            amount: Number(detail.amount || 0)
          })
        }
      })
    })

    return Array.from(map.values())
  }, [collections])

  const addDeductionRow = () => {
    setDeductions(prev => [...prev, { tempId: crypto.randomUUID(), description: '', amount: '' }])
  }

  const removeDeductionRow = (tempId: string) => {
    setDeductions(prev => prev.filter(item => item.tempId !== tempId))
  }

  const updateDeductionRow = (tempId: string, field: 'description' | 'amount', value: string) => {
    setDeductions(prev => prev.map(item => (item.tempId === tempId ? { ...item, [field]: value } : item)))
  }

  const toggleExpandedClass = (classId: string) => {
    setExpandedClassIds(prev =>
      prev.includes(classId) ? prev.filter(item => item !== classId) : [...prev, classId]
    )
  }

  const resetAndClose = () => {
    setFormData({ instructorId: auth?.user.id || '', notes: '' })
    setCollections([])
    setLateStudents([])
    setExpandedClassIds([])
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
      setLoading(true)

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
      setLoading(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={resetAndClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 360, sm: 620 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Tạo phiếu bàn giao tiền</Typography>
        <IconButton size='small' onClick={resetAndClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />

      <div className='p-5 overflow-y-auto'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          {/*<Alert severity='info' sx={{ py: 0.5 }}>*/}
          {/*  Phiếu bàn giao được tạo theo người bàn giao. Màn hình này chỉ hiển thị số tiền cần bàn giao tới thời điểm*/}
          {/*  hiện tại, còn số tiền đã bàn giao trước đó sẽ xem trong lịch sử bàn giao.*/}
          {/*</Alert>*/}

          {isAdmin && (
            <FormControl fullWidth>
              <InputLabel>Người bàn giao</InputLabel>

              <Select
                label='Người bàn giao'
                value={formData.instructorId}
                onChange={event =>
                  setFormData(prev => ({
                    ...prev,
                    instructorId: event.target.value
                  }))
                }
              >
                {instructors.map(item => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, bgcolor: 'action.hover' }}>
            <Typography variant='subtitle2' className='mb-3 font-semibold'>
              Số tiền cần bàn giao tới thời điểm hiện tại
            </Typography>

            {aggregatedBreakdown.map(item => (
              <div key={item.key} className='flex justify-between mb-1'>
                <Typography variant='body2' color='text.secondary'>
                  {item.label}:
                </Typography>
                <Typography variant='body2' className='font-medium'>
                  {formatCurrency(item.amount)}
                </Typography>
              </div>
            ))}

            <Divider sx={{ my: 1.5 }} />

            <div className='flex justify-between mb-1'>
              <Typography variant='body2' color='text.secondary'>
                Tổng cần bàn giao:
              </Typography>
              <Typography variant='body2' className='font-semibold' color='success.main'>
                {formatCurrency(totalAvailableToHandover)}
              </Typography>
            </div>

            {totalDeductionAmount > 0 && (
              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>
                  Cần bàn giao sau khoản trừ:
                </Typography>
                <Typography variant='body2' className='font-semibold' color='warning.main'>
                  {formatCurrency(totalAfterDeduction)}
                </Typography>
              </div>
            )}
          </Box>

          <Box>
            <div className='flex items-center justify-between mb-2'>
              <Typography variant='subtitle2' className='font-semibold'>
                Chi tiết số tiền cần bàn giao theo lớp
              </Typography>
              <Chip label={`${collections.length} lớp còn tiền`} size='small' color='primary' />
            </div>

            {collections.length === 0 ? (
              <Typography variant='body2' color='text.secondary'>
                Hiện chưa có dữ liệu cần bàn giao.
              </Typography>
            ) : (
              <div className='flex flex-col gap-2'>
                {collections.map(item => {
                  const expanded = expandedClassIds.includes(item.classId)

                  return (
                    <Box key={item.classId} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <Typography className='font-medium'>{item.className || item.classId}</Typography>
                          <Typography variant='body2' color='success.main'>
                            Cần bàn giao: {formatCurrency(item.availableToHandover)}
                          </Typography>
                        </div>

                        <Button
                          type='button'
                          size='small'
                          variant='text'
                          onClick={() => toggleExpandedClass(item.classId)}
                        >
                          {expanded ? 'Ẩn' : 'Xem'}
                        </Button>
                      </div>

                      <Collapse in={expanded}>
                        <Box sx={{ mt: 2 }}>
                          <Table size='small'>
                            <TableHead>
                              <TableRow>
                                <TableCell>Khoản mục cần bàn giao</TableCell>
                                <TableCell align='right'>Số tiền</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {item.breakdown.map(detail => (
                                <TableRow key={detail.key}>
                                  <TableCell>{detail.label}</TableCell>
                                  <TableCell align='right'>{formatCurrency(detail.amount)}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Tổng cần bàn giao</TableCell>
                                <TableCell align='right' sx={{ fontWeight: 600, color: 'success.main' }}>
                                  {formatCurrency(item.availableToHandover)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </Box>
                  )
                })}
              </div>
            )}
          </Box>

          <Box>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Typography variant='subtitle2' className='font-semibold'>
                  Học viên chậm học phí
                </Typography>
                {lateStudents.length > 0 && <Chip label={lateStudents.length} size='small' color='warning' />}
              </div>
              {lateStudents.length > 0 && (
                <Button type='button' size='small' onClick={() => setShowLateStudents(prev => !prev)} variant='text'>
                  {showLateStudents ? 'Ẩn' : 'Xem'}
                </Button>
              )}
            </div>

            {lateStudents.length === 0 && (
              <Typography variant='body2' color='success.main' sx={{ mt: 0.5 }}>
                Không có học viên chậm đóng học phí.
              </Typography>
            )}

            <Collapse in={showLateStudents}>
              <Box
                sx={{ mt: 1, border: '1px solid', borderColor: 'warning.light', borderRadius: 1, overflow: 'hidden' }}
              >
                <Table size='small'>
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
                          <Chip
                            label={`${item.daysSinceLastPayment} ngày`}
                            size='small'
                            color={item.daysSinceLastPayment > 60 ? 'error' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </Box>

          <Box>
            <div className='flex items-center justify-between mb-2'>
              <Typography variant='subtitle2' className='font-semibold'>
                Khoản trừ
              </Typography>
              <Button type='button' size='small' startIcon={<i className='ri-add-line' />} onClick={addDeductionRow}>
                Thêm
              </Button>
            </div>

            {deductions.length === 0 && (
              <Typography variant='body2' color='text.secondary'>
                Chưa có khoản trừ nào.
              </Typography>
            )}

            {deductions.map(item => (
              <div key={item.tempId} className='flex gap-2 mb-2 items-center'>
                <TextField
                  size='small'
                  label='Mô tả'
                  value={item.description}
                  onChange={event => updateDeductionRow(item.tempId, 'description', event.target.value)}
                  sx={{ flex: 2 }}
                />
                <TextField
                  size='small'
                  label='Số tiền'
                  type='number'
                  value={item.amount}
                  onChange={event => updateDeductionRow(item.tempId, 'amount', event.target.value)}
                  sx={{ flex: 1 }}
                />
                <IconButton size='small' color='error' onClick={() => removeDeductionRow(item.tempId)}>
                  <i className='ri-delete-bin-line' />
                </IconButton>
              </div>
            ))}
          </Box>

          <TextField
            label='Ghi chú'
            multiline
            rows={2}
            value={formData.notes}
            onChange={event => setFormData(prev => ({ ...prev, notes: event.target.value }))}
          />

          <div className='flex items-center gap-3 flex-wrap'>
            <Button type='submit' variant='contained' disabled={loading || totalAvailableToHandover <= 0}>
              {loading ? 'Đang xử lý...' : 'Tạo phiếu bàn giao'}
            </Button>
            <Button type='button' variant='outlined' color='error' onClick={resetAndClose}>
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddCashHandoverDrawer
