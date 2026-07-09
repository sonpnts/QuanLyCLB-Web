'use client'

import { useEffect, useState, useCallback } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import classService from '@/services/classService'
import cashHandoverService from '@/services/cashHandoverService'

const currentYear = new Date().getFullYear()
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i)

const formatCurrency = (value: number) => value.toLocaleString('vi-VN') + 'đ'

const TuitionDebtReportView = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [classOptions, setClassOptions] = useState<{ id: string; name: string }[]>([])
  const [branchOptions, setBranchOptions] = useState<{ id: string; name: string }[]>([])

  const [classId, setClassId] = useState<string>('')
  const [branchId, setBranchId] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('months')
  const [sortDescending, setSortDescending] = useState<boolean>(true)

  useEffect(() => {
    const loadOptions = async () => {
      const classRes = await classService.getClasses({ isActive: true, pageSize: 1000 })
      if (classRes.success && classRes.data) {
        setClassOptions(classRes.data.map((c: any) => ({ id: c.id, name: `${c.code || ''} - ${c.name}` })))
      }
    }
    loadOptions()
  }, [])

  useEffect(() => {
    const branchSet = new Map<string, string>()
    classOptions.forEach(c => {
      const parts = c.name.split(' - ')
      if (parts.length > 1) {
        branchSet.set(c.id, parts[0])
      }
    })
  }, [classOptions])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await cashHandoverService.getTuitionDebtReport({
        classId: classId || undefined,
        branchId: branchId || undefined,
        sortBy,
        sortDescending
      })
      if (response.success && response.data) {
        setData(response.data)
      } else {
        setData(null)
      }
    } finally {
      setLoading(false)
    }
  }, [classId, branchId, sortBy, sortDescending])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleExport = async () => {
    await cashHandoverService.exportTuitionDebtReport({
      classId: classId || undefined,
      branchId: branchId || undefined,
      sortBy,
      sortDescending
    })
  }

  const summaryByClass = data?.items?.reduce((acc: any[], item: any) => {
    const existing = acc.find((a: any) => a.classId === item.classId)
    if (existing) {
      existing.studentCount++
      existing.totalMonthsOwed += item.monthsOwed
      existing.totalDebt += item.monthsOwed * item.tuitionFee
    } else {
      acc.push({
        classId: item.classId,
        className: item.className,
        studentCount: 1,
        totalMonthsOwed: item.monthsOwed,
        totalDebt: item.monthsOwed * item.tuitionFee
      })
    }
    return acc
  }, []) || []

  const summaryByBranch = data?.items?.reduce((acc: any[], item: any) => {
    const key = item.branchName || 'Không xác định'
    const existing = acc.find((a: any) => a.name === key)
    if (existing) {
      existing.studentCount++
      existing.totalMonthsOwed += item.monthsOwed
      existing.totalDebt += item.monthsOwed * item.tuitionFee
    } else {
      acc.push({
        name: key,
        studentCount: 1,
        totalMonthsOwed: item.monthsOwed,
        totalDebt: item.monthsOwed * item.tuitionFee
      })
    }
    return acc
  }, []) || []

  return (
    <Box className='flex flex-col gap-6'>
      <Card>
        <CardHeader
          title='Báo cáo nợ học phí võ sinh'
          subheader='Thống kê học viên chưa đóng học phí theo lớp, chi nhánh.'
          action={
            <Button variant='outlined' color='primary' onClick={handleExport} startIcon={<i className='ri-download-line' />}>
              Xuất Excel
            </Button>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Lớp học</InputLabel>
                <Select value={classId} label='Lớp học' onChange={e => setClassId(e.target.value)}>
                  <MenuItem value=''>Tất cả</MenuItem>
                  {classOptions.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Sắp xếp</InputLabel>
                <Select value={sortBy} label='Sắp xếp' onChange={e => setSortBy(e.target.value)}>
                  <MenuItem value='months'>Số tháng nợ</MenuItem>
                  <MenuItem value='name'>Tên học viên</MenuItem>
                  <MenuItem value='class'>Tên lớp</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Thứ tự</InputLabel>
                <Select value={String(sortDescending)} label='Thứ tự' onChange={e => setSortDescending(e.target.value === 'true')}>
                  <MenuItem value='true'>Giảm dần</MenuItem>
                  <MenuItem value='false'>Tăng dần</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant='outlined'>
            <CardContent>
              <Typography variant='body2' color='text.secondary'>Tổng HV nợ</Typography>
              <Typography variant='h4' color='error.main'>{data?.totalStudents ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant='outlined'>
            <CardContent>
              <Typography variant='body2' color='text.secondary'>Tổng nợ</Typography>
              <Typography variant='h4' color='warning.main'>{formatCurrency(data?.totalDebtAmount ?? 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant='outlined'>
            <CardContent>
              <Typography variant='body2' color='text.secondary'>Tổng tháng nợ</Typography>
              <Typography variant='h4'>{data?.items?.reduce((s: number, i: any) => s + i.monthsOwed, 0) ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {summaryByClass.length > 0 && (
        <Card>
          <CardHeader title='Thống kê theo lớp' />
          <CardContent>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Lớp</TableCell>
                  <TableCell align='center'>Số HV nợ</TableCell>
                  <TableCell align='center'>Tổng tháng nợ</TableCell>
                  <TableCell align='right'>Tổng nợ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summaryByClass.sort((a: any, b: any) => b.totalMonthsOwed - a.totalMonthsOwed).map((row: any) => (
                  <TableRow key={row.classId}>
                    <TableCell>{row.className}</TableCell>
                    <TableCell align='center'>{row.studentCount}</TableCell>
                    <TableCell align='center'>{row.totalMonthsOwed}</TableCell>
                    <TableCell align='right'>{formatCurrency(row.totalDebt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {summaryByBranch.length > 0 && (
        <Card>
          <CardHeader title='Thống kê theo chi nhánh' />
          <CardContent>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Chi nhánh</TableCell>
                  <TableCell align='center'>Số HV nợ</TableCell>
                  <TableCell align='center'>Tổng tháng nợ</TableCell>
                  <TableCell align='right'>Tổng nợ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summaryByBranch.sort((a: any, b: any) => b.totalMonthsOwed - a.totalMonthsOwed).map((row: any) => (
                  <TableRow key={row.name}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell align='center'>{row.studentCount}</TableCell>
                    <TableCell align='center'>{row.totalMonthsOwed}</TableCell>
                    <TableCell align='right'>{formatCurrency(row.totalDebt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader title='Danh sách học viên nợ học phí' />
        <CardContent>
          {loading ? (
            <Box className='flex items-center justify-center py-10'>
              <CircularProgress size={30} />
            </Box>
          ) : !data?.items || data.items.length === 0 ? (
            <Alert severity='success'>Không có học viên nào nợ học phí!</Alert>
          ) : (
            <div className='overflow-x-auto'>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Họ và tên</TableCell>
                    <TableCell>Lớp</TableCell>
                    <TableCell>Chi nhánh</TableCell>
                    <TableCell align='center'>Tháng nợ</TableCell>
                    <TableCell align='right'>Tổng nợ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.items.map((item: any) => (
                    <TableRow key={item.studentId}>
                      <TableCell>
                        <Typography fontWeight={500}>{item.studentName}</Typography>
                      </TableCell>
                      <TableCell>{item.className}</TableCell>
                      <TableCell>{item.branchName || '-'}</TableCell>
                      <TableCell align='center'>
                        <div className='flex flex-wrap gap-1'>
                          {item.monthsOwedDetails?.map((m: string, idx: number) => (
                            <Chip key={idx} label={m} size='small' color={item.monthsOwed >= 3 ? 'error' : 'warning'} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography color='error.main' fontWeight={500}>
                          {formatCurrency(item.monthsOwed * item.tuitionFee)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default TuitionDebtReportView
