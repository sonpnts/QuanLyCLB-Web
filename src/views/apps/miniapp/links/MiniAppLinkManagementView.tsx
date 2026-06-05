'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useNotification } from '@/contexts/notificationContext'
import miniAppLinkService from '@/services/miniAppLinkService'
import type {
  MiniAppLinkClassOptionType,
  MiniAppLinkedPhoneType,
  MiniAppManagedStudentRowType
} from '@/types/apps/miniAppLinkTypes'

type PhoneDialogState = {
  open: boolean
  student: MiniAppManagedStudentRowType | null
  link: MiniAppLinkedPhoneType | null
  phoneNumber: string
}

const emptyPhoneDialog: PhoneDialogState = {
  open: false,
  student: null,
  link: null,
  phoneNumber: ''
}

export default function MiniAppLinkManagementView() {
  const { showNotification } = useNotification()

  const [classes, setClasses] = useState<MiniAppLinkClassOptionType[]>([])
  const [rows, setRows] = useState<MiniAppManagedStudentRowType[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [saving, setSaving] = useState(false)

  const [classId, setClassId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const [phoneDialog, setPhoneDialog] = useState<PhoneDialogState>(emptyPhoneDialog)
  const [deleteTarget, setDeleteTarget] = useState<{ student: MiniAppManagedStudentRowType; link: MiniAppLinkedPhoneType } | null>(null)

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true)

    try {
      const response = await miniAppLinkService.getClasses()
      setClasses(response.success && response.data ? response.data : [])
    } finally {
      setLoadingClasses(false)
    }
  }, [])

  const loadRows = useCallback(async () => {
    setLoading(true)

    try {
      const response = await miniAppLinkService.getStudentsPaged({
        classId: classId || undefined,
        keyword: keyword.trim() || undefined,
        pageNumber: page + 1,
        pageSize: rowsPerPage
      })

      if (!response.success || !response.data) {
        setRows([])
        setTotalRecords(0)
        if (response.message) {
          showNotification(response.message, 'error')
        }

        return
      }

      setRows(response.data.records)
      setTotalRecords(response.data.totalRecords)
    } finally {
      setLoading(false)
    }
  }, [classId, keyword, page, rowsPerPage, showNotification])

  useEffect(() => {
    loadClasses()
  }, [loadClasses])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  const selectedClass = useMemo(
    () => (classId ? classes.find(item => item.classId === classId) ?? null : null),
    [classId, classes]
  )

  const openCreateDialog = (student: MiniAppManagedStudentRowType) => {
    setPhoneDialog({
      open: true,
      student,
      link: null,
      phoneNumber: ''
    })
  }

  const openEditDialog = (student: MiniAppManagedStudentRowType, link: MiniAppLinkedPhoneType) => {
    setPhoneDialog({
      open: true,
      student,
      link,
      phoneNumber: link.phoneNumber
    })
  }

  const closePhoneDialog = () => {
    if (saving) return
    setPhoneDialog(emptyPhoneDialog)
  }

  const handleSavePhone = async () => {
    if (!phoneDialog.student) return

    try {
      setSaving(true)

      const response = phoneDialog.link
        ? await miniAppLinkService.updateLink(phoneDialog.link.id, {
            phoneNumber: phoneDialog.phoneNumber
          })
        : await miniAppLinkService.createLink({
            studentId: phoneDialog.student.studentId,
            phoneNumber: phoneDialog.phoneNumber
          })

      if (!response.success) {
        showNotification(response.message || 'Không thể lưu số điện thoại Mini App.', 'error')
        return
      }

      showNotification(
        phoneDialog.link ? 'Đã cập nhật số điện thoại Mini App.' : 'Đã thêm số điện thoại Mini App.',
        'success'
      )
      setPhoneDialog(emptyPhoneDialog)
      await loadRows()
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePhone = async () => {
    if (!deleteTarget) return

    try {
      setSaving(true)
      const response = await miniAppLinkService.deleteLink(deleteTarget.link.id)

      if (!response.success) {
        showNotification(response.message || 'Không thể xóa số điện thoại Mini App.', 'error')
        return
      }

      showNotification('Đã xóa số điện thoại Mini App.', 'success')
      setDeleteTarget(null)
      await loadRows()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box className='space-y-6'>
      <Card>
        <CardHeader
          title='Quản lý SĐT Mini App'
          subheader='SĐT chính của học viên vẫn dùng cho ZNS. Các SĐT phụ trong bảng này được phép đăng nhập và xem Mini App.'
        />
        <CardContent>
          {selectedClass ? (
            <Alert severity='info'>
              Đang lọc theo lớp <strong>{selectedClass.classCode}</strong> - {selectedClass.className}.
            </Alert>
          ) : (
            <Alert severity='info'>Đang hiển thị toàn bộ học viên trong phạm vi lớp bạn được quản lý.</Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title='Bộ lọc' />
        <CardContent>
          <Box className='flex flex-wrap gap-4 items-center'>
            <FormControl size='small' sx={{ minWidth: 280 }}>
              <InputLabel id='miniapp-class-filter'>Lớp</InputLabel>
              <Select
                labelId='miniapp-class-filter'
                label='Lớp'
                value={classId}
                onChange={event => {
                  setClassId(event.target.value)
                  setPage(0)
                }}
                disabled={loadingClasses}
              >
                <MenuItem value=''>Tất cả lớp</MenuItem>
                {classes.map(item => (
                  <MenuItem key={item.classId} value={item.classId}>
                    {item.classCode} - {item.className}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size='small'
              label='Tìm kiếm'
              placeholder='Tên / mã HV / SĐT...'
              value={keyword}
              onChange={event => {
                setKeyword(event.target.value)
                setPage(0)
              }}
              sx={{ minWidth: 280 }}
            />

            <Button variant='outlined' onClick={loadRows} disabled={loading}>
              Lọc
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title='Danh sách học viên' />
        <CardContent>
          {loading ? (
            <Box className='flex justify-center py-8'>
              <CircularProgress />
            </Box>
          ) : rows.length === 0 ? (
            <Typography variant='body2' color='text.secondary' className='text-center py-4'>
              Không có dữ liệu.
            </Typography>
          ) : (
            <>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Học viên</TableCell>
                      <TableCell>SĐT chính</TableCell>
                      <TableCell>Lớp đang học</TableCell>
                      <TableCell>SĐT Mini App</TableCell>
                      <TableCell align='right'>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map(student => (
                      <TableRow key={student.studentId} hover>
                        <TableCell sx={{ minWidth: 220 }}>
                          <Stack spacing={0.5}>
                            <Typography variant='body2' fontWeight={600}>
                              {student.studentName}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {student.studentCode || 'Chưa có mã HV'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ minWidth: 140 }}>{student.primaryPhoneNumber || '-'}</TableCell>
                        <TableCell sx={{ minWidth: 220 }}>
                          <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
                            {student.classes.map(item => (
                              <Chip
                                key={`${student.studentId}_${item.classId}`}
                                size='small'
                                variant='tonal'
                                label={`${item.classCode}`}
                              />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ minWidth: 260 }}>
                          {student.linkedPhones.length === 0 ? (
                            <Chip size='small' variant='outlined' label='Chưa có SĐT phụ' />
                          ) : (
                            <Stack spacing={1}>
                              {student.linkedPhones.map(link => (
                                <Box
                                  key={link.id}
                                  className='flex items-center justify-between gap-2 rounded border p-2'
                                >
                                  <Typography variant='body2'>{link.phoneNumber}</Typography>
                                  <Box className='flex items-center gap-1'>
                                    <Button size='small' variant='text' onClick={() => openEditDialog(student, link)}>
                                      Sửa
                                    </Button>
                                    <Button
                                      size='small'
                                      color='error'
                                      variant='text'
                                      onClick={() => setDeleteTarget({ student, link })}
                                    >
                                      Xóa
                                    </Button>
                                  </Box>
                                </Box>
                              ))}
                            </Stack>
                          )}
                        </TableCell>
                        <TableCell align='right' sx={{ minWidth: 120 }}>
                          <Button size='small' variant='contained' onClick={() => openCreateDialog(student)}>
                            Thêm SĐT
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component='div'
                count={totalRecords}
                page={page}
                onPageChange={(_, nextPage) => setPage(nextPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={event => {
                  setRowsPerPage(Number(event.target.value))
                  setPage(0)
                }}
                rowsPerPageOptions={[10, 20, 50]}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={phoneDialog.open} onClose={closePhoneDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{phoneDialog.link ? 'Cập nhật SĐT Mini App' : 'Thêm SĐT Mini App'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label='Học viên'
              value={
                phoneDialog.student
                  ? `${phoneDialog.student.studentName}${phoneDialog.student.studentCode ? ` (${phoneDialog.student.studentCode})` : ''}`
                  : ''
              }
              disabled
              fullWidth
            />

            <TextField
              label='SĐT chính'
              value={phoneDialog.student?.primaryPhoneNumber || ''}
              disabled
              fullWidth
            />

            <TextField
              label='SĐT Mini App'
              value={phoneDialog.phoneNumber}
              onChange={event => setPhoneDialog(current => ({ ...current, phoneNumber: event.target.value }))}
              placeholder='Nhập số điện thoại phụ'
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePhoneDialog} disabled={saving}>
            Hủy
          </Button>
          <Button variant='contained' onClick={handleSavePhone} disabled={saving || !phoneDialog.phoneNumber.trim()}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => (saving ? null : setDeleteTarget(null))} maxWidth='xs' fullWidth>
        <DialogTitle>Xóa SĐT Mini App</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            <Typography variant='body2'>
              Học viên: <strong>{deleteTarget?.student.studentName}</strong>
            </Typography>
            <Typography variant='body2'>
              Số điện thoại: <strong>{deleteTarget?.link.phoneNumber}</strong>
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={saving}>
            Hủy
          </Button>
          <Button color='error' variant='contained' onClick={handleDeletePhone} disabled={saving}>
            {saving ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
