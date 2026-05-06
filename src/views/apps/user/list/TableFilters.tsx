'use client'

// React Imports
import { useState, useEffect, useCallback, useRef } from 'react'

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
import type { GetUsersParams } from '@/services/userService'
import type { RoleType } from '@/services/roleService'

type Props = {
  onFilterChange: (params: GetUsersParams) => void
  roles: RoleType[]
}

const TableFilters = ({ onFilterChange, roles }: Props) => {
  // States
  const [isActive, setIsActive] = useState<string>('')
  const [keyword, setKeyword] = useState<string>('')
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>('')
  const [role, setRole] = useState<string>('') // store roleId
  const [userType, setUserType] = useState<string>('')
  const [skillLevel, setSkillLevel] = useState<string>('')
  const [certification, setCertification] = useState<string>('')
  const [createdDate, setCreatedDate] = useState<string>('')
  const [createdBy, setCreatedBy] = useState<string>('')
  const keywordTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounce keyword input
  useEffect(() => {
    if (keywordTimeoutRef.current) {
      clearTimeout(keywordTimeoutRef.current)
    }

    keywordTimeoutRef.current = setTimeout(() => {
      setDebouncedKeyword(keyword.trim())
    }, 500)

    return () => {
      if (keywordTimeoutRef.current) {
        clearTimeout(keywordTimeoutRef.current)
      }
    }
  }, [keyword])

  // Handle filter change
  const handleFilterChange = useCallback(() => {
    const params: GetUsersParams = {}

    if (isActive !== '') {
      params.IsActive = isActive === 'true'
    }

    if (debouncedKeyword) {
      params.Keyword = debouncedKeyword
    }

    if (role) {
      params.RoleId = role
      const found = roles?.find(r => r.id === role)

      if (found?.name) params.Role = found.name
    }

    if (userType) {
      params.UserType = userType
    }

    if (skillLevel) {
      params.SkillLevel = skillLevel
    }

    if (certification) {
      params.Certification = certification
    }

    if (createdDate) {
      params.CreatedDate = createdDate
    }

    if (createdBy) {
      params.CreatedBy = createdBy
    }

    onFilterChange(params)
  }, [
    isActive,
    debouncedKeyword,
    role,
    userType,
    skillLevel,
    certification,
    createdDate,
    createdBy,
    onFilterChange,
    roles
  ])

  useEffect(() => {
    handleFilterChange()
  }, [handleFilterChange])

  // Handle reset
  const handleReset = () => {
    setIsActive('')
    setKeyword('')
    setRole('')
    setUserType('')
    setSkillLevel('')
    setCertification('')
    setCreatedDate('')
    setCreatedBy('')
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
            <FormControl fullWidth>
              <InputLabel>Vai trò</InputLabel>
              <Select value={role} label='Vai trò' onChange={e => setRole(e.target.value)}>
                <MenuItem value=''>Tất cả</MenuItem>
                {roles && roles.length > 0 ? (
                  Array.from(new Map(roles.map(r => [r.id, r])).values()).map(roleItem => (
                    <MenuItem key={roleItem.id} value={roleItem.id}>
                      {roleItem.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value='' disabled>
                    Đang tải vai trò...
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          {/*<Grid size={{ xs: 12, sm: 6, md: 3 }}>*/}
          {/*  <FormControl fullWidth>*/}
          {/*    <InputLabel>Loại người dùng</InputLabel>*/}
          {/*    <Select value={userType} label='Loại người dùng' onChange={e => setUserType(e.target.value)}>*/}
          {/*      <MenuItem value=''>Tất cả</MenuItem>*/}
          {/*      <MenuItem value='Admin'>Quản trị viên</MenuItem>*/}
          {/*      <MenuItem value='Coach'>Huấn luyện viên</MenuItem>*/}
          {/*      <MenuItem value='Student'>Học viên</MenuItem>*/}
          {/*      <MenuItem value='Member'>Thành viên</MenuItem>*/}
          {/*    </Select>*/}
          {/*  </FormControl>*/}
          {/*</Grid>*/}
          {/*<Grid size={{ xs: 12, sm: 6, md: 3 }}>*/}
          {/*  <TextField*/}
          {/*    fullWidth*/}
          {/*    label='Trình độ'*/}
          {/*    value={skillLevel}*/}
          {/*    onChange={e => setSkillLevel(e.target.value)}*/}
          {/*    placeholder='Nhập trình độ...'*/}
          {/*  />*/}
          {/*</Grid>*/}
          {/*<Grid size={{ xs: 12, sm: 6, md: 3 }}>*/}
          {/*  <TextField*/}
          {/*    fullWidth*/}
          {/*    label='Chứng chỉ'*/}
          {/*    value={certification}*/}
          {/*    onChange={e => setCertification(e.target.value)}*/}
          {/*    placeholder='Nhập chứng chỉ...'*/}
          {/*  />*/}
          {/*</Grid>*/}
          {/*<Grid size={{ xs: 12, sm: 6, md: 3 }}>*/}
          {/*  <TextField*/}
          {/*    fullWidth*/}
          {/*    label='Ngày tạo'*/}
          {/*    type='date'*/}
          {/*    value={createdDate}*/}
          {/*    onChange={e => setCreatedDate(e.target.value)}*/}
          {/*    InputLabelProps={{ shrink: true }}*/}
          {/*  />*/}
          {/*</Grid>*/}
          {/*<Grid size={{ xs: 12, sm: 6, md: 3 }}>*/}
          {/*  <TextField*/}
          {/*    fullWidth*/}
          {/*    label='Người tạo'*/}
          {/*    value={createdBy}*/}
          {/*    onChange={e => setCreatedBy(e.target.value)}*/}
          {/*    placeholder='Nhập ID người tạo...'*/}
          {/*  />*/}
          {/*</Grid>*/}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
