'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { TextFieldProps } from '@mui/material/TextField'

import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import { fuzzyFilter } from '@/utils/tableHelpers'
import classService from '@/services/classService'
import studentAttendanceService from '@/services/studentAttendanceService'
import type { GetStudentAbsencesParams, StudentAbsenceType } from '@/services/studentAttendanceService'
import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import useConfirmActionDialog from '@/hooks/useConfirmAction'
import { formatDateVN } from '@/utils/dateTime'
import { hasAdminRole } from '@/utils/roleUtils'
import { buildModulePermissionMap } from '@/utils/rbac'

import AddLeaveRequestDrawer from './AddLeaveRequestDrawer'
import TableFilters from './TableFilters'

import tableStyles from '@core/styles/table.module.css'

type ClassOption = {
  id: string
  code?: string
  name: string
}

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
    const timeout = setTimeout(() => onChange(value), debounce)

    return () => clearTimeout(timeout)
  }, [value, debounce, onChange])

  return <TextField {...props} value={value} onChange={event => setValue(event.target.value)} size='small' />
}

const columnHelper = createColumnHelper<StudentAbsenceType>()

const LeaveRequestListTable = () => {
  const { auth } = useAuth()
  const isAdmin = hasAdminRole(auth?.roles)

  const leaveRequestPermissions = useMemo(
    () => buildModulePermissionMap(auth?.permissions, auth?.roles, 'LeaveRequest'),
    [auth?.permissions, auth?.roles]
  )

  const { showNotification } = useNotification()
  const { confirm, confirmDialog } = useConfirmActionDialog()
  const showNotificationRef = useRef(showNotification)

  showNotificationRef.current = showNotification

  const [addRequestOpen, setAddRequestOpen] = useState(false)
  const [data, setData] = useState<StudentAbsenceType[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterParams, setFilterParams] = useState<GetStudentAbsencesParams>({})

  useEffect(() => {
    const loadClasses = async () => {
      const response = isAdmin
        ? await classService.getClasses({ isActive: true, pageSize: 1000 })
        : await studentAttendanceService.getCoachClasses()

      if (response.success && response.data) {
        setClasses(
          response.data.map((item: any) => ({
            id: item.id || item.classId,
            code: item.code || item.classCode,
            name: item.name || item.className
          }))
        )
      }
    }

    loadClasses()
  }, [isAdmin])

  const handleFilterChange = useCallback((params: GetStudentAbsencesParams) => {
    setFilterParams(params)
  }, [])

  const loadAbsences = useCallback(async () => {
    try {
      setLoading(true)

      const response = await studentAttendanceService.getAbsences({
        pageSize: 500,
        ...filterParams
      })

      setData(response.success && response.data ? response.data : [])
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [filterParams])

  useEffect(() => {
    loadAbsences()
  }, [loadAbsences])

  const handleDelete = useCallback(async (id: string) => {
    const confirmed = await confirm({
      title: 'Xác nhận xóa nghỉ phép',
      description: 'Bạn có chắc chắn muốn xóa dòng xin nghỉ phép này?',
      confirmText: 'Xóa'
    })

    if (!confirmed) return

    const response = await studentAttendanceService.deleteAttendance(id)

    if (!response.success) {
      showNotificationRef.current(response.message || 'Không thể xóa dòng xin nghỉ phép.', 'error')
      
return
    }

    setData(prev => prev.filter(item => item.id !== id))
    showNotificationRef.current('Đã xóa dòng xin nghỉ phép.', 'success')
  }, [confirm])

  const columns = useMemo<ColumnDef<StudentAbsenceType, any>[]>(() => {
    const nextColumns: ColumnDef<StudentAbsenceType, any>[] = [
      columnHelper.accessor('studentName', {
        header: 'Học viên',
        cell: ({ row }) => (
          <div>
            <Typography className='font-medium'>{row.original.studentName}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.original.studentPhone || '-'}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('className', {
        header: 'Lớp',
        cell: ({ row }) => <Typography>{row.original.className}</Typography>
      }),
      columnHelper.accessor('attendanceDate', {
        header: 'Buổi nghỉ',
        cell: ({ row }) => <Typography>{formatDateVN(row.original.attendanceDate)}</Typography>
      }),
      columnHelper.accessor('isExcused', {
        header: 'Loại vắng',
        cell: ({ row }) => (
          <Chip
            label={row.original.isExcused ? 'Có phép' : 'Không phép'}
            size='small'
            color={row.original.isExcused ? 'info' : 'error'}
            variant='tonal'
          />
        )
      }),
      columnHelper.accessor('reason', {
        header: 'Lý do',
        cell: ({ row }) => (
          <Typography variant='body2' className='max-w-[260px] truncate'>
            {row.original.reason || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('markedByUserName', {
        header: 'Người ghi nhận',
        cell: ({ row }) => <Typography>{row.original.markedByUserName || '-'}</Typography>
      })
    ]

    if (leaveRequestPermissions.canDelete) {
      nextColumns.push({
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <IconButton color='error' title='Xóa dòng xin nghỉ phép' onClick={() => handleDelete(row.original.id)}>
            <i className='ri-delete-bin-6-line' />
          </IconButton>
        )
      })
    }

    return nextColumns
  }, [handleDelete, leaveRequestPermissions.canDelete])

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Quản lý nghỉ phép'
          subheader='Dữ liệu màn này dùng chung với điểm danh: nghỉ phép tạo tại đây sẽ hiện sẵn ở trang điểm danh, và các buổi vắng do coach điểm danh cũng hiển thị lại tại đây.'
        />
        <TableFilters classes={classes} onFilterChange={handleFilterChange} />
        <Divider />
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            placeholder='Tìm học viên, lớp, lý do...'
            className='max-sm:is-full'
          />
          {leaveRequestPermissions.canCreate && (
            <Button variant='contained' onClick={() => setAddRequestOpen(true)}>
              Thêm nghỉ phép
            </Button>
          )}
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
                  <td colSpan={columns.length} className='text-center'>
                    {loading ? 'Đang tải...' : 'Không có dữ liệu'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
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
          count={table.getPrePaginationRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          onRowsPerPageChange={event => table.setPageSize(Number(event.target.value))}
        />
      </Card>

      {leaveRequestPermissions.canCreate && (
        <AddLeaveRequestDrawer open={addRequestOpen} handleClose={() => setAddRequestOpen(false)} setData={setData} />
      )}
      {confirmDialog}
    </>
  )
}

export default LeaveRequestListTable
