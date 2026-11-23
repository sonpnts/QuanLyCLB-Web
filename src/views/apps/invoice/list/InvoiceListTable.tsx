'use client'

import { useMemo, useState } from 'react'

import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import type { ReceiptListItemType } from '@/types/apps/paymentTypes'
import { paymentMethodLabels, paymentTypeLabels } from '@/types/apps/paymentTypes'
import { formatDateTimeVN } from '@/utils/dateTime'
import { exportToExcel, formatVnCurrency, formatVnDate } from '@/utils/exportToExcel'
import ReceiptPreviewDialog from '@/views/apps/invoice/preview/ReceiptPreviewDialog'

import tableStyles from '@core/styles/table.module.css'

const toInputDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const buildRange = (days: number) => {
  const today = new Date()
  const from = new Date(today)

  from.setDate(today.getDate() - (days - 1))

  return {
    from: toInputDate(from),
    to: toInputDate(today)
  }
}

type ClassOption = {
  id: string
  name: string
}

type Props = {
  receipts: ReceiptListItemType[]
  loading: boolean
  totalCount: number
  page: number
  rowsPerPage: number
  search: string
  methodFilter: string
  typeFilter: string
  dateFrom: string
  dateTo: string
  onSearchChange: (value: string) => void
  onMethodFilterChange: (value: string) => void
  onTypeFilterChange: (value: string) => void
  onPageChange: (value: number) => void
  onRowsPerPageChange: (value: number) => void
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  selectedClassId: string
  onClassIdChange: (value: string) => void
  classOptions: ClassOption[]
  isAdmin: boolean
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

const formatDate = (dateStr: string) => formatDateTimeVN(dateStr)

const typeColorMap: Record<number, 'primary' | 'info' | 'success' | 'secondary' | 'warning'> = {
  0: 'primary',
  1: 'info',
  2: 'success',
  3: 'secondary',
  4: 'warning',
  5: 'info',
  6: 'secondary'
}

const getClassLabel = (row: ReceiptListItemType) => (row.classNames.length > 0 ? row.classNames.join(', ') : '-')

const getPeriodLabel = (row: ReceiptListItemType) => (row.periods.length > 0 ? row.periods.join(', ') : '')

const InvoiceListTable = ({
  receipts,
  loading,
  totalCount,
  page,
  rowsPerPage,
  search,
  methodFilter,
  typeFilter,
  dateFrom,
  dateTo,
  onSearchChange,
  onMethodFilterChange,
  onTypeFilterChange,
  onPageChange,
  onRowsPerPageChange,
  onDateFromChange,
  onDateToChange,
  selectedClassId,
  onClassIdChange,
  classOptions,
  isAdmin
}: Props) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null)
  const [proofImageOpen, setProofImageOpen] = useState(false)
  const [receiptPreviewOpen, setReceiptPreviewOpen] = useState(false)
  const [selectedReceiptNumber, setSelectedReceiptNumber] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const preset30 = useMemo(() => buildRange(30), [])
  const preset60 = useMemo(() => buildRange(60), [])
  const isPreset30 = dateFrom === preset30.from && dateTo === preset30.to
  const isPreset60 = dateFrom === preset60.from && dateTo === preset60.to
  const isCustomRange = !isPreset30 && !isPreset60

  // Số bộ lọc nâng cao đang bật (hiện trên nút "Bộ lọc" ở điện thoại)
  const activeFilterCount = [selectedClassId, methodFilter, typeFilter].filter(Boolean).length

  const showFilters = !isMobile || filtersOpen

  const handleResetFilters = () => {
    onDateFromChange(preset30.from)
    onDateToChange(preset30.to)
    onClassIdChange('')
    onMethodFilterChange('')
    onTypeFilterChange('')
    onSearchChange('')
    onPageChange(0)
  }

  const applyQuickRange = (from: string, to: string) => {
    onDateFromChange(from)
    onDateToChange(to)
    onPageChange(0)
  }

  const openProofImage = (imageUrl?: string | null) => {
    if (!imageUrl) return

    setProofImageUrl(imageUrl)
    setProofImageOpen(true)
  }

  const closeProofImage = () => {
    setProofImageOpen(false)
    setProofImageUrl(null)
  }

  const openReceiptPreview = (receiptNumber: string) => {
    setSelectedReceiptNumber(receiptNumber)
    setReceiptPreviewOpen(true)
  }

  const handleExport = () => {
    exportToExcel({
      filename: 'lich-su-bien-lai',
      rows: receipts.map(row => ({ ...row, classLabel: getClassLabel(row) })),
      columns: [
        { header: 'Số biên lai', accessor: 'receiptNumber' },
        { header: 'Ngày thu', accessor: 'paymentDate', formatter: formatVnDate },
        { header: 'Học viên', accessor: 'studentName' },
        { header: 'Lớp', accessor: 'classLabel' },
        { header: 'Người thu', accessor: 'collectedByUserName' },
        {
          header: 'Loại thu',
          accessor: 'types',
          formatter: value =>
            Array.isArray(value)
              ? value
                  .map((type: number) => paymentTypeLabels[type] || '')
                  .filter(Boolean)
                  .join(', ')
              : ''
        },
        {
          header: 'Phương thức',
          accessor: 'method',
          formatter: value => paymentMethodLabels[value as number] || ''
        },
        {
          header: 'Kỳ',
          accessor: 'periods',
          formatter: value => (Array.isArray(value) && value.length > 0 ? value.join(', ') : '-')
        },
        { header: 'Tổng tiền (VND)', accessor: 'totalAmount', formatter: formatVnCurrency },
        { header: 'Số khoản thu', accessor: 'itemCount' }
      ]
    })
  }

  const renderTypeChips = (row: ReceiptListItemType) => (
    <div className='flex gap-1 flex-wrap'>
      {row.types.map(type => (
        <Chip
          key={type}
          label={paymentTypeLabels[type] || `Loại ${type}`}
          size='small'
          variant='tonal'
          color={typeColorMap[type] ?? 'secondary'}
        />
      ))}
    </div>
  )

  const renderMethodChip = (row: ReceiptListItemType) => (
    <Chip
      label={paymentMethodLabels[row.method] ?? '-'}
      size='small'
      variant='tonal'
      color={row.method === 1 ? 'info' : 'secondary'}
    />
  )

  const renderCollector = (row: ReceiptListItemType) => (
    <span className='flex items-center gap-1 min-is-0'>
      <i className='ri-user-3-line text-base text-primary' />
      <Typography component='span' variant='body2' color='text.primary' fontWeight={600} className='break-words'>
        {row.collectedByUserName}
      </Typography>
    </span>
  )

  const renderProofButton = (row: ReceiptListItemType) =>
    row.transferProofImageUrl ? (
      <Tooltip title='Xem ảnh chuyển khoản'>
        <Button
          size='small'
          variant='outlined'
          color='info'
          startIcon={<i className='ri-image-line' />}
          onClick={event => {
            event.stopPropagation()
            openProofImage(row.transferProofImageUrl)
          }}
        >
          Ảnh CK
        </Button>
      </Tooltip>
    ) : null

  /* ---------- Bộ lọc ---------- */

  const filterFields = (
    <div className='flex gap-3 flex-wrap items-center flex-col sm:flex-row [&>*]:w-full sm:[&>*]:w-auto'>
      <TextField
        size='small'
        label='Từ ngày'
        type='date'
        value={dateFrom}
        onChange={event => {
          onDateFromChange(event.target.value)
          onPageChange(0)
        }}
        slotProps={{ inputLabel: { shrink: true } }}
        className='min-is-[150px]'
      />
      <TextField
        size='small'
        label='Đến ngày'
        type='date'
        value={dateTo}
        onChange={event => {
          onDateToChange(event.target.value)
          onPageChange(0)
        }}
        slotProps={{ inputLabel: { shrink: true } }}
        className='min-is-[150px]'
      />
      <FormControl size='small' className='min-is-[220px]'>
        <InputLabel>Lớp học</InputLabel>
        <Select
          value={selectedClassId}
          label='Lớp học'
          onChange={event => {
            onClassIdChange(event.target.value)
            onPageChange(0)
          }}
        >
          <MenuItem value=''>Tất cả lớp</MenuItem>
          {classOptions.map(option => (
            <MenuItem key={option.id} value={option.id}>
              {option.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size='small' className='min-is-[170px]'>
        <InputLabel>Phương thức</InputLabel>
        <Select
          value={methodFilter}
          label='Phương thức'
          onChange={event => {
            onMethodFilterChange(event.target.value)
            onPageChange(0)
          }}
        >
          <MenuItem value=''>Tất cả</MenuItem>
          <MenuItem value='0'>Tiền mặt</MenuItem>
          <MenuItem value='1'>Chuyển khoản</MenuItem>
          <MenuItem value='2'>Khác</MenuItem>
        </Select>
      </FormControl>
      <FormControl size='small' className='min-is-[190px]'>
        <InputLabel>Loại thu</InputLabel>
        <Select
          value={typeFilter}
          label='Loại thu'
          onChange={event => {
            onTypeFilterChange(event.target.value)
            onPageChange(0)
          }}
        >
          <MenuItem value=''>Tất cả</MenuItem>
          {Object.entries(paymentTypeLabels).map(([key, label]) => (
            <MenuItem key={key} value={key}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant='outlined' color='secondary' onClick={handleResetFilters}>
        Đặt lại bộ lọc
      </Button>
    </div>
  )

  /* ---------- Bảng (desktop): gộp 10 cột còn 6 ---------- */

  const desktopTable = (
    <table className={tableStyles.table}>
      <thead>
        <tr>
          <th>Biên lai</th>
          <th>Học viên</th>
          <th>Khoản thu</th>
          <th>Thanh toán</th>
          <th className='text-end'>Tổng tiền</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {receipts.length === 0 ? (
          <tr>
            <td colSpan={6} className='text-center'>
              Không có biên lai phù hợp.
            </td>
          </tr>
        ) : (
          receipts.map(row => (
            <tr
              key={row.receiptNumber}
              onClick={() => openReceiptPreview(row.receiptNumber)}
              className='cursor-pointer'
            >
              {/* Biên lai: số + ngày thu */}
              <td>
                <Typography color='primary.main' className='font-mono text-sm' fontWeight={600}>
                  {row.receiptNumber}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {formatDate(row.paymentDate)}
                </Typography>
              </td>

              {/* Học viên: tên + lớp */}
              <td>
                <Typography color='text.primary' fontWeight={500}>
                  {row.studentName}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {getClassLabel(row)}
                </Typography>
              </td>

              {/* Khoản thu: loại thu + kỳ */}
              <td>
                {renderTypeChips(row)}
                {getPeriodLabel(row) && (
                  <Typography variant='body2' color='text.secondary' className='mbs-1'>
                    Kỳ: {getPeriodLabel(row)}
                  </Typography>
                )}
              </td>

              {/* Thanh toán: phương thức + người thu (cạnh nhau) */}
              <td>
                <div className='flex items-center gap-2 flex-wrap'>
                  {renderMethodChip(row)}
                  {renderCollector(row)}
                </div>
              </td>

              <td className='text-end'>
                <Typography color='text.primary' fontWeight={600}>
                  {formatCurrency(row.totalAmount)}
                </Typography>
              </td>

              <td>
                {renderProofButton(row) ?? (
                  <Typography variant='body2' color='text.disabled'>
                    -
                  </Typography>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  )

  /* ---------- Danh sách thẻ (điện thoại) ---------- */

  const mobileList =
    receipts.length === 0 ? (
      <Typography className='text-center p-6' color='text.secondary'>
        Không có biên lai phù hợp.
      </Typography>
    ) : (
      <div>
        {receipts.map((row, index) => (
          <div key={row.receiptNumber}>
            {index > 0 && <Divider />}
            <div
              role='button'
              tabIndex={0}
              onClick={() => openReceiptPreview(row.receiptNumber)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openReceiptPreview(row.receiptNumber)
                }
              }}
              className='flex flex-col gap-2 p-4 cursor-pointer active:bg-actionHover'
            >
              {/* Dòng 1: học viên + tổng tiền */}
              <div className='flex items-start justify-between gap-3'>
                <div className='min-is-0'>
                  <Typography color='text.primary' fontWeight={600} className='break-words'>
                    {row.studentName}
                  </Typography>
                  <Typography variant='body2' color='text.secondary' className='break-words'>
                    {getClassLabel(row)}
                  </Typography>
                </div>
                <Typography color='text.primary' fontWeight={700} className='whitespace-nowrap'>
                  {formatCurrency(row.totalAmount)}
                </Typography>
              </div>

              {/* Dòng 2: loại thu + kỳ */}
              <div className='flex items-center gap-2 flex-wrap'>
                {renderTypeChips(row)}
                {getPeriodLabel(row) && (
                  <Typography variant='caption' color='text.secondary'>
                    Kỳ {getPeriodLabel(row)}
                  </Typography>
                )}
              </div>

              {/* Dòng 3: phương thức + người thu, ảnh CK */}
              <div className='flex items-center justify-between gap-2 flex-wrap'>
                <div className='flex items-center gap-2 flex-wrap min-is-0'>
                  {renderMethodChip(row)}
                  {renderCollector(row)}
                </div>
                {renderProofButton(row)}
              </div>

              {/* Dòng 4: số biên lai + ngày thu */}
              <div className='flex items-center gap-2 flex-wrap'>
                <Typography color='primary.main' className='font-mono text-xs' fontWeight={600}>
                  {row.receiptNumber}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {formatDate(row.paymentDate)}
                </Typography>
              </div>
            </div>
          </div>
        ))}
      </div>
    )

  return (
    <>
      <Card>
        {/* Tiêu đề + xuất Excel */}
        <CardContent className='flex justify-between gap-3 items-center'>
          <Typography variant='h6'>Danh sách biên lai</Typography>
          {isMobile ? (
            <Tooltip title='Xuất Excel'>
              <span>
                <IconButton
                  color='success'
                  disabled={receipts.length === 0}
                  onClick={handleExport}
                  aria-label='Xuất Excel'
                >
                  <i className='ri-file-excel-2-line' />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Button
              variant='outlined'
              color='success'
              startIcon={<i className='ri-file-excel-2-line' />}
              disabled={receipts.length === 0}
              onClick={handleExport}
            >
              Xuất Excel
            </Button>
          )}
        </CardContent>

        {/* Tìm kiếm + khoảng thời gian nhanh (luôn hiển thị) */}
        <CardContent className='pt-0 flex flex-col gap-3'>
          <div className='flex gap-3 items-center'>
            <TextField
              size='small'
              fullWidth
              placeholder='Tìm học viên, lớp, người thu, số biên lai...'
              value={search}
              onChange={event => {
                onSearchChange(event.target.value)
                onPageChange(0)
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='ri-search-line text-textSecondary' />
                    </InputAdornment>
                  )
                }
              }}
              className='sm:max-is-[420px]'
            />
            {isMobile && (
              <Badge badgeContent={activeFilterCount} color='primary'>
                <Button
                  variant={filtersOpen ? 'contained' : 'outlined'}
                  color='secondary'
                  onClick={() => setFiltersOpen(open => !open)}
                  startIcon={<i className='ri-filter-3-line' />}
                >
                  Lọc
                </Button>
              </Badge>
            )}
          </div>

          <div className='flex gap-2 overflow-x-auto pbe-1'>
            <Chip
              label='30 ngày qua'
              clickable
              color='primary'
              variant={isPreset30 ? 'filled' : 'outlined'}
              onClick={() => applyQuickRange(preset30.from, preset30.to)}
            />
            <Chip
              label='60 ngày qua'
              clickable
              color='primary'
              variant={isPreset60 ? 'filled' : 'outlined'}
              onClick={() => applyQuickRange(preset60.from, preset60.to)}
            />
            <Chip
              label='Tùy chỉnh'
              clickable
              color='primary'
              variant={isCustomRange ? 'filled' : 'outlined'}
              onClick={() => {
                onDateFromChange('')
                onDateToChange('')
                onPageChange(0)
                if (isMobile) setFiltersOpen(true)
              }}
            />
          </div>

          {/* Bộ lọc chi tiết: luôn mở ở desktop, thu gọn ở điện thoại */}
          <Collapse in={showFilters} unmountOnExit={false}>
            {filterFields}
          </Collapse>
        </CardContent>

        <Divider />

        {/* Nội dung */}
        {loading ? (
          <Box display='flex' justifyContent='center' p={8}>
            <CircularProgress />
          </Box>
        ) : isMobile ? (
          mobileList
        ) : (
          <div className='overflow-x-auto'>{desktopTable}</div>
        )}

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          className='border-bs'
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, nextPage) => onPageChange(nextPage)}
          onRowsPerPageChange={event => {
            onRowsPerPageChange(Number(event.target.value))
            onPageChange(0)
          }}
          labelRowsPerPage={isMobile ? 'Số dòng:' : 'Số dòng mỗi trang:'}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </Card>

      <Dialog open={proofImageOpen} onClose={closeProofImage} maxWidth='md' fullWidth fullScreen={isMobile}>
        <DialogTitle>Ảnh minh chứng chuyển khoản</DialogTitle>
        <DialogContent>
          {proofImageUrl && (
            <Box className='flex justify-center'>
              <Box
                component='img'
                src={proofImageUrl}
                alt='Ảnh chuyển khoản'
                sx={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 1 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            variant='outlined'
            href={proofImageUrl || '#'}
            target='_blank'
            rel='noopener noreferrer'
            startIcon={<i className='ri-external-link-line' />}
            disabled={!proofImageUrl}
          >
            Mở ảnh gốc
          </Button>
          <Button onClick={closeProofImage}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <ReceiptPreviewDialog
        open={receiptPreviewOpen}
        receiptNumber={selectedReceiptNumber}
        onClose={() => {
          setReceiptPreviewOpen(false)
          setSelectedReceiptNumber(null)
        }}
      />
    </>
  )
}

export default InvoiceListTable
