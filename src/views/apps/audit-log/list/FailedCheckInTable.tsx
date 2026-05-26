'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import TablePagination from '@mui/material/TablePagination'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'

import { apiClient } from '@/utils/apiClient'
import { logger } from '@/utils/logger'
import tableStyles from '@core/styles/table.module.css'
import { exportToExcel, formatVnDateTime } from '@/utils/exportToExcel'

type FailedAttempt = {
  id: string
  userId: string
  userName?: string
  attemptedAt: string
  latitude: number
  longitude: number
  nearestBranchId?: string | null
  nearestBranchName?: string | null
  distanceToNearestBranchMeters?: number | null
  allowedRadiusMeters?: number | null
  reason: string
  deviceInfo?: string | null
  ipAddress?: string | null
  createdAt?: string
}

const FailedCheckInTable = () => {
  const [data, setData] = useState<FailedAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<any>('/attendance/failed-attempts', {
        params: { pageNumber: page + 1, pageSize }
      })
      const apiResponse = res.data

      if (apiResponse?.isSuccess) {
        const records = apiResponse.data?.records || apiResponse.data?.items || apiResponse.data || []
        const totalRecords =
          apiResponse.data?.totalRecords ?? apiResponse.data?.totalCount ?? apiResponse.data?.TotalRecords ?? records.length

        setData(records)
        setTotal(Number(totalRecords || 0))
      } else {
        setData([])
        setTotal(0)
      }
    } catch (error) {
      logger.error('FailedCheckInTable', 'load', error)
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize])

  const formatMeters = (m?: number | null) =>
    m === null || m === undefined ? '-' : m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`

  return (
    <Card>
      <CardHeader
        title='Check-in thất bại'
        subheader='Các lần chấm công bị từ chối do vị trí cách xa chi nhánh'
        action={
          <Button
            variant='outlined'
            color='success'
            startIcon={<i className='ri-file-excel-2-line' />}
            disabled={data.length === 0}
            onClick={() => {
              exportToExcel({
                filename: 'check-in-that-bai',
                rows: data,
                columns: [
                  { header: 'Thời gian thử', accessor: 'attemptedAt', formatter: formatVnDateTime },
                  { header: 'User ID', accessor: 'userId' },
                  { header: 'Họ tên', accessor: 'userName' as any },
                  { header: 'Latitude', accessor: 'latitude' },
                  { header: 'Longitude', accessor: 'longitude' },
                  { header: 'Chi nhánh gần nhất', accessor: 'nearestBranchName' as any },
                  { header: 'Khoảng cách (m)', accessor: 'distanceToNearestBranchMeters' as any },
                  { header: 'Bán kính cho phép (m)', accessor: 'allowedRadiusMeters' as any },
                  { header: 'Lý do', accessor: 'reason' },
                  { header: 'IP', accessor: 'ipAddress' },
                  { header: 'Thiết bị', accessor: 'deviceInfo' }
                ]
              })
            }}
          >
            Xuất Excel
          </Button>
        }
      />
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
                <th>Người dùng</th>
                <th>Vị trí</th>
                <th>Chi nhánh gần nhất</th>
                <th>Khoảng cách</th>
                <th>Bán kính</th>
                <th>Lý do</th>
                <th>IP</th>
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
                      <Typography variant='body2'>{formatVnDateTime(row.attemptedAt)}</Typography>
                    </td>
                    <td>
                      <Typography variant='body2' className='font-medium'>
                        {row.userName || row.userId.slice(0, 8) + '...'}
                      </Typography>
                    </td>
                    <td>
                      <Typography variant='caption' color='text.secondary'>
                        {row.latitude?.toFixed(5)}, {row.longitude?.toFixed(5)}
                      </Typography>
                    </td>
                    <td>
                      <Typography variant='body2'>{row.nearestBranchName || '-'}</Typography>
                    </td>
                    <td>
                      <Chip
                        label={formatMeters(row.distanceToNearestBranchMeters)}
                        size='small'
                        color='warning'
                        variant='tonal'
                      />
                    </td>
                    <td>
                      <Typography variant='body2'>{formatMeters(row.allowedRadiusMeters)}</Typography>
                    </td>
                    <td>
                      <Typography variant='body2' color='error.main'>
                        {row.reason || '-'}
                      </Typography>
                    </td>
                    <td>
                      <Typography variant='body2'>{row.ipAddress || '-'}</Typography>
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

export default FailedCheckInTable
