'use client'

import { useState, useEffect } from 'react'

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

import { useForm, Controller } from 'react-hook-form'

import { logger } from '@/utils/logger'

import type { ClassType } from '@/types/apps/classTypes'
import type { UsersType } from '@/types/apps/userTypes'
import type { BranchType } from '@/services/branchService'
import classService from '@/services/classService'
import userService from '@/services/userService'
import branchService from '@/services/branchService'

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
  branchId: string
  userIds?: string[]
  leadInstructorId?: string
}

const AddClassDrawer = (props: Props) => {
  const { open, handleClose, classData, setData } = props

  const [loading, setLoading] = useState(false)
  const [teachingStaff, setTeachingStaff] = useState<UsersType[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [branches, setBranches] = useState<BranchType[]>([])

  const { showNotification } = useNotification()

  const {
    control,
    reset: resetForm,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormValidateType>({
    defaultValues: {
      code: '',
      name: '',
      description: '',
      branchId: '',
      userIds: [],
      leadInstructorId: ''
    }
  })

  useEffect(() => {
    const loadData = async () => {
      if (open) {
        try {
          setLoadingStaff(true)

          const [staffResponse, branchResponse] = await Promise.all([
            userService.getTeachingStaff(),
            branchService.getBranches({ IsActive: true })
          ])

          if (staffResponse.success && staffResponse.data) setTeachingStaff(staffResponse.data)
          if (branchResponse.success && branchResponse.data) setBranches(branchResponse.data)
        } catch {
        } finally {
          setLoadingStaff(false)
        }
      }
    }

    loadData()
  }, [open])

  const selectedUserIds = watch('userIds') || []

  const onSubmit = async (data: FormValidateType) => {
    try {
      setLoading(true)

      if (!data.userIds?.length) {
        showNotification('Vui lòng chọn ít nhất 1 người phụ trách lớp.', 'warning')
        
return
      }

      if (!data.leadInstructorId || !data.userIds.includes(data.leadInstructorId)) {
        showNotification('Vui lòng chọn đúng 1 huấn luyện viên chính.', 'warning')
        
return
      }

      if (!data.branchId) {
        showNotification('Vui lòng chọn chi nhánh cho lớp học.', 'warning')
        
return
      }

      const response = await classService.createClass({
        code: data.code,
        name: data.name,
        description: data.description,
        branchId: data.branchId,
        userIds: data.userIds,
        leadInstructorId: data.leadInstructorId
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
      logger.error('AddClassDrawer', 'Error creating class', error)
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
            <Grid size={{ xs: 12 }}>
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
              <FormControl fullWidth error={Boolean(errors.branchId)}>
                <InputLabel id='branch-select'>Chi nhánh *</InputLabel>
                <Controller
                  name='branchId'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select {...field} label='Chi nhánh *' value={field.value || ''}>
                      {branches.map(branch => (
                        <MenuItem key={branch.id} value={branch.id}>
                          {branch.name} - {new Intl.NumberFormat('vi-VN').format(branch.tuitionFee || 0)}đ
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.branchId && <FormHelperText>Vui lòng chọn chi nhánh.</FormHelperText>}
              </FormControl>
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
                  Người phụ trách lớp
                </InputLabel>
                <Controller
                  name='userIds'
                  control={control}
                  render={({ field }) => {
                    const selectedIds = field.value || []
                    const availableStaff = teachingStaff.filter(staff => !selectedIds.includes(String(staff.id)))

                    return (
                      <Select
                        {...field}
                        multiple
                        label='Người phụ trách lớp'
                        error={Boolean(errors.userIds)}
                        disabled={loadingStaff}
                        value={selectedIds}
                        renderValue={selected => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map(value => {
                              const staff = teachingStaff.find(c => String(c.id) === value)

                              return staff ? (
                                <Chip
                                  key={value}
                                  label={staff.fullName}
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
                        {availableStaff.map(staff => (
                          <MenuItem key={String(staff.id)} value={String(staff.id)}>
                            {staff.fullName} ({staff.email})
                          </MenuItem>
                        ))}
                      </Select>
                    )
                  }}
                />
                {loadingStaff && <FormHelperText>Đang tải danh sách...</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth error={Boolean(errors.leadInstructorId)}>
                <InputLabel id='lead-instructor-select'>Huấn luyện viên chính *</InputLabel>
                <Controller
                  name='leadInstructorId'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label='Huấn luyện viên chính *'
                      value={field.value || ''}
                      disabled={selectedUserIds.length === 0}
                    >
                      {selectedUserIds.map(id => {
                        const staff = teachingStaff.find(u => String(u.id) === id)

                        if (!staff) return null
                        
return (
                          <MenuItem key={id} value={id}>
                            {staff.fullName} ({staff.email})
                          </MenuItem>
                        )
                      })}
                    </Select>
                  )}
                />
                {errors.leadInstructorId && <FormHelperText>Vui lòng chọn huấn luyện viên chính.</FormHelperText>}
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
