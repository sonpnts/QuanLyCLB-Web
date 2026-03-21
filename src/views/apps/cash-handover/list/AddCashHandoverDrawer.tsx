'use client'

import { useEffect, useMemo, useState } from 'react'

import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { CashHandoverType } from '@/types/apps/cashHandoverTypes'
import type { ClassType } from '@/types/apps/classTypes'
import type { UsersType } from '@/types/apps/userTypes'
import type { InstructorClassCollectionType } from '@/types/apps/financeTypes'
import cashHandoverService from '@/services/cashHandoverService'
import classService from '@/services/classService'
import userService from '@/services/userService'
import financeService from '@/services/financeService'
import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'

type Props = {
  open: boolean
  handleClose: () => void
  setData: React.Dispatch<React.SetStateAction<CashHandoverType[]>>
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const AddCashHandoverDrawer = ({ open, handleClose, setData }: Props) => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()

  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<ClassType[]>([])
  const [instructors, setInstructors] = useState<UsersType[]>([])
  const [collections, setCollections] = useState<InstructorClassCollectionType[]>([])

  const [formData, setFormData] = useState({
    classId: '',
    instructorId: auth?.user.id || '',
    amountHandedOver: '',
    notes: '',
    asOfDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [classRes, instructorRes] = await Promise.all([classService.getClasses({}), userService.getCoaches()])

        if (classRes.success && classRes.data) setClasses(classRes.data)
        if (instructorRes.success && instructorRes.data) {
          setInstructors(instructorRes.data)

          setFormData(prev => ({
            ...prev,
            instructorId: prev.instructorId || auth?.user.id || instructorRes.data?.[0]?.id || ''
          }))
        }
      } catch (error) {
        showNotification('Không thể tải dữ liệu ban đầu cho bàn giao tiền.', 'error')
      }
    }

    if (open) loadReferences()
  }, [open, auth?.user.id, showNotification])

  useEffect(() => {
    const loadCollections = async () => {
      if (!open) return

      try {
        const response = formData.instructorId
          ? await financeService.getClassCollectionsByInstructor(formData.instructorId, formData.asOfDate || undefined)
          : await financeService.getMyClassCollections(formData.asOfDate || undefined)

        if (!response.success || !response.data) {
          setCollections([])
          return
        }

        setCollections(response.data)
        setFormData(prev => ({
          ...prev,
          classId: prev.classId || response.data?.[0]?.classId || ''
        }))
      } catch (error) {
        setCollections([])
      }
    }

    loadCollections()
  }, [open, formData.instructorId, formData.asOfDate])

  const classOptions = useMemo(() => {
    if (collections.length > 0) {
      return collections.map(item => ({
        id: item.classId,
        name: item.className || item.classId
      }))
    }

    return classes.map(item => ({
      id: item.id,
      name: item.name
    }))
  }, [collections, classes])

  const selectedCollection = useMemo(
    () => collections.find(item => item.classId === formData.classId) || null,
    [collections, formData.classId]
  )

  const resetAndClose = () => {
    setFormData({
      classId: '',
      instructorId: auth?.user.id || '',
      amountHandedOver: '',
      notes: '',
      asOfDate: new Date().toISOString().split('T')[0]
    })
    setCollections([])
    handleClose()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const amount = Number(formData.amountHandedOver)

    if (!formData.classId || !formData.instructorId || amount <= 0) {
      showNotification('Vui lòng nhập lớp, HLV và số tiền hợp lệ.', 'error')
      return
    }

    if (selectedCollection && amount > selectedCollection.availableToHandover) {
      showNotification('Số tiền bàn giao vượt mức có thể bàn giao tại thời điểm hiện tại.', 'error')
      return
    }

    try {
      setLoading(true)
      const response = await cashHandoverService.createCashHandover({
        classId: formData.classId,
        instructorId: formData.instructorId,
        amountHandedOver: amount,
        notes: formData.notes.trim() || undefined
      })

      if (!response.success || !response.data) {
        showNotification(response.message || 'Không thể tạo phiếu bàn giao.', 'error')
        return
      }

      setData(prev => [response.data!, ...prev])
      showNotification('Tạo phiếu bàn giao tiền thành công.', 'success')
      resetAndClose()
    } catch (error) {
      showNotification('Đã có lỗi khi tạo phiếu bàn giao.', 'error')
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
      sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 460 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Tạo phiếu bàn giao tiền</Typography>
        <IconButton size='small' onClick={resetAndClose}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          <TextField
            type='date'
            label='As of date'
            InputLabelProps={{ shrink: true }}
            value={formData.asOfDate}
            onChange={event => setFormData(prev => ({ ...prev, asOfDate: event.target.value }))}
          />

          <FormControl fullWidth>
            <InputLabel>Huấn luyện viên</InputLabel>
            <Select
              label='Huấn luyện viên'
              value={formData.instructorId}
              onChange={event => setFormData(prev => ({ ...prev, instructorId: event.target.value }))}
            >
              {instructors.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Lớp</InputLabel>
            <Select
              label='Lớp'
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

          <TextField
            type='number'
            label='Số tiền bàn giao'
            value={formData.amountHandedOver}
            onChange={event => setFormData(prev => ({ ...prev, amountHandedOver: event.target.value }))}
          />

          <TextField
            label='Ghi chú'
            multiline
            rows={3}
            value={formData.notes}
            onChange={event => setFormData(prev => ({ ...prev, notes: event.target.value }))}
          />

          {selectedCollection && (
            <div className='rounded border border-dashed p-4'>
              <Typography variant='body2' color='text.secondary'>
                Snapshot học phí: {formatCurrency(selectedCollection.tuitionCollectedToDate)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Snapshot bán sản phẩm: {formatCurrency(selectedCollection.productSalesCollectedToDate)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Tổng đã thu: {formatCurrency(selectedCollection.totalCollectedToDate)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Tổng đã bàn giao: {formatCurrency(selectedCollection.totalHandedOver)}
              </Typography>
              <Typography variant='body2' color='success.main' className='font-medium'>
                Có thể bàn giao: {formatCurrency(selectedCollection.availableToHandover)}
              </Typography>
            </div>
          )}

          <div className='flex items-center gap-4'>
            <Button type='submit' variant='contained' disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Tạo phiếu'}
            </Button>
            <Button variant='outlined' color='error' onClick={resetAndClose}>
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddCashHandoverDrawer
