'use client'

import { useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import productService from '@/services/productService'
import type { ProductReportSummaryType } from '@/types/apps/productTypes'
import { buildModulePermissionMap } from '@/utils/rbac'

import tableStyles from '@core/styles/table.module.css'

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const ProductReportView = () => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()

  const reportPermissions = useMemo(
    () => buildModulePermissionMap(auth?.permissions, auth?.roles, 'ProductReport'),
    [auth?.permissions, auth?.roles]
  )

  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<ProductReportSummaryType | null>(null)

  const [filters, setFilters] = useState({
    fromDate: toDateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    toDate: toDateInputValue(new Date())
  })

  const loadSummary = async () => {
    try {
      setLoading(true)
      const response = await productService.getReportSummary(filters.fromDate || undefined, filters.toDate || undefined)

      if (!response.success || !response.data) {
        showNotification(response.message || 'Không thể tải báo cáo sản phẩm.', 'error')
        
return
      }

      setSummary(response.data)
    } catch {
      showNotification('Không thể tải báo cáo sản phẩm.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSummary()
  }, [])

  if (!reportPermissions.canView) {
    return <Alert severity='warning'>Bạn không có quyền xem báo cáo sản phẩm.</Alert>
  }

  return (
    <Stack spacing={5}>
      <Card>
        <CardHeader title='Báo cáo sản phẩm' subheader='Theo dõi bán hàng, tồn kho và biến động kho sản phẩm.' />
        <Divider />
        <CardContent>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type='date'
                label='Từ ngày'
                slotProps={{ inputLabel: { shrink: true } }}
                value={filters.fromDate}
                onChange={event => setFilters(prev => ({ ...prev, fromDate: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type='date'
                label='Đến ngày'
                slotProps={{ inputLabel: { shrink: true } }}
                value={filters.toDate}
                onChange={event => setFilters(prev => ({ ...prev, toDate: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box className='flex items-end h-full'>
                <Button variant='contained' onClick={() => void loadSummary()} disabled={loading}>
                  {loading ? 'Đang tải...' : 'Xem báo cáo'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card variant='outlined'>
            <CardContent>
              <Typography color='text.secondary'>Tổng sản phẩm</Typography>
              <Typography variant='h4'>{summary?.totalProducts || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card variant='outlined'>
            <CardContent>
              <Typography color='text.secondary'>Tổng biến thể</Typography>
              <Typography variant='h4'>{summary?.totalVariants || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card variant='outlined'>
            <CardContent>
              <Typography color='text.secondary'>Tổng tồn kho</Typography>
              <Typography variant='h4'>{summary?.totalUnitsInStock || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card variant='outlined'>
            <CardContent>
              <Typography color='text.secondary'>Giá trị tồn kho</Typography>
              <Typography variant='h6'>{formatCurrency(Number(summary?.totalStockValue || 0))}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={5}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <Card>
            <CardHeader title='Top sản phẩm bán chạy' />
            <Divider />
            <CardContent>
              <div className='overflow-x-auto'>
                <table className={tableStyles.table}>
                  <thead>
                    <tr>
                      {/*<th>Mã sản phẩm</th>*/}
                      <th>Tên sản phẩm</th>
                      <th>Biến thể</th>
                      <th>Số lượng bán</th>
                      <th>Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summary?.topSellingProducts || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className='text-center'>
                          {loading ? 'Đang tải...' : 'Chưa có dữ liệu bán hàng'}
                        </td>
                      </tr>
                    ) : (
                      (summary?.topSellingProducts || []).map(item => (
                        <tr key={`${item.productId}-${item.productVariantLabel || 'base'}`}>
                          {/*<td>{item.productCode}</td>*/}
                          <td>{item.productName}</td>
                          <td>{item.productVariantLabel || '-'}</td>
                          <td>{item.soldQuantity}</td>
                          <td>{formatCurrency(item.revenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 6 }}>
          <Card>
            <CardHeader title='Biến động kho gần đây' />
            <Divider />
            <CardContent>
              <div className='overflow-x-auto'>
                <table className={tableStyles.table}>
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Sản phẩm</th>
                      <th>Biến thể</th>
                      <th>Loại giao dịch</th>
                      <th>Biến động</th>
                      <th>Tồn sau giao dịch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summary?.recentTransactions || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className='text-center'>
                          {loading ? 'Đang tải...' : 'Chưa có biến động kho'}
                        </td>
                      </tr>
                    ) : (
                      (summary?.recentTransactions || []).map(item => (
                        <tr key={item.id}>
                          <td>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '-'}</td>
                          <td>{item.productName}</td>
                          <td>{item.productVariantLabel || '-'}</td>
                          <td>{item.transactionType}</td>
                          <td>{item.quantityChange > 0 ? `+${item.quantityChange}` : item.quantityChange}</td>
                          <td>{item.stockAfterTransaction}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default ProductReportView
