'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback } from 'react'

// Next Imports
import Link from 'next/link'

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
import { rankItem } from '@tanstack/match-sorter-utils'
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
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Type Imports
import type { ClassType } from '@/types/apps/classTypes'

// Component Imports
import TableFilters from './TableFilters'
import AddClassDrawer from './AddClassDrawer'
import AddClassScheduleDrawer from './AddClassScheduleDrawer'
import ClassScheduleView from './ClassScheduleView'
import OptionMenu from '@core/components/option-menu'

// Util Imports

// Service Imports
import classService from '@/services/classService'
import instructorService from '@/services/instructorService'
import type { GetClassesParams } from '@/services/classService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

type ClassTypeWithAction = ClassType & {
  action?: string
}

// Styled Components

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
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
  // States
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
  // States
  const [addClassOpen, setAddClassOpen] = useState(false)
  const [addScheduleOpen, setAddScheduleOpen] = useState(false)
  const [viewScheduleOpen, setViewScheduleOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<ClassType[]>(tableData || [])
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [, setLoading] = useState(false)
  const [filterParams, setFilterParams] = useState<GetClassesParams>({})
  const [instructors, setInstructors] = useState<any[]>([])

  // Notification Hook
  const { showNotification } = useNotification()

  // Handle filter change from TableFilters
  const handleFilterChange = useCallback((params: GetClassesParams) => {
    setFilterParams(params)
  }, [])

  // Load classes when filter params change
  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoading(true)
        const response = await classService.getClasses(filterParams)

        if (response.success && response.data) {
          setData(response.data)
          setFilteredData(response.data)
        } else {
          console.error('Failed to load classes:', response.message)
          showNotification(response.message || 'Không thể tải danh sách lớp học.', 'error')
        }
      } catch (error) {
        console.error('Error loading classes:', error)
        showNotification('Đã có lỗi khi tải lớp học.', 'error')
      } finally {
        setLoading(false)
      }
    }

    // Only load if tableData is not provided or empty
    if (!tableData || tableData.length === 0) {
      loadClasses()
    }
  }, [filterParams, tableData, showNotification])

  // Update filteredData when data changes
  useEffect(() => {
    setFilteredData(data)
  }, [data])

  // Load instructors for display
  useEffect(() => {
    const loadInstructors = async () => {
      try {
        const response = await instructorService.getInstructors({})

        if (response.success && response.data) {
          setInstructors(response.data)
        }
      } catch (error) {
        console.error('Error loading instructors:', error)
      }
    }

    loadInstructors()
  }, [])

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
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {/*<CustomAvatar skin='light' size={34}>*/}
            {/*  {getInitials(row.original.name)}*/}
            {/*</CustomAvatar>*/}
            <div className='flex flex-col'>
              <Typography className='font-medium' color='text.primary'>
                {row.original.name}
              </Typography>
              <Typography variant='body2'>{row.original.description}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('code', {
        header: 'Mã',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.code}
          </Typography>
        )
      }),
      columnHelper.accessor('startDate', {
        header: 'Ngày bắt đầu',
        cell: ({ row }) => <Typography>{new Date(row.original.startDate).toLocaleDateString('vi-VN')}</Typography>
      }),
      columnHelper.accessor('endDate', {
        header: 'Ngày kết thúc',
        cell: ({ row }) => <Typography>{new Date(row.original.endDate).toLocaleDateString('vi-VN')}</Typography>
      }),
      columnHelper.accessor('coachIds', {
        header: 'Huấn luyện viên & Trợ giảng',
        cell: ({ row }) => {
          const coachIds = row.original.coachIds || []

          if (coachIds.length === 0) {
            return <Typography variant='body2'>-</Typography>
          }

          return (
            <Box className='flex flex-wrap gap-1'>
              {coachIds.map((coachId: string, index: number) => {
                const instructor = instructors.find(inst => inst.id === coachId)
                const isLead = instructor?.isLeadCoach || false
                const displayName = instructor ? instructor.fullName : coachId

                return (
                  <Chip
                    key={`${coachId}-${index}`}
                    label={displayName}
                    size='small'
                    color={isLead ? 'primary' : 'secondary'}
                    variant='tonal'
                    className='text-xs'
                  />
                )
              })}
            </Box>
          )
        }
      }),
      columnHelper.accessor('maxStudents', {
        header: 'Sỉ số',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Typography color='text.primary'>{row.original.currentStudents || 0}</Typography>
            <Typography color='text.disabled'>/ {row.original.maxStudents}</Typography>
          </div>
        )
      }),

      // columnHelper.accessor('status', {
      //   header: 'Status',
      //   cell: ({ row }) => (
      //     <div className='flex items-center gap-3'>
      //       <Chip
      //         variant='tonal'
      //         label={row.original.status}
      //         size='small'
      //         color={classStatusObj[row.original.status]}
      //         className='capitalize'
      //       />
      //     </div>
      //   )
      // }),
      columnHelper.accessor('action', {
        header: 'Thao tác',
        cell: ({ row }) => {
          // Check if class is inactive - explicitly check for false
          // Treat undefined/null as active (default behavior)
          const isActiveValue = row.original.isActive
          const isInactive = isActiveValue === false || isActiveValue === null

          const handleRestore = async () => {
            try {
              setLoading(true)
              const response = await classService.restoreClass(row.original.id)

              if (response.success && response.data) {
                // Update the class in data state with restored class data
                const restoredClass = response.data

                setData(prevData => prevData?.map(clazz => (clazz.id === row.original.id ? restoredClass : clazz)))
                setFilteredData(prevData =>
                  prevData?.map(clazz => (clazz.id === row.original.id ? restoredClass : clazz))
                )
                showNotification('Khôi phục lớp học thành công!', 'success')
              } else {
                showNotification(response.message || 'Không thể khôi phục lớp học.', 'error')
              }
            } catch (error) {
              console.error('Error restoring class:', error)
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
                setData(prevData => prevData?.filter(clazz => clazz.id !== row.original.id))
                setFilteredData(prevData => prevData?.filter(clazz => clazz.id !== row.original.id))
                showNotification('Xóa lớp học thành công!', 'success')
              } else {
                showNotification(response.message || 'Không thể xóa lớp học.', 'error')
              }
            } catch (error) {
              console.error('Error deleting class:', error)
              showNotification('Đã có lỗi khi xóa lớp học.', 'error')
            } finally {
              setLoading(false)
            }
          }

          return (
            <div className='flex items-center'>
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
              {isInactive ? (
                <IconButton onClick={handleRestore} title='Khôi phục lớp học' color='success'>
                  <i className='ri-restart-line' style={{ color: '#2e7d32' }} />
                </IconButton>
              ) : (
                <IconButton onClick={handleDelete} title='Xóa lớp học' color='error'>
                  <i className='ri-delete-bin-7-line' />
                </IconButton>
              )}
              <IconButton>
                <Link href={`/apps/class/view/${row.original.id}`} className='flex' title='Xem chi tiết'>
                  <i className='ri-eye-line text-textSecondary' />
                </Link>
              </IconButton>
              <OptionMenu
                iconButtonProps={{ size: 'medium' }}
                iconClassName='text-textSecondary'
                options={[
                  // {
                  //   text: 'Tải xuống',
                  //   icon: 'ri-download-line',
                  //   menuItemProps: { className: 'flex items-center gap-2 text-textSecondary' }
                  // },
                  {
                    text: 'Chỉnh sửa',
                    icon: 'ri-edit-box-line',
                    menuItemProps: { className: 'flex items-center gap-2 text-textSecondary' }
                  }
                ]}
              />
            </div>
          )
        },
        enableSorting: false
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, filteredData, showNotification, setData, setLoading, instructors]
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
    enableRowSelection: true, //enable row selection for all rows
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
            Export
          </Button>
          <div className='flex items-center gap-x-4 gap-4 flex-col max-sm:is-full sm:flex-row'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search Class'
              className='max-sm:is-full'
            />
            <Button variant='contained' onClick={() => setAddClassOpen(!addClassOpen)} className='max-sm:is-full'>
              Add New Class
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
            {table.getFilteredRowModel().rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    No data available
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table
                  .getRowModel()
                  .rows.slice(0, table.getState().pagination.pageSize)
                  .map(row => {
                    return (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
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
      <AddClassDrawer
        open={addClassOpen}
        handleClose={() => setAddClassOpen(!addClassOpen)}
        classData={data}
        setData={setData}
      />
      {selectedClass && (
        <>
          <AddClassScheduleDrawer
            open={addScheduleOpen}
            handleClose={() => {
              setAddScheduleOpen(false)
              setSelectedClass(null)
            }}
            classData={selectedClass}
            onScheduleAdded={() => {
              // Refresh data if needed
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
        </>
      )}
    </>
  )
}

export default ClassListTable
