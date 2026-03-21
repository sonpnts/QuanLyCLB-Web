'use client'

import { memo, useEffect, useState } from 'react'

import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import type { SelectChangeEvent } from '@mui/material/Select'

import type { ProductType } from '@/types/apps/productTypes'
import type { ClassType } from '@/types/apps/classTypes'
import type { UsersType } from '@/types/apps/userTypes'
import type { GetProductSalesParams } from '@/services/productSaleService'

type Props = {
  products: ProductType[]
  classes: ClassType[]
  collectors: UsersType[]
  onFilterChange: (params: GetProductSalesParams) => void
}

const TableFilters = memo(({ products, classes, collectors, onFilterChange }: Props) => {
  const [productId, setProductId] = useState('')
  const [classId, setClassId] = useState('')
  const [soldByUserId, setSoldByUserId] = useState('')
  const [saleDateFrom, setSaleDateFrom] = useState('')
  const [saleDateTo, setSaleDateTo] = useState('')

  useEffect(() => {
    const params: GetProductSalesParams = {}

    if (productId) params.productId = productId
    if (classId) params.classId = classId
    if (soldByUserId) params.soldByUserId = soldByUserId
    if (saleDateFrom) params.saleDateFrom = saleDateFrom
    if (saleDateTo) params.saleDateTo = saleDateTo

    onFilterChange(params)
  }, [productId, classId, soldByUserId, saleDateFrom, saleDateTo, onFilterChange])

  return (
    <CardContent>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Sản phẩm</InputLabel>
            <Select
              label='Sản phẩm'
              value={productId}
              onChange={(event: SelectChangeEvent) => setProductId(event.target.value)}
            >
              <MenuItem value=''>Tất cả</MenuItem>
              {products.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Lớp</InputLabel>
            <Select
              label='Lớp'
              value={classId}
              onChange={(event: SelectChangeEvent) => setClassId(event.target.value)}
            >
              <MenuItem value=''>Tất cả</MenuItem>
              {classes.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Người thu tiền</InputLabel>
            <Select
              label='Người thu tiền'
              value={soldByUserId}
              onChange={(event: SelectChangeEvent) => setSoldByUserId(event.target.value)}
            >
              <MenuItem value=''>Tất cả</MenuItem>
              {collectors.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type='date'
            label='Từ ngày'
            InputLabelProps={{ shrink: true }}
            value={saleDateFrom}
            onChange={event => setSaleDateFrom(event.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type='date'
            label='Đến ngày'
            InputLabelProps={{ shrink: true }}
            value={saleDateTo}
            onChange={event => setSaleDateTo(event.target.value)}
          />
        </Grid>
      </Grid>
    </CardContent>
  )
})

TableFilters.displayName = 'ProductSaleTableFilters'

export default TableFilters
