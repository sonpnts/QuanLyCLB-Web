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
import { hasPermission } from '@/utils/permissionUtils'

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
  const isAdmin = hasPermission(auth?.permissions, 'CashHandover.ManageAll') || hasAdminRole(auth?.roles)

  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<ClassType[]>([])
  const [instructors, setInstructors] = useState<UsersType[]>([])
  const [collections, setCollections] = useState<InstructorClassCollectionType[]>([])
  const [lateStudents, setLateStudents] = useState<LateTuitionStudentType[]>([])
  const [showLateStudents, setShowLateStudents] = useState(false)
  const [expandedClassIds, setExpandedClassIds] = useState<string[]>([])
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
          setCollections(response.data)
          setFormData(prev => ({
            ...prev,
            classId: presetClassId || prev.classId || response.data?.[0]?.classId || ''
          }))
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
  }, [open, formData.instructorId, presetClassId])

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

  const collectionsWithMoney = useMemo(
    () => collections.filter(item => item.availableToHandover > 0),
    [collections]
  )

  const totalDeductionAmount = useMemo(
    () => deductions.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [deductions]
  )

  const lateInClass = useMemo(
    () => (formData.classId ? lateStudents.filter(item => item.classId === formData.classId) : lateStudents),
    [lateStudents, formData.classId]
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

  const toggleExpandedClass = (classId: string) => {
    setExpandedClassIds(prev =>
      prev.includes(classId) ? prev.filter(item => item !== classId) : [...prev, classId]
    )
  }

  const resetAndClose = () => {
    setFormData({ classId: '', instructorId: auth?.user.id || '', notes: '' })
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
        showNotification('Khoáº£n trá»« pháº£i cÃ³ mÃ´ táº£ vÃ  sá»‘ tiá»n há»£p lá»‡.', 'error')
        return null
      }

      validRows.push({ description: item.description.trim(), amount })
    }

    return validRows
  }

  const createSingleHandover = async (classId: string, appliedDeductions?: CreateDeductionRequest[]) => {
    return cashHandoverService.createCashHandover({
      classId,
      instructorId: formData.instructorId,
      notes: formData.notes.trim() || undefined,
      deductions: appliedDeductions && appliedDeductions.length > 0 ? appliedDeductions : undefined
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!formData.classId || !formData.instructorId) {
      showNotification('Vui lÃ²ng chá»n lá»›p vÃ  huáº¥n luyá»‡n viÃªn.', 'error')
      return
    }

    const validDeductions = getValidDeductions()

    if (validDeductions === null) return

    try {
      setLoading(true)

      const response = await createSingleHandover(formData.classId, validDeductions)

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

  const handleCreateAllHandovers = async () => {
    if (!formData.instructorId) {
      showNotification('Vui lÃ²ng chá»n huáº¥n luyá»‡n viÃªn.', 'error')
      return
    }

    if (deductions.length > 0) {
      showNotification('BÃ n giao toÃ n bá»™ khÃ´ng Ã¡p dá»¥ng khi Ä‘ang cÃ³ khoáº£n trá»«. HÃ£y táº¡o theo tá»«ng lá»›p.', 'warning')
      return
    }

    if (collectionsWithMoney.length === 0) {
      showNotification('Hiá»‡n khÃ´ng cÃ³ lá»›p nÃ o cÃ²n tiá»n Ä‘á»ƒ bÃ n giao.', 'warning')
      return
    }

    try {
      setLoading(true)

      const createdRows: CashHandoverType[] = []
      const failedClasses: string[] = []

      for (const item of collectionsWithMoney) {
        const response = await createSingleHandover(item.classId)

        if (response.success && response.data) {
          createdRows.push(response.data)
        } else {
          failedClasses.push(item.className || item.classId)
        }
      }

      if (createdRows.length > 0) {
        setData(prev => [...createdRows, ...prev])
      }

      if (failedClasses.length === 0) {
        showNotification(`ÄÃ£ táº¡o ${createdRows.length} phiáº¿u bÃ n giao Ä‘áº¿n thá»i Ä‘iá»ƒm hiá»‡n táº¡i.`, 'success')
        resetAndClose()
        return
      }

      showNotification(
        `ÄÃ£ táº¡o ${createdRows.length}/${collectionsWithMoney.length} phiáº¿u. ChÆ°a táº¡o Ä‘Æ°á»£c: ${failedClasses.join(', ')}`,
        'warning'
      )
      resetAndClose()
    } catch {
      showNotification('ÄÃ£ cÃ³ lá»—i khi bÃ n giao toÃ n bá»™.', 'error')
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
      sx={{ '& .MuiDrawer-paper': { width: { xs: 360, sm: 560 } } }}
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
          <Alert severity='info' sx={{ py: 0.5 }}>
            Khi táº¡o phiáº¿u, há»‡ thá»‘ng máº·c Ä‘á»‹nh bÃ n giao toÃ n bá»™ sá»‘ tiá»n kháº£ dá»¥ng cá»§a lá»›p tá»›i thá»i Ä‘iá»ƒm hiá»‡n táº¡i.
          </Alert>

          <FormControl fullWidth>
            <InputLabel>Huáº¥n luyá»‡n viÃªn</InputLabel>
            <Select
              label='Huáº¥n luyá»‡n viÃªn'
              value={formData.instructorId}
              disabled={!isAdmin}
              onChange={event => setFormData(prev => ({ ...prev, instructorId: event.target.value, classId: '' }))}
            >
              {!isAdmin && <MenuItem value={auth?.user.id || ''}>{auth?.user?.fullName || 'TÃ´i'}</MenuItem>}
              {instructors.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Lá»›p</InputLabel>
            <Select
              label='Lá»›p'
              value={formData.classId}
              onChange={event => setFormData(prev => ({ ...prev, classId: event.target.value }))}
            >
              {classOptions.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedCollection && (
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, bgcolor: 'action.hover' }}>
              <Typography variant='subtitle2' className='mb-2 font-semibold'>
                Khoản cần bàn giao của lớp đang chọn
              </Typography>

              {selectedCollection.breakdown.map(item => (
                <div key={item.key} className='flex justify-between'>
                  <Typography variant='body2' color='text.secondary'>
                    {item.label}:
                  </Typography>
                  <Typography variant='body2' className='font-medium'>
                    {formatCurrency(item.amount)}
                  </Typography>
                </div>
              ))}

              <Divider sx={{ my: 1 }} />

              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>
                  Tổng ghi nhận:
                </Typography>
                <Typography variant='body2' className='font-medium'>
                  {formatCurrency(selectedCollection.totalCollectedToDate)}
                </Typography>
              </div>

              <div className='flex justify-between'>
                <Typography variant='body2' color='text.secondary'>
                  Cần bàn giao:
                </Typography>
                <Typography variant='body2' className='font-semibold' color='success.main'>
                  {formatCurrency(selectedCollection.availableToHandover)}
                </Typography>
              </div>
            </Box>
          )}

          <Box>
            <div className='flex items-center justify-between mb-2'>
              <Typography variant='subtitle2' className='font-semibold'>
                Sá»‘ tiá»n theo tá»«ng lá»›p
              </Typography>
              <Chip label={`${collectionsWithMoney.length} lá»›p cÃ²n tiá»n`} size='small' color='primary' />
            </div>

            {collections.length === 0 ? (
              <Typography variant='body2' color='text.secondary'>
                ChÆ°a cÃ³ dá»¯ liá»‡u thu tiá»n theo lá»›p.
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
                          <Typography variant='body2' color='text.secondary'>
                            Tổng ghi nhận {formatCurrency(item.totalCollectedToDate)}
                          </Typography>
                          <Typography variant='body2' color={item.availableToHandover > 0 ? 'success.main' : 'text.secondary'}>
                            Cần bàn giao: {formatCurrency(item.availableToHandover)}
                          </Typography>
                        </div>

                        <div className='flex items-center gap-2'>
                          <Button type='button' size='small' variant='text' onClick={() => toggleExpandedClass(item.classId)}>
                            {expanded ? 'áº¨n' : 'Xem'}
                          </Button>
                          <Button
                            type='button'
                            size='small'
                            variant={formData.classId === item.classId ? 'contained' : 'outlined'}
                            onClick={() => setFormData(prev => ({ ...prev, classId: item.classId }))}
                          >
                            Chá»n lá»›p
                          </Button>
                        </div>
                      </div>

                      <Collapse in={expanded}>
                        <Box sx={{ mt: 2 }}>
                          <Table size='small'>
                            <TableHead>
                              <TableRow>
                                <TableCell>Khoản chưa bàn giao</TableCell>
                                <TableCell align='right'>Sá»‘ tiá»n</TableCell>
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
                                <TableCell sx={{ fontWeight: 600 }}>Tổng ghi nhận</TableCell>
                                <TableCell align='right' sx={{ fontWeight: 600 }}>
                                  {formatCurrency(item.totalCollectedToDate)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>Cần bàn giao</TableCell>
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
                  Há»c viÃªn cháº­m há»c phÃ­
                </Typography>
                {lateInClass.length > 0 && <Chip label={lateInClass.length} size='small' color='warning' />}
              </div>
              {lateInClass.length > 0 && (
                <Button type='button' size='small' onClick={() => setShowLateStudents(prev => !prev)} variant='text'>
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
                    {lateInClass.map(item => (
                      <TableRow key={`${item.studentId}-${item.classId}`}>
                        <TableCell>{item.studentName}</TableCell>
                        <TableCell>{item.className}</TableCell>
                        <TableCell align='right'>
                          <Chip
                            label={`${item.daysSinceLastPayment} ngÃ y`}
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
                Khoáº£n trá»«
              </Typography>
              <Button type='button' size='small' startIcon={<i className='ri-add-line' />} onClick={addDeductionRow}>
                ThÃªm
              </Button>
            </div>

            {deductions.length === 0 && (
              <Typography variant='body2' color='text.secondary'>
                ChÆ°a cÃ³ khoáº£n trá»« nÃ o
              </Typography>
            )}

            {deductions.map(item => (
              <div key={item.tempId} className='flex gap-2 mb-2 items-center'>
                <TextField
                  size='small'
                  label='MÃ´ táº£'
                  value={item.description}
                  onChange={event => updateDeductionRow(item.tempId, 'description', event.target.value)}
                  sx={{ flex: 2 }}
                />
                <TextField
                  size='small'
                  label='Sá»‘ tiá»n'
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

            {deductions.length > 0 && (
              <div className='flex justify-end mt-1'>
                <Typography variant='body2' color='error.main' className='font-medium'>
                  Tá»•ng khoáº£n trá»«: {formatCurrency(totalDeductionAmount)}
                </Typography>
              </div>
            )}
          </Box>

          {selectedCollection && (
            <Alert severity='info' sx={{ py: 0.5 }}>
              <Typography variant='body2'>
                Sá»‘ tiá»n bÃ n giao lá»›p Ä‘ang chá»n = <strong>{formatCurrency(selectedCollection.totalCollectedToDate)}</strong>
                {selectedCollection.totalHandedOver > 0 && (
                  <> âˆ’ Ä‘Ã£ bÃ n giao <strong>{formatCurrency(selectedCollection.totalHandedOver)}</strong></>
                )}
                {totalDeductionAmount > 0 && (
                  <> âˆ’ khoáº£n trá»« <strong>{formatCurrency(totalDeductionAmount)}</strong></>
                )}
                {' = '}
                <strong style={{ color: 'var(--mui-palette-success-main)' }}>
                  {formatCurrency(Math.max(0, selectedCollection.availableToHandover - totalDeductionAmount))}
                </strong>
              </Typography>
            </Alert>
          )}

          <TextField
            label='Ghi chÃº'
            multiline
            rows={2}
            value={formData.notes}
            onChange={event => setFormData(prev => ({ ...prev, notes: event.target.value }))}
          />

          <div className='flex items-center gap-3 flex-wrap'>
            <Button type='submit' variant='contained' disabled={loading || !formData.classId}>
              {loading ? 'Äang xá»­ lÃ½...' : 'Táº¡o phiáº¿u lá»›p Ä‘Ã£ chá»n'}
            </Button>
            <Button
              type='button'
              variant='outlined'
              color='success'
              disabled={loading || collectionsWithMoney.length === 0}
              onClick={handleCreateAllHandovers}
            >
              BÃ n giao toÃ n bá»™ tá»›i hiá»‡n táº¡i
            </Button>
            <Button type='button' variant='outlined' color='error' onClick={resetAndClose}>
              Há»§y
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddCashHandoverDrawer
