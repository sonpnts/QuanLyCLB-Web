'use client'

// React Imports
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
        console.error('Error loading belt levels:', error)
        setBeltLevels([])
      }
    }

    if (open) {
      loadBeltLevels()
    }
  }, [open])

  const defaultValues = useMemo<FormValues>(
    () => ({
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
        showNotification(res.message || 'Cập nhật học viên thành công.', 'success')
        onSaved(res.data as StudentType)
        onClose()
      } else {
        showNotification(res.message || 'Không thể cập nhật học viên.', 'error')
      }
    } catch (err) {
      console.error('Error updating student:', err)
      showNotification('Đã có lỗi khi cập nhật học viên.', 'error')
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
        <Typography variant='h5'>Chỉnh sửa học viên</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4 p-5'>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12 }}>
            <Controller
              name='fullName'
              control={control}
              rules={{ required: 'Họ tên là bắt buộc' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label='Họ và tên *'
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
              render={({ field }) => <TextField {...field} fullWidth label='Số điện thoại' />}
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
              render={({ field }) => <TextField {...field} fullWidth label='Địa chỉ' />}
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
                <TextField {...field} fullWidth label='Ngày sinh' type='date' InputLabelProps={{ shrink: true }} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='gender'
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Giới tính</InputLabel>
                  <Select {...field} label='Giới tính'>
                    <MenuItem value=''>Chọn giới tính</MenuItem>
                    <MenuItem value='true'>Nam</MenuItem>
                    <MenuItem value='false'>Nữ</MenuItem>
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
                  <InputLabel>Cấp đai hiện tại</InputLabel>
                  <Select {...field} label='Cấp đai hiện tại'>
                    <MenuItem value=''>Chưa có cấp đai</MenuItem>
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
              render={({ field }) => <TextField {...field} fullWidth label='Ghi chú' multiline rows={3} />}
            />
          </Grid>
        </Grid>
        <div className='flex gap-2 justify-end'>
          <Button variant='outlined' onClick={onClose}>
            Hủy
          </Button>
          <Button type='submit' variant='contained' disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </Drawer>
  )
}

export default EditStudentDrawer
