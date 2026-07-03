'use client'

// React Imports
import { useState, useEffect, useRef, memo } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import type { SelectChangeEvent } from '@mui/material/Select'

// Service Imports
import type { GetAuditLogsParams } from '@/services/auditLogService'

// Type Imports
import { auditActionLabels } from '@/types/apps/auditLogTypes'

interface TableFiltersProps {
  onFilterChange: (params: GetAuditLogsParams) => void
}

const entityTypes = [
  'Student',
  'Class',
  'ClassTransferRequest',
  'Payment',
  'BeltExam',
  'Attendance',
  'Branch',
  'Instructor',
  'User'
]

const userRoles = ['Admin', 'Coach', 'Assistant', 'Student']

const TableFilters = memo(({ onFilterChange }: TableFiltersProps) => {
  const [action, setAction] = useState<string>('')
  const [entityType, setEntityType] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [isSuccess, setIsSuccess] = useState<string>('')
  const [timestampFrom, setTimestampFrom] = useState<string>('')
  const [timestampTo, setTimestampTo] = useState<string>('')

  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false

      return
    }

    const params: GetAuditLogsParams = {}

    if (action) params.action = action
    if (entityType) params.entityType = entityType
    if (userRole) params.userRole = userRole
    if (userName.trim()) params.userName = userName.trim()
    if (isSuccess !== '') params.isSuccess = isSuccess === 'true'
    if (timestampFrom) params.timestampFrom = timestampFrom
    if (timestampTo) params.timestampTo = timestampTo
    onFilterChange(params)
  }, [action, entityType, userRole, userName, isSuccess, timestampFrom, timestampTo, onFilterChange])

  return (
    <CardContent>
      <Grid container spacing={5}>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth size='small'>
            <InputLabel>Hành động</InputLabel>
            <Select value={action} onChange={(e: SelectChangeEvent) => setAction(e.target.value)} label='Hành động'>
              <MenuItem value=''>Tất cả</MenuItem>
              {Object.entries(auditActionLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth size='small'>
            <InputLabel>Đối tượng</InputLabel>
            <Select
              value={entityType}
              onChange={(e: SelectChangeEvent) => setEntityType(e.target.value)}
              label='Đối tượng'
            >
              <MenuItem value=''>Tất cả</MenuItem>
              {entityTypes.map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <TextField
            fullWidth
            size='small'
            label='Người dùng'
            value={userName}
            onChange={e => setUserName(e.target.value)}
            placeholder='Tìm theo tên...'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth size='small'>
            <InputLabel>Vai trò</InputLabel>
            <Select value={userRole} onChange={(e: SelectChangeEvent) => setUserRole(e.target.value)} label='Vai trò'>
              <MenuItem value=''>Tất cả</MenuItem>
              {userRoles.map(role => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth size='small'>
            <InputLabel>Kết quả</InputLabel>
            <Select value={isSuccess} onChange={(e: SelectChangeEvent) => setIsSuccess(e.target.value)} label='Kết quả'>
              <MenuItem value=''>Tất cả</MenuItem>
              <MenuItem value='true'>Thành công</MenuItem>
              <MenuItem value='false'>Thất bại</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='Từ ngày'
            value={timestampFrom}
            onChange={e => setTimestampFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <TextField
            fullWidth
            size='small'
            type='date'
            label='Đến ngày'
            value={timestampTo}
            onChange={e => setTimestampTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
    </CardContent>
  )
})

TableFilters.displayName = 'AuditLogTableFilters'

export default TableFilters
