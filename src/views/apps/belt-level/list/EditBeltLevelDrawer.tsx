'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

// Form
import { useForm, Controller } from 'react-hook-form'

import { logger } from '@/utils/logger'

// Types
import type { BeltLevelType } from '@/types/apps/beltExamTypes'

// Services
import beltLevelService from '@/services/beltLevelService'

// Context
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  onClose: () => void
  beltLevel: BeltLevelType | null
  onSaved: (updated: BeltLevelType) => void
}

type FormValues = {
  name: string
  order: string
  description: string
}

const EditBeltLevelDrawer = (props: Props) => {
  const { open, onClose, beltLevel, onSaved } = props
  const { showNotification } = useNotification()
  const [submitting, setSubmitting] = useState(false)

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: beltLevel?.name || '',
      order: beltLevel?.order?.toString() || '',
      description: beltLevel?.description || ''
    }),
    [beltLevel]
  )

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({ defaultValues })

  useEffect(() => {
    if (beltLevel) reset(defaultValues)
  }, [beltLevel, defaultValues, reset])

  const onSubmit = async (values: FormValues) => {
    if (!beltLevel) return

    if (!values.name.trim()) {
      showNotification('Vui lòng nhập tên cấp đai.', 'error')
      
return
    }

    if (!values.order || isNaN(Number(values.order)) || Number(values.order) < 1) {
      showNotification('Vui lòng nhập thứ tự hợp lệ (≥ 1).', 'error')
      
return
    }

    try {
      setSubmitting(true)

      const res = await beltLevelService.updateBeltLevel(beltLevel.id, {
        name: values.name,
        order: Number(values.order),
        description: values.description || undefined
      })

      if (res.success) {
        showNotification(res.message || 'Cập nhật cấp đai thành công.', 'success')

        const updatedBeltLevel: BeltLevelType = res.data || {
          ...beltLevel,
          name: values.name,
          order: Number(values.order),
          description: values.description || undefined
        }

        onSaved(updatedBeltLevel)
        onClose()
      } else {
        showNotification(res.message || 'Không thể cập nhật cấp đai.', 'error')
      }
    } catch (err) {
      logger.error('EditBeltLevelDrawer', 'Error updating belt level', err)
      showNotification('Đã có lỗi khi cập nhật cấp đai.', 'error')
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
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Chỉnh sửa cấp đai</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5 p-5'>
        <Controller
          name='name'
          control={control}
          rules={{ required: 'Tên cấp đai là bắt buộc' }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label='Tên cấp đai *'
              error={!!errors.name}
              helperText={errors.name?.message}
              placeholder='VD: Đai trắng, Đai vàng, Nhất đẳng...'
            />
          )}
        />
        <Controller
          name='order'
          control={control}
          rules={{
            required: 'Thứ tự là bắt buộc',
            min: { value: 1, message: 'Thứ tự phải ≥ 1' }
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              type='number'
              label='Thứ tự *'
              error={!!errors.order}
              helperText={errors.order?.message || 'Cấp kup: 1–10. Đẳng: 11 trở lên (11 = Nhất đẳng, 12 = Nhị đẳng...)'}
              placeholder='VD: 1, 2, ... 10, 11, 12...'
              inputProps={{ min: 1 }}
            />
          )}
        />
        <Controller
          name='description'
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth multiline rows={3} label='Mô tả' placeholder='Mô tả về cấp đai này...' />
          )}
        />
        <div className='flex gap-4'>
          <Button variant='contained' type='submit' disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
          <Button variant='outlined' color='error' onClick={onClose}>
            Hủy
          </Button>
        </div>
      </form>
    </Drawer>
  )
}

export default EditBeltLevelDrawer
