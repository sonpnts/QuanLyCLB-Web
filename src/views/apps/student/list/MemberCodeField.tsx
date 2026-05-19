'use client'

/**
 * MemberCodeField – trường "Mã HV" với:
 * - Kính lúp bên phải để mở modal tìm kiếm theo tên
 * - Tự động tra cứu thông tin hội viên liên đoàn khi nhập mã và nhấn Enter/Tab
 * - Hiển thị bảng thông tin dự kiến để xác nhận trước khi áp dụng
 * - Sau khi HV có mã, khoá toàn bộ các trường cá nhân liên quan
 */

import { useEffect, useRef, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import federationMemberService from '@/services/federationMemberService'
import type { FederationMemberDto } from '@/services/federationMemberService'
import MemberCodeSearchDialog from './MemberCodeSearchDialog'

export interface MemberInfo {
  fullName: string
  gender?: boolean // true = Nam, false = Nữ
  dateOfBirth?: string
  phoneNumber?: string
  personalIdNumber?: string
  address?: string
  email?: string
}

interface Props {
  /** Giá trị hiện tại của trường mã HV */
  value: string
  /** Callback khi giá trị mã HV thay đổi */
  onChange: (code: string) => void
  /**
   * Callback khi người dùng xác nhận áp dụng thông tin từ hội viên liên đoàn.
   * Component cha dùng để copy fullName, gender, dob, ... sang form.
   */
  onMemberInfoConfirmed: (info: MemberInfo) => void
  /** Nếu true → trường chỉ đọc (không cho sửa gì) */
  locked?: boolean
  /** Helper text bên dưới trường mã */
  helperText?: string
}

const genderToBool = (g?: string | null): boolean | undefined => {
  if (!g) return undefined
  const n = g.toLowerCase()
  if (n === 'nam' || n === 'true' || n === '1' || n === 'male') return true
  if (n === 'nữ' || n === 'nu' || n === 'false' || n === '0' || n === 'female') return false
  return undefined
}

const MemberCodeField = ({ value, onChange, onMemberInfoConfirmed, locked = false, helperText }: Props) => {
  const [searchOpen, setSearchOpen] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupResult, setLookupResult] = useState<FederationMemberDto | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lastLookedUpCode, setLastLookedUpCode] = useState<string>('')

  const inputRef = useRef<HTMLInputElement>(null)

  // Reset preview khi mã bị xoá hoặc thay đổi
  useEffect(() => {
    if (!value) {
      setLookupResult(null)
      setLookupError(null)
      setLastLookedUpCode('')
    }
  }, [value])

  const lookupByCode = async (code: string) => {
    const trimmed = code.trim()
    if (!trimmed || trimmed === lastLookedUpCode) return

    setLookupLoading(true)
    setLookupError(null)
    setLookupResult(null)

    try {
      const res = await federationMemberService.getByCode(trimmed)
      if (res.success && res.data) {
        setLookupResult(res.data)
        setLastLookedUpCode(trimmed)
      } else {
        setLookupError(res.message || `Không tìm thấy hội viên với mã '${trimmed}'`)
        setLastLookedUpCode(trimmed)
      }
    } finally {
      setLookupLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      lookupByCode(value)
    }
  }

  const handleBlur = () => {
    if (value && value.trim() !== lastLookedUpCode) {
      lookupByCode(value)
    }
  }

  // Khi chọn từ modal tìm kiếm
  const handleSelectFromSearch = (member: FederationMemberDto) => {
    onChange(member.memberCode)
    setLookupResult(member)
    setLookupError(null)
    setLastLookedUpCode(member.memberCode)
    setSearchOpen(false)
  }

  // Xác nhận áp dụng thông tin
  const handleConfirm = () => {
    if (!lookupResult) return
    onMemberInfoConfirmed({
      fullName: lookupResult.fullName,
      gender: genderToBool(lookupResult.gender),
      dateOfBirth: lookupResult.dateOfBirth
        ? lookupResult.dateOfBirth.includes('T')
          ? lookupResult.dateOfBirth.split('T')[0]
          : lookupResult.dateOfBirth
        : undefined,
      phoneNumber: lookupResult.phoneNumber || undefined,
      personalIdNumber: lookupResult.idCard || undefined,
      address: lookupResult.address || undefined,
      email: lookupResult.email || undefined
    })
  }

  // Bảng hiển thị preview
  const renderPreviewTable = () => {
    if (!lookupResult) return null
    const m = lookupResult
    const rows: [string, string | undefined | null][] = [
      ['Họ và tên', m.fullName],
      ['Mã hội viên', m.memberCode],
      ['Giới tính', m.gender || '—'],
      ['Ngày sinh', m.dateOfBirth || '—'],
      ['Số điện thoại', m.phoneNumber || '—'],
      ['CMND/CCCD', m.idCard || '—'],
      ['Địa chỉ', m.address || '—'],
      ['Email', m.email || '—'],
      ['Cấp đai', m.beltRank || '—'],
      ['Câu lạc bộ', m.clubName || '—'],
      ['Hiệu lực', m.isEffective === 'x' ? 'Còn hiệu lực ✓' : (m.isEffective || '—')]
    ]

    return (
      <Paper variant='outlined' sx={{ mt: 1.5, borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1, bgcolor: 'primary.main' }}>
          <Typography variant='caption' sx={{ color: 'white', fontWeight: 600 }}>
            Thông tin dự kiến từ liên đoàn – Xác nhận để áp dụng
          </Typography>
        </Box>
        <Table size='small'>
          <TableBody>
            {rows.map(([label, val]) => (
              <TableRow key={label} sx={{ '&:last-child td': { border: 0 } }}>
                <TableCell sx={{ width: '40%', py: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
                  {label}
                </TableCell>
                <TableCell sx={{ py: 0.5, fontSize: '0.8rem', fontWeight: val && val !== '—' ? 500 : 400 }}>
                  {val || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Divider />
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            size='small'
            variant='outlined'
            onClick={() => { setLookupResult(null); setLastLookedUpCode('') }}
          >
            Bỏ qua
          </Button>
          <Button size='small' variant='contained' onClick={handleConfirm}>
            Áp dụng thông tin
          </Button>
        </Box>
      </Paper>
    )
  }

  return (
    <Box>
      <TextField
        fullWidth
        label='Mã HV (hội viên liên đoàn)'
        value={value}
        onChange={e => {
          onChange(e.target.value)
          // Reset preview nếu mã thay đổi so với lần lookup cuối
          if (e.target.value.trim() !== lastLookedUpCode) {
            setLookupResult(null)
            setLookupError(null)
          }
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={locked}
        placeholder={locked ? 'Đã khoá' : 'Nhập mã hoặc dùng kính lúp tìm theo tên...'}
        helperText={
          locked
            ? 'Học viên đã có mã HV – thông tin được khoá'
            : (helperText ?? 'Nhấn Enter/Tab để tra cứu thông tin từ liên đoàn')
        }
        inputRef={inputRef}
        InputProps={{
          endAdornment: (
            <InputAdornment position='end'>
              {lookupLoading ? (
                <CircularProgress size={16} />
              ) : (
                <IconButton
                  size='small'
                  onClick={() => setSearchOpen(true)}
                  disabled={locked}
                  title='Tìm kiếm theo tên'
                >
                  <i className='ri-search-line' />
                </IconButton>
              )}
            </InputAdornment>
          )
        }}
      />

      {lookupError && !locked && (
        <Alert severity='warning' sx={{ mt: 0.5 }} icon={<i className='ri-alert-line' />}>
          {lookupError}
        </Alert>
      )}

      {lookupResult && !locked && renderPreviewTable()}

      <MemberCodeSearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSelectFromSearch}
      />
    </Box>
  )
}

export default MemberCodeField
