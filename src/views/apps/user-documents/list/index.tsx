'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

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
import classnames from 'classnames'

import { useNotification } from '@/contexts/notificationContext'
import userDocumentService from '@/services/userDocumentService'
import userService from '@/services/userService'
import type { UsersType } from '@/types/apps/userTypes'
import type { UserDocumentDto, UserDocumentType } from '@/types/apps/userDocumentTypes'
import {
  documentStatusColors,
  documentStatusLabels
} from '@/types/apps/userDocumentTypes'
import { fuzzyFilter } from '@/utils/tableHelpers'
import tableStyles from '@core/styles/table.module.css'

// ── Document type display ─────────────────────────────────────────────────────
// Backend dùng JsonStringEnumConverter → documentType có thể là string ("ProfilePhoto")
// hoặc number (0) tuỳ version API. Hàm resolveDocType() xử lý cả hai trường hợp.

const DOC_TYPE_ICON: Record<number, { icon: string; color: string }> = {
  0: { icon: 'ri-user-3-line', color: '#1976d2' },
  1: { icon: 'ri-award-line', color: '#7b1fa2' },
  2: { icon: 'ri-file-text-line', color: '#388e3c' },
  3: { icon: 'ri-bank-card-line', color: '#f57c00' }
}

// Map string enum name → numeric index
const DOC_TYPE_NAME_MAP: Record<string, number> = {
  ProfilePhoto: 0, profilePhoto: 0,
  BeltCertificate: 1, beltCertificate: 1,
  Certificate: 2, certificate: 2,
  BankTransferProof: 3, bankTransferProof: 3
}

/** Chuyển string/number bất kỳ → numeric index (0-3), fallback 0 */
const resolveDocTypeIndex = (type: unknown): number => {
  if (typeof type === 'number' && type >= 0 && type <= 3) return type
  if (typeof type === 'string') {
    const n = DOC_TYPE_NAME_MAP[type]
    if (n !== undefined) return n
    const parsed = parseInt(type, 10)
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 3) return parsed
  }
  return 0
}

/**
 * DocTypeChip: nhận `type` (số hoặc string enum), `label` dùng documentTypeLabel từ DTO
 * để hiển thị text chính xác mà không cần đoán tên enum.
 */
const DocTypeChip = ({ type, label }: { type: unknown; label?: string }) => {
  const idx = resolveDocTypeIndex(type)
  const meta = DOC_TYPE_ICON[idx]
  return (
    <Box className='flex items-center gap-1.5'>
      <i className={`${meta.icon} text-sm`} style={{ color: meta.color }} />
      <Typography variant='body2'>{label ?? `Loại ${idx}`}</Typography>
    </Box>
  )
}

// ── Grouped data type ─────────────────────────────────────────────────────────

type DocGroup = {
  groupKey: string
  ownerName: string
  // ownerSub: string          // "Tài khoản" | "Học viên"
  documentType: unknown     // raw value từ API (có thể string hoặc number)
  documentTypeLabel: string // label từ DTO, luôn đúng
  /** Newest doc in this group */
  latest: UserDocumentDto
  /** All older docs in this group (sorted newest → oldest, excludes latest) */
  history: UserDocumentDto[]
}

const newestFirst = (a: UserDocumentDto, b: UserDocumentDto) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

