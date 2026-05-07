'use client'

// React Imports
import { useEffect, useState, useCallback } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import Grid from '@mui/material/Grid'

// Type Imports
import type { InstructorClassSalaryType } from '@/types/apps/instructorClassSalaryTypes'
import type { UsersType } from '@/types/apps/userTypes'
import type { ClassType } from '@/types/apps/classTypes'

// Service Imports
import instructorClassSalaryService from '@/services/instructorClassSalaryService'
import userService from '@/services/userService'
import classService from '@/services/classService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + ' đ'

const roleLabel = (role: string) => (role === 'Coach' ? 'Huấn luyện viên' : role === 'Assistant' ? 'Trợ giảng' : role)

const salaryTypeLabel = (type: string) =>
  type === 'PerSession' ? 'Theo buổi' : type === 'PerHour' ? 'Theo giờ' : type

const salaryTypeUnit = (type: string) => (type === 'PerSession' ? '/buổi' : type === 'PerHour' ? '/giờ' : '')

// ─── empty form ───────────────────────────────────────────────────────────────

const emptyForm = () => ({
  formUserId: '',
  formClassId: '',
  formRole: 'Coach',
  formSalaryType: 'PerSession',
  formRate: '',
  formNotes: '',
})

// ─── component ────────────────────────────────────────────────────────────────

