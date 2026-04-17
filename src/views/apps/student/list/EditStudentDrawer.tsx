'use client'

// React Imports
import { logger } from '@/utils/logger'
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

// Form
import { useForm, Controller } from 'react-hook-form'

// Types
import type { StudentType } from '@/types/apps/studentTypes'
import type { BeltLevelType } from '@/types/apps/beltExamTypes'

// Services
import studentService from '@/services/studentService'
import beltExamService from '@/services/beltExamService'

// Context
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  onClose: () => void
  student: StudentType | null
  onSaved: (updated: StudentType) => void
}

type FormValues = {
  code: string
  fullName: string
  phoneNumber?: string
  email?: string
  address?: string
  identityNumber?: string
  dateOfBirth?: string
  gender?: string
  currentBeltLevelId?: string
  notes?: string
}

const EditStudentDrawer = (props: Props) => {
  const { open, onClose, student, onSaved } = props
  const { showNotification } = useNotification()
  const [submitting, setSubmitting] = useState(false)
  const [beltLevels, setBeltLevels] = useState<BeltLevelType[]>([])

  // Load belt levels
  useEffect(() => {
    const loadBeltLevels = async () => {
      try {
        const response = await beltExamService.getBeltLevels()

        if (response.success && Array.isArray(response.data)) {
          setBeltLevels(response.data)
        } else {
          setBeltLevels([])
        }
      } catch (error) {
        logger.error('EditStudentDrawer', 'Error loading belt levels', error)
        setBeltLevels([])
      }
    }

    if (open) {
      loadBeltLevels()
    }
  }, [open])

  const defaultValues = useMemo<FormValues>(
    () => ({
      code: student?.code || '',
      fullName: student?.fullName || '',
      phoneNumber: student?.phoneNumber || '',
      email: student?.email || '',
      address: student?.address || '',
      identityNumber: student?.identityNumber || '',
      dateOfBirth: student?.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      gender: student?.gender !== undefined ? String(student.gender) : '',
      currentBeltLevelId: student?.currentBeltLevelId || '',
      notes: student?.notes || ''
    }),
    [student]
  )

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues
  })

  useEffect(() => {
    if (student) {
      reset(defaultValues)
    }
  }, [student, defaultValues, reset])

  const onSubmit = async (values: FormValues) => {
    if (!student) return

    try {
      setSubmitting(true)

      const payload = {
        code: values.code,
        fullName: values.fullName,
        phoneNumber: values.phoneNumber || undefined,
        email: values.email || undefined,
        address: values.address || undefined,
        identityNumber: values.identityNumber || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        gender: values.gender !== '' ? values.gender === 'true' : undefined,
        currentBeltLevelId: values.currentBeltLevelId || undefined,
        notes: values.notes || undefined
      }

      const res = await studentService.updateStudent(student.id, payload)

      if (res.success && res.data) {
        showNotification(res.message || 'Cáº­p nháº­t há»c viÃªn thÃ nh cÃ´ng.', 'success')
        onSaved(res.data as StudentType)
        onClose()
      } else {
        showNotification(res.message || 'KhÃ´ng thá»ƒ cáº­p nháº­t há»c viÃªn.', 'error')
      }
    } catch (err) {
      logger.error('EditStudentDrawer', 'Error updating student', err)
      showNotification('ÄÃ£ cÃ³ lá»—i khi cáº­p nháº­t há»c viÃªn.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 420 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Chá»‰nh sá»­a há»c viÃªn</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 p-5'>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <Controller
              name='code'
              control={control}
              rules={{ required: 'MÃ£ há»c viÃªn lÃ  báº¯t buá»™c' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='MÃ£ há»c viÃªn *'
                  error={!!errors.code}
                  helperText={errors.code?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name='fullName'
              control={control}
              rules={{ required: 'Há» tÃªn lÃ  báº¯t buá»™c' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Há» vÃ  tÃªn *'
                  error={!!errors.fullName}
                  helperText={errors.fullName?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='phoneNumber'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Sá»‘ Ä‘iá»‡n thoáº¡i' />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='email'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Email' type='email' />}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name='address'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Äá»‹a chá»‰' />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='identityNumber'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='CMND/CCCD' />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='dateOfBirth'
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label='NgÃ y sinh' type='date' InputLabelProps={{ shrink: true }} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='gender'
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Giá»›i tÃ­nh</InputLabel>
                  <Select {...field} label='Giá»›i tÃ­nh'>
                    <MenuItem value=''>Chá»n giá»›i tÃ­nh</MenuItem>
                    <MenuItem value='true'>Nam</MenuItem>
                    <MenuItem value='false'>Ná»¯</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='currentBeltLevelId'
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Cáº¥p Ä‘ai hiá»‡n táº¡i</InputLabel>
                  <Select {...field} label='Cáº¥p Ä‘ai hiá»‡n táº¡i'>
                    <MenuItem value=''>ChÆ°a cÃ³ cáº¥p Ä‘ai</MenuItem>
                    {beltLevels.map(belt => (
                      <MenuItem key={belt.id} value={belt.id}>
                        {belt.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name='notes'
              control={control}
              render={({ field }) => <TextField {...field} fullWidth label='Ghi chÃº' multiline rows={3} />}
            />
          </Grid>
        </Grid>
        <div className='flex gap-2 justify-end'>
          <Button variant='outlined' onClick={onClose}>
            Há»§y
          </Button>
          <Button type='submit' variant='contained' disabled={submitting}>
            {submitting ? 'Äang lÆ°u...' : 'LÆ°u thay Ä‘á»•i'}
          </Button>
        </div>
      </form>
    </Drawer>
  )
}

export default EditStudentDrawer
