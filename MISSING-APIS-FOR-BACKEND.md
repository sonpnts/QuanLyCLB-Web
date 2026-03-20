# API Status - Hệ Thống Quản Lý Câu Lạc Bộ Võ Thuật

## ✅ API ĐÃ CÓ (Theo API Documentation)

### Authentication

- POST `/api/Auth/google` - Login với Google
- POST `/api/Auth/password` - Login với Password
- POST `/api/Auth/refresh` - Refresh Token
- POST `/api/Auth/register` - Register

### Student Management

- GET `/api/Students` - Lấy danh sách (keyword, classId, beltLevelId, gender, enrollmentStatus)
- GET `/api/Students/{id}` - Lấy theo ID
- POST `/api/Students` - Tạo mới
- PUT `/api/Students/{id}` - Cập nhật
- DELETE `/api/Students/{id}` - Xóa
- POST `/api/Students/{id}/restore` - Khôi phục
- GET `/api/Students/{id}/enrollments` - Lấy enrollments
- POST `/api/Students/enroll` - Đăng ký vào lớp
- GET `/api/Students/by-class/{classId}` - Lấy theo lớp
- GET `/api/Students/{id}/tuition-status` - Kiểm tra học phí
- GET `/api/Students/{id}/exam-history` - Lịch sử thi
- GET `/api/Students/{id}/payments` - Lịch sử thanh toán
- GET `/api/Students/{id}/attendance` - Lịch sử điểm danh

### Class Management

- GET `/api/Classes` - Lấy danh sách (keyword)
- GET `/api/Classes/{id}` - Lấy theo ID
- POST `/api/Classes` - Tạo mới
- PUT `/api/Classes/{id}` - Cập nhật
- DELETE `/api/Classes/{id}` - Xóa
- POST `/api/Classes/{id}/restore` - Khôi phục
- GET `/api/Classes/{classId}/schedules` - Lấy lịch học
- POST `/api/Classes/{classId}/schedules` - Tạo lịch học hàng loạt
- GET `/api/Classes/{classId}/students` - Lấy học viên
- GET `/api/Classes/{classId}/attendance` - Lấy điểm danh
- GET `/api/Classes/{classId}/payments` - Lấy thanh toán
- POST `/api/Classes/{classId}/duplicate` - Nhân bản lớp

### Schedule Management

- GET `/api/Schedules` - Lấy danh sách (classId, branchId, dayOfWeek)
- GET `/api/Schedules/{id}` - Lấy theo ID
- POST `/api/Schedules` - Tạo mới
- PUT `/api/Schedules/{id}` - Cập nhật
- DELETE `/api/Schedules/{id}` - Xóa
- POST `/api/Schedules/{id}/restore` - Khôi phục
- GET `/api/Schedules/by-date` - Lấy theo ngày
- GET `/api/Schedules/by-instructor/{instructorId}` - Lấy theo HLV

### Instructor Management

- GET `/api/Instructors` - Lấy danh sách (skillLevel, certification)
- GET `/api/Instructors/{id}` - Lấy theo ID
- POST `/api/Instructors` - Tạo mới
- PUT `/api/Instructors/{id}` - Cập nhật
- DELETE `/api/Instructors/{id}` - Xóa
- POST `/api/Instructors/{id}/restore` - Khôi phục
- GET `/api/Instructors/{id}/statistics` - Thống kê
- GET `/api/Instructors/{id}/schedules` - Lịch dạy
- GET `/api/Instructors/{id}/classes` - Danh sách lớp

### Branch Management

- GET `/api/Branches` - Lấy danh sách
- GET `/api/Branches/{id}` - Lấy theo ID
- POST `/api/Branches` - Tạo mới
- PUT `/api/Branches/{id}` - Cập nhật
- DELETE `/api/Branches/{id}` - Xóa
- POST `/api/Branches/{id}/restore` - Khôi phục

### Belt Level Management

- GET `/api/belt-levels` - Lấy danh sách
- GET `/api/belt-levels/{id}` - Lấy theo ID
- POST `/api/belt-levels` - Tạo mới
- PUT `/api/belt-levels/{id}` - Cập nhật
- DELETE `/api/belt-levels/{id}` - Xóa

### Class Transfer Management

- GET `/api/class-transfers` - Lấy danh sách
- POST `/api/class-transfers` - Tạo yêu cầu
- PUT `/api/class-transfers/{id}` - Cập nhật
- POST `/api/class-transfers/{id}/approve` - Phê duyệt
- POST `/api/class-transfers/{id}/reject` - Từ chối
- POST `/api/class-transfers/{id}/cancel` - Hủy
- DELETE `/api/class-transfers/{id}` - Xóa
- GET `/api/class-transfers/student/{studentId}` - Theo học viên
- GET `/api/class-transfers/pending` - Chờ duyệt

### Belt Exam Management

- GET `/api/belt-exams/sessions` - Lấy danh sách kỳ thi
- POST `/api/belt-exams/sessions` - Tạo kỳ thi
- POST `/api/belt-exams/sessions/{id}/submit` - Gửi duyệt
- POST `/api/belt-exams/sessions/{id}/approve` - Phê duyệt
- POST `/api/belt-exams/sessions/{id}/reject` - Từ chối
- GET `/api/belt-exams/registrations` - Lấy đăng ký
- POST `/api/belt-exams/registrations` - Đăng ký thi
- POST `/api/belt-exams/registrations/batch` - Đăng ký hàng loạt
- POST `/api/belt-exams/registrations/{id}/approve` - Duyệt đăng ký
- POST `/api/belt-exams/registrations/{id}/reject` - Từ chối đăng ký
- PUT `/api/belt-exams/registrations/{id}/result` - Cập nhật kết quả

### Payment Management

- GET `/api/payments` - Lấy danh sách (studentId, classId, type, fromDate, toDate)
- GET `/api/payments/{id}` - Lấy theo ID
- POST `/api/payments` - Tạo mới
- PUT `/api/payments/{id}` - Cập nhật
- DELETE `/api/payments/{id}` - Xóa
- POST `/api/payments/{id}/restore` - Khôi phục
- GET `/api/payments/by-student/{studentId}` - Theo học viên
- GET `/api/payments/by-class/{classId}` - Theo lớp
- GET `/api/payments/summary/class/{classId}` - Báo cáo theo lớp
- GET `/api/payments/reports/monthly` - Báo cáo tháng
- GET `/api/payments/statistics/class/{classId}` - Thống kê lớp
- GET `/api/payments/overdue` - Học phí quá hạn

### Leave Request Management

- GET `/api/leave-requests` - Lấy danh sách
- GET `/api/leave-requests/{id}` - Lấy theo ID
- POST `/api/leave-requests` - Tạo đơn
- PUT `/api/leave-requests/{id}` - Cập nhật
- DELETE `/api/leave-requests/{id}` - Xóa
- POST `/api/leave-requests/{id}/approve` - Phê duyệt
- POST `/api/leave-requests/{id}/reject` - Từ chối
- GET `/api/leave-requests/pending` - Chờ duyệt
- GET `/api/leave-requests/my-requests` - Đơn của tôi

### Audit Log Management

- GET `/api/audit-logs` - Lấy danh sách
- GET `/api/audit-logs/{id}` - Lấy theo ID
- GET `/api/audit-logs/user/{userId}` - Theo user
- GET `/api/audit-logs/entity/{entityType}/{entityId}` - Theo entity

### Attendance Management

- POST `/api/Attendance/check-in` - Check-in
- POST `/api/Attendance/check-out` - Check-out
- POST `/api/Attendance/manual` - Chấm công thủ công
- GET `/api/Attendance/{userId}` - Theo user
- GET `/api/Attendance/my` - Của tôi

### Dashboard

- GET `/api/Dashboard/statistics` - Thống kê tổng quan
- GET `/api/Dashboard/revenue` - Doanh thu
- GET `/api/Dashboard/students` - Học viên
- GET `/api/Dashboard/classes` - Lớp học
- GET `/api/Dashboard/attendance` - Điểm danh

### User Management

- GET `/api/Users` - Lấy danh sách
- GET `/api/Users/{id}` - Lấy theo ID
- POST `/api/Users` - Tạo mới
- PUT `/api/Users/{id}` - Cập nhật
- DELETE `/api/Users/{id}` - Xóa
- PUT `/api/Users/{id}/roles` - Cập nhật vai trò

### Payroll Management

- GET `/api/Payroll` - Lấy danh sách
- GET `/api/Payroll/{id}` - Lấy theo ID
- POST `/api/Payroll` - Tạo mới
- POST `/api/Payroll/calculate` - Tính lương tự động

### Reports

- GET `/api/reports/students/list` - Xuất danh sách học viên
- GET `/api/reports/financial/class` - Xuất báo cáo tài chính

---

_Cập nhật: December 2025_