/** Nhóm danh sách flat docs thành 1 hàng / (owner × documentType) */
const groupDocs = (docs: UserDocumentDto[]): DocGroup[] => {
  const map = new Map<string, UserDocumentDto[]>()
  for (const doc of docs) {
    const ownerId = doc.userId ?? doc.studentId ?? 'unknown'
    // Dùng documentTypeLabel làm key phụ vì documentType có thể là string hoặc number
    const typeKey = doc.documentTypeLabel ?? String(doc.documentType)
    const key = `${ownerId}::${typeKey}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(doc)
  }

  const groups: DocGroup[] = []
  map.forEach(items => {
    const sorted = [...items].sort(newestFirst)
    const latest = sorted[0]
    groups.push({
      groupKey: `${latest.userId ?? latest.studentId}::${latest.documentTypeLabel ?? latest.documentType}`,
      ownerName: latest.userFullName ?? latest.studentFullName ?? '—',
      // ownerSub: latest.email,
      documentType: latest.documentType,
      documentTypeLabel: latest.documentTypeLabel ?? String(latest.documentType),
      latest,
      history: sorted.slice(1)
    })
  })

  // Sắp xếp: doc mới nhất lên đầu
  return groups.sort((a, b) => newestFirst(a.latest, b.latest))
}

// ── Filter options ────────────────────────────────────────────────────────────

const DOCUMENT_TYPES: { label: string; value: UserDocumentType }[] = [
  { label: 'Ảnh thẻ',          value: 0 },
  { label: 'Văn bằng đẳng',    value: 1 },
  { label: 'Chứng chỉ',        value: 2 },
  { label: 'Ảnh chuyển khoản', value: 3 }
]

const columnHelper = createColumnHelper<DocGroup>()

// ── Main Component ────────────────────────────────────────────────────────────

const UserDocumentListTable = () => {
  const [rawDocs, setRawDocs] = useState<UserDocumentDto[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<number | ''>('')

  // User search filter
  const [userSearchInput, setUserSearchInput] = useState('')
  const [userOptions, setUserOptions] = useState<UsersType[]>([])
  const [selectedUser, setSelectedUser] = useState<UsersType | null>(null)
  const [userSearchLoading, setUserSearchLoading] = useState(false)

  const [resubmitTarget, setResubmitTarget] = useState<UserDocumentDto | null>(null)
  const [resubmitReason, setResubmitReason] = useState('')

  const [previewDoc, setPreviewDoc] = useState<UserDocumentDto | null>(null)

  // Dialog lịch sử ảnh cũ
  const [historyGroup, setHistoryGroup] = useState<DocGroup | null>(null)

  const { showNotification } = useNotification()
  const loadedRef = useRef(false)
  const userSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced user search
  useEffect(() => {
    if (!userSearchInput.trim()) {
      setUserOptions([])
      return
    }
    if (userSearchRef.current) clearTimeout(userSearchRef.current)
    userSearchRef.current = setTimeout(async () => {
      setUserSearchLoading(true)
      const res = await userService.getUsers({ Keyword: userSearchInput, PageSize: 20 })
      if (res.success) setUserOptions(res.data ?? [])
      setUserSearchLoading(false)
    }, 350)
    return () => { if (userSearchRef.current) clearTimeout(userSearchRef.current) }
  }, [userSearchInput])

  const load = useCallback(async () => {
    setLoading(true)
    const params = {
      ...(filterType !== '' && { documentType: filterType }),
      ...(selectedUser && { userId: selectedUser.id }),
      pageSize: 500
    }
    const res = await userDocumentService.getAllDocuments(params)
    if (res.success) setRawDocs(res.data ?? [])
    setLoading(false)
  }, [filterType, selectedUser])

  useEffect(() => {
    if (loadedRef.current && filterType === '' && !selectedUser) return
    loadedRef.current = true
    load()
  }, [load])

  // Nhóm dữ liệu
  const groupedData = useMemo(() => groupDocs(rawDocs), [rawDocs])

  // ── Yêu cầu nộp lại ──────────────────────────────────────────────────────

  const handleResubmit = async () => {
    if (!resubmitTarget || !resubmitReason.trim()) {
      showNotification('Vui lòng nhập lý do yêu cầu nộp lại.', 'error')
      return
    }
    setLoading(true)
    const res = await userDocumentService.requestResubmission(resubmitTarget.id, resubmitReason)
    if (res.success) {
      // Cập nhật local state
      setRawDocs(prev =>
        prev.map(d =>
          d.id === resubmitTarget.id
            ? { ...d, status: 2, statusLabel: 'Cần nộp lại', resubmissionReason: resubmitReason }
            : d
        )
      )
      showNotification('Đã gửi yêu cầu và email thông báo đến người dùng.', 'success')
    } else {
      showNotification(res.message || 'Không thể gửi yêu cầu.', 'error')
    }
    setResubmitTarget(null)
    setResubmitReason('')
    setLoading(false)
  }

  // ── Thumbnail helper ──────────────────────────────────────────────────────

  const DocThumbnail = ({ doc, size = 64 }: { doc: UserDocumentDto; size?: number }) => {
    const isImage = doc.contentType.startsWith('image/')
    return (
      <Box
        onClick={() => setPreviewDoc(doc)}
        sx={{
          width: size, height: size, flexShrink: 0,
          borderRadius: 1, overflow: 'hidden',
          border: '1px solid', borderColor: 'divider',
          bgcolor: 'action.hover',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          '&:hover': { opacity: 0.85 }
        }}
      >
        {isImage
          ? <Box component='img' src={doc.fileUrl} alt={doc.fileName}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <i className='ri-file-pdf-line' style={{ fontSize: size * 0.5, color: '#d32f2f' }} />
        }
      </Box>
    )
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<DocGroup, any>[]>(() => [
    // Người dùng
    columnHelper.accessor('ownerName', {
      header: 'Người dùng',
      cell: ({ row }) => (
        <Box>
          <Typography variant='body2' fontWeight={500}>{row.original.ownerName}</Typography>
          {/*<Typography variant='caption' color='text.secondary'>{row.original.ownerSub}</Typography>*/}
        </Box>
      )
    }),

    // Loại tài liệu
    columnHelper.accessor('documentType', {
      header: 'Loại',
      cell: ({ row }) => <DocTypeChip type={row.original.documentType} label={row.original.documentTypeLabel} />
    }),

    // Ảnh mới nhất
    {
      id: 'latestFile',
      header: 'Ảnh / File',
      cell: ({ row }) => {
        const doc = row.original.latest
        return (
          <Box className='flex items-center gap-3'>
            <DocThumbnail doc={doc} size={72} />
            <Box sx={{ minWidth: 0 }}>
              <Tooltip title={doc.fileName}>
                <Typography variant='body2' noWrap sx={{ maxWidth: 160 }}>{doc.fileName}</Typography>
              </Tooltip>
              <Typography variant='caption' color='text.secondary'>
                {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
              </Typography>
            </Box>
          </Box>
        )
      }
    },

    // Trạng thái
    // columnHelper.accessor(row => row.latest.status, {
    //   id: 'status',
    //   header: 'Trạng thái',
    //   cell: ({ row }) => {
    //     const doc = row.original.latest
    //     return (
    //       <Box className='flex flex-col gap-0.5'>
    //         <Chip
    //           label={documentStatusLabels[doc.status]}
    //           size='small'
    //           color={documentStatusColors[doc.status]}
    //           variant='tonal'
    //         />
    //         {doc.status === 2 && doc.resubmissionReason && (
    //           <Tooltip title={doc.resubmissionReason}>
    //             <Typography variant='caption' color='error' noWrap sx={{ maxWidth: 140, cursor: 'help' }}>
    //               {doc.resubmissionReason}
    //             </Typography>
    //           </Tooltip>
    //         )}
    //       </Box>
    //     )
    //   }
    // }),

    // Lịch sử
    {
      id: 'history',
      header: 'Lịch sử',
      cell: ({ row }) => {
        const count = row.original.history.length
        if (count === 0) return <Typography variant='caption' color='text.disabled'>—</Typography>
        return (
          <Button
            size='small'
            variant='outlined'
            color='secondary'
            startIcon={<i className='ri-history-line' />}
            onClick={() => setHistoryGroup(row.original)}
          >
            {count} ảnh cũ
          </Button>
        )
      }
    },

    // Thao tác
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => {
        const doc = row.original.latest
        return (
          <Box className='flex items-center gap-0.5' onClick={event => event.stopPropagation()}>
            <Tooltip title='Tải xuống'>
              <IconButton size='small' component='a' href={doc.fileUrl} download={doc.fileName} target='_blank'>
                <i className='ri-download-line' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Yêu cầu nộp lại'>
              <IconButton
                size='small'
                color='warning'
                onClick={() => {
                  setResubmitTarget(doc)
                  setResubmitReason('')
                }}
              >
                <i className='ri-close-circle-line' />
              </IconButton>
            </Tooltip>
          </Box>
        )
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [])

  const table = useReactTable({
    data: groupedData,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
    globalFilterFn: fuzzyFilter,
    initialState: { pagination: { pageSize: 15 } },
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
          title='Quản lý tài liệu người dùng'
          subheader='Hiển thị 1 ảnh/file mới nhất mỗi loại tài liệu theo từng người dùng'
        />

        {/* Filters */}
        <Box className='flex gap-3 p-5 flex-wrap items-center'>
          <TextField select size='small' label='Loại tài liệu' value={filterType}
            onChange={e => setFilterType(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value=''>Tất cả loại</MenuItem>
            {DOCUMENT_TYPES.map(t => (
              <MenuItem key={t.value} value={t.value}>
                <Box className='flex items-center gap-1.5'>
                  <i className={DOC_TYPE_ICON[t.value].icon} style={{ color: DOC_TYPE_ICON[t.value].color }} />
                  {t.label}
                </Box>
              </MenuItem>
            ))}
          </TextField>

          {/* User search Autocomplete */}
          <Autocomplete
            size='small'
            sx={{ minWidth: 240 }}
            options={userOptions}
            value={selectedUser}
            loading={userSearchLoading}
            getOptionLabel={u => u.fullName || u.email || u.username || ''}
            filterOptions={x => x}
            inputValue={userSearchInput}
            onInputChange={(_, val, reason) => {
              if (reason === 'input') setUserSearchInput(val)
              if (reason === 'clear') { setUserSearchInput(''); setSelectedUser(null) }
            }}
            onChange={(_, val) => {
              setSelectedUser(val)
              if (val) setUserSearchInput(val.fullName || val.email || '')
            }}
            renderOption={(props, u) => (
              <li {...props} key={u.id}>
                <Box>
                  <Typography variant='body2'>{u.fullName}</Typography>
                  <Typography variant='caption' color='text.secondary'>{u.email}</Typography>
                </Box>
              </li>
            )}
            renderInput={params => (
              <TextField
                {...params}
                label='Tìm theo tên người dùng'
                placeholder='Gõ tên để tìm...'
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <i className='ri-user-search-line mr-1 text-secondary' />
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  endAdornment: (
                    <>
                      {userSearchLoading ? <CircularProgress size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />

          {/*<Button variant='outlined' size='small' onClick={load} disabled={loading}>*/}
          {/*  {loading ? <CircularProgress size={16} /> : 'Lọc'}*/}
          {/*</Button>*/}

          <TextField
            size='small' placeholder='Tìm trong bảng...'
            value={globalFilter} onChange={e => setGlobalFilter(e.target.value)}
            sx={{ ml: 'auto', minWidth: 200 }}
            InputProps={{ startAdornment: <i className='ri-search-line mr-2 text-secondary' /> }}
          />
        </Box>

        <Divider />

        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th key={h.id}>
                      {h.isPlaceholder ? null : (
                        <div
                          className={classnames({
                            'flex items-center': h.column.getIsSorted(),
                            'cursor-pointer select-none': h.column.getCanSort()
                          })}
                          onClick={h.column.getToggleSortingHandler()}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {h.column.getIsSorted() === 'asc' && <i className='ri-arrow-up-s-line ml-1' />}
                          {h.column.getIsSorted() === 'desc' && <i className='ri-arrow-down-s-line ml-1' />}
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
                  <td colSpan={columns.length} className='text-center py-10'>
                    <Box className='flex flex-col items-center gap-2'>
                      <i className='ri-folder-open-line text-4xl text-secondary' />
                      <Typography color='text.secondary'>
                        {loading ? 'Đang tải...' : 'Không có tài liệu nào'}
                      </Typography>
                    </Box>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} onClick={() => setPreviewDoc(row.original.latest)} style={{ cursor: 'pointer' }}>
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
          rowsPerPageOptions={[15, 25, 50]}
          component='div' className='border-bs'
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
          onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
        />
      </Card>

      {/* Preview dialog */}
      <Dialog open={!!previewDoc} onClose={() => setPreviewDoc(null)} maxWidth='md' fullWidth>
        <DialogTitle sx={{ pr: 6 }}>
          <Box className='flex items-center gap-2 flex-wrap'>
            {previewDoc && <DocTypeChip type={previewDoc.documentType} label={previewDoc.documentTypeLabel} />}
            <Typography variant='caption' color='text.secondary' sx={{ ml: 1 }}>
              — {previewDoc?.userFullName ?? previewDoc?.studentFullName}
            </Typography>
          </Box>
          <Typography variant='caption' color='text.disabled' display='block' sx={{ mt: 0.25 }}>
            {previewDoc?.fileName} · {previewDoc && new Date(previewDoc.createdAt).toLocaleDateString('vi-VN')}
          </Typography>
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setPreviewDoc(null)}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {previewDoc?.contentType.startsWith('image/') ? (
            <Box component='img' src={previewDoc.fileUrl} alt={previewDoc.fileName}
              sx={{ width: '100%', borderRadius: 1 }} />
          ) : (
            <Box component='iframe' src={previewDoc?.fileUrl} sx={{ width: '100%', height: 520, border: 0 }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button href={previewDoc?.fileUrl ?? ''} download={previewDoc?.fileName} target='_blank'>
            <i className='ri-download-line mr-1' />Tải xuống
          </Button>
          <Button color='warning' variant='outlined' onClick={() => {
            if (previewDoc) { setResubmitTarget(previewDoc); setResubmitReason(''); setPreviewDoc(null) }
          }}>
            <i className='ri-mail-send-line mr-1' />Yêu cầu nộp lại
          </Button>
          <Button onClick={() => setPreviewDoc(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog lịch sử ảnh cũ */}
      <Dialog open={!!historyGroup} onClose={() => setHistoryGroup(null)} maxWidth='md' fullWidth>
        <DialogTitle>
          <Box className='flex items-center gap-2'>
            <i className='ri-history-line' />
            <span>Lịch sử tài liệu cũ</span>
            {historyGroup && <DocTypeChip type={historyGroup.documentType} label={historyGroup.documentTypeLabel} />}
          </Box>
          <Typography variant='caption' color='text.secondary' display='block'>
            {historyGroup?.ownerName} · {historyGroup?.history.length} phiên bản cũ hơn
          </Typography>
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setHistoryGroup(null)}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box className='flex flex-col gap-3'>
            {historyGroup?.history.map((doc, idx) => {
              const isImage = doc.contentType.startsWith('image/')
              return (
                <Box
                  key={doc.id}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    p: 2, bgcolor: 'action.hover', borderRadius: 1
                  }}
                >
                  {/* Số thứ tự */}
                  <Typography variant='caption' color='text.secondary' sx={{ flexShrink: 0, width: 24, textAlign: 'center' }}>
                    #{idx + 1}
                  </Typography>

                  {/* Thumbnail */}
                  <Box
                    onClick={() => { setPreviewDoc(doc); setHistoryGroup(null) }}
                    sx={{
                      width: 64, height: 64, flexShrink: 0,
                      borderRadius: 1, overflow: 'hidden',
                      border: '1px solid', borderColor: 'divider',
                      bgcolor: 'background.paper',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', '&:hover': { opacity: 0.8 }
                    }}
                  >
                    {isImage
                      ? <Box component='img' src={doc.fileUrl} alt={doc.fileName}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <i className='ri-file-pdf-line text-2xl' style={{ color: '#d32f2f' }} />
                    }
                  </Box>

                  {/* Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant='body2' fontWeight={500} noWrap>{doc.fileName}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Tải lên: {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                    </Typography>
                  </Box>

                  {/*<Chip*/}
                  {/*  label={documentStatusLabels[doc.status]}*/}
                  {/*  size='small'*/}
                  {/*  color={documentStatusColors[doc.status]}*/}
                  {/*  variant='tonal'*/}
                  {/*  sx={{ flexShrink: 0 }}*/}
                  {/*/>*/}

                  {/* Actions */}
                  <Box className='flex gap-0.5'>
                    <Tooltip title='Xem'>
                      <IconButton size='small' onClick={() => { setPreviewDoc(doc); setHistoryGroup(null) }}>
                        <i className='ri-eye-line' />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Tải xuống'>
                      <IconButton size='small' component='a' href={doc.fileUrl} download={doc.fileName} target='_blank'>
                        <i className='ri-download-line' />
                      </IconButton>
                    </Tooltip>
                    {/*<Tooltip title='Yêu cầu nộp lại'>*/}
                    {/*  <IconButton size='small' color='warning' onClick={() => {*/}
                    {/*    setResubmitTarget(doc); setResubmitReason(''); setHistoryGroup(null)*/}
                    {/*  }}>*/}
                    {/*    <i className='ri-close-circle-line' />*/}
                    {/*  </IconButton>*/}
                    {/*</Tooltip>*/}
                  </Box>
                </Box>
              )
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryGroup(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Resubmission dialog */}
      <Dialog open={!!resubmitTarget} onClose={() => setResubmitTarget(null)} maxWidth='sm' fullWidth>
        <DialogTitle>Yêu cầu nộp lại tài liệu</DialogTitle>
        <DialogContent className='flex flex-col gap-4 pt-3'>
          <Box className='flex items-center gap-3 p-3 rounded' sx={{ bgcolor: 'action.hover' }}>
            {resubmitTarget && (
              <Box sx={{
                width: 56, height: 56, borderRadius: 1, overflow: 'hidden', flexShrink: 0,
                bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {resubmitTarget.contentType.startsWith('image/')
                  ? <Box component='img' src={resubmitTarget.fileUrl} alt={resubmitTarget.fileName}
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <i className='ri-file-pdf-line text-2xl' style={{ color: '#d32f2f' }} />
                }
              </Box>
            )}
            <Box>
              {resubmitTarget && <DocTypeChip type={resubmitTarget.documentType} label={resubmitTarget.documentTypeLabel} />}
              <Typography variant='body2' color='text.secondary'>
                của <strong>{resubmitTarget?.userFullName ?? resubmitTarget?.studentFullName}</strong>
              </Typography>
            </Box>
          </Box>
          <Typography variant='body2' color='text.secondary'>
            Email thông báo sẽ được gửi tự động đến người dùng sau khi xác nhận.
          </Typography>
          <TextField
            label='Lý do yêu cầu nộp lại *'
            fullWidth multiline rows={3}
            value={resubmitReason}
            onChange={e => setResubmitReason(e.target.value)}
            placeholder='Ví dụ: Ảnh không rõ nét, sai loại tài liệu, cần file chất lượng cao hơn...'
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResubmitTarget(null)}>Hủy</Button>
          <Button
            variant='contained' color='warning'
            onClick={handleResubmit}
            disabled={loading || !resubmitReason.trim()}
            startIcon={loading ? <CircularProgress size={16} color='inherit' /> : <i className='ri-mail-send-line' />}
          >
            Gửi yêu cầu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default UserDocumentListTable
