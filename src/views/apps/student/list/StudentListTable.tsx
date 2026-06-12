'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'

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

import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import type { StudentType } from '@/types/apps/studentTypes'
import type { ClassType } from '@/types/apps/classTypes'

import TableFilters from './TableFilters'
import AddStudentDrawer from './AddStudentDrawer'
import EditStudentDrawer from './EditStudentDrawer'
import ViewStudentDrawer from './ViewStudentDrawer'
import EnrollStudentDrawer from './EnrollStudentDrawer'
import TransferStudentDialog from './TransferStudentDialog'
import ImportStudentsDialog from './ImportStudentsDialog'
import CustomAvatar from '@core/components/mui/Avatar'

import studentService from '@/services/studentService'
import classService from '@/services/classService'
import type { GetStudentsParams } from '@/services/studentService'

import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'

import { hasAdminRole, isInstructorUser } from '@/utils/roleUtils'
import { buildModulePermissionMap } from '@/utils/rbac'
import { logger } from '@/utils/logger'
import { formatDateVN } from '@/utils/dateTime'
import { exportToExcel, formatVnDate, formatBool } from '@/utils/exportToExcel'

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
    const timeout = setTimeout(() => onChange(value), debounce)


return () => clearTimeout(timeout)
  }, [value, debounce, onChange])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

const columnHelper = createColumnHelper<StudentType>()

