'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback } from 'react'

// Next Imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
import Box from '@mui/material/Box'
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

import { logger } from '@/utils/logger'

import { fuzzyFilter } from '@/utils/tableHelpers'
import { exportToExcel, formatBool } from '@/utils/exportToExcel'

// Type Imports
import type { ClassType } from '@/types/apps/classTypes'

// Component Imports
import TableFilters from './TableFilters'
import AddClassDrawer from './AddClassDrawer'
import EditClassDrawer from './EditClassDrawer'
import ClassPermissionDialog from './ClassPermissionDialog'
import AddClassScheduleDrawer from './AddClassScheduleDrawer'
import ClassScheduleView from './ClassScheduleView'
import AddStudentsToClassDrawer from './AddStudentsToClassDrawer'

// Service Imports
import classService from '@/services/classService'
import userService from '@/services/userService'
import type { GetClassesParams } from '@/services/classService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'

// Role utils
import { hasAdminRole, isInstructorUser } from '@/utils/roleUtils'
import { hasPermission } from '@/utils/permissionUtils'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

type ClassTypeWithAction = ClassType & {
  action?: string
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
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

// Column Definitions
const columnHelper = createColumnHelper<ClassTypeWithAction>()

const ClassListTable = ({ tableData }: { tableData?: ClassType[] }) => {
  const router = useRouter()
  // States
  const [addClassOpen, setAddClassOpen] = useState(false)
  const [editClassOpen, setEditClassOpen] = useState(false)
  const [addScheduleOpen, setAddScheduleOpen] = useState(false)
  const [viewScheduleOpen, setViewScheduleOpen] = useState(false)
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false)
  const [addStudentsOpen, setAddStudentsOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<ClassType[]>([])
  const [filteredData, setFilteredData] = useState<ClassType[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterParams, setFilterParams] = useState<GetClassesParams>({})
  const [users, setUsers] = useState<any[]>([])

  // Notification Hook
  const { showNotification } = useNotification()

  // Auth & role detection
  const { auth } = useAuth()
  const isAdmin = useMemo(() => hasPermission(auth?.permissions, 'Class.ManageAll') || hasAdminRole(auth?.roles), [auth])
  const isInstructor = useMemo(() => isInstructorUser(auth?.roles), [auth])
  const userId = auth?.user?.id

  // Handle filter change from TableFilters
  const handleFilterChange = useCallback((params: GetClassesParams) => {
    setFilterParams(params)
  }, [])

  // Load classes – re-runs whenever filterParams or auth/role changes
  useEffect(() => {
    // If caller provided server-side data, skip client-side fetch
    if (tableData && tableData.length > 0) {
      setData(tableData)
      setFilteredData(tableData)

return
    }

    let cancelled = false

    const loadClasses = async () => {
      try {
        setLoading(true)

        const response = await classService.getClasses(filterParams)

        if (!cancelled) {
          setData(response.data || [])
          setFilteredData(response.data || [])
        }
      } catch (err) {
        logger.error('ClassListTable', 'Error loading classes', err)

        if (!cancelled) {
          setData([])
          setFilteredData([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadClasses()

    return () => {
      cancelled = true
    }
  }, [filterParams, isInstructor, tableData, userId])

  // Update filteredData when data changes
  useEffect(() => {
    setFilteredData(data)
  }, [data])

  // Load users for display (coaches/instructors) – only once
  useEffect(() => {
    if (!isAdmin) return

    let cancelled = false

    const loadUsers = async () => {
      try {
        const response = await userService.getUsers({})

        if (!cancelled && response.success && response.data) {
          setUsers(response.data)
        }
      } catch (error) {
        logger.error('ClassListTable', 'Error loading users', error)
      }
    }

    loadUsers()

    return () => {
      cancelled = true
    }
  }, [isAdmin])

  // Hooks
  const columns = useMemo<ColumnDef<ClassTypeWithAction, any>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler()
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            {...{
              checked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              indeterminate: row.getIsSomeSelected(),
              onChange: row.getToggleSelectedHandler()
            }}
          />
        )
      },
      columnHelper.accessor('name', {
        header: 'Tên',
        cell: ({ row }) => {
          const isInactive = row.original.isActive === false


return (
            <div className='flex items-center gap-2'>
              <div className='flex flex-col'>
                <Box className='flex items-center gap-1'>
                  <Typography
                    className='font-medium'
                    color={isInactive ? 'text.disabled' : 'text.primary'}
                    sx={{ textDecoration: isInactive ? 'line-through' : 'none' }}
                  >
                    {row.original.name}
                  </Typography>
                  {isInactive && (
                    <Chip
                      label='Đã xóa'
                      size='small'
                      color='error'
                      variant='tonal'
                      sx={{ height: 18, fontSize: '0.65rem' }}
                    />
                  )}
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  {row.original.description}
                </Typography>
              </div>
            </div>
          )
        }
      }),
      columnHelper.accessor('code', {
        header: 'Mã',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.code}
          </Typography>
        )
      }),
      columnHelper.accessor('coachIds', {
        header: 'Huấn luyện viên & Trợ giảng',
        cell: ({ row }) => {
          const coaches = row.original.coaches ?? []
          const assistants = row.original.assistants ?? []

          // Fallback: if backend chưa trả coaches (cũ), dùng coachIds + lookup users
          const fallbackCoaches =
            coaches.length === 0
              ? (row.original.coachIds ?? []).map(id => {
                  const u = users.find(x => x.id === id)


return { userId: id, fullName: u?.fullName || id, isLeadInstructor: false }
                })
              : coaches

          if (fallbackCoaches.length === 0 && assistants.length === 0) {
            return <Typography variant='body2'>-</Typography>
          }

          return (
            <Box className='flex flex-col gap-1'>
              {fallbackCoaches.length > 0 && (
                <Box className='flex flex-wrap items-center gap-1'>
                  <Typography variant='caption' color='text.secondary' className='min-w-[36px]'>
                    HLV:
                  </Typography>
                  {fallbackCoaches.map((coach, index) => (
                    <Chip
                      key={`coach-${coach.userId}-${index}`}
                      label={coach.isLeadInstructor ? `${coach.fullName} (Chính)` : coach.fullName}
                      size='small'
                      color={coach.isLeadInstructor ? 'primary' : 'default'}
                      variant='tonal'
                      className='text-xs'
                    />
                  ))}
                </Box>
              )}
              {assistants.length > 0 && (
                <Box className='flex flex-wrap items-center gap-1'>
                  <Typography variant='caption' color='text.secondary' className='min-w-[36px]'>
                    TG:
                  </Typography>
                  {assistants.map((assistant, index) => (
                    <Chip
                      key={`assistant-${assistant.userId}-${index}`}
                      label={assistant.fullName}
                      size='small'
                      color='info'
                      variant='tonal'
                      className='text-xs'
                    />
                  ))}
                </Box>
              )}
            </Box>
          )
        }
      }),
      columnHelper.accessor('branchName', {
        header: 'Chi nhánh',
        cell: ({ row }) => {
          const branch = row.original.branch
          const branchName = row.original.branchName || branch?.name || '-'
          const mapUrl = branch?.googleMapsEmbedUrl

          return (
            <Box className='flex flex-col gap-1'>
              <Box className='flex items-center gap-1'>
                <Typography color='text.primary'>{branchName}</Typography>
                {mapUrl && (
                  <IconButton
                    component='a'
                    href={mapUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    size='small'
                    title='Mở bản đồ'
                  >
                    <i className='ri-map-pin-line text-base' />
                  </IconButton>
                )}
              </Box>
              {branch?.address && (
                <Typography variant='caption' color='text.secondary'>
                  {branch.address}
                </Typography>
              )}
            </Box>
          )
        }
      }),
      columnHelper.accessor('currentStudents', {
        header: 'Học viên',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.currentStudents || 0}</Typography>
      }),
      columnHelper.accessor('action', {
        header: 'Thao tác',
        cell: ({ row }) => {
          // Explicitly check isActive === false (not undefined/null = active)
          const isInactive = row.original.isActive === false

          const handleRestore = async () => {
            try {
              setLoading(true)
              const response = await classService.restoreClass(row.original.id)

              if (response.success && response.data) {
                // Cập nhật lại class trong state với dữ liệu đã khôi phục
                setData(prevData => prevData.map(clazz => (clazz.id === row.original.id ? response.data! : clazz)))
                showNotification('Khôi phục lớp học thành công!', 'success')
              } else {
                showNotification(response.message || 'Không thể khôi phục lớp học.', 'error')
              }
            } catch (error) {
              logger.error('ClassListTable', 'Error restoring class', error)
              showNotification('Đã có lỗi khi khôi phục lớp học.', 'error')
            } finally {
              setLoading(false)
            }
          }

          const handleDelete = async () => {
            try {
              setLoading(true)
              const response = await classService.deleteClass(row.original.id)

              if (response.success) {
                // Cập nhật isActive = false trong state thay vì xóa khỏi danh sách
                // (để người dùng có thể thấy và khôi phục)
                setData(prevData =>
                  prevData.map(clazz => (clazz.id === row.original.id ? { ...clazz, isActive: false } : clazz))
                )
                showNotification('Xóa lớp học thành công! Học viên thuộc lớp đã bị tạm nghỉ.', 'success')
              } else {
                showNotification(response.message || 'Không thể xóa lớp học.', 'error')
              }
            } catch (error) {
              logger.error('ClassListTable', 'Error deleting class', error)
              showNotification('Đã có lỗi khi xóa lớp học.', 'error')
            } finally {
              setLoading(false)
            }
          }

          return (
            <div className='flex items-center' onClick={event => event.stopPropagation()}>
              {/* Các thao tác chỉ hiện khi lớp đang hoạt động */}
              {!isInactive &&
                isAdmin &&(
                  <>
                    <IconButton
                      onClick={() => {
                        setSelectedClass(row.original)
                        setAddStudentsOpen(true)
                      }}
                      title='Thêm học viên'
                      color='success'
                    >
                      <i className='ri-user-add-line' />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setSelectedClass(row.original)
                        setAddScheduleOpen(true)
                      }}
                      title='Thêm lịch học'
                      color='info'
                    >
                      <i className='ri-calendar-line' />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setSelectedClass(row.original)
                        setViewScheduleOpen(true)
                      }}
                      title='Xem lịch học'
                      color='primary'
                    >
                      <i className='ri-calendar-check-line' />
                    </IconButton>
                  </>
                )}

              {isAdmin &&
                (isInactive ? (
                  <IconButton onClick={handleRestore} title='Khôi phục lớp học' color='success'>
                    <i className='ri-restart-line' style={{ color: '#2e7d32' }} />
                  </IconButton>
                ) : (
                  <IconButton onClick={handleDelete} title='Xóa lớp học' color='error'>
                    <i className='ri-delete-bin-7-line' />
                  </IconButton>
                ))}

              {/* Row click handles "view" */}

              {isAdmin && !isInactive && (
                <IconButton
                  onClick={() => {
                    setSelectedClass(row.original)
                    setPermissionDialogOpen(true)
                  }}
                  title='Phân quyền'
                >
                  <i className='ri-shield-keyhole-line text-warning' />
                </IconButton>
              )}

              {isAdmin && !isInactive && (
                <IconButton
                  onClick={() => {
                    setSelectedClass(row.original)
                    setEditClassOpen(true)
                  }}
                  title='Chỉnh sửa'
                >
                  <i className='ri-edit-box-line text-textSecondary' />
                </IconButton>
              )}
            </div>
          )
        },
        enableSorting: false
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, showNotification, users, isAdmin]
  )

  const table = useReactTable({
    data: filteredData as ClassType[],
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
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
        {/* Bộ lọc nâng cao chỉ hiển thị cho admin */}
        {isAdmin && (
          <>
            <CardHeader title='Bộ lọc' />
            <TableFilters onFilterChange={handleFilterChange} />
          </>
        )}
        <Divider />
        <div className='flex justify-between p-5 gap-4 flex-col items-start sm:flex-row sm:items-center'>
          <Button
            color='success'
            variant='outlined'
            startIcon={<i className='ri-file-excel-2-line text-xl' />}
            className='max-sm:is-full'
            disabled={data.length === 0}
            onClick={() => {
              exportToExcel({
                filename: 'danh-sach-lop-hoc',
                rows: data,
                columns: [
                  { header: 'Mã lớp', accessor: 'code' as any },
                  { header: 'Tên lớp', accessor: 'name' as any },
                  { header: 'Mô tả', accessor: 'description' as any },
                  {
                    header: 'HLV chính',
                    accessor: 'branchName' as any
                  },
                  {
                    header: 'HLV chính',
                    accessor: r =>
                      Array.isArray((r as any).coaches)
                        ? (r as any).coaches.find((c: any) => c.isLeadInstructor)?.fullName ||
                          (r as any).coaches[0]?.fullName ||
                          ''
                        : ''
                  },
                  {
                    header: 'HLV phụ',
                    accessor: r =>
                      Array.isArray((r as any).coaches)
                        ? (r as any).coaches.filter((c: any) => !c.isLeadInstructor).map((c: any) => c.fullName).join(', ')
                        : ''
                  },
                  {
                    header: 'Trợ giảng',
                    accessor: r =>
                      Array.isArray((r as any).assistants)
                        ? (r as any).assistants.map((a: any) => a.fullName).join(', ')
                        : ''
                  },
                  { header: 'Hoạt động', accessor: 'isActive' as any, formatter: v => formatBool(v, 'Có', 'Không') }
                ]
              })
            }}
          >
            Xuất Excel
          </Button>
          <div className='flex items-center gap-x-4 gap-4 flex-col max-sm:is-full sm:flex-row'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Tìm kiếm...'
              className='max-sm:is-full'
            />
            {isAdmin && (
              <Button variant='contained' onClick={() => setAddClassOpen(!addClassOpen)} className='max-sm:is-full'>
                Thêm lớp học
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
                        <>
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
                        </>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {loading ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center py-8'>
                    <Typography color='text.secondary'>Đang tải dữ liệu...</Typography>
                  </td>
                </tr>
              </tbody>
            ) : table.getFilteredRowModel().rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center py-8'>
                    <Typography color='text.secondary'>Không có dữ liệu</Typography>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table
                  .getRowModel()
                  .rows.map(row => {
                    const isInactive = row.original.isActive === false


return (
                      <tr
                        key={row.id}
                        className={classnames({ selected: row.getIsSelected() })}
                        onClick={() => router.push(`/apps/class/view/${row.original.id}`)}
                        style={{
                          cursor: 'pointer',
                          ...(isInactive ? { opacity: 0.6, backgroundColor: 'rgba(0,0,0,0.02)' } : {})
                        }}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    )
                  })}
              </tbody>
            )}
          </table>
        </div>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          className='border-bs'
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => {
            table.setPageIndex(page)
          }}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />
      </Card>
      {isAdmin && (
        <AddClassDrawer
          open={addClassOpen}
          handleClose={() => setAddClassOpen(!addClassOpen)}
          classData={data}
          setData={setData}
        />
      )}
      {selectedClass && (
        <>
          <EditClassDrawer
            open={editClassOpen}
            handleClose={() => {
              setEditClassOpen(false)
              setSelectedClass(null)
            }}
            classData={selectedClass}
            onClassUpdated={updatedClass => {
              setData(prevData => prevData.map(c => (c.id === updatedClass.id ? updatedClass : c)))
              setFilteredData(prevData => prevData.map(c => (c.id === updatedClass.id ? updatedClass : c)))
            }}
          />
          <AddClassScheduleDrawer
            open={addScheduleOpen}
            handleClose={() => {
              setAddScheduleOpen(false)
              setSelectedClass(null)
            }}
            classData={selectedClass}
            onScheduleAdded={() => {
              console.log('Schedule added for class:', selectedClass.name)
            }}
          />
          {viewScheduleOpen && (
            <ClassScheduleView
              classData={selectedClass}
              onClose={() => {
                setViewScheduleOpen(false)
                setSelectedClass(null)
              }}
            />
          )}
          <AddStudentsToClassDrawer
            open={addStudentsOpen}
            onClose={() => {
              setAddStudentsOpen(false)
              setSelectedClass(null)
            }}
            classData={selectedClass}
            onStudentsAdded={() => {
              // Re-fetch with current filter
              setFilterParams(prev => ({ ...prev }))
            }}
          />
          <ClassPermissionDialog
            open={permissionDialogOpen}
            onClose={() => {
              setPermissionDialogOpen(false)
              setSelectedClass(null)
            }}
            classData={selectedClass}
          />
        </>
      )}
    </>
  )
}

export default ClassListTable
