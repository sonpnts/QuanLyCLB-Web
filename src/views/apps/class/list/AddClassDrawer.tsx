'use client'

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
  classData?: ClassType[]
  setData: React.Dispatch<React.SetStateAction<ClassType[]>>
}

type FormValidateType = {
  code: string
  name: string
  description?: string
  maxStudents: number
  userIds?: string[]
}

const AddClassDrawer = (props: Props) => {
  // Props
  const { open, handleClose, classData, setData } = props

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
      code: '',
      name: '',
      description: '',
      maxStudents: 30,
      userIds: []
    }
  })

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
            console.error('Failed to load coaches:', response.message)
            showNotification('Không thể tải danh sách huấn luyện viên.', 'warning')
          }
        } catch (error) {
          console.error('Error loading coaches:', error)
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

      const response = await classService.createClass({
        code: data.code,
        name: data.name,
        description: data.description,
        maxStudents: data.maxStudents,
        userIds: data.userIds
      })

      if (response.success && response.data) {
        setData([...(classData ?? []), response.data])
        showNotification('Tạo lớp học thành công!', 'success')
        handleClose()
        resetForm()
      } else {
        showNotification(response.message || 'Không thể tạo lớp học. Vui lòng thử lại.', 'error')
      }
    } catch (error) {
      console.error('Error creating class:', error)
      showNotification('Đã có lỗi xảy ra. Vui lòng thử lại.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    handleClose()
    resetForm()
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
        <Typography variant='h5'>Thêm lớp học mới</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit(data => onSubmit(data))} className='flex flex-col gap-5'>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name='code'
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label='Mã lớp học *'
                    placeholder='VD: LOP-001'
                    {...(errors.code && { error: true, helperText: 'Trường này là bắt buộc.' })}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name='maxStudents'
                control={control}
                rules={{ required: true, min: 1 }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type='number'
                    label='Sỉ số tối đa *'
                    placeholder='30'
                    {...(errors.maxStudents && {
                      error: true,
                      helperText: 'Trường này là bắt buộc và phải lớn hơn 0.'
                    })}
                  />
                )}
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
                    placeholder='VD: Lớp Thiếu Nhi A'
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
                <InputLabel id='instructor-select' error={Boolean(errors.userIds)}>
                  Huấn luyện viên
                </InputLabel>
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
                        error={Boolean(errors.userIds)}
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
              {loading ? 'Đang xử lý...' : 'Tạo lớp học'}
            </Button>
            <Button variant='outlined' color='error' type='reset' onClick={() => handleReset()} disabled={loading}>
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddClassDrawer
