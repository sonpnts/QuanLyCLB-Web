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

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import { fuzzyFilter } from '@/utils/tableHelpers'


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

  const { showNotification } = useNotification()

  // Dùng ref để tránh dependency showNotification trong useEffect
  const showNotificationRef = useRef(showNotification)
  showNotificationRef.current = showNotification

  // Ref để track đã load students chưa (tránh double call trong Strict Mode)
  const studentsLoadedRef = useRef(false)
  const currentFilterRef = useRef<string>('')

  const handleFilterChange = useCallback((params: GetStudentsParams) => {
    setFilterParams(params)
  }, [])

  // Load students - chỉ phụ thuộc vào filterParams
  useEffect(() => {
    const filterKey = JSON.stringify(filterParams)

    // Tránh load lại nếu filter không đổi
    if (studentsLoadedRef.current && currentFilterRef.current === filterKey) {
      return
    }

    const loadStudents = async () => {
      try {
        setLoading(true)
        currentFilterRef.current = filterKey
        studentsLoadedRef.current = true

        const response = await studentService.getStudents(filterParams)

        setData(response.data || [])
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    }
    loadStudents()
  }, [filterParams])

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

  // Reload data sau khi enroll
  const handleEnrolled = useCallback(() => {
    studentsLoadedRef.current = false
    currentFilterRef.current = ''
    setFilterParams(prev => ({ ...prev }))
  }, [])

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
            <CustomAvatar skin='light' size={34} color={row.original.avatarColor || 'primary'}>
              {getInitials(row.original.fullName)}
            </CustomAvatar>
            <div className='flex flex-col'>
              <Typography className='font-medium' color='text.primary'>
                {row.original.fullName}
              </Typography>
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
            <IconButton onClick={() => handleEnroll(row.original)} title='Đăng ký lớp' color='success'>
              <i className='ri-user-add-line' />
            </IconButton>
            <IconButton onClick={() => handleDelete(row.original.id)} title='Xóa học viên' color='error'>
              <i className='ri-delete-bin-7-line' />
            </IconButton>
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
    [handleDelete, handleEdit, handleView, handleEnroll]
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

  return (
    <>
      <Card>
        <CardHeader title='Bộ lọc' />
        <TableFilters onFilterChange={handleFilterChange} />
        <Divider />
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <Button
            color='secondary'
            variant='outlined'
            startIcon={<i className='ri-upload-2-line text-xl' />}
            className='max-sm:is-full'
          >
            Xuất Excel
          </Button>
          <div className='flex items-center gap-x-4 gap-4 flex-col max-sm:is-full sm:flex-row'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Tìm kiếm học viên'
              className='max-sm:is-full'
            />
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
                  <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
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
