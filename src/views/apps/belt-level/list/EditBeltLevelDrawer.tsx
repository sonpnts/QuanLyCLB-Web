'use client'

// React Imports
import { logger } from '@/utils/logger'
import { useEffect, useMemo, useState } from 'react'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

// Form
import { useForm, Controller } from 'react-hook-form'

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
  colorCode: string
}

const EditBeltLevelDrawer = (props: Props) => {
  const { open, onClose, beltLevel, onSaved } = props
  const { showNotification } = useNotification()
  const [submitting, setSubmitting] = useState(false)

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: beltLevel?.name || '',
      order: beltLevel?.order?.toString() || '',
      description: beltLevel?.description || '',
      colorCode: beltLevel?.colorCode || '#000000'
    }),
    [beltLevel]
  )

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues
  })

  useEffect(() => {
    if (beltLevel) {
      reset(defaultValues)
    }
  }, [beltLevel, defaultValues, reset])

  const onSubmit = async (values: FormValues) => {
    if (!beltLevel) return

    if (!values.name.trim()) {
      showNotification('Vui lÃ²ng nháº­p tÃªn cáº¥p Ä‘ai.', 'error')

      return
    }

    if (!values.order || isNaN(Number(values.order))) {
      showNotification('Vui lÃ²ng nháº­p thá»© tá»± há»£p lá»‡.', 'error')

      return
    }

    try {
      setSubmitting(true)

      const payload = {
        name: values.name,
        order: Number(values.order),
        description: values.description || undefined,
        colorCode: values.colorCode || undefined
      }

      const res = await beltLevelService.updateBeltLevel(beltLevel.id, payload)

      if (res.success) {
        showNotification(res.message || 'Cáº­p nháº­t cáº¥p Ä‘ai thÃ nh cÃ´ng.', 'success')

        // Náº¿u API khÃ´ng tráº£ vá» data, táº¡o object vá»›i dá»¯ liá»‡u Ä‘Ã£ cáº­p nháº­t

        const updatedBeltLevel: BeltLevelType = res.data || {
          ...beltLevel,
          name: values.name,
          order: Number(values.order),
          description: values.description || undefined,
          colorCode: values.colorCode || undefined
        }

        onSaved(updatedBeltLevel)
        onClose()
      } else {
        showNotification(res.message || 'KhÃ´ng thá»ƒ cáº­p nháº­t cáº¥p Ä‘ai.', 'error')
      }
    } catch (err) {
      logger.error('EditBeltLevelDrawer', 'Error updating belt level', err)
      showNotification('ÄÃ£ cÃ³ lá»—i khi cáº­p nháº­t cáº¥p Ä‘ai.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const colorValue = watch('colorCode')

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
        <Typography variant='h5'>Chá»‰nh sá»­a cáº¥p Ä‘ai</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5 p-5'>
        <Controller
          name='name'
          control={control}
          rules={{ required: 'TÃªn cáº¥p Ä‘ai lÃ  báº¯t buá»™c' }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label='TÃªn cáº¥p Ä‘ai *'
              error={!!errors.name}
              helperText={errors.name?.message}
              placeholder='VD: Äai tráº¯ng, Äai vÃ ng...'
            />
          )}
        />
        <Controller
          name='order'
          control={control}
          rules={{ required: 'Thá»© tá»± lÃ  báº¯t buá»™c' }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              type='number'
              label='Thá»© tá»± *'
              error={!!errors.order}
              helperText={errors.order?.message || 'Thá»© tá»± tá»« tháº¥p Ä‘áº¿n cao (1 lÃ  tháº¥p nháº¥t)'}
              placeholder='VD: 1, 2, 3...'
            />
          )}
        />
        <Controller
          name='description'
          control={control}
          render={({ field }) => (
            <TextField {...field} fullWidth multiline rows={3} label='MÃ´ táº£' placeholder='MÃ´ táº£ vá» cáº¥p Ä‘ai nÃ y...' />
          )}
        />
        <Box>
          <Typography variant='body2' className='mb-2'>
            MÃ u sáº¯c
          </Typography>
          <Box className='flex items-center gap-3'>
            <input
              type='color'
              value={colorValue}
              onChange={e => setValue('colorCode', e.target.value)}
              style={{ width: 50, height: 40, cursor: 'pointer', border: '1px solid #ddd', borderRadius: 4 }}
            />
            <Controller
              name='colorCode'
              control={control}
              render={({ field }) => <TextField {...field} size='small' placeholder='#000000' sx={{ width: 120 }} />}
            />
          </Box>
        </Box>
        <div className='flex gap-4'>
          <Button variant='contained' type='submit' disabled={submitting}>
            {submitting ? 'Äang lÆ°u...' : 'LÆ°u thay Ä‘á»•i'}
          </Button>
          <Button variant='outlined' color='error' onClick={onClose}>
            Há»§y
          </Button>
        </div>
      </form>
    </Drawer>
  )
}

export default EditBeltLevelDrawer
