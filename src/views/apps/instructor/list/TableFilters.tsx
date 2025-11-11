'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

// Type Imports
import type { GetInstructorsParams } from '@/services/instructorService'

type Props = {
  onFilterChange: (params: GetInstructorsParams) => void
}

const TableFilters = ({ onFilterChange }: Props) => {
  // States
  const [isActive, setIsActive] = useState<string>('')
  const [keyword, setKeyword] = useState<string>('')
  const [skillLevel, setSkillLevel] = useState<string>('')
  const [certification, setCertification] = useState<string>('')
  const [isLeadCoach, setIsLeadCoach] = useState<string>('')

  // Handle filter change
  useEffect(() => {
    const params: GetInstructorsParams = {}

    if (isActive !== '') {
      params.IsActive = isActive === 'true'
    }

    if (keyword) {
      params.Keyword = keyword
    }

    if (skillLevel) {
      params.SkillLevel = skillLevel
    }

    if (certification) {
      params.Certification = certification
    }

    if (isLeadCoach !== '') {
      params.IsLeadCoach = isLeadCoach === 'true'
    }

    onFilterChange(params)
  }, [isActive, keyword, skillLevel, certification, isLeadCoach, onFilterChange])

  // Handle reset
  const handleReset = () => {
    setIsActive('')
    setKeyword('')
    setSkillLevel('')
    setCertification('')
    setIsLeadCoach('')
  }

  return (
    <Card>
      <CardContent>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select value={isActive} label='Trạng thái' onChange={e => setIsActive(e.target.value)}>
                <MenuItem value=''>Tất cả</MenuItem>
                <MenuItem value='true'>Hoạt động</MenuItem>
                <MenuItem value='false'>Không hoạt động</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label='Từ khóa'
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder='Tìm kiếm theo tên, email...'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label='Trình độ'
              value={skillLevel}
              onChange={e => setSkillLevel(e.target.value)}
              placeholder='Nhập trình độ...'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label='Chứng chỉ'
              value={certification}
              onChange={e => setCertification(e.target.value)}
              placeholder='Nhập chứng chỉ...'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Huấn luyện viên chính</InputLabel>
              <Select value={isLeadCoach} label='Huấn luyện viên chính' onChange={e => setIsLeadCoach(e.target.value)}>
                <MenuItem value=''>Tất cả</MenuItem>
                <MenuItem value='true'>Có</MenuItem>
                <MenuItem value='false'>Không</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Box className='flex gap-2'>
              <Button variant='outlined' onClick={handleReset}>
                Đặt lại bộ lọc
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default TableFilters





