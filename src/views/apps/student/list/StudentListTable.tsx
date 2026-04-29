'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import type { TextFieldProps } from '@mui/material/TextField'

// Third-party Imports
import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

// Type Imports
import type { StudentType } from '@/types/apps/studentTypes'

// Component Imports
import TableFilters from './TableFilters'
import AddStudentDrawer from './AddStudentDrawer'
import EditStudentDrawer from './EditStudentDrawer'
import ViewStudentDrawer from './ViewStudentDrawer'
import EnrollStudentDrawer from './EnrollStudentDrawer'
import CustomAvatar from '@core/components/mui/Avatar'

// Service Imports
import studentService from '@/services/studentService'
import type { GetStudentsParams } from '@/services/studentService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Utils
import { logger } from '@/utils/logger'
import { exportToExcel, formatVnDate, formatBool } from '@/utils/exportToExcel'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import { fuzzyFilter } from '@/utils/tableHelpers'

type StatusFilter = 'all' | 'active' | 'suspended'

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)
    return () => clearTimeout(timeout)
  }, [value, debounce, onChange])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const columnHelper = createColumnHelper<StudentType>()

const StudentListTable = () => {
  // States
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [editStudentOpen, setEditStudentOpen] = useState(false)
  const [viewStudentOpen, setViewStudentOpen] = useState(false)
  const [enrollStudentOpen, setEnrollStudentOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<StudentType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterParams, setFilterParams] = useState<GetStudentsParams>({})
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  // Suspend dialog
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [suspendTarget, setSuspendTarget] = useState<StudentType | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspendLoading, setSuspendLoading] = useState(false)

  const { showNotification } = useNotification()

  const showNotificationRef = useRef(showNotification)
  showNotificationRef.current = showNotification

  const studentsLoadedRef = useRef(false)
  const currentFilterRef = useRef<string>('')

  const handleFilterChange = useCallback((params: GetStudentsParams) => {
    setFilterParams(params)
  }, [])

  // Tính filterParams thực tế (kết hợp base filter + status filter)
  const effectiveParams = useMemo<GetStudentsParams>(() => {
    const p = { ...filterParams }
    if (statusFilter === 'suspended') {
      p.isSuspended = true
    } else if (statusFilter === 'active') {
      p.isSuspended = false
    } else {
      delete p.isSuspended
    }
    return p
  }, [filterParams, statusFilter])

  // Load students - phụ thuộc vào effectiveParams
  useEffect(() => {
    const filterKey = JSON.stringify(effectiveParams)

    if (studentsLoadedRef.current && currentFilterRef.current === filterKey) return

    const loadStudents = async () => {
      try {
        setLoading(true)
        currentFilterRef.current = filterKey
        studentsLoadedRef.current = true

        const response = await studentService.getStudents(effectiveParams)
        setData(response.data || [])
      } catch (error) {
        logger.error('StudentListTable', 'loadStudents', error)
        setData([])
      } finally {
        setLoading(false)
      }
    }
    loadStudents()
  }, [effectiveParams])

  const reloadData = useCallback(() => {
    studentsLoadedRef.current = false
    currentFilterRef.current = ''
    setFilterParams(prev => ({ ...prev }))
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    try {
      setLoading(true)
      const response = await studentService.deleteStudent(id)
      if (response.success) {
        setData(prev => prev.filter(s => s.id !== id))
        showNotificationRef.current('Xóa học viên thành công!', 'success')
      } else {
        showNotificationRef.current(response.message || 'Không thể xóa học viên.', 'error')
      }
    } catch (error) {
      logger.error('StudentListTable', 'handleDelete', error)
      showNotificationRef.current('Đã có lỗi khi xóa học viên.', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleEdit = useCallback((student: StudentType) => {
    setSelectedStudent(student)
    setEditStudentOpen(true)
  }, [])

  const handleView = useCallback((student: StudentType) => {
    setSelectedStudent(student)
    setViewStudentOpen(true)
  }, [])

  const handleEnroll = useCallback((student: StudentType) => {
    setSelectedStudent(student)
    setEnrollStudentOpen(true)
  }, [])

  const handleStudentUpdated = useCallback((updated: StudentType) => {
    setData(prev => prev.map(s => (s.id === updated.id ? updated : s)))
  }, [])

  const handleEnrolled = useCallback(() => {
    reloadData()
  }, [reloadData])

  // Suspend handlers
  const openSuspendDialog = useCallback((student: StudentType) => {
    setSuspendTarget(student)
    setSuspendReason('')
    setSuspendDialogOpen(true)
  }, [])

  const handleSuspendConfirm = useCallback(async () => {
    if (!suspendTarget) return
    try {
      setSuspendLoading(true)
      const response = await studentService.suspendStudent(suspendTarget.id, suspendReason.trim() || undefined)
      if (response.success) {
        setData(prev => prev.map(s => (s.id === suspendTarget.id ? { ...s, isSuspended: true, suspendedAt: new Date().toISOString(), suspendReason: suspendReason.trim() || undefined } : s)))
        showNotificationRef.current('Đã chuyển học viên sang trạng thái tạm nghỉ.', 'success')
        setSuspendDialogOpen(false)
        setSuspendTarget(null)
        if (statusFilter !== 'all') reloadData()
      } else {
        showNotificationRef.current(response.message || 'Không thể tạm nghỉ học viên.', 'error')
      }
    } catch (error) {
      logger.error('StudentListTable', 'handleSuspendConfirm', error)
      showNotificationRef.current('Đã có lỗi xảy ra.', 'error')
    } finally {
      setSuspendLoading(false)
    }
  }, [suspendTarget, suspendReason, statusFilter, reloadData])

  const handleResume = useCallback(async (student: StudentType) => {
    try {
      setLoading(true)
      const response = await studentService.resumeStudent(student.id)
      if (response.success) {
        setData(prev => prev.map(s => (s.id === student.id ? { ...s, isSuspended: false, suspendedAt: undefined, suspendReason: undefined } : s)))
        showNotificationRef.current('Đã khôi phục học viên.', 'success')
        if (statusFilter !== 'all') reloadData()
      } else {
        showNotificationRef.current(response.message || 'Không thể khôi phục học viên.', 'error')
      }
    } catch (error) {
      logger.error('StudentListTable', 'handleResume', error)
      showNotificationRef.current('Đã có lỗi xảy ra.', 'error')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, reloadData])

  const columns = useMemo<ColumnDef<StudentType, any>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
          />
        )
      },
      columnHelper.accessor('fullName', {
        header: 'Học viên',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <CustomAvatar skin='light' size={34} color={row.original.isSuspended ? 'secondary' : (row.original.avatarColor || 'primary')}>
              {getInitials(row.original.fullName)}
            </CustomAvatar>
            <div className='flex flex-col gap-0.5'>
              <div className='flex items-center gap-2'>
                <Typography className='font-medium' color='text.primary'>
                  {row.original.fullName}
                </Typography>
                {row.original.isSuspended && (
                  <Tooltip
                    arrow
                    placement='top'
                    title={
                      row.original.suspendReason
                        ? `Lý do tạm nghỉ: ${row.original.suspendReason}`
                        : 'Đang tạm nghỉ (không có lý do)'
                    }
                  >
                    <Chip
                      label='Tạm nghỉ'
                      size='small'
                      color='warning'
                      variant='tonal'
                      icon={<i className='ri-information-line' />}
                    />
                  </Tooltip>
                )}
              </div>
              <Typography variant='body2'>{row.original.email}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('phoneNumber', {
        header: 'Số điện thoại',
        cell: ({ row }) => <Typography>{row.original.phoneNumber || '-'}</Typography>
      }),
      columnHelper.accessor('gender', {
        header: 'Giới tính',
        cell: ({ row }) => (
          <Chip
            label={row.original.gender === true ? 'Nam' : row.original.gender === false ? 'Nữ' : '-'}
            size='small'
            color={row.original.gender === true ? 'info' : 'secondary'}
            variant='tonal'
          />
        )
      }),
      columnHelper.accessor('dateOfBirth', {
        header: 'Ngày sinh',
        cell: ({ row }) => (
          <Typography>
            {row.original.dateOfBirth ? new Date(row.original.dateOfBirth).toLocaleDateString('vi-VN') : '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('currentBeltLevelName', {
        header: 'Cấp đai',
        cell: ({ row }) => (
          <Chip label={row.original.currentBeltLevelName || 'Chưa có'} size='small' color='warning' variant='tonal' />
        )
      }),
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className='flex items-center'>
            {!row.original.isSuspended ? (
              <>
                <IconButton onClick={() => handleEnroll(row.original)} title='Đăng ký lớp' color='success'>
                  <i className='ri-user-add-line' />
                </IconButton>
                <IconButton onClick={() => openSuspendDialog(row.original)} title='Tạm nghỉ' color='warning'>
                  <i className='ri-pause-circle-line' />
                </IconButton>
                <IconButton onClick={() => handleDelete(row.original.id)} title='Xóa học viên' color='error'>
                  <i className='ri-delete-bin-7-line' />
                </IconButton>
              </>
            ) : (
              <IconButton onClick={() => handleResume(row.original)} title='Khôi phục' color='success'>
                <i className='ri-play-circle-line' />
              </IconButton>
            )}
            <IconButton title='Xem chi tiết' onClick={() => handleView(row.original)}>
              <i className='ri-eye-line text-textSecondary' />
            </IconButton>
            <IconButton title='Chỉnh sửa' onClick={() => handleEdit(row.original)} color='primary'>
              <i className='ri-edit-box-line' />
            </IconButton>
          </div>
        )
      }
    ],
    [handleDelete, handleEdit, handleView, handleEnroll, openSuspendDialog, handleResume]
  )

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { rowSelection, globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  const suspendedCount = data.filter(s => s.isSuspended).length

  return (
    <>
      <Card>
        <CardHeader title='Bộ lọc' />
        <TableFilters onFilterChange={handleFilterChange} />
        <Divider />

        {/* Status filter bar */}
        <div className='flex items-center justify-between px-5 pt-4 pb-2 gap-4 flex-wrap'>
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={(_, v) => {
              if (v) {
                setStatusFilter(v)
                studentsLoadedRef.current = false
                currentFilterRef.current = ''
              }
            }}
            size='small'
            color='primary'
          >
            <ToggleButton value='all'>Tất cả</ToggleButton>
            <ToggleButton value='active'>Đang học</ToggleButton>
            <ToggleButton value='suspended'>
              Tạm nghỉ
              {suspendedCount > 0 && statusFilter !== 'suspended' && (
                <Chip label={suspendedCount} size='small' color='warning' sx={{ ml: 1, height: 18, fontSize: 11 }} />
              )}
            </ToggleButton>
          </ToggleButtonGroup>

          <div className='flex items-center gap-x-4 gap-4 flex-col max-sm:is-full sm:flex-row'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Tìm kiếm học viên'
              className='max-sm:is-full'
            />
            <Button
              variant='outlined'
              color='success'
              startIcon={<i className='ri-file-excel-2-line' />}
              disabled={data.length === 0}
              onClick={() => {
                const tabLabel =
                  statusFilter === 'active' ? 'dang-hoc' : statusFilter === 'suspended' ? 'tam-nghi' : 'tat-ca'
                exportToExcel({
                  filename: `danh-sach-hoc-vien_${tabLabel}`,
                  rows: data,
                  columns: [
                    { header: 'Mã học viên', accessor: 'code' },
                    { header: 'Họ và tên', accessor: 'fullName' },
                    { header: 'Email', accessor: 'email' },
                    { header: 'Số điện thoại', accessor: 'phoneNumber' },
                    {
                      header: 'Giới tính',
                      accessor: 'gender',
                      formatter: v => (v === true ? 'Nam' : v === false ? 'Nữ' : '')
                    },
                    { header: 'Ngày sinh', accessor: 'dateOfBirth', formatter: formatVnDate },
                    { header: 'Cấp đai', accessor: 'currentBeltLevelName' as any },
                    {
                      header: 'Trạng thái',
                      accessor: 'isSuspended',
                      formatter: v => (v ? 'Tạm nghỉ' : 'Đang học')
                    },
                    { header: 'Lý do tạm nghỉ', accessor: 'suspendReason' as any },
                    { header: 'Ngày tạm nghỉ', accessor: 'suspendedAt' as any, formatter: formatVnDate },
                    { header: 'Hoạt động', accessor: 'isActive' as any, formatter: v => formatBool(v, 'Có', 'Không') }
                  ]
                })
                showNotificationRef.current(`Đã xuất ${data.length} học viên ra file Excel.`, 'success')
              }}
              className='max-sm:is-full'
            >
              Xuất Excel
            </Button>
            <Button variant='contained' onClick={() => setAddStudentOpen(true)} className='max-sm:is-full'>
              Thêm học viên
            </Button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={classnames({
                            'flex items-center': header.column.getIsSorted(),
                            'cursor-pointer select-none': header.column.getCanSort()
                          })}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <i className='ri-arrow-up-s-line text-xl' />,
                            desc: <i className='ri-arrow-down-s-line text-xl' />
                          }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getFilteredRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    {loading ? 'Đang tải...' : 'Không có dữ liệu'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className={classnames({ selected: row.getIsSelected() })}
                    style={row.original.isSuspended ? { opacity: 0.75, background: 'rgba(255,152,0,0.04)' } : undefined}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          labelRowsPerPage='Số dòng mỗi trang:'
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          className='border-bs'
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />
      </Card>

      {/* Suspend Confirmation Dialog */}
      <Dialog open={suspendDialogOpen} onClose={() => setSuspendDialogOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Tạm nghỉ học viên</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' className='mb-4'>
            Học viên <strong>{suspendTarget?.fullName}</strong> sẽ được chuyển sang trạng thái tạm nghỉ.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label='Lý do tạm nghỉ (tuỳ chọn)'
            placeholder='Nhập lý do...'
            value={suspendReason}
            onChange={e => setSuspendReason(e.target.value)}
            size='small'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuspendDialogOpen(false)} disabled={suspendLoading}>
            Hủy
          </Button>
          <Button variant='contained' color='warning' onClick={handleSuspendConfirm} disabled={suspendLoading}>
            {suspendLoading ? 'Đang xử lý...' : 'Xác nhận tạm nghỉ'}
          </Button>
        </DialogActions>
      </Dialog>

      <AddStudentDrawer open={addStudentOpen} handleClose={() => setAddStudentOpen(false)} setData={setData} />
      <EditStudentDrawer
        open={editStudentOpen}
        onClose={() => {
          setEditStudentOpen(false)
          setSelectedStudent(null)
        }}
        student={selectedStudent}
        onSaved={handleStudentUpdated}
      />
      <ViewStudentDrawer
        open={viewStudentOpen}
        onClose={() => {
          setViewStudentOpen(false)
          setSelectedStudent(null)
        }}
        student={selectedStudent}
        onSuspend={openSuspendDialog}
        onResume={handleResume}
      />
      <EnrollStudentDrawer
        open={enrollStudentOpen}
        onClose={() => {
          setEnrollStudentOpen(false)
          setSelectedStudent(null)
        }}
        student={selectedStudent}
        onEnrolled={handleEnrolled}
      />
    </>
  )
}

export default StudentListTable
