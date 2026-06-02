'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import federationMemberService from '@/services/federationMemberService'
import type { FederationMemberDto } from '@/services/federationMemberService'
import { formatDateVN } from '@/utils/dateTime'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (member: FederationMemberDto) => void
}

const PAGE_SIZE = 20

/** Định dạng ngày YYYY-MM-DD → DD/MM/YYYY */
const formatDob = (dob?: string | null) => {
  if (!dob) return '—'

  try {
    const d = new Date(dob)

    if (isNaN(d.getTime())) return dob

    return formatDateVN(d)
  } catch {
    return dob
  }
}

const genderLabel = (g?: string | null) => {
  if (!g) return '—'
  if (g === 'Nam' || g === 'true' || g === '1') return 'Nam'
  if (g === 'Nữ' || g === 'false' || g === '0') return 'Nữ'
  
return g
}

const MemberCodeSearchDialog = ({ open, onClose, onSelect }: Props) => {
  const [keyword, setKeyword]           = useState('')
  const [results, setResults]           = useState<FederationMemberDto[]>([])
  const [totalCount, setTotalCount]     = useState(0)
  const [page, setPage]                 = useState(1)
  const [hasMore, setHasMore]           = useState(false)
  const [loading, setLoading]           = useState(false)
  const [loadingMore, setLoadingMore]   = useState(false)

  // Sentinel cho infinite scroll
  const sentinelRef  = useRef<HTMLDivElement | null>(null)
  const observerRef  = useRef<IntersectionObserver | null>(null)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastKwRef    = useRef('')

  const doSearch = useCallback(async (kw: string, pg: number, append: boolean) => {
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)

    try {
      const res = await federationMemberService.search({ keyword: kw, pageNumber: pg, pageSize: PAGE_SIZE })

      if (res.success && res.data) {
        const { items, totalCount: tc } = res.data

        setResults(prev => (append ? [...prev, ...items] : items))
        setTotalCount(tc)
        setHasMore((append ? results.length + items.length : items.length) < tc)
        setPage(pg)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reset khi dialog mở
  useEffect(() => {
    if (open) {
      setKeyword('')
      setResults([])
      setPage(1)
      setHasMore(false)
      lastKwRef.current = ''
      doSearch('', 1, false)
    }
  }, [open, doSearch])

  // Debounce keyword
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (keyword !== lastKwRef.current) {
        lastKwRef.current = keyword
        setResults([])
        doSearch(keyword, 1, false)
      }
    }, 350)
    
return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [keyword, doSearch])

  // IntersectionObserver cho load-more
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        doSearch(lastKwRef.current, page + 1, true)
      }
    }, { threshold: 0.1 })
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
    
