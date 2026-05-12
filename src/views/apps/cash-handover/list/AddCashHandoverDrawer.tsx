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
import type { ClassType } from '@/types/apps/classTypes'
import type { UsersType } from '@/types/apps/userTypes'
import type { InstructorClassCollectionType } from '@/types/apps/financeTypes'
import cashHandoverService from '@/services/cashHandoverService'
import type { CreateDeductionRequest } from '@/services/cashHandoverService'
import classService from '@/services/classService'
import userService from '@/services/userService'
import financeService from '@/services/financeService'
import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'
import { hasAdminRole } from '@/utils/roleUtils'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<CashHandoverType[]>>
  presetInstructorId?: string
  presetClassId?: string
}

type DeductionRow = {
  tempId: string
  description: string
  amount: string
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const AddCashHandoverDrawer = ({ open, handleClose, setData, presetInstructorId, presetClassId }: Props) => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()
  const isAdmin = hasAdminRole(auth?.roles)

  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<ClassType[]>([])
  const [instructors, setInstructors] = useState<UsersType[]>([])
  const [collections, setCollections] = useState<InstructorClassCollectionType[]>([])
  const [lateStudents, setLateStudents] = useState<LateTuitionStudentType[]>([])
  const [showLateStudents, setShowLateStudents] = useState(false)
  const [deductions, setDeductions] = useState<DeductionRow[]>([])

  const [formData, setFormData] = useState({
    classId: '',
    instructorId: presetInstructorId || auth?.user.id || '',
    notes: ''
  })

  useEffect(() => {
    if (!open) return
    setFormData(prev => ({
      ...prev,
      instructorId: presetInstructorId || prev.instructorId || auth?.user.id || '',
      classId: presetClassId || prev.classId
    }))
  }, [open, presetInstructorId, presetClassId, auth?.user.id])

  useEffect(() => {
    let mounted = true
    const loadReferences = async () => {
      try {
        if (isAdmin) {
          const [classRes, instructorRes] = await Promise.all([
            classService.getClasses({ isActive: true, pageSize: 1000 }),
            userService.getCoaches()
          ])

          if (mounted && classRes.success && classRes.data) setClasses(classRes.data)
          if (mounted && instructorRes.success && instructorRes.data) {
            setInstructors(instructorRes.data)
            setFormData(prev => ({
              ...prev,
              instructorId: prev.instructorId || auth?.user.id || instructorRes.data?.[0]?.id || ''
            }))
          }
        } else {
          const classRes = await classService.getClassesByUserId(auth?.user.id || '')
          if (mounted && classRes.success && classRes.data) setClasses(classRes.data)
          if (mounted) setInstructors([])
          setFormData(prev => ({ ...prev, instructorId: auth?.user.id || '' }))
        }
      } catch {
        if (mounted) showNotification('KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u ban Ä‘áº§u.', 'error')
      }
    }

    if (open) loadReferences()
    return () => { mounted = false }
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
          setCollections(response.data)
          setFormData(prev => ({
            ...prev,
            classId: prev.classId || response.data?.[0]?.classId || ''
          }))
        } else {
          if (mounted) setCollections([])
        }
      } catch {
        if (mounted) setCollections([])
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
        const response = await cashHandoverService.getLateTuitionStudents({
          instructorId: formData.instructorId,
          classId: formData.classId || undefined
        })

        if (mounted && response.success && response.data) {
          setLateStudents(response.data)
        } else {
          if (mounted) setLateStudents([])
        }
      } catch {
        if (mounted) setLateStudents([])
      }
    }

    loadLateStudents()
    return () => { mounted = false }
  }, [open, formData.instructorId, formData.classId])

  const classOptions = useMemo(() => {
    if (collections.length > 0) {
      return collections.map(item => ({ id: item.classId, name: item.className || item.classId }))
    }

    return classes.map(item => ({ id: item.id, name: item.name }))
  }, [collections, classes])

  const selectedCollection = useMemo(
    () => collections.find(item => item.classId === formData.classId) || null,
    [collections, formData.classId]
  )

  const totalDeductionAmount = useMemo(
    () => deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
    [deductions]
  )

  const addDeductionRow = () => {
    setDeductions(prev => [...prev, { tempId: crypto.randomUUID(), description: '', amount: '' }])
  }

  const removeDeductionRow = (tempId: string) => {
    setDeductions(prev => prev.filter(d => d.tempId !== tempId))
  }

  const updateDeductionRow = (tempId: string, field: 'description' | 'amount', value: string) => {
    setDeductions(prev => prev.map(d => (d.tempId === tempId ? { ...d, [field]: value } : d)))
  }

  const resetAndClose = () => {
    setFormData({ classId: '', instructorId: auth?.user.id || '', notes: '' })
    setCollections([])
    setLateStudents([])
    setDeductions([])
    setShowLateStudents(false)
    handleClose()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.classId || !formData.instructorId) {
      showNotification('Vui lÃ²ng chá»n lá»›p vÃ  HLV.', 'error')
      return
    }

    const validDeductions: CreateDeductionRequest[] = []
    for (const d of deductions) {
      const amt = Number(d.amount)

      if (!d.description.trim() || amt <= 0) {
        showNotification('Khoáº£n trá»« pháº£i cÃ³ mÃ´ táº£ vÃ  sá»‘ tiá»n há»£p lá»‡.', 'error')
        return
      }

      validDeductions.push({ description: d.description.trim(), amount: amt })
    }

    try {
      setLoading(true)
      const response = await cashHandoverService.createCashHandover({
        classId: formData.classId,
        instructorId: formData.instructorId,
        notes: formData.notes.trim() || undefined,
        deductions: validDeductions.length > 0 ? validDeductions : undefined
      })

      if (!response.success || !response.data) {
        showNotification(response.message || 'KhÃ´ng thá»ƒ táº¡o phiáº¿u bÃ n giao.', 'error')
        return
      }

      setData(prev => [response.data!, ...prev])
      showNotification('Táº¡o phiáº¿u bÃ n giao tiá»n thÃ nh cÃ´ng.', 'success')
      resetAndClose()
    } catch {
      showNotification('ÄÃ£ cÃ³ lá»—i khi táº¡o phiáº¿u bÃ n giao.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const lateInClass = useMemo(
    () => (formData.classId ? lateStudents.filter(s => s.classId === formData.classId) : lateStudents),
    [lateStudents, formData.classId]
  )

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={resetAndClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 340, sm: 520 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Táº¡o phiáº¿u bÃ n giao tiá»n</Typography>
        <IconButton size='small' onClick={resetAndClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />

      <div className='p-5 overflow-y-auto'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>

          {/* Instructor & Class */}
          <FormControl fullWidth>
            <InputLabel>Huáº¥n luyá»‡n viÃªn</InputLabel>
            <Select
              label='Huáº¥n luyá»‡n viÃªn'
              value={formData.instructorId}
              disabled={!isAdmin}
              onChange={e => setFormData(prev => ({ ...prev, instructorId: e.target.value, classId: "" }))}
            >
              {!isAdmin && <MenuItem value={auth?.user.id || ''}>{auth?.user?.fullName || 'Tôi'}</MenuItem>}
              {instructors.map(item => (
                <MenuItem key={item.id} value={item.id}>{item.fullName}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Lá»›p</InputLabel>
            <Select
              label='Lá»›p'
              value={formData.classId}
              onChange={e => setFormData(prev => ({ ...prev, classId: e.target.value }))}
            >
              {classOptions.map(item => (
                <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Raw totals panel */}
          {selectedCollection && (
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, bgcolor: 'action.hover' }}>
              <Typography variant='subtitle2' className='mb-2 font-semibold'>
                Tá»•ng thu Ä‘áº¿n hiá»‡n táº¡i
              </Typography>
              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>Há»c phÃ­:</Typography>
                <Typography variant='body2' className='font-medium'>
                  {formatCurrency(selectedCollection.tuitionCollectedToDate)}
                </Typography>
              </div>
              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>BÃ¡n sáº£n pháº©m:</Typography>
                <Typography variant='body2' className='font-medium'>
                  {formatCurrency(selectedCollection.productSalesCollectedToDate)}
                </Typography>
              </div>
              <Divider sx={{ my: 1 }} />
              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>Tá»•ng cá»™ng:</Typography>
                <Typography variant='body2' className='font-semibold' color='primary.main'>
                  {formatCurrency(selectedCollection.totalCollectedToDate)}
                </Typography>
              </div>
            </Box>
          )}

          {/* Late students panel */}
          <Box>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Typography variant='subtitle2' className='font-semibold'>
                  Há»c viÃªn cháº­m há»c phÃ­
                </Typography>
                {lateInClass.length > 0 && (
                  <Chip label={lateInClass.length} size='small' color='warning' />
                )}
              </div>
              {lateInClass.length > 0 && (
                <Button
                  size='small'
                  onClick={() => setShowLateStudents(v => !v)}
                  variant='text'
                >
                  {showLateStudents ? 'áº¨n' : 'Xem'}
                </Button>
              )}
            </div>

            {lateInClass.length === 0 && (
              <Typography variant='body2' color='success.main' sx={{ mt: 0.5 }}>
                KhÃ´ng cÃ³ há»c viÃªn cháº­m Ä‘Ã³ng há»c phÃ­
              </Typography>
            )}

            <Collapse in={showLateStudents}>
              <Box sx={{ mt: 1, border: '1px solid', borderColor: 'warning.light', borderRadius: 1, overflow: 'hidden' }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'warning.lighter' }}>
                      <TableCell>Há»c viÃªn</TableCell>
                      <TableCell>Lá»›p</TableCell>
                      <TableCell align='right'>Sá»‘ ngÃ y</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lateInClass.map(s => (
                      <TableRow key={s.studentId}>
                        <TableCell>{s.studentName}</TableCell>
                        <TableCell>{s.className}</TableCell>
                        <TableCell align='right'>
                          <Chip
                            label={`${s.daysSinceLastPayment} ngÃ y`}
                            size='small'
                            color={s.daysSinceLastPayment > 60 ? 'error' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </Box>

          {/* Deductions */}
          <Box>
            <div className='flex items-center justify-between mb-2'>
              <Typography variant='subtitle2' className='font-semibold'>
                Khoáº£n trá»«
              </Typography>
              <Button size='small' startIcon={<i className='ri-add-line' />} onClick={addDeductionRow}>
                ThÃªm
              </Button>
            </div>

            {deductions.length === 0 && (
              <Typography variant='body2' color='text.secondary'>
                ChÆ°a cÃ³ khoáº£n trá»« nÃ o
              </Typography>
            )}

            {deductions.map((d, idx) => (
              <div key={d.tempId} className='flex gap-2 mb-2 items-center'>
                <TextField
                  size='small'
                  label='MÃ´ táº£'
                  value={d.description}
                  onChange={e => updateDeductionRow(d.tempId, 'description', e.target.value)}
                  sx={{ flex: 2 }}
                />
                <TextField
                  size='small'
                  label='Sá»‘ tiá»n'
                  type='number'
                  value={d.amount}
                  onChange={e => updateDeductionRow(d.tempId, 'amount', e.target.value)}
                  sx={{ flex: 1 }}
                />
                <IconButton size='small' color='error' onClick={() => removeDeductionRow(d.tempId)}>
                  <i className='ri-delete-bin-line' />
                </IconButton>
              </div>
            ))}

            {deductions.length > 0 && (
              <div className='flex justify-end mt-1'>
                <Typography variant='body2' color='error.main' className='font-medium'>
                  Tá»•ng khoáº£n trá»«: {formatCurrency(totalDeductionAmount)}
                </Typography>
              </div>
            )}
          </Box>

          {/* Summary before submit */}
          {selectedCollection && (
            <Alert severity='info' sx={{ py: 0.5 }}>
              <Typography variant='body2'>
                Sá»‘ tiá»n bÃ n giao ={' '}
                <strong>{formatCurrency(selectedCollection.totalCollectedToDate)}</strong>
                {selectedCollection.totalHandedOver > 0 && (
                  <> âˆ’ Ä‘Ã£ bÃ n giao <strong>{formatCurrency(selectedCollection.totalHandedOver)}</strong></>
                )}
                {totalDeductionAmount > 0 && (
                  <> âˆ’ khoáº£n trá»« <strong>{formatCurrency(totalDeductionAmount)}</strong></>
                )}
                {' = '}
                <strong style={{ color: 'var(--mui-palette-success-main)' }}>
                  {formatCurrency(
                    Math.max(0, selectedCollection.totalCollectedToDate - selectedCollection.totalHandedOver - totalDeductionAmount)
                  )}
                </strong>
              </Typography>
            </Alert>
          )}

          {/* Notes */}
          <TextField
            label='Ghi chÃº'
            multiline
            rows={2}
            value={formData.notes}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          />

          <div className='flex items-center gap-4'>
            <Button type='submit' variant='contained' disabled={loading || !formData.classId}>
              {loading ? 'Äang xá»­ lÃ½...' : 'Táº¡o phiáº¿u'}
            </Button>
            <Button variant='outlined' color='error' onClick={resetAndClose}>
              Há»§y
            </Button>
          </div>

        </form>
      </div>
    </Drawer>
  )
}

export default AddCashHandoverDrawer
