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
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import federationMemberService from '@/services/federationMemberService'
import type { FederationMemberDto } from '@/services/federationMemberService'
import { formatDateVN } from '@/utils/dateTime'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (member: FederationMemberDto) => void
}

const PAGE_SIZE = 20

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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<FederationMemberDto[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastKwRef = useRef('')

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

  const hasOldCode = results.some(m => !!m.oldMemberCode)
  const colCount = hasOldCode ? 8 : 7

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      fullScreen={isMobile}
      PaperProps={isMobile ? { sx: { m: 0, borderRadius: 0, height: '100%', maxHeight: '100%' } } : undefined}
    >
      <DialogTitle sx={{ pb: 1, pt: isMobile ? 2 : undefined }}>
        <Box className='flex items-center justify-between'>
          <Box className='flex items-center gap-2'>
            <i className='ri-search-2-line text-primary text-xl' />
            <Typography variant='h6' sx={{ fontSize: isMobile ? '1.1rem' : undefined }}>
              Tra cứu hội viên
            </Typography>
          </Box>
          <IconButton size='small' onClick={onClose}>
            <i className='ri-close-line text-xl' />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pb: 1, display: 'flex', flexDirection: 'column', pt: 2 }}>
        <TextField
          fullWidth
          autoFocus
          size='small'
          placeholder='Nhập tên hoặc mã hội viên...'
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
          sx={{ mb: 2 }}
        />

        <TableContainer
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            flex: 1,
            minHeight: 200,
            maxHeight: isMobile ? 'calc(100vh - 220px)' : 420,
            overflow: 'auto'
          }}
        >
          <Table size='small' stickyHeader sx={{ minWidth: isMobile ? 520 : 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Đai</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 130 }}>Họ tên</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap', minWidth: 90 }}>Mã HV</TableCell>
                {!isMobile && <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Ngày sinh</TableCell>}
                {!isMobile && <TableCell sx={{ fontWeight: 700 }}>Giới tính</TableCell>}
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap', minWidth: 100 }}>CCCD</TableCell>
                {hasOldCode && !isMobile && (
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap', minWidth: 90 }}>Mã cũ</TableCell>
                )}
                <TableCell sx={{ fontWeight: 700, width: 56 }} />
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={colCount} align='center' sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colCount} align='center' sx={{ py: 5 }}>
                    <Typography color='text.secondary' variant='body2'>
                      {keyword ? 'Không tìm thấy kết quả' : 'Nhập tên hoặc mã để tìm'}
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
                      <TableCell sx={{ py: 1 }}>
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
                      <TableCell sx={{ py: 1 }}>
                        <Box>
                          <Typography variant='body2' fontWeight={500} noWrap sx={{ maxWidth: isMobile ? 120 : 180 }}>
                            {m.fullName}
                          </Typography>
                          {isMobile && (
                            <Typography variant='caption' color='text.secondary' display='block'>
                              {formatDob(m.dateOfBirth)} · {genderLabel(m.gender)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ py: 1 }}>
                        <Typography variant='body2' fontFamily='monospace' fontWeight={600} color='primary.main'>
                          {m.memberCode}
                        </Typography>
                      </TableCell>
                      {!isMobile && (
                        <TableCell sx={{ py: 1 }}>
                          <Typography variant='body2'>{formatDob(m.dateOfBirth)}</Typography>
                        </TableCell>
                      )}
                      {!isMobile && (
                        <TableCell sx={{ py: 1 }}>
                          <Typography variant='body2'>{genderLabel(m.gender)}</Typography>
                        </TableCell>
                      )}
                      <TableCell sx={{ py: 1 }}>
                        <Typography variant='body2' fontFamily='monospace' sx={{ fontSize: '0.8rem' }}>
                          {m.idCard || '—'}
                        </Typography>
                      </TableCell>
                      {hasOldCode && !isMobile && (
                        <TableCell sx={{ py: 1 }}>
                          <Typography variant='body2' fontFamily='monospace' color='text.secondary'>
                            {m.oldMemberCode || '—'}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell align='center' sx={{ py: 1 }} onClick={e => e.stopPropagation()}>
                        <Tooltip title='Chọn'>
                          <Button
                            size='small'
                            variant='contained'
                            sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: '0.7rem' }}
                            onClick={() => handleSelect(m)}
                          >
                            Chọn
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}

                  <TableRow>
                    <TableCell colSpan={colCount} sx={{ p: 0, border: 0 }}>
                      <div ref={sentinelRef} style={{ height: 4 }} />
                    </TableCell>
                  </TableRow>

                  {loadingMore && (
                    <TableRow>
                      <TableCell colSpan={colCount} align='center' sx={{ py: 2 }}>
                        <CircularProgress size={20} />
                      </TableCell>
                    </TableRow>
                  )}

                  {!hasMore && results.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={colCount} align='center' sx={{ py: 1.5 }}>
                        <Typography variant='caption' color='text.secondary'>
                          {results.length} / {totalCount}
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
