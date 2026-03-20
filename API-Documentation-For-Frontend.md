# API Documentation - Hệ Thống Quản Lý Câu Lạc Bộ Võ Thuật

## 📋 Tổng Quan

Tài liệu API chi tiết dành cho Frontend Team để phát triển giao diện người dùng.

### Base URL

```
https://api.truongson.id.vn
```

### Authentication

```
Authorization: Bearer <your-jwt-token>
```

### Response Format

```json
{
  "isSuccess": true,
  "message": "Success message",
  "data": {},
  "code": 200
}
```

---

## 🆕 CÁC CHỨC NĂNG MỚI

### ✅ Class Transfer Management (Chuyển Lớp)

- Tạo yêu cầu chuyển lớp cho học viên
- Quy trình phê duyệt từ Admin
- Tự động cập nhật enrollment khi được duyệt
- Trạng thái: Pending → Approved/Rejected/Cancelled

### ✅ Audit Logging System (Ghi Log)

- Tự động ghi lại TẤT CẢ thao tác của người dùng
- Lưu: User, IP, User Agent, Old/New Values, Timestamp
- Chỉ Admin mới xem được audit logs

### ✅ Leave Request Management (Xin Nghỉ Phép) - MỚI

- Tạo đơn xin nghỉ phép
- Quy trình phê duyệt từ Admin
- Các loại nghỉ: Annual, Sick, Personal, Unpaid, Maternity, Other

### ✅ Enhanced APIs - MỚI

- Lấy lịch học theo ngày, theo HLV
- Lấy lịch sử thanh toán/điểm danh của học viên
- Lấy học viên/điểm danh/thanh toán của lớp
- Nhân bản lớp học
- Danh sách học phí quá hạn

### ✅ Student Attendance Management (Điểm Danh Học Viên) - MỚI

- HLV và trợ giảng chấm công cho học viên trong lớp
- Điểm danh đơn lẻ hoặc hàng loạt
- Thống kê điểm danh theo học viên
- Xem danh sách học viên chưa điểm danh

---

## 🔐 Authentication APIs

### Login với Google

**POST** `/api/Auth/google`

```json
{ "authorizationCode": "string" }
```

### Login với Password

**POST** `/api/Auth/password`

```json
{ "username": "string", "password": "string" }
```

### Refresh Token

**POST** `/api/Auth/refresh`

```json
{ "refreshToken": "string" }
```

### Register

**POST** `/api/Auth/register`

```json
{
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "phoneNumber": "0123456789",
  "password": "password123"
}
```

**Response (Login/Register):**

```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "expiresAtUtc": "2025-01-01T00:00:00Z",
  "instructor": {
    "id": "guid",
    "fullName": "Nguyễn Văn A",
    "email": "instructor@example.com"
  },
  "roles": ["Coach", "Admin"]
}
```

---

## 👥 Student Management APIs

### Lấy danh sách học viên

**GET** `/api/Students`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| pageNumber | number | Trang (default: 1) |
| pageSize | number | Số item/trang (default: 20) |
| keyword | string | Tìm theo tên, SĐT |
| classId | guid | Lọc theo lớp |
| beltLevelId | guid | Lọc theo cấp đai |
| gender | boolean | true=Nam, false=Nữ |
| enrollmentStatus | string | Active, Inactive, Completed |

**Response:**

```json
{
  "totalRecords": 100,
  "records": [
    {
      "id": "guid",
      "fullName": "Nguyễn Văn A",
      "phoneNumber": "0123456789",
      "address": "123 ABC Street",
      "identityNumber": "123456789",
      "dateOfBirth": "2000-01-01",
      "email": "student@example.com",
      "gender": true,
      "notes": "Ghi chú",
      "currentBeltLevelId": "guid",
      "currentBeltLevelName": "Đai trắng",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": null,
      "classes": [
        {
          "classId": "guid",
          "className": "Lớp Thiếu Nhi A",
          "enrollmentId": "guid",
          "enrollmentDate": "2025-01-01",
          "status": 0
        }
      ]
    }
  ]
}
```

### Lấy học viên theo ID

**GET** `/api/Students/{id}`

**Response:** Trả về thông tin học viên bao gồm danh sách các lớp đang học (classes)

### Tạo học viên

**POST** `/api/Students`

```json
{
  "fullName": "Nguyễn Văn A",
  "phoneNumber": "0123456789",
  "address": "123 ABC Street",
  "identityNumber": "123456789",
  "dateOfBirth": "2000-01-01",
  "email": "student@example.com",
  "gender": true,
  "notes": "Ghi chú",
  "currentBeltLevelId": "guid"
}
```

### Cập nhật học viên

**PUT** `/api/Students/{id}`

### Xóa học viên

**DELETE** `/api/Students/{id}`

### Khôi phục học viên

**POST** `/api/Students/{id}/restore`

### Lấy enrollments của học viên

**GET** `/api/Students/{studentId}/enrollments`

### Đăng ký học viên vào lớp

**POST** `/api/Students/enroll`

```json
{
  "studentId": "guid",
  "classId": "guid",
  "enrollmentDate": "2025-01-01",
  "notes": "Ghi chú"
}
```

### Lấy học viên theo lớp

**GET** `/api/Students/by-class/{classId}`

### Kiểm tra trạng thái học phí

**GET** `/api/Students/{id}/tuition-status?classId={guid}&month={int}&year={int}`

### Lấy lịch sử thi cấp

**GET** `/api/Students/{id}/exam-history`

### Lấy lịch sử thanh toán của học viên (MỚI)

**GET** `/api/Students/{id}/payments`

### Lấy lịch sử điểm danh của học viên (MỚI)

**GET** `/api/Students/{id}/attendance`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| fromDate | date | Từ ngày |
| toDate | date | Đến ngày |

---

## 🏫 Class Management APIs

### Lấy danh sách lớp

**GET** `/api/Classes`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| pageNumber | number | Trang |
| pageSize | number | Số item/trang |
| keyword | string | Tìm kiếm |

### Lấy lớp theo ID

**GET** `/api/Classes/{id}`

### Tạo lớp

**POST** `/api/Classes`

```json
{
  "code": "LOP-001",
  "name": "Lớp Thiếu Nhi A",
  "description": "Lớp dành cho trẻ em 6-12 tuổi",
  "maxStudents": 20,
  "userIds": ["guid-instructor-1", "guid-instructor-2"]
}
```

### Cập nhật lớp

**PUT** `/api/Classes/{id}`

### Xóa lớp

**DELETE** `/api/Classes/{id}`

### Khôi phục lớp

**POST** `/api/Classes/{id}/restore`

### Lấy lịch học của lớp

**GET** `/api/Classes/{classId}/schedules`

### Tạo lịch học hàng loạt

**POST** `/api/Classes/{classId}/schedules`

```json
{
  "branchId": "guid",
  "daysOfWeek": [1, 3, 5],
  "startTime": "18:00",
  "endTime": "19:30"
}
```

### Lấy học viên trong lớp (MỚI)

**GET** `/api/Classes/{classId}/students`

### Lấy điểm danh của lớp (MỚI)

**GET** `/api/Classes/{classId}/attendance`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| fromDate | date | Từ ngày |
| toDate | date | Đến ngày |

### Lấy thanh toán của lớp (MỚI)

**GET** `/api/Classes/{classId}/payments`

### Nhân bản lớp học (MỚI)

**POST** `/api/Classes/{classId}/duplicate`

```json
{
  "newCode": "LOP-002",
  "newName": "Lớp Thiếu Nhi B",
  "copySchedules": true,
  "copyInstructors": true
}
```

---

## 📅 Schedule APIs

### Lấy tất cả lịch học

**GET** `/api/Schedules`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| classId | guid | Lọc theo lớp |
| branchId | guid | Lọc theo chi nhánh |
| dayOfWeek | int | 0=Sunday, 1=Monday... |

### Lấy lịch học theo ID

**GET** `/api/Schedules/{id}`

### Tạo lịch học

**POST** `/api/Schedules`

### Cập nhật lịch học

**PUT** `/api/Schedules/{id}`

### Xóa lịch học

**DELETE** `/api/Schedules/{id}`

### Khôi phục lịch học

**POST** `/api/Schedules/{id}/restore`

### Lấy lịch học theo ngày (MỚI)

**GET** `/api/Schedules/by-date?date={date}`

**Response:** Trả về tất cả lịch học trong ngày đó (dựa trên DayOfWeek)

### Lấy lịch học theo HLV (MỚI)

**GET** `/api/Schedules/by-instructor/{instructorId}`

---

## 👨‍🏫 Instructor APIs

### Lấy danh sách HLV

**GET** `/api/Instructors`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| skillLevel | string | Lọc theo trình độ |
| certification | string | Lọc theo chứng chỉ |

### Lấy HLV theo ID

**GET** `/api/Instructors/{id}`

### Tạo HLV

**POST** `/api/Instructors`

```json
{
  "fullName": "Nguyễn Văn A",
  "email": "instructor@example.com",
  "phoneNumber": "0123456789",
  "skillLevel": "Đai đen đệ nhị đẳng",
  "certification": "Chứng chỉ HLV Taekwondo"
}
```

### Cập nhật HLV

**PUT** `/api/Instructors/{id}`

### Xóa HLV

**DELETE** `/api/Instructors/{id}`

### Khôi phục HLV

**POST** `/api/Instructors/{id}/restore`

### Lấy thống kê HLV

**GET** `/api/Instructors/{id}/statistics?month={int}&year={int}`

### Lấy lịch dạy của HLV (MỚI)

**GET** `/api/Instructors/{id}/schedules`

### Lấy danh sách lớp của HLV (MỚI)

**GET** `/api/Instructors/{id}/classes`

---

## 🏢 Branch APIs

### Lấy danh sách chi nhánh

**GET** `/api/Branches`

### Lấy chi nhánh theo ID

**GET** `/api/Branches/{id}`

### Tạo chi nhánh

**POST** `/api/Branches`

### Cập nhật chi nhánh

**PUT** `/api/Branches/{id}`

### Xóa chi nhánh

**DELETE** `/api/Branches/{id}`

### Khôi phục chi nhánh

**POST** `/api/Branches/{id}/restore`

---

## 🥋 Belt Level APIs

### Lấy danh sách cấp đai

**GET** `/api/belt-levels`

### Lấy cấp đai theo ID

**GET** `/api/belt-levels/{id}`

### Tạo cấp đai

**POST** `/api/belt-levels`

### Cập nhật cấp đai

**PUT** `/api/belt-levels/{id}`

### Xóa cấp đai

**DELETE** `/api/belt-levels/{id}`

---

## 🔄 Class Transfer APIs

### Lấy danh sách yêu cầu chuyển lớp

**GET** `/api/class-transfers`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| studentId | guid | Lọc theo học viên |
| fromClassId | guid | Lọc theo lớp nguồn |
| toClassId | guid | Lọc theo lớp đích |
| status | string | Pending, Approved, Rejected, Cancelled |
| requestDateFrom | date | Từ ngày |
| requestDateTo | date | Đến ngày |

**Response:**

```json
{
  "items": [
    {
      "id": "guid",
      "studentId": "guid",
      "studentName": "Nguyễn Văn A",
      "fromClassId": "guid",
      "fromClassName": "Lớp Thiếu Nhi A",
      "toClassId": "guid",
      "toClassName": "Lớp Thiếu Nhi B",
      "reason": "Học viên muốn chuyển lớp gần nhà hơn",
      "status": "Pending",
      "requestDate": "2025-01-01T00:00:00Z",
      "approvedDate": null,
      "approvedByUserName": null,
      "approvalNotes": null,
      "rejectionReason": null
    }
  ],
  "totalCount": 50,
  "pageNumber": 1,
  "pageSize": 20
}
```

### Tạo yêu cầu chuyển lớp

**POST** `/api/class-transfers`

```json
{
  "studentId": "guid",
  "fromClassId": "guid",
  "toClassId": "guid",
  "reason": "Học viên muốn chuyển lớp gần nhà hơn"
}
```

### Cập nhật yêu cầu

**PUT** `/api/class-transfers/{id}`

### Phê duyệt yêu cầu ⭐

**POST** `/api/class-transfers/{id}/approve`

**Authorization:** Admin Only

```json
{
  "approvalNotes": "Đã phê duyệt chuyển lớp"
}
```

### Từ chối yêu cầu

**POST** `/api/class-transfers/{id}/reject`

**Authorization:** Admin Only

```json
{
  "rejectionReason": "Lớp đích đã đầy"
}
```

### Hủy yêu cầu

**POST** `/api/class-transfers/{id}/cancel`

### Xóa yêu cầu

**DELETE** `/api/class-transfers/{id}`

### Lấy yêu cầu theo học viên

**GET** `/api/class-transfers/student/{studentId}`

### Lấy danh sách chờ duyệt

**GET** `/api/class-transfers/pending`

---

## 🥋 Belt Exam APIs

### Kỳ thi

#### Lấy danh sách kỳ thi

**GET** `/api/belt-exams/sessions`

#### Tạo kỳ thi

**POST** `/api/belt-exams/sessions`

```json
{
  "name": "Kỳ thi cấp đai vàng Q1/2025",
  "examDate": "2025-03-15",
  "registrationDeadline": "2025-03-01",
  "beltLevelId": "guid",
  "examFee": 500000,
  "maxCandidates": 50
}
```

#### Gửi phê duyệt

**POST** `/api/belt-exams/sessions/{id}/submit`

#### Phê duyệt kỳ thi

**POST** `/api/belt-exams/sessions/{id}/approve`

#### Từ chối kỳ thi

**POST** `/api/belt-exams/sessions/{id}/reject`

### Đăng ký thi

#### Lấy danh sách đăng ký

**GET** `/api/belt-exams/registrations`

#### Đăng ký thi

**POST** `/api/belt-exams/registrations`

```json
{
  "examSessionId": "guid",
  "studentId": "guid"
}
```

#### Đăng ký hàng loạt

**POST** `/api/belt-exams/registrations/batch`

```json
{
  "examSessionId": "guid",
  "studentIds": ["guid1", "guid2"]
}
```

#### Phê duyệt đăng ký

**POST** `/api/belt-exams/registrations/{id}/approve`

#### Từ chối đăng ký

**POST** `/api/belt-exams/registrations/{id}/reject`

#### Cập nhật kết quả

**PUT** `/api/belt-exams/registrations/{id}/result`

```json
{
  "result": 1,
  "score": 85.5,
  "notes": "Đạt yêu cầu"
}
```

---

## 💰 Payment APIs

### Lấy danh sách thanh toán

**GET** `/api/payments`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| studentId | guid | Lọc theo học viên |
| classId | guid | Lọc theo lớp |
| type | int | 0=Tuition, 1=ExamFee, 2=Registration, 3=Other |
| fromDate | date | Từ ngày |
| toDate | date | Đến ngày |

### Lấy thanh toán theo ID

**GET** `/api/payments/{id}`

### Tạo thanh toán

**POST** `/api/payments`

```json
{
  "studentId": "guid",
  "classId": "guid",
  "type": 0,
  "amount": 500000,
  "paymentDate": "2025-01-15",
  "method": 0,
  "forMonth": 1,
  "forYear": 2025,
  "description": "Học phí tháng 1/2025"
}
```

### Cập nhật thanh toán

**PUT** `/api/payments/{id}`

### Xóa thanh toán

**DELETE** `/api/payments/{id}`

### Khôi phục thanh toán

**POST** `/api/payments/{id}/restore`

### Lấy thanh toán theo học viên

**GET** `/api/payments/by-student/{studentId}`

### Lấy thanh toán theo lớp

**GET** `/api/payments/by-class/{classId}`

### Báo cáo tài chính theo lớp

**GET** `/api/payments/summary/class/{classId}?fromDate={date}&toDate={date}`

### Báo cáo theo tháng

**GET** `/api/payments/reports/monthly?year={int}&month={int}`

### Thống kê theo lớp

**GET** `/api/payments/statistics/class/{classId}?month={int}&year={int}`

### Lấy danh sách học phí quá hạn (MỚI)

**GET** `/api/payments/overdue`

**Response:**

```json
{
  "items": [
    {
      "studentId": "guid",
      "studentName": "Nguyễn Văn A",
      "phoneNumber": "0123456789",
      "classId": "guid",
      "className": "Lớp Thiếu Nhi A",
      "monthsOverdue": 2,
      "enrollmentDate": "2024-09-01"
    }
  ],
  "totalCount": 10
}
```

---

## 📅 Leave Request APIs (MỚI)

### Lấy danh sách đơn xin nghỉ

**GET** `/api/leave-requests`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| userId | guid | Lọc theo người xin nghỉ |
| leaveType | int | 0=Annual, 1=Sick, 2=Personal, 3=Unpaid, 4=Maternity, 5=Other |
| status | int | 0=Pending, 1=Approved, 2=Rejected, 3=Cancelled |
| fromDate | date | Từ ngày |
| toDate | date | Đến ngày |

**Response:**

```json
{
  "items": [
    {
      "id": "guid",
      "userId": "guid",
      "userName": "Nguyễn Văn A",
      "leaveType": 1,
      "startDate": "2025-01-15",
      "endDate": "2025-01-17",
      "reason": "Bị ốm",
      "status": 0,
      "approvedByUserId": null,
      "approvedByUserName": null,
      "approvedAt": null,
      "approvalNotes": null,
      "createdAt": "2025-01-10T10:00:00Z"
    }
  ]
}
```

### Lấy đơn theo ID

**GET** `/api/leave-requests/{id}`

### Tạo đơn xin nghỉ

**POST** `/api/leave-requests`

```json
{
  "leaveType": 1,
  "startDate": "2025-01-15",
  "endDate": "2025-01-17",
  "reason": "Bị ốm, cần nghỉ ngơi"
}
```

### Cập nhật đơn

**PUT** `/api/leave-requests/{id}`

_Chỉ cập nhật được khi status = Pending_

### Xóa đơn

**DELETE** `/api/leave-requests/{id}`

### Phê duyệt đơn

**POST** `/api/leave-requests/{id}/approve`

**Authorization:** Admin Only

```json
{
  "notes": "Đã duyệt"
}
```

### Từ chối đơn

**POST** `/api/leave-requests/{id}/reject`

**Authorization:** Admin Only

```json
{
  "reason": "Không đủ điều kiện"
}
```

### Lấy danh sách chờ duyệt

**GET** `/api/leave-requests/pending`

**Authorization:** Admin Only

### Lấy đơn của tôi

**GET** `/api/leave-requests/my-requests`

---

## 📋 Audit Log APIs

### Lấy danh sách audit logs

**GET** `/api/audit-logs`

**Authorization:** Admin Only

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| userId | guid | Lọc theo user |
| userRole | string | Lọc theo role |
| action | string | Login, Create, Update, Delete, TransferApprove... |
| entityType | string | Student, ClassTransferRequest... |
| entityId | guid | ID của entity |
| timestampFrom | datetime | Từ thời điểm |
| timestampTo | datetime | Đến thời điểm |
| isSuccess | boolean | Thành công/thất bại |

**Response:**

```json
{
  "items": [
    {
      "id": "guid",
      "userId": "guid",
      "userName": "Thầy Nguyễn Văn A",
      "userRole": "Coach",
      "action": "TransferApprove",
      "entityType": "ClassTransferRequest",
      "entityId": "guid",
      "description": "Approved transfer request for student Nguyễn Văn B",
      "oldValues": "{\"Status\":\"Pending\"}",
      "newValues": "{\"Status\":\"Approved\"}",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2025-01-01T10:30:00Z",
      "isSuccess": true
    }
  ]
}
```

### Lấy audit log theo ID

**GET** `/api/audit-logs/{id}`

### Lấy logs theo user

**GET** `/api/audit-logs/user/{userId}`

### Lấy logs theo entity

**GET** `/api/audit-logs/entity/{entityType}/{entityId}`

**Ví dụ:**

```
GET /api/audit-logs/entity/Student/guid-student-id
GET /api/audit-logs/entity/ClassTransferRequest/guid-transfer-id
```

---

## 📝 Attendance APIs

### Check-in

**POST** `/api/Attendance/check-in`

```json
{
  "checkedInAt": "2025-01-01T18:00:00Z",
  "latitude": 10.762622,
  "longitude": 106.660172
}
```