const InstructorClassSalaryView = () => {
  // ── data states ─────────────────────────────────────────────────────────────
  const [data, setData] = useState<InstructorClassSalaryType[]>([])
  const [loading, setLoading] = useState(false)
  const [instructors, setInstructors] = useState<UsersType[]>([])
  const [classes, setClasses] = useState<ClassType[]>([])

  // ── filter states ────────────────────────────────────────────────────────────
  const [filterUserId, setFilterUserId] = useState('')
  const [filterClassId, setFilterClassId] = useState('')

  // ── dialog states ────────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InstructorClassSalaryType | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // ── form states ──────────────────────────────────────────────────────────────
  const [formUserId, setFormUserId] = useState('')
  const [formClassId, setFormClassId] = useState('')
  const [formRole, setFormRole] = useState('Coach')
  const [formSalaryType, setFormSalaryType] = useState('PerSession')
  const [formRate, setFormRate] = useState('')
  const [formNotes, setFormNotes] = useState('')

  // ── notification ─────────────────────────────────────────────────────────────
  const { showNotification } = useNotification()

  // ── load data ────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [salaryRes, instructorRes, classRes] = await Promise.all([
        instructorClassSalaryService.getAll(),
        userService.getCoaches(),
        classService.getClasses({ isActive: true, pageSize: 1000 }),
      ])

      setData(salaryRes.data || [])
      setInstructors(instructorRes.data || [])
      setClasses(classRes.data || [])
    } catch {
      showNotification('Không thể tải dữ liệu.', 'error')
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── filtered data ─────────────────────────────────────────────────────────────

  const filteredData = data.filter(item => {
    if (filterUserId && item.userId !== filterUserId) return false
    if (filterClassId && item.classId !== filterClassId) return false

    return true
  })

  // ── form helpers ──────────────────────────────────────────────────────────────

  const openAddDialog = () => {
    const f = emptyForm()

    setFormUserId(f.formUserId)
    setFormClassId(f.formClassId)
    setFormRole(f.formRole)
    setFormSalaryType(f.formSalaryType)
    setFormRate(f.formRate)
    setFormNotes(f.formNotes)
    setEditingItem(null)
    setDialogOpen(true)
  }

  const openEditDialog = (item: InstructorClassSalaryType) => {
    setFormUserId(item.userId)
    setFormClassId(item.classId)
    setFormRole(item.role)
    setFormSalaryType(item.salaryType)
    setFormRate(String(item.rate))
    setFormNotes(item.notes || '')
    setEditingItem(item)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
  }

  // ── save ──────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formUserId || !formClassId || !formRole || !formSalaryType || !formRate) {
      showNotification('Vui lòng điền đầy đủ thông tin bắt buộc.', 'warning')

      return
    }

    const rate = parseFloat(formRate)

    if (isNaN(rate) || rate <= 0) {
      showNotification('Mức lương phải là số dương.', 'warning')

      return
    }

    setSaving(true)
    try {
      let res

      if (editingItem) {
        res = await instructorClassSalaryService.update(editingItem.id, {
          role: formRole,
          salaryType: formSalaryType as 'PerSession' | 'PerHour',
          rate,
          notes: formNotes || undefined,
          isActive: editingItem.isActive,
        })
      } else {
        res = await instructorClassSalaryService.create({
          userId: formUserId,
          classId: formClassId,
          role: formRole,
          salaryType: formSalaryType as 'PerSession' | 'PerHour',
          rate,
          notes: formNotes || undefined,
        })
      }

      if (res.success) {
        showNotification(res.message || (editingItem ? 'Cập nhật thành công.' : 'Thêm thành công.'), 'success')
        closeDialog()
        loadData()
      } else {
        showNotification(res.message || 'Thao tác thất bại.', 'error')
      }
    } catch {
      showNotification('Đã có lỗi xảy ra.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── delete ────────────────────────────────────────────────────────────────────

  const openDeleteDialog = (id: string) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingId) return
    setSaving(true)
    try {
      const res = await instructorClassSalaryService.delete(deletingId)

      if (res.success) {
        showNotification(res.message || 'Xóa thành công.', 'success')
        setDeleteDialogOpen(false)
        setDeletingId(null)
        loadData()
      } else {
        showNotification(res.message || 'Không thể xóa.', 'error')
      }
    } catch {
      showNotification('Đã có lỗi khi xóa.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <Box className='flex flex-col gap-6'>
      {/* Filter bar */}
      <Card>
        <CardContent>
          <Grid container spacing={3} alignItems='center'>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Huấn luyện viên</InputLabel>
                <Select
                  value={filterUserId}
                  label='Huấn luyện viên'
                  onChange={e => setFilterUserId(e.target.value)}
                >
                  <MenuItem value=''>Tất cả</MenuItem>
                  {instructors.map(ins => (
                    <MenuItem key={ins.id} value={ins.id}>
                      {ins.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size='small'>
                <InputLabel>Lớp học</InputLabel>
                <Select
                  value={filterClassId}
                  label='Lớp học'
                  onChange={e => setFilterClassId(e.target.value)}
                >
                  <MenuItem value=''>Tất cả</MenuItem>
                  {classes.map(cls => (
                    <MenuItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} className='flex justify-end'>
              <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={openAddDialog}>
                Thêm cấu hình
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data table */}
      <Card>
        <CardContent className='p-0'>
          {loading ? (
            <Box className='flex justify-center items-center p-8'>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Huấn luyện viên</TableCell>
                    <TableCell>Lớp học</TableCell>
                    <TableCell>Vai trò</TableCell>
                    <TableCell>Loại lương</TableCell>
                    <TableCell>Mức lương</TableCell>
                    <TableCell>Ghi chú</TableCell>
                    <TableCell align='center'>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align='center'>
                        <Typography variant='body2' color='text.secondary' className='py-4'>
                          Không có dữ liệu
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map(item => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant='body2' fontWeight={500}>
                            {item.userName || item.userId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{item.className || item.classId}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{roleLabel(item.role)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>{salaryTypeLabel(item.salaryType)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2'>
                            {formatVND(item.rate)}
                            {salaryTypeUnit(item.salaryType)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' color='text.secondary'>
                            {item.notes || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Box className='flex items-center justify-center gap-1'>
                            <IconButton size='small' color='primary' onClick={() => openEditDialog(item)}>
                              <i className='ri-edit-line text-xl' />
                            </IconButton>
                            <IconButton size='small' color='error' onClick={() => openDeleteDialog(item.id)}>
                              <i className='ri-delete-bin-7-line text-xl' />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{editingItem ? 'Sửa cấu hình lương' : 'Thêm cấu hình lương'}</DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-4 pt-2'>
            {/* Huấn luyện viên */}
            <FormControl fullWidth required disabled={!!editingItem}>
              <InputLabel>Huấn luyện viên</InputLabel>
              <Select
                value={formUserId}
                label='Huấn luyện viên'
                onChange={e => setFormUserId(e.target.value)}
              >
                {instructors.map(ins => (
                  <MenuItem key={ins.id} value={ins.id}>
                    {ins.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Lớp học */}
            <FormControl fullWidth required disabled={!!editingItem}>
              <InputLabel>Lớp học</InputLabel>
              <Select
                value={formClassId}
                label='Lớp học'
                onChange={e => setFormClassId(e.target.value)}
              >
                {classes.map(cls => (
                  <MenuItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Vai trò */}
            <FormControl fullWidth required>
              <InputLabel>Vai trò</InputLabel>
              <Select value={formRole} label='Vai trò' onChange={e => setFormRole(e.target.value)}>
                <MenuItem value='Coach'>Huấn luyện viên</MenuItem>
                <MenuItem value='Assistant'>Trợ giảng</MenuItem>
              </Select>
            </FormControl>

            {/* Loại tính lương */}
            <FormControl fullWidth required>
              <InputLabel>Loại tính lương</InputLabel>
              <Select
                value={formSalaryType}
                label='Loại tính lương'
                onChange={e => setFormSalaryType(e.target.value)}
              >
                <MenuItem value='PerSession'>Theo buổi</MenuItem>
                <MenuItem value='PerHour'>Theo giờ</MenuItem>
              </Select>
            </FormControl>

            {/* Mức lương */}
            <TextField
              label='Mức lương (VNĐ)'
              type='number'
              fullWidth
              required
              value={formRate}
              onChange={e => setFormRate(e.target.value)}
              inputProps={{ min: 0 }}
            />

            {/* Ghi chú */}
            <TextField
              label='Ghi chú'
              fullWidth
              multiline
              rows={2}
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Hủy
          </Button>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <DialogContentText>Bạn có chắc chắn muốn xóa cấu hình lương này?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
            Hủy
          </Button>
          <Button variant='contained' color='error' onClick={confirmDelete} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default InstructorClassSalaryView
