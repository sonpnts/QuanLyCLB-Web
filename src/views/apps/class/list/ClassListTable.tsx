'use client'

// React Imports
import { logger } from '@/utils/logger'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'

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

import { fuzzyFilter } from '@/utils/tableHelpers'

// Type Imports
import type { ClassType } from '@/types/apps/classTypes'

// Component Imports
import TableFilters from './TableFilters'
import AddClassDrawer from './AddClassDrawer'
import EditClassDrawer from './EditClassDrawer'
import AddClassScheduleDrawer from './AddClassScheduleDrawer'
import ClassScheduleView from './ClassScheduleView'
import AddStudentsToClassDrawer from './AddStudentsToClassDrawer'
import OptionMenu from '@core/components/option-menu'

// Util Imports

// Service Imports
import classService from '@/services/classService'
import userService from '@/services/userService'
import type { GetClassesParams } from '@/services/classService'

// Context Imports
import { useNotification } from '@/contexts/notificationContext'

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
  const [editClassOpen, setEditClassOpen] = useState(false)
  const [addScheduleOpen, setAddScheduleOpen] = useState(false)
  const [viewScheduleOpen, setViewScheduleOpen] = useState(false)
  const [addStudentsOpen, setAddStudentsOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState<ClassType[]>(tableData || [])
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [, setLoading] = useState(false)
  const [filterParams, setFilterParams] = useState<GetClassesParams>({})
  const [users, setUsers] = useState<any[]>([])

  // Notification Hook
  const { showNotification } = useNotification()

  // Refs Ä‘á»ƒ trÃ¡nh duplicate calls
  const showNotificationRef = useRef(showNotification)
  showNotificationRef.current = showNotification
  const dataLoadedRef = useRef(false)
  const currentFilterRef = useRef<string>('')
  const usersLoadedRef = useRef(false)

  // Handle filter change from TableFilters
  const handleFilterChange = useCallback((params: GetClassesParams) => {
    setFilterParams(params)
  }, [])

  // Load classes when filter params change
  useEffect(() => {
    const filterKey = JSON.stringify(filterParams)

    // TrÃ¡nh load láº¡i náº¿u filter khÃ´ng Ä‘á»•i
    if (dataLoadedRef.current && currentFilterRef.current === filterKey) {
      return
    }

    const loadClasses = async () => {
      // Only load if tableData is not provided or empty
      if (tableData && tableData.length > 0) {
        return
      }

      try {
        setLoading(true)
        currentFilterRef.current = filterKey
        dataLoadedRef.current = true

        const response = await classService.getClasses(filterParams)

        setData(response.data || [])
        setFilteredData(response.data || [])
      } catch {
        setData([])
        setFilteredData([])
      } finally {
        setLoading(false)
      }
    }

    loadClasses()
  }, [filterParams, tableData])

  // Update filteredData when data changes
  useEffect(() => {
    setFilteredData(data)
  }, [data])

  // Load users for display (coaches/instructors) - chá»‰ load 1 láº§n
  useEffect(() => {
    if (usersLoadedRef.current) return

    const loadUsers = async () => {
      try {
        usersLoadedRef.current = true
        const response = await userService.getUsers({})

        if (response.success && response.data) {
          setUsers(response.data)
        }
      } catch (error) {
        logger.error('ClassListTable', 'Error loading users', error)
        usersLoadedRef.current = false
      }
    }

    loadUsers()
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
        header: 'TÃªn',
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
        header: 'MÃ£',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.code}
          </Typography>
        )
      }),
      columnHelper.accessor('coachIds', {
        header: 'Huáº¥n luyá»‡n viÃªn & Trá»£ giáº£ng',
        cell: ({ row }) => {
          const coachIds = row.original.coachIds || []

          if (coachIds.length === 0) {
            return <Typography variant='body2'>-</Typography>
          }

          return (
            <Box className='flex flex-wrap gap-1'>
              {coachIds.map((coachId: string, index: number) => {
                const user = users.find(u => u.id === coachId)
                const displayName = user ? user.fullName : coachId

                return (
                  <Chip
                    key={`${coachId}-${index}`}
                    label={displayName}
                    size='small'
                    color='primary'
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
        header: 'Sá»‰ sá»‘',
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
        header: 'Thao tÃ¡c',
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
                showNotification('KhÃ´i phá»¥c lá»›p há»c thÃ nh cÃ´ng!', 'success')
              } else {
                showNotification(response.message || 'KhÃ´ng thá»ƒ khÃ´i phá»¥c lá»›p há»c.', 'error')
              }
            } catch (error) {
              logger.error('ClassListTable', 'Error restoring class', error)
              showNotification('ÄÃ£ cÃ³ lá»—i khi khÃ´i phá»¥c lá»›p há»c.', 'error')
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
                showNotification('XÃ³a lá»›p há»c thÃ nh cÃ´ng!', 'success')
              } else {
                showNotification(response.message || 'KhÃ´ng thá»ƒ xÃ³a lá»›p há»c.', 'error')
              }
            } catch (error) {
              logger.error('ClassListTable', 'Error deleting class', error)
              showNotification('ÄÃ£ cÃ³ lá»—i khi xÃ³a lá»›p há»c.', 'error')
            } finally {
              setLoading(false)
            }
          }

          return (
            <div className='flex items-center'>
              <IconButton
                onClick={() => {
                  setSelectedClass(row.original)
                  setAddStudentsOpen(true)
                }}
                title='ThÃªm há»c viÃªn'
                color='success'
              >
                <i className='ri-user-add-line' />
              </IconButton>
              <IconButton
                onClick={() => {
                  setSelectedClass(row.original)
                  setAddScheduleOpen(true)
                }}
                title='ThÃªm lá»‹ch há»c'
                color='info'
              >
                <i className='ri-calendar-line' />
              </IconButton>
              <IconButton
                onClick={() => {
                  setSelectedClass(row.original)
                  setViewScheduleOpen(true)
                }}
                title='Xem lá»‹ch há»c'
                color='primary'
              >
                <i className='ri-calendar-check-line' />
              </IconButton>
              {isInactive ? (
                <IconButton onClick={handleRestore} title='KhÃ´i phá»¥c lá»›p há»c' color='success'>
                  <i className='ri-restart-line' style={{ color: '#2e7d32' }} />
                </IconButton>
              ) : (
                <IconButton onClick={handleDelete} title='XÃ³a lá»›p há»c' color='error'>
                  <i className='ri-delete-bin-7-line' />
                </IconButton>
              )}
              <IconButton>
                <Link href={`/apps/class/view/${row.original.id}`} className='flex' title='Xem chi tiáº¿t'>
                  <i className='ri-eye-line text-textSecondary' />
                </Link>
              </IconButton>
              <OptionMenu
                iconButtonProps={{ size: 'medium' }}
                iconClassName='text-textSecondary'
                options={[
                  {
                    text: 'Chá»‰nh sá»­a',
                    icon: 'ri-edit-box-line',
                    menuItemProps: {
                      className: 'flex items-center gap-2 text-textSecondary',
                      onClick: () => {
                        setSelectedClass(row.original)
                        setEditClassOpen(true)
                      }
                    }
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
    [data, filteredData, showNotification, setData, setLoading, users]
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
        <CardHeader title='Bá»™ lá»c' />
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
          <AddStudentsToClassDrawer
            open={addStudentsOpen}
            onClose={() => {
              setAddStudentsOpen(false)
              setSelectedClass(null)
            }}
            classData={selectedClass}
            onStudentsAdded={() => {
              // Refresh data
              dataLoadedRef.current = false
              currentFilterRef.current = ''
              setFilterParams(prev => ({ ...prev }))
            }}
          />
        </>
      )}
    </>
  )
}

export default ClassListTable