return () => observerRef.current?.disconnect()
  }, [hasMore, loadingMore, loading, page, doSearch])

  const handleSelect = (member: FederationMemberDto) => {
    onSelect(member)
    onClose()
  }

  // Kiểm tra có hàng nào có mã cũ không (để ẩn/hiện cột)
  const hasOldCode = results.some(m => !!m.oldMemberCode)

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box className='flex items-center justify-between'>
          <Box className='flex items-center gap-2'>
            <i className='ri-search-2-line text-primary text-xl' />
            <Typography variant='h6'>Tra cứu hội viên liên đoàn</Typography>
          </Box>
          <IconButton size='small' onClick={onClose}>
            <i className='ri-close-line text-xl' />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pb: 1 }}>
        {/* Ô tìm kiếm */}
        <TextField
          fullWidth
          autoFocus
          size='small'
          placeholder='Nhập tên hoặc mã hội viên để tìm kiếm...'
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <i className='ri-search-line text-textSecondary' />
              </InputAdornment>
            ),
            endAdornment: keyword ? (
              <InputAdornment position='end'>
                <IconButton size='small' onClick={() => setKeyword('')}>
                  <i className='ri-close-circle-line text-textSecondary' />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
          sx={{ mb: 1.5 }}
        />

        {/* Bảng kết quả */}
        <TableContainer
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            maxHeight: 420,
            overflowY: 'auto'
          }}
        >
          <Table size='small' stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap', minWidth: 110 }}>Mã HV</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Họ và tên</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Ngày sinh</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Giới tính</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap', minWidth: 130 }}>CMND / CCCD</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Cấp đẳng</TableCell>
                {hasOldCode && (
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap', minWidth: 110 }}>Mã HV cũ</TableCell>
                )}
                <TableCell sx={{ fontWeight: 700, width: 80 }} />
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={hasOldCode ? 8 : 7} align='center' sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasOldCode ? 8 : 7} align='center' sx={{ py: 5 }}>
                    <Typography color='text.secondary' variant='body2'>
                      {keyword ? 'Không tìm thấy kết quả phù hợp' : 'Nhập tên hoặc mã để tìm kiếm'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {results.map((m, idx) => (
                    <TableRow
                      key={`${m.memberCode}-${idx}`}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleSelect(m)}
                    >
                      {/* Mã HV */}
                      <TableCell>
                        <Box className='flex items-center gap-1 flex-wrap'>
                          <Typography variant='body2' fontFamily='monospace' fontWeight={600} color='primary.main'>
                            {m.memberCode}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Họ tên */}
                      <TableCell>
                        <Typography variant='body2' fontWeight={500}>
                          {m.fullName}
                        </Typography>
                      </TableCell>

                      {/* Ngày sinh */}
                      <TableCell>
                        <Typography variant='body2'>{formatDob(m.dateOfBirth)}</Typography>
                      </TableCell>

                      {/* Giới tính */}
                      <TableCell>
                        <Typography variant='body2'>{genderLabel(m.gender)}</Typography>
                      </TableCell>

                      {/* CCCD */}
                      <TableCell>
                        <Typography variant='body2' fontFamily='monospace'>
                          {m.idCard || '—'}
                        </Typography>
                      </TableCell>

                      {/* Cấp đẳng */}
                      <TableCell>
                        {m.beltRank ? (
                          <Chip
                            label={m.beltRank}
                            size='small'
                            color='warning'
                            variant='tonal'
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        ) : (
                          <Typography variant='body2' color='text.secondary'>—</Typography>
                        )}
                      </TableCell>

                      {/* Mã HV cũ (chỉ render cột nếu có dữ liệu) */}
                      {hasOldCode && (
                        <TableCell>
                          <Typography variant='body2' fontFamily='monospace' color='text.secondary'>
                            {m.oldMemberCode || '—'}
                          </Typography>
                        </TableCell>
                      )}

                      {/* Nút chọn */}
                      <TableCell align='center' onClick={e => e.stopPropagation()}>
                        <Tooltip title='Chọn hội viên này'>
                          <Button
                            size='small'
                            variant='contained'
                            sx={{ minWidth: 0, px: 1.5, fontSize: '0.72rem' }}
                            onClick={() => handleSelect(m)}
                          >
                            Chọn
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Sentinel cho infinite scroll */}
                  <TableRow>
                    <TableCell colSpan={hasOldCode ? 8 : 7} sx={{ p: 0, border: 0 }}>
                      <div ref={sentinelRef} style={{ height: 4 }} />
                    </TableCell>
                  </TableRow>

                  {loadingMore && (
                    <TableRow>
                      <TableCell colSpan={hasOldCode ? 8 : 7} align='center' sx={{ py: 2 }}>
                        <CircularProgress size={20} />
                      </TableCell>
                    </TableRow>
                  )}

                  {!hasMore && results.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={hasOldCode ? 8 : 7} align='center' sx={{ py: 1.5 }}>
                        <Typography variant='caption' color='text.secondary'>
                          Đã hiển thị {results.length} / {totalCount} hội viên
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant='outlined'>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MemberCodeSearchDialog
