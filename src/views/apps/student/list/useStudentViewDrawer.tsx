'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import studentService from '@/services/studentService'
import { useAuth } from '@/contexts/authContext'
import { useNotification } from '@/contexts/notificationContext'
import type { StudentType } from '@/types/apps/studentTypes'
import { buildModulePermissionMap } from '@/utils/rbac'

import EditStudentDrawer from './EditStudentDrawer'
import ViewStudentDrawer from './ViewStudentDrawer'

type Options = {
  onStudentUpdated?: (student: StudentType) => void
  enableEdit?: boolean
}

// Hook dùng chung cho các trang danh sách hiển thị tên học viên.
// Bấm vào tên học viên => mở drawer XEM thông tin (ViewStudentDrawer);
// nếu có quyền Student.Update thì trong drawer xem có nút mở drawer chỉnh sửa.
const useStudentViewDrawer = (options?: Options) => {
  const { auth } = useAuth()
  const { showNotification } = useNotification()

  const studentPermissions = useMemo(
    () => buildModulePermissionMap(auth?.permissions, auth?.roles, 'Student'),
    [auth?.permissions, auth?.roles]
  )

  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null)
  const [viewStudentOpen, setViewStudentOpen] = useState(false)
  const [editStudentOpen, setEditStudentOpen] = useState(false)
  const [loadingStudent, setLoadingStudent] = useState(false)

  const showNotificationRef = useRef(showNotification)

  showNotificationRef.current = showNotification

  // useCallback để các trang có thể dùng trong useMemo (columns) mà không bị stale closure
  const openStudentDrawer = useCallback(async (studentId?: string | null) => {
    if (!studentId) return

    try {
      setLoadingStudent(true)
      const result = await studentService.getStudentById(studentId)

      if (result.success && result.data) {
        setSelectedStudent(result.data)
        setViewStudentOpen(true)
      } else {
        showNotificationRef.current(result.message || 'Không thể tải thông tin học viên.', 'error')
      }
    } finally {
      setLoadingStudent(false)
    }
  }, [])

  const handleClose = () => {
    setViewStudentOpen(false)
    setEditStudentOpen(false)
    setSelectedStudent(null)
  }

  const studentDrawerElement: ReactNode = (
    <>
      {loadingStudent && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: theme => theme.zIndex.modal + 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,0.45)'
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <ViewStudentDrawer
        open={viewStudentOpen}
        onClose={handleClose}
        student={selectedStudent}
        onEdit={
          options?.enableEdit === false || !studentPermissions.canUpdate
            ? undefined
            : student => {
                setViewStudentOpen(false)
                setSelectedStudent(student)
                setEditStudentOpen(true)
              }
        }
      />
      <EditStudentDrawer
        open={editStudentOpen}
        onClose={() => setEditStudentOpen(false)}
        student={selectedStudent}
        onSaved={updated => {
          setSelectedStudent(updated)
          options?.onStudentUpdated?.(updated)
        }}
      />
    </>
  )

  return { openStudentDrawer, studentDrawerElement }
}

export default useStudentViewDrawer
