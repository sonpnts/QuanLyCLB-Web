'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'

import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import tableStyles from '@core/styles/table.module.css'
import { exportToExcel, formatVnDateTime } from '@/utils/exportToExcel'

type LoginLog = {
  id: string
  userId?: string | null
  username?: string | null
  provider?: string
  isSuccess: boolean
  apiEndpoint?: string
  locationAddress?: string | null
  longitude?: number | null
  latitude?: number | null
  deviceInfo?: string | null
  ipAddress?: string | null
  message?: string | null
  createdAt?: string
}

const LoginLogTable = () => {
  const [data, setData] = useState<LoginLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [usernameFilter, setUsernameFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'true' | 'false'>('')

  const load = async () => {
    setLoading(true)

    try {
      const params: Record<string, any> = { pageNumber: page + 1, pageSize }

      if (usernameFilter.trim()) params.username = usernameFilter.trim()
      if (statusFilter !== '') params.isSuccess = statusFilter

      const res = await apiClient.get<any>('/audit-logs/logins', { params })
      const apiResponse = res.data

      if (apiResponse?.isSuccess) {
        setData(apiResponse.data?.records || [])
        setTotal(apiResponse.data?.totalRecords || 0)
      } else {
        setData([])
        setTotal(0)
      }
    } catch (error) {
      logger.error('LoginLogTable', 'load', error)
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, usernameFilter, statusFilter])

  return (
    <Card>
      <CardHeader
        title='Nhật ký đăng nhập'
        subheader='Lịch sử các lần đăng nhập (thành công và thất bại)'
        action={
          <Button
            variant='outlined'
            color='success'
            startIcon={<i className='ri-file-excel-2-line' />}
            disabled={data.length === 0}
            onClick={() => {
              exportToExcel({
                filename: 'nhat-ky-dang-nhap',
                rows: data,
                columns: [
                  { header: 'Thời gian', accessor: 'createdAt', formatter: formatVnDateTime },
                  { header: 'Username', accessor: 'username' },
                  { header: 'Phương thức', accessor: 'provider' },
                  { header: 'Kết quả', accessor: 'isSuccess', formatter: v => (v ? 'Thành công' : 'Thất bại') },
                  { header: 'Endpoint', accessor: 'apiEndpoint' },
                  { header: 'IP', accessor: 'ipAddress' },
                  { header: 'Thiết bị', accessor: 'deviceInfo' },
                  { header: 'Vị trí', accessor: 'locationAddress' },
                  { header: 'Thông báo', accessor: 'message' }
                ]
              })
            }}
          >
            Xuất Excel
          </Button>
        }
      />
      <Box className='flex gap-3 px-5 pb-3 flex-wrap'>
        <TextField
          size='small'
          label='Username'
          value={usernameFilter}
          onChange={e => {
            setUsernameFilter(e.target.value)
            setPage(0)
          }}
          placeholder='Lọc theo username...'
        />
        <TextField
          size='small'
          select
          label='Trạng thái'
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value as any)
            setPage(0)
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value=''>Tất cả</MenuItem>
          <MenuItem value='true'>Thành công</MenuItem>
          <MenuItem value='false'>Thất bại</MenuItem>
        </TextField>
      </Box>
      <div className='overflow-x-auto'>
        {loading ? (
          <Box className='flex justify-center p-8'>
            <CircularProgress />
          </Box>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Username</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th>IP</th>
                <th>Thiết bị</th>
                <th>Vị trí</th>
                <th>Thông báo</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={8} className='text-center p-6'>
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                data.map(row => (
                  <tr key={row.id}>
                    <td>
                      <Typography variant='body2'>{formatVnDateTime(row.createdAt)}</Typography>
                    </td>
                    <td>
                      <Typography variant='body2' className='font-medium'>
                        {row.username || '-'}
                      </Typography>
                    </td>
                    <td>
                      <Chip label={row.provider || '-'} size='small' variant='tonal' />
                    </td>
                    <td>
                      <Chip
                        label={row.isSuccess ? 'Thành công' : 'Thất bại'}
                        size='small'
                        color={row.isSuccess ? 'success' : 'error'}
                        variant='tonal'
                      />
                    </td>
                    <td>
                      <Typography variant='body2'>{row.ipAddress || '-'}</Typography>
                    </td>
                    <td>
                      <Typography variant='body2' className='max-w-[180px] truncate' title={row.deviceInfo || ''}>
                        {row.deviceInfo || '-'}
                      </Typography>
                    </td>
                    <td>
                      <Typography variant='body2'>{row.locationAddress || '-'}</Typography>
                    </td>
                    <td>
                      <Typography variant='body2' color='text.secondary'>
                        {row.message || '-'}
                      </Typography>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      <TablePagination
        component='div'
        count={total}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={e => {
          setPageSize(parseInt(e.target.value, 10))
          setPage(0)
        }}
        rowsPerPageOptions={[10, 20, 50, 100]}
      />
    </Card>
  )
}

export default LoginLogTable
