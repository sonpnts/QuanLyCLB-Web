'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { ClassType } from '@/types/apps/classTypes'
import type { BranchType } from '@/types/apps/branchTypes'
import type { UsersType } from '@/types/apps/userTypes'
import type { ClassInstructorSummaryType, InstructorClassCollectionType } from '@/types/apps/financeTypes'
import classService from '@/services/classService'
import branchService from '@/services/branchService'
import userService from '@/services/userService'
import financeService from '@/services/financeService'
import { useNotification } from '@/contexts/notificationContext'
import { useAuth } from '@/contexts/authContext'

import tableStyles from '@core/styles/table.module.css'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

type SummaryCardProps = { title: string; amount: number; color?: string }

const SummaryCard = ({ title, amount, color = 'success.main' }: SummaryCardProps) => (
  <Card variant='outlined' sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant='body2' color='text.secondary' gutterBottom>
        {title}
      </Typography>
      <Typography variant='h5' color={color} sx={{ mt: 1 }}>
        {formatCurrency(amount)}
      </Typography>
    </CardContent>
  </Card>
)

const FinanceSummaryView = () => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()

  const [classes, setClasses] = useState<ClassType[]>([])
  const [branches, setBranches] = useState<BranchType[]>([])
  const [instructors, setInstructors] = useState<UsersType[]>([])
  const [loading, setLoading] = useState(false)

  const [filters, setFilters] = useState({
    classId: '',
    branchId: '',
    instructorId: '',
    fromDate: '',
    toDate: '',
    asOfDate: new Date().toISOString().split('T')[0]
  })

  const [classTuitionAmount, setClassTuitionAmount] = useState(0)
  const [productSalesAmount, setProductSalesAmount] = useState(0)
  const [branchAmount, setBranchAmount] = useState(0)
  const [instructorSummary, setInstructorSummary] = useState<ClassInstructorSummaryType | null>(null)
  const [collections, setCollections] = useState<InstructorClassCollectionType[]>([])

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [classRes, branchRes, instructorRes] = await Promise.all([
          classService.getClasses({}),
          branchService.getBranches({}),
          userService.getCoaches()
        ])

        const nextClasses = classRes.success && classRes.data ? classRes.data : []
        const nextBranches = branchRes.success && branchRes.data ? branchRes.data : []
        const nextInstructors = instructorRes.success && instructorRes.data ? instructorRes.data : []

        setClasses(nextClasses)
        setBranches(nextBranches)
        setInstructors(nextInstructors)

        const defaultInstructorId =
          nextInstructors.find(item => item.id === auth?.user.id)?.id || nextInstructors[0]?.id || ''

        setFilters(prev => ({
          ...prev,
          classId: prev.classId || nextClasses[0]?.id || '',
          branchId: prev.branchId || nextBranches[0]?.id || '',
          instructorId: prev.instructorId || defaultInstructorId
        }))
      } catch (error) {
        showNotification('Không thể tải dữ liệu danh mục thống kê.', 'error')
      }
    }

    loadReferences()
  }, [auth?.user.id, showNotification])

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true)

      if (filters.classId) {
        const tuitionRes = await financeService.getClassTuitionSummary(filters.classId, {
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined
        })

        if (tuitionRes.success && tuitionRes.data) {
          setClassTuitionAmount(tuitionRes.data.amount)
        }
      }

      const productSalesRes = await financeService.getProductSalesSummary({
        classId: filters.classId || undefined,
        branchId: filters.branchId || undefined,
        instructorId: filters.instructorId || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined
      })

      if (productSalesRes.success && productSalesRes.data) {
        setProductSalesAmount(productSalesRes.data.amount)
      }

      if (filters.classId && filters.instructorId) {
        const instructorRes = await financeService.getClassInstructorSummary(
          filters.classId,
          filters.instructorId,
          {
            fromDate: filters.fromDate || undefined,
            toDate: filters.toDate || undefined
          }
        )

        if (instructorRes.success && instructorRes.data) {
          setInstructorSummary(instructorRes.data)
        }
      } else {
        setInstructorSummary(null)
      }

      if (filters.branchId) {
        const branchRes = await financeService.getBranchSummary(filters.branchId, {
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined
        })

        if (branchRes.success && branchRes.data) {
          setBranchAmount(branchRes.data.amount)
        }
      }

      const classCollectionsRes = filters.instructorId
        ? await financeService.getClassCollectionsByInstructor(filters.instructorId, filters.asOfDate || undefined)
        : await financeService.getMyClassCollections(filters.asOfDate || undefined)

      if (classCollectionsRes.success && classCollectionsRes.data) {
        setCollections(classCollectionsRes.data)
      } else {
        setCollections([])
      }
    } catch (error) {
      showNotification('Không thể tải dữ liệu thống kê tài chính.', 'error')
    } finally {
      setLoading(false)
    }
  }, [
    filters.classId,
    filters.branchId,
    filters.instructorId,
    filters.fromDate,
    filters.toDate,
    filters.asOfDate,
    showNotification
  ])

  useEffect(() => {
    if (!filters.classId && !filters.branchId && !filters.instructorId) return
    loadSummary()
  }, [loadSummary, filters.classId, filters.branchId, filters.instructorId])

  const instructorTotal = useMemo(() => instructorSummary?.totalCollected || 0, [instructorSummary])

  return (
    <Stack spacing={5}>
      <Card>
        <CardHeader title='Thống kê tài chính' />
        <Divider />
        <CardContent>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Lớp</InputLabel>
                <Select
                  label='Lớp'
                  value={filters.classId}
                  onChange={event => setFilters(prev => ({ ...prev, classId: event.target.value }))}
                >
                  <MenuItem value=''>-- Tất cả --</MenuItem>
                  {classes.map(item => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Chi nhánh</InputLabel>
                <Select
                  label='Chi nhánh'
                  value={filters.branchId}
                  onChange={event => setFilters(prev => ({ ...prev, branchId: event.target.value }))}
                >
                  <MenuItem value=''>-- Tất cả --</MenuItem>
                  {branches.map(item => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Huấn luyện viên</InputLabel>
                <Select
                  label='Huấn luyện viên'
                  value={filters.instructorId}
                  onChange={event => setFilters(prev => ({ ...prev, instructorId: event.target.value }))}
                >
                  <MenuItem value=''>Của tôi</MenuItem>
                  {instructors.map(item => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
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
              <TextField
                fullWidth
                type='date'
                label='Tính đến ngày (bàn giao)'
                slotProps={{ inputLabel: { shrink: true } }}
                value={filters.asOfDate}
                onChange={event => setFilters(prev => ({ ...prev, asOfDate: event.target.value }))}
              />
            </Grid>
          </Grid>

          <div className='mt-4'>
            <Button variant='contained' onClick={loadSummary} startIcon={<i className='ri-refresh-line' />}>
              Làm mới thống kê
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className='flex items-center justify-center py-10'>
            <CircularProgress />
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard title='Tổng học phí (lớp đã chọn)' amount={classTuitionAmount} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard title='Tổng doanh thu bán sản phẩm' amount={productSalesAmount} color='info.main' />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard title='Tổng tiền HLV đã thu (lớp)' amount={instructorTotal} color='warning.main' />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard title='Tổng doanh thu chi nhánh' amount={branchAmount} color='secondary.main' />
            </Grid>
          </Grid>

          <Card>
            <CardHeader title='Chi tiết thu theo lớp của huấn luyện viên' />
            <Divider />
            <CardContent>
              <div className='overflow-x-auto'>
                <table className={tableStyles.table}>
                  <thead>
                    <tr>
                      <th>Lớp</th>
                      <th>Học phí thu được</th>
                      <th>Bán sản phẩm</th>
                      <th>Tổng thu</th>
                      <th>Đã bàn giao</th>
                      <th>Còn lại</th>
                      <th>Tính đến</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collections.length === 0 ? (
                      <tr>
                        <td className='text-center' colSpan={7}>
                          Không có dữ liệu
                        </td>
                      </tr>
                    ) : (
                      collections.map(item => (
                        <tr key={`${item.instructorId}-${item.classId}`}>
                          <td>
                            <Typography variant='body2' className='font-medium'>
                              {item.className || item.classId}
                            </Typography>
                          </td>
                          <td>{formatCurrency(item.tuitionCollectedToDate)}</td>
                          <td>{formatCurrency(item.productSalesCollectedToDate)}</td>
                          <td>
                            <Typography variant='body2' color='success.main' className='font-medium'>
                              {formatCurrency(item.totalCollectedToDate)}
                            </Typography>
                          </td>
                          <td>{formatCurrency(item.totalHandedOver)}</td>
                          <td>
                            <Typography
                              variant='body2'
                              color={item.availableToHandover > 0 ? 'warning.main' : 'text.secondary'}
                            >
                              {formatCurrency(item.availableToHandover)}
                            </Typography>
                          </td>
                          <td>
                            <Typography variant='body2' color='text.secondary'>
                              {item.asOf ? new Date(item.asOf).toLocaleDateString('vi-VN') : '-'}
                            </Typography>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </Stack>
  )
}

export default FinanceSummaryView
