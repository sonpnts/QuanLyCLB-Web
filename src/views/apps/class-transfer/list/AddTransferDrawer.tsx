'use client'

// React Imports
import { logger } from '@/utils/logger'
import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Autocomplete from '@mui/material/Autocomplete'

// Type Imports
import type { ClassTransferType } from '@/types/apps/classTransferTypes'
import type { StudentType } from '@/types/apps/studentTypes'

// Service Imports
import classTransferService from '@/services/classTransferService'
import classService from '@/services/classService'
import studentService from '@/services/studentService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<ClassTransferType[]>>
}

const AddTransferDrawer = ({ open, handleClose, setData }: Props) => {
  const { auth } = useAuth()
  const isAdmin = auth?.roles?.some(role => role.toLowerCase() === 'admin') ?? false
  const currentUserId = auth?.user.id

  const [formData, setFormData] = useState({
    studentId: '',
    fromClassId: '',
    toClassId: '',
    reason: ''
  })
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<StudentType[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)

  const { showNotification } = useNotification()

  const fromClassOptions = useMemo(() => {
    if (isAdmin) return classes
    if (!currentUserId) return []

    return classes.filter(
      item => item.instructorId === currentUserId || (Array.isArray(item.coachIds) && item.coachIds.includes(currentUserId))
    )
  }, [classes, isAdmin, currentUserId])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [classRes, studentRes] = await Promise.all([classService.getClasses({}), studentService.getStudents({})])
        if (classRes.success && classRes.data) setClasses(classRes.data)
        if (studentRes.success && studentRes.data) setStudents(studentRes.data)
      } catch (error) {
        logger.error('AddTransferDrawer', 'Error loading data', error)
      }
    }
    if (open) loadData()
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.studentId || !formData.fromClassId || !formData.toClassId) {
      showNotification('Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ thÃ´ng tin.', 'error')
      return
    }

    if (!formData.reason.trim()) {
      showNotification('Vui lÃ²ng nháº­p lÃ½ do chuyá»ƒn lá»›p.', 'error')
      return
    }

    if (formData.fromClassId === formData.toClassId) {
      showNotification('Lá»›p Ä‘Ã­ch pháº£i khÃ¡c lá»›p hiá»‡n táº¡i.', 'error')
      return
    }

    if (!isAdmin) {
      const canCreateFromClass = fromClassOptions.some(item => item.id === formData.fromClassId)

      if (!canCreateFromClass) {
        showNotification('Báº¡n chá»‰ cÃ³ thá»ƒ táº¡o yÃªu cáº§u tá»« lá»›p mÃ¬nh Ä‘ang phá»¥ trÃ¡ch.', 'error')
        return
      }
    }

    try {
      setLoading(true)
      const response = await classTransferService.createClassTransfer({
        studentId: formData.studentId,
        fromClassId: formData.fromClassId,
        toClassId: formData.toClassId,
        reason: formData.reason.trim()
      })

      if (response.success && response.data) {
        setData(prev => [...prev, response.data!])
        showNotification('Táº¡o yÃªu cáº§u chuyá»ƒn lá»›p thÃ nh cÃ´ng!', 'success')
        handleReset()
      } else {
        showNotification(response.message || 'KhÃ´ng thá»ƒ táº¡o yÃªu cáº§u.', 'error')
      }
    } catch (error) {
      const responseStatus = (error as { response?: { status?: number } })?.response?.status

      if (responseStatus === 403) {
        showNotification('KhÃ´ng cÃ³ quyá»n táº¡o yÃªu cáº§u chuyá»ƒn lá»›p tá»« lá»›p nguá»“n nÃ y.', 'error')
      } else {
        showNotification('ÄÃ£ cÃ³ lá»—i khi táº¡o yÃªu cáº§u.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({ studentId: '', fromClassId: '', toClassId: '', reason: '' })
    setSelectedStudent(null)
    handleClose()
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Táº¡o yÃªu cáº§u chuyá»ƒn lá»›p</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          {!isAdmin && (
            <Typography variant='body2' color='warning.main'>
              Chá»‰ hiá»ƒn thá»‹ lá»›p báº¡n Ä‘ang Ä‘Æ°á»£c phÃ¢n cÃ´ng Ä‘á»ƒ táº¡o yÃªu cáº§u chuyá»ƒn lá»›p.
            </Typography>
          )}
          <Autocomplete
            options={students}
            getOptionLabel={option => option.fullName}
            value={selectedStudent}
            onChange={(_, newValue) => {
              setSelectedStudent(newValue)
              setFormData({ ...formData, studentId: newValue?.id || '' })
            }}
            renderInput={params => <TextField {...params} label='Há»c viÃªn *' />}
          />
          <FormControl fullWidth>
            <InputLabel>Tá»« lá»›p *</InputLabel>
            <Select
              label='Tá»« lá»›p *'
              value={formData.fromClassId}
              onChange={e => setFormData({ ...formData, fromClassId: e.target.value })}
            >
              {fromClassOptions.map(cls => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Äáº¿n lá»›p *</InputLabel>
            <Select
              label='Äáº¿n lá»›p *'
              value={formData.toClassId}
              onChange={e => setFormData({ ...formData, toClassId: e.target.value })}
            >
              {classes
                .filter(cls => cls.id !== formData.fromClassId)
                .map(cls => (
                <MenuItem key={cls.id} value={cls.id}>
                  {cls.name}
                </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            label='LÃ½ do chuyá»ƒn lá»›p *'
            fullWidth
            multiline
            rows={3}
            value={formData.reason}
            onChange={e => setFormData({ ...formData, reason: e.target.value })}
          />
          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? 'Äang xá»­ lÃ½...' : 'Táº¡o yÃªu cáº§u'}
            </Button>
            <Button variant='outlined' color='error' onClick={handleReset}>
              Há»§y
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddTransferDrawer
