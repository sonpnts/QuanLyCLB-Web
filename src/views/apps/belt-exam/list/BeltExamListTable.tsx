'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'

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

import { useNotification } from '@/contexts/notificationContext'
import beltExamService from '@/services/beltExamService'
import type { ExamSessionType } from '@/types/apps/beltExamTypes'
import { examSessionStatusColors, examSessionStatusLabels } from '@/types/apps/beltExamTypes'
import { fuzzyFilter } from '@/utils/tableHelpers'
import tableStyles from '@core/styles/table.module.css'

import AddExamSessionDrawer from './AddExamSessionDrawer'
import EditExamSessionDrawer from './EditExamSessionDrawer'
import { formatDateTimeVN, formatDateVN } from '@/utils/dateTime'

const columnHelper = createColumnHelper<ExamSessionType>()

const parseDateTime = (value?: string | null) => {
  if (!value) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)

    return new Date(year, month - 1, day, 0, 0, 0)
  }

  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}


const sortSessions = (sessions: ExamSessionType[]) =>
  [...sessions].sort((left, right) => {
    const leftTime = parseDateTime(left.examDate)?.getTime() ?? 0
    const rightTime = parseDateTime(right.examDate)?.getTime() ?? 0

    return rightTime - leftTime
  })

const BeltExamListTable = () => {
  const router = useRouter()
  const { showNotification } = useNotification()
  const [addExamOpen, setAddExamOpen] = useState(false)
  const [editExamOpen, setEditExamOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<ExamSessionType | null>(null)
  const [data, setData] = useState<ExamSessionType[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedExam, setSelectedExam] = useState<ExamSessionType | null>(null)
  const [openDialogOpen, setOpenDialogOpen] = useState(false)

  const dataLoadedRef = useRef(false)

  useEffect(() => {
    if (dataLoadedRef.current) return

    const loadExams = async () => {
      try {
        dataLoadedRef.current = true
        setLoading(true)
        const response = await beltExamService.getExamSessions()

        setData(sortSessions(response.data || []))
      } catch {
        setData([])
      } finally {
        setLoading(false)
      }
    }

    loadExams()
  }, [])

  const handleOpenSession = async () => {
    if (!selectedExam) return

    try {
      setLoading(true)
      const response = await beltExamService.openSession(selectedExam.id)

      if (!response.success) {
        showNotification(response.message || 'Không thể mở đăng ký.', 'error')

        return
      }

      setData(prev =>
        sortSessions(prev.map(session => (session.id === selectedExam.id ? { ...session, status: 'Open' } : session)))
      )
      showNotification('Đã mở kỳ thi cho HLV đăng ký.', 'success')
      setOpenDialogOpen(false)
      setSelectedExam(null)
    } finally {
      setLoading(false)
    }
  }

  const openEditDrawer = (exam: ExamSessionType) => {
    setEditingExam(exam)
    setEditExamOpen(true)
  }

  const columns = useMemo<ColumnDef<ExamSessionType, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'Tên kỳ thi',
        cell: ({ row }) => (
          <Box>
            <Typography className='font-medium' color='text.primary'>
              {row.original.name}
            </Typography>
            {row.original.description && (
              <Typography variant='caption' color='text.secondary'>
                {row.original.description}
              </Typography>
            )}
          </Box>
        )
      }),
      columnHelper.accessor('examDate', {
        header: 'Ngày thi',
        cell: ({ row }) => <Typography>{formatDateVN(row.original.examDate)}</Typography>
      }),
      columnHelper.accessor('registrationDeadline', {
        header: 'Hạn đăng ký',
        cell: ({ row }) => <Typography>{formatDateTimeVN(row.original.registrationDeadline)}</Typography>
      }),
      columnHelper.accessor('location', {
        header: 'Địa điểm',
        cell: ({ row }) => <Typography>{row.original.location || '—'}</Typography>
      }),
      columnHelper.accessor('totalRegistrations', {
        header: 'Tổng đăng ký',
        cell: ({ row }) => <Typography>{row.original.totalRegistrations || 0}</Typography>
      }),
      columnHelper.accessor('paidRegistrations', {
        header: 'Đã đóng phí',
        cell: ({ row }) => <Typography>{row.original.paidRegistrations || 0}</Typography>
      }),
      columnHelper.accessor('unpaidRegistrations', {
        header: 'Chưa đóng phí',
        cell: ({ row }) => <Typography>{row.original.unpaidRegistrations || 0}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        cell: ({ row }) => (
          <Chip
            label={examSessionStatusLabels[row.original.status] ?? row.original.status}
            size='small'
            color={examSessionStatusColors[row.original.status] ?? 'default'}
            variant='tonal'
          />
        )
      }),
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => {
          const exam = row.original

          return (
            <Box className='flex items-center gap-1' onClick={event => event.stopPropagation()}>
              {exam.status !== 'Locked' && (
                <IconButton color='primary' title='Chỉnh sửa' onClick={() => openEditDrawer(exam)}>
                  <i className='ri-pencil-line' />
                </IconButton>
              )}
              {exam.status === 'Draft' && (
                <IconButton
                  color='success'
                  title='Mở cho HLV đăng ký'
                  onClick={() => {
                    setSelectedExam(exam)
                    setOpenDialogOpen(true)
                  }}
                >
                  <i className='ri-door-open-line' />
                </IconButton>
              )}
              <IconButton
                component={Link}
                href={`/apps/belt-exam/${exam.id}/admin`}
                title='Quản lý danh sách'
                color='secondary'
              >
                <i className='ri-file-list-3-line' />
              </IconButton>
            </Box>
          )
        }
      }
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    initialState: { pagination: { pageSize: 10 } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Quản lý kỳ thi cấp đai'
          subheader='Luồng mới: tạo kỳ thi, mở cho HLV đăng ký, sau đó chốt danh sách.'
          action={
            <Button variant='contained' onClick={() => setAddExamOpen(true)}>
              Tạo kỳ thi mới
            </Button>
          }
        />
        <Divider />
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
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/apps/belt-exam/${row.original.id}/admin`)}
                    style={{ cursor: 'pointer' }}
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

      <Dialog open={openDialogOpen} onClose={() => setOpenDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Mở cho HLV đăng ký</DialogTitle>
        <DialogContent>
          <Typography>
            Kỳ thi <strong>{selectedExam?.name}</strong> sẽ chuyển sang trạng thái mở đăng ký.
          </Typography>
          {/*<Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>*/}
          {/*  Hạn đăng ký sẽ dùng đúng giá trị đã nhập khi tạo hoặc chỉnh sửa kỳ thi, không cần nhập lại ở bước này.*/}
          {/*</Typography>*/}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenDialogOpen(false)
              setSelectedExam(null)
            }}
          >
            Hủy
          </Button>
          <Button variant='contained' color='success' onClick={handleOpenSession} disabled={loading}>
            Mở đăng ký
          </Button>
        </DialogActions>
      </Dialog>

      <AddExamSessionDrawer
        open={addExamOpen}
        handleClose={() => setAddExamOpen(false)}
        setData={value => setData(current => sortSessions(typeof value === 'function' ? value(current) : value))}
      />
      <EditExamSessionDrawer
        open={editExamOpen}
        session={editingExam}
        onClose={() => {
          setEditExamOpen(false)
          setEditingExam(null)
        }}
        setData={value => setData(current => sortSessions(typeof value === 'function' ? value(current) : value))}
      />
    </>
  )
}

export default BeltExamListTable