const StudentListTable = () => {
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [editStudentOpen, setEditStudentOpen] = useState(false)
  const [viewStudentOpen, setViewStudentOpen] = useState(false)
  const [enrollStudentOpen, setEnrollStudentOpen] = useState(false)
  const [transferStudentOpen, setTransferStudentOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<StudentType[]>([])
  const [assignedClasses, setAssignedClasses] = useState<ClassType[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [filterParams, setFilterParams] = useState<GetStudentsParams>({})
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [suspendTarget, setSuspendTarget] = useState<StudentType | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspendLoading, setSuspendLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const { showNotification } = useNotification()
  const { auth } = useAuth()
  const isAdmin = useMemo(() => hasAdminRole(auth?.roles), [auth?.roles])
  const isInstructor = useMemo(() => isInstructorUser(auth?.roles), [auth?.roles])

  const studentPermissions = useMemo(
    () => buildModulePermissionMap(auth?.permissions, auth?.roles, 'Student'),
    [auth?.permissions, auth?.roles]
  )

  const userId = auth?.user?.id

  const showNotificationRef = useRef(showNotification)

  showNotificationRef.current = showNotification

  const handleFilterChange = useCallback((params: GetStudentsParams) => {
    setPage(0)
    setFilterParams(params)
  }, [])

  const effectiveParams = useMemo<GetStudentsParams>(() => {
    const p = { ...filterParams }

    if (statusFilter === 'suspended') p.isSuspended = true
    else if (statusFilter === 'active') p.isSuspended = false
    else delete p.isSuspended
    if (searchKeyword.trim()) p.keyword = searchKeyword.trim()
    else delete p.keyword

return p
  }, [filterParams, searchKeyword, statusFilter])

  useEffect(() => {
    let cancelled = false

    const loadAssignedClasses = async () => {
      try {
        const response =
          !isAdmin && userId
            ? await classService.getClassesByUserId(userId, { isActive: true, pageNumber: 1, pageSize: 1000 })
            : await classService.getClasses({ isActive: true, pageNumber: 1, pageSize: 1000 })

        if (!cancelled) {
          setAssignedClasses(
            (response.data || [])
              .filter(cls => cls.isActive !== false)
              .sort((left, right) => (left.name || '').localeCompare(right.name || '', 'vi'))
          )
        }
      } catch (error) {
        logger.error('StudentListTable', 'loadAssignedClasses', error)
        if (!cancelled) setAssignedClasses([])
      }
    }

    void loadAssignedClasses()

    return () => {
      cancelled = true
    }
  }, [isAdmin, userId])

  useEffect(() => {
    let cancelled = false

    const loadStudents = async () => {
      try {
        setLoading(true)

        const response = await studentService.getStudentsPaged({
          ...effectiveParams,
          pageNumber: page + 1,
          pageSize: rowsPerPage
        })

        if (cancelled) return

        setData(response.data?.records || [])
        setTotalCount(response.data?.totalRecords || 0)
      } catch (error) {
        logger.error('StudentListTable', 'loadStudents', error)

        if (!cancelled) {
          setData([])
          setTotalCount(0)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadStudents()

    return () => {
      cancelled = true
    }
  }, [effectiveParams, page, reloadKey, rowsPerPage])

  const reloadData = useCallback(() => {
    setReloadKey(prev => prev + 1)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    try {
      setLoading(true)
      const response = await studentService.deleteStudent(id)

      if (response.success) {
        setData(prev => prev.filter(s => s.id !== id))
        setTotalCount(prev => Math.max(0, prev - 1))
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

  const handleTransfer = useCallback((student: StudentType) => {
    setSelectedStudent(student)
    setTransferStudentOpen(true)
  }, [])

  const handleStudentUpdated = useCallback(
    (updated: StudentType) => {
      setData(prev =>
        prev.map(s =>
          s.id !== updated.id
            ? s
            : {
                ...s,
                ...updated,
                classes: updated.classes && updated.classes.length > 0 ? updated.classes : s.classes
              }
        )
      )
      reloadData()
    },
    [reloadData]
  )

  const handleEnrolled = useCallback(() => {
    reloadData()
  }, [reloadData])

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
        setData(prev =>
          prev.map(s =>
            s.id === suspendTarget.id
              ? {
                  ...s,
                  isSuspended: true,
                  suspendedAt: new Date().toISOString(),
                  suspendReason: suspendReason.trim() || undefined
                }
              : s
          )
        )
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
  }, [reloadData, statusFilter, suspendReason, suspendTarget])

  const handleResume = useCallback(
    async (student: StudentType) => {
      try {
        setLoading(true)
        const response = await studentService.resumeStudent(student.id)

        if (response.success) {
          setData(prev =>
            prev.map(s =>
              s.id === student.id ? { ...s, isSuspended: false, suspendedAt: undefined, suspendReason: undefined } : s
            )
          )
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
    },
    [reloadData, statusFilter]
  )

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
            onClick={event => event.stopPropagation()}
          />
        )
      },
      columnHelper.accessor('fullName', {
      header: 'Học viên',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <CustomAvatar
              skin='light'
              size={34}
              color={row.original.isSuspended ? 'secondary' : row.original.avatarColor || 'primary'}
            >
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
              <Typography variant='body2'>{row.original.phoneNumber || '-'}</Typography>
            </div>
          </div>
        )
      }),

      // columnHelper.accessor('phoneNumber', {
      // header: 'Số điện thoại',
      //   cell: ({ row }) => <Typography>{row.original.phoneNumber || '-'}</Typography>
      // }),
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
            {formatDateVN(row.original.dateOfBirth)}
          </Typography>
        )
      }),
      columnHelper.accessor('beltLevelName', {
      header: 'Cấp đai',
        cell: ({ row }) => (
        <Chip label={row.original.beltLevelName || 'Chưa có'} size='small' color='warning' variant='tonal' />
        )
      }),
      {
        id: 'classes',
      header: 'Lớp đang học',
        cell: ({ row }) => {
          const activeClasses = (row.original.classes || []).filter(c => !c.status || c.status === 'Active')

          if (activeClasses.length === 0) {
            return (
              <Typography variant='body2' color='text.disabled'>
                  Chưa đăng ký
              </Typography>
            )
          }

          return (
            <div className='flex flex-wrap gap-1 max-w-[220px]'>
              {activeClasses.map(cls => (
                <Chip
                  key={cls.classId}
                  label={cls.className}
                  size='small'
                  color='primary'
                  variant='tonal'
              title={`Đăng ký: ${formatDateVN(cls.enrollmentDate, '')}`}
                />
              ))}
            </div>
          )
        }
      },
      {
        id: 'actions',
      header: 'Thao tác',
        cell: ({ row }) => {
          const activeClasses = (row.original.classes || []).filter(c => !c.status || c.status === 'Active')


return (
            <div className='flex items-center' onClick={event => event.stopPropagation()}>
              {studentPermissions.canUpdate && !row.original.isSuspended ? (
                <>
                  {activeClasses.length === 0 ? (
              <IconButton onClick={() => handleEnroll(row.original)} title='Đăng ký lớp' color='success'>
                      <i className='ri-user-add-line' />
                    </IconButton>
                  ) : (
              <IconButton onClick={() => handleTransfer(row.original)} title='Yêu cầu chuyển lớp' color='warning'>
                      <i className='ri-arrow-left-right-line' />
                    </IconButton>
                  )}
              <IconButton onClick={() => openSuspendDialog(row.original)} title='Tạm nghỉ' color='warning'>
                    <i className='ri-pause-circle-line' />
                  </IconButton>
                </>
              ) : studentPermissions.canUpdate && row.original.isSuspended ? (
              <IconButton onClick={() => handleResume(row.original)} title='Khôi phục' color='success'>
                  <i className='ri-play-circle-line' />
                </IconButton>
              ) : null}

              {studentPermissions.canDelete && (
              <IconButton onClick={() => handleDelete(row.original.id)} title='Xóa học viên' color='error'>
                  <i className='ri-delete-bin-7-line' />
                </IconButton>
              )}

              {studentPermissions.canUpdate && (
            <IconButton title='Chỉnh sửa' onClick={() => handleEdit(row.original)} color='primary'>
                  <i className='ri-edit-box-line' />
                </IconButton>
              )}
            </div>
          )
        }
      }
    ],
    [
      handleDelete,
      handleEdit,
      handleEnroll,
      handleResume,
      handleTransfer,
      openSuspendDialog,
      studentPermissions.canDelete,
      studentPermissions.canUpdate
    ]
  )

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  return (
    <>
      <Card>
        {(isAdmin || (isInstructor && assignedClasses.length > 0)) && (
          <>
            <CardHeader title='Bộ lọc' />
            <TableFilters
              onFilterChange={handleFilterChange}
              classOptions={!isAdmin ? assignedClasses : undefined}
            />
          </>
        )}
        <Divider />

        <div className='flex items-center justify-between px-5 pt-4 pb-2 gap-4 flex-wrap'>
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={(_, v) => {
              if (v) {
                setPage(0)
                setStatusFilter(v)
              }
            }}
            size='small'
            color='primary'
          >
            <ToggleButton value='all'>Tất cả</ToggleButton>
            <ToggleButton value='active'>Đang học</ToggleButton>
            <ToggleButton value='suspended'>
            Tạm nghỉ
            </ToggleButton>
          </ToggleButtonGroup>

          <div className='flex items-center gap-x-4 gap-4 flex-col max-sm:is-full sm:flex-row'>
            <DebouncedInput
              value={searchKeyword}
              onChange={value => {
                setPage(0)
                setSearchKeyword(String(value))
              }}
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
    { header: 'Số điện thoại', accessor: 'phoneNumber' },
                    {
      header: 'Giới tính',
                      accessor: 'gender',
      formatter: v => (v === true ? 'Nam' : v === false ? 'Nữ' : '')
                    },
    { header: 'Ngày sinh', accessor: 'dateOfBirth', formatter: formatVnDate },
    { header: 'Cấp đai', accessor: 'beltLevelName' as any },
                    {
      header: 'Lớp đang học',
                      accessor: r =>
                        Array.isArray(r.classes)
                          ? r.classes
                              .filter((c: any) => !c.status || c.status === 'Active')
                              .map((c: any) => c.className)
                              .join(', ')
                          : ''
                    },
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

            {isAdmin && studentPermissions.canCreate && (
              <Button variant='outlined' onClick={() => setImportOpen(true)} className='max-sm:is-full'>
            Import học viên
              </Button>
            )}

            {studentPermissions.canCreate && (isAdmin || (isInstructor && assignedClasses.length > 0)) && (
              <Button variant='contained' onClick={() => setAddStudentOpen(true)} className='max-sm:is-full'>
            Thêm học viên
              </Button>
            )}
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
              {table.getRowModel().rows.length === 0 ? (
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
                    onClick={() => handleView(row.original)}
                    style={{
                      cursor: 'pointer',
                      ...(row.original.isSuspended ? { opacity: 0.75, background: 'rgba(255,152,0,0.04)' } : {})
                    }}
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
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          className='border-bs'
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={e => {
            setRowsPerPage(Number(e.target.value))
            setPage(0)
          }}
        />
      </Card>

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
          Huỷ
          </Button>
          <Button variant='contained' color='warning' onClick={handleSuspendConfirm} disabled={suspendLoading}>
            {suspendLoading ? 'Đang xử lý...' : 'Xác nhận tạm nghỉ'}
          </Button>
        </DialogActions>
      </Dialog>

      {studentPermissions.canCreate && (isAdmin || isInstructor) && (
        <AddStudentDrawer
          open={addStudentOpen}
          handleClose={() => setAddStudentOpen(false)}
          setData={setData}
          classOptions={assignedClasses}
          onStudentCreated={reloadData}
        />
      )}

      {studentPermissions.canUpdate && (
        <EditStudentDrawer
          open={editStudentOpen}
          onClose={() => {
            setEditStudentOpen(false)
            setSelectedStudent(null)
          }}
          student={selectedStudent}
          onSaved={handleStudentUpdated}
        />
      )}

      <ViewStudentDrawer
        open={viewStudentOpen}
        onClose={() => {
          setViewStudentOpen(false)
          setSelectedStudent(null)
        }}
        student={selectedStudent}
        onEdit={
          studentPermissions.canUpdate
            ? student => {
                setViewStudentOpen(false)
                handleEdit(student)
              }
            : undefined
        }
        onSuspend={studentPermissions.canUpdate ? openSuspendDialog : undefined}
        onResume={studentPermissions.canUpdate ? handleResume : undefined}
        onTransferred={handleEnrolled}
      />

      {studentPermissions.canUpdate && (
        <EnrollStudentDrawer
          open={enrollStudentOpen}
          onClose={() => {
            setEnrollStudentOpen(false)
            setSelectedStudent(null)
          }}
          student={selectedStudent}
          classOptions={assignedClasses}
          onEnrolled={handleEnrolled}
        />
      )}

      {studentPermissions.canUpdate && (
        <TransferStudentDialog
          open={transferStudentOpen}
          onClose={() => {
            setTransferStudentOpen(false)
            setSelectedStudent(null)
          }}
          student={selectedStudent}
          onTransferred={handleEnrolled}
        />
      )}

      <ImportStudentsDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={reloadData} classOptions={assignedClasses} />
    </>
  )
}

export default StudentListTable