### Check-out

**POST** `/api/Attendance/check-out`

```json
{
  "checkedOutAt": "2025-01-01T19:30:00Z",
  "latitude": 10.762622,
  "longitude": 106.660172
}
```

### Chấm công thủ công

**POST** `/api/Attendance/manual`

### Lấy chấm công theo user

**GET** `/api/Attendance/{userId}?fromDate={date}&toDate={date}`

### Lấy chấm công của tôi

**GET** `/api/Attendance/my?fromDate={date}&toDate={date}`

---

## 📝 Student Attendance APIs (Điểm Danh Học Viên) - MỚI

API cho phép HLV và trợ giảng chấm công cho học viên trong lớp.

### Lấy danh sách điểm danh học viên

**GET** `/api/student-attendance`

**Authorization:** InstructorOrAdmin

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| studentId | guid | Lọc theo học viên |
| classId | guid | Lọc theo lớp |
| classScheduleId | guid | Lọc theo buổi học |
| fromDate | date | Từ ngày |
| toDate | date | Đến ngày |
| status | int | 0=Pending, 1=Present, 2=Late, 3=Absent, 4=Manual |
| markedByUserId | guid | Lọc theo người chấm |

**Response:**

```json
{
  "totalRecords": 50,
  "records": [
    {
      "id": "guid",
      "studentId": "guid",
      "studentName": "Nguyễn Văn A",
      "studentPhone": "0123456789",
      "classId": "guid",
      "className": "Lớp Thiếu Nhi A",
      "classScheduleId": "guid",
      "attendanceDate": "2025-01-15",
      "status": 1,
      "checkedInAt": "2025-01-15T18:00:00Z",
      "checkedOutAt": "2025-01-15T19:30:00Z",
      "notes": "Ghi chú",
      "markedByUserId": "guid",
      "markedByUserName": "Thầy Nguyễn Văn B",
      "isActive": true,
      "createdAt": "2025-01-15T18:00:00Z",
      "updatedAt": null
    }
  ]
}
```

### Lấy điểm danh theo ID

**GET** `/api/student-attendance/{id}`

### Tạo điểm danh cho học viên

**POST** `/api/student-attendance`

```json
{
  "studentId": "guid",
  "classId": "guid",
  "classScheduleId": "guid",
  "attendanceDate": "2025-01-15",
  "status": 1,
  "checkedInAt": "2025-01-15T18:00:00Z",
  "checkedOutAt": "2025-01-15T19:30:00Z",
  "notes": "Ghi chú"
}
```

### Cập nhật điểm danh

**PUT** `/api/student-attendance/{id}`

```json
{
  "status": 1,
  "checkedInAt": "2025-01-15T18:00:00Z",
  "checkedOutAt": "2025-01-15T19:30:00Z",
  "notes": "Ghi chú cập nhật",
  "isActive": true
}
```

### Xóa điểm danh

**DELETE** `/api/student-attendance/{id}`

### Điểm danh hàng loạt cho nhiều học viên

**POST** `/api/student-attendance/batch`

```json
{
  "classId": "guid",
  "classScheduleId": "guid",
  "attendanceDate": "2025-01-15",
  "students": [
    {
      "studentId": "guid1",
      "status": 1,
      "checkedInAt": "2025-01-15T18:00:00Z",
      "checkedOutAt": "2025-01-15T19:30:00Z",
      "notes": null
    },
    {
      "studentId": "guid2",
      "status": 3,
      "checkedInAt": null,
      "checkedOutAt": null,
      "notes": "Vắng không phép"
    }
  ]
}
```

**Response:**

```json
{
  "createdCount": 2,
  "errors": []
}
```

### Lấy điểm danh của học viên theo lớp

**GET** `/api/student-attendance/student/{studentId}/class/{classId}`

### Lấy điểm danh của lớp theo ngày

**GET** `/api/student-attendance/class/{classId}/date/{date}`

### Lấy thống kê điểm danh của học viên

**GET** `/api/student-attendance/statistics/student/{studentId}/class/{classId}?month={int}&year={int}`

**Response:**

