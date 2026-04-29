'use client'
import { logger } from '@/utils/logger'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import FormHelperText from '@mui/material/FormHelperText'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'

// Types Imports
import type { ClassType } from '@/types/apps/classTypes'
import type { UsersType } from '@/types/apps/userTypes'
import classService from '@/services/classService'
import userService from '@/services/userService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

type Props = {
  open: boolean
  handleClose: () => void
  classData: ClassType
  onClassUpdated: (updatedClass: ClassType) => void
}

type FormValidateType = {
  name: string
  description?: string
  userIds?: string[]
}

const EditClassDrawer = (props: Props) => {
  const { open, handleClose, classData, onClassUpdated } = props

  // States
  const [loading, setLoading] = useState(false)
  const [coaches, setCoaches] = useState<UsersType[]>([])
  const [loadingCoaches, setLoadingCoaches] = useState(false)

  // Notification Hook
  const { showNotification } = useNotification()

  // Hooks
  const {
    control,
    reset: resetForm,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValidateType>({
    defaultValues: {
      name: classData.name || '',
      description: classData.description || '',
      userIds: classData.coachIds || []
    }
  })

  // Reset form when classData changes
  useEffect(() => {
    if (open && classData) {
      resetForm({
        name: classData.name || '',
        description: classData.description || '',
        userIds: classData.coachIds || []
      })
    }
  }, [open, classData, resetForm])

  // Load coaches when drawer opens
  useEffect(() => {
    const loadCoaches = async () => {
      if (open) {
        try {
          setLoadingCoaches(true)
          const response = await userService.getCoaches()

          if (response.success && response.data) {
            setCoaches(response.data)
          } else {
            showNotification('Không thể tải danh sách huấn luyện viên.', 'warning')
          }
        } catch (error) {
          logger.error('EditClassDrawer', 'Error loading coaches', error)
          showNotification('Đã có lỗi khi tải huấn luyện viên.', 'error')
        } finally {
          setLoadingCoaches(false)
        }
      }
    }

    loadCoaches()
  }, [open, showNotification])

  const onSubmit = async (data: FormValidateType) => {
    try {
      setLoading(true)

      const response = await classService.updateClass(classData.id, {
        name: data.name,
        description: data.description,
        // Giữ nguyên giá trị maxStudents hiện tại (đã bỏ field input — backend vẫn yêu cầu)
        maxStudents: classData.maxStudents || 9999,
        userIds: data.userIds
      })

      if (response.success && response.data) {
        onClassUpdated(response.data)
        showNotification('Cập nhật lớp học thành công!', 'success')
        handleClose()
      } else {
        showNotification(response.message || 'Không thể cập nhật lớp học.', 'error')
      }
    } catch (error) {
      logger.error('EditClassDrawer', 'Error updating class', error)
      showNotification('Đã có lỗi xảy ra. Vui lòng thử lại.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    handleClose()
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 500, md: 600 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Chỉnh sửa lớp học</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Mã lớp học'
                value={classData.code}
                disabled
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name='name'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Tên lớp *'
                    {...(errors.name && { error: true, helperText: 'Trường này là bắt buộc.' })}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name='description'
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={3}
                    label='Mô tả'
                    placeholder='Nhập mô tả lớp học...'
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel id='instructor-select'>Huấn luyện viên</InputLabel>
                <Controller
                  name='userIds'
                  control={control}
                  render={({ field }) => {
                    const selectedIds = field.value || []
                    const availableCoaches = coaches.filter(coach => !selectedIds.includes(String(coach.id)))

                    return (
                      <Select
                        {...field}
                        multiple
                        label='Huấn luyện viên'
                        disabled={loadingCoaches}
                        value={selectedIds}
                        renderValue={selected => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map(value => {
                              const coach = coaches.find(c => String(c.id) === value)

                              return coach ? (
                                <Chip
                                  key={value}
                                  label={coach.fullName}
                                  size='small'
                                  onDelete={() => {
                                    const newValue = selectedIds.filter((id: string) => id !== value)

                                    field.onChange(newValue)
                                  }}
                                  onMouseDown={e => {
                                    e.stopPropagation()
                                  }}
                                />
                              ) : null
                            })}
                          </Box>
                        )}
                      >
                        {availableCoaches.map(coach => (
                          <MenuItem key={String(coach.id)} value={String(coach.id)}>
                            {coach.fullName} ({coach.email})
                          </MenuItem>
                        ))}
                      </Select>
                    )
                  }}
                />
                {loadingCoaches && <FormHelperText>Đang tải danh sách...</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
          <div className='flex items-center gap-4'>
            <Button variant='contained' type='submit' disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Cập nhật'}
            </Button>
            <Button variant='outlined' color='error' onClick={handleReset} disabled={loading}>
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default EditClassDrawer