```json
{
  "studentId": "guid",
  "studentName": "Nguyễn Văn A",
  "classId": "guid",
  "className": "Lớp Thiếu Nhi A",
  "totalSessions": 20,
  "presentCount": 15,
  "lateCount": 3,
  "absentCount": 2,
  "attendanceRate": 90.0
}
```

### Lấy danh sách học viên chưa điểm danh

**GET** `/api/student-attendance/unmarked/class/{classId}/date/{date}?classScheduleId={guid}`

**Response:**

```json
[
  {
    "studentId": "guid",
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0123456789"
  }
]
```

---

## 📊 Dashboard APIs

### Lấy thống kê tổng quan

**GET** `/api/Dashboard/statistics`

**Response:**

```json
{
  "totalStudents": 150,
  "activeStudents": 120,
  "totalClasses": 10,
  "activeClasses": 10,
  "totalInstructors": 5,
  "totalBranches": 3,
  "monthlyRevenue": 50000000,
  "pendingTransfers": 5,
  "upcomingExams": 2,
  "todayAttendance": {
    "checkIns": 45,
    "checkOuts": 30,
    "scheduledSessions": 8
  }
}
```

### Lấy thống kê doanh thu

**GET** `/api/Dashboard/revenue?year={int}&month={int}`

### Lấy thống kê học viên

**GET** `/api/Dashboard/students`

### Lấy thống kê lớp học

**GET** `/api/Dashboard/classes`

### Lấy thống kê điểm danh

**GET** `/api/Dashboard/attendance?year={int}&month={int}`

---

## 📊 Reports APIs

### Xuất danh sách học viên

**GET** `/api/reports/students/list?classId={guid}&format={excel|pdf}`

### Xuất báo cáo tài chính

**GET** `/api/reports/financial/class?classId={guid}&month={int}&year={int}&format={excel|pdf}`

---

## 👤 User Management APIs

### Lấy danh sách người dùng

**GET** `/api/Users`

### Lấy người dùng theo ID

**GET** `/api/Users/{id}`

### Tạo người dùng

**POST** `/api/Users`

### Cập nhật người dùng

**PUT** `/api/Users/{id}`

### Xóa người dùng

**DELETE** `/api/Users/{id}`

### Cập nhật vai trò

**PUT** `/api/Users/{id}/roles`

---

## 💵 Payroll APIs

### Lấy danh sách bảng lương

**GET** `/api/Payroll`

### Lấy bảng lương theo ID

**GET** `/api/Payroll/{id}`

### Tạo bảng lương

**POST** `/api/Payroll`

### Tính lương tự động

**POST** `/api/Payroll/calculate`

---

## 🔒 Authorization

### Roles

| Role      | Description           |
| --------- | --------------------- |
| Admin     | Toàn quyền            |
| Coach     | Huấn luyện viên chính |
| Assistant | Trợ giảng             |
| Student   | Học viên              |

### Policies

| Policy              | Roles                   |
| ------------------- | ----------------------- |
| AdminOnly           | Admin                   |
| CoachOnly           | Coach, Admin            |
| InstructorOrAdmin   | Coach, Assistant, Admin |
| StudentManagement   | Admin, Coach            |
| FinancialManagement | Admin                   |
| ExamManagement      | Admin, Coach            |

---

## 📝 Changelog

### Version 2.1 (Latest)

- ✅ Student Attendance Management APIs (Điểm danh học viên bởi HLV/Trợ giảng)
- ✅ Leave Request Management APIs (Xin nghỉ phép)
- ✅ Overdue Payments API (Học phí quá hạn)
- ✅ Student Payment/Attendance History APIs
- ✅ Class Students/Attendance/Payments APIs
- ✅ Class Duplicate API
- ✅ Schedule by Date/Instructor APIs
- ✅ Instructor Schedules/Classes APIs

### Version 2.0

- ✅ Class Transfer Management APIs
- ✅ Audit Logging System
- ✅ Enhanced Security & Authorization

### Version 1.0

- ✅ Authentication APIs
- ✅ Student Management APIs
- ✅ Class Management APIs
- ✅ Belt Exam APIs
- ✅ Payment APIs
- ✅ Attendance APIs
- ✅ Reports APIs

---

_Cập nhật: December 2025_
