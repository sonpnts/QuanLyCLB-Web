export const API_ENDPOINTS = {
  auth: {
    password: process.env.NEXT_PUBLIC_LOGINPASS_ENDPOINT ?? '/Auth/password',
    google: process.env.NEXT_PUBLIC_LOGINGG_ENDPOINT ?? '/Auth/google',
    refresh: process.env.NEXT_PUBLIC_REFRESH_ENDPOINT ?? '/Auth/refresh',
    register: '/Auth/register'
  },
  attendance: {
    checkIn: '/Attendance/check-in',
    checkOut: '/Attendance/check-out',
    manual: '/Attendance/manual',
    my: '/Attendance/my',
    byUser: (userId: string) => `/Attendance/${userId}`,
    tickets: '/Attendance/tickets',
    ticketApproval: (ticketId: string) => `/Attendance/tickets/${ticketId}/approval`
  },
  auditLogs: {
    root: '/audit-logs',
    byId: (id: string) => `/audit-logs/${id}`,
    byUser: (userId: string) => `/audit-logs/user/${userId}`,
    byEntity: (entityType: string, entityId: string) => `/audit-logs/entity/${entityType}/${entityId}`
  },
  beltExams: {
    sessions: '/belt-exams/sessions',
    sessionById: (id: string) => `/belt-exams/sessions/${id}`,
    sessionSubmit: (id: string) => `/belt-exams/sessions/${id}/submit`,
    sessionApprove: (id: string) => `/belt-exams/sessions/${id}/approve`,
    sessionReject: (id: string) => `/belt-exams/sessions/${id}/reject`,
    registrations: '/belt-exams/registrations',
    registrationBatch: '/belt-exams/registrations/batch',
    registrationApprove: (id: string) => `/belt-exams/registrations/${id}/approve`,
    registrationReject: (id: string) => `/belt-exams/registrations/${id}/reject`,
    registrationResult: (id: string) => `/belt-exams/registrations/${id}/result`,
    // --- Luồng HLV đăng ký thi cấp (mới) ---
    openSessions: '/belt-exams/open',
    eligibleStudents: (sessionId: string, classId: string) =>
      `/belt-exams/${sessionId}/eligible-students/${classId}`,
    registrationList: (sessionId: string) => `/belt-exams/${sessionId}/registration-list`,
    myRegistrationList: (sessionId: string) => `/belt-exams/${sessionId}/registration-list/mine`,
    submitRegistrationList: (listId: string) => `/belt-exams/registration-list/${listId}/submit`,
    removeStudentFromList: (listId: string, studentId: string) =>
      `/belt-exams/registration-list/${listId}/student/${studentId}`,
    openSession: (sessionId: string) => `/belt-exams/sessions/${sessionId}/open`,
    lockSession: (sessionId: string) => `/belt-exams/${sessionId}/lock`,
    adminView: (sessionId: string) => `/belt-exams/${sessionId}/admin-view`,
    exportList: (sessionId: string) => `/belt-exams/${sessionId}/export`
  },
  beltLevels: {
    root: '/belt-levels',
    byId: (id: string) => `/belt-levels/${id}`
  },
  branches: {
    root: '/Branches',
    byId: (id: string) => `/Branches/${id}`,
    restore: (id: string) => `/Branches/${id}/restore`
  },
  cashHandovers: {
    root: '/cash-handovers',
    byId: (id: string) => `/cash-handovers/${id}`
  },
  classes: {
    root: '/Classes',
    byId: (id: string) => `/Classes/${id}`,
    restore: (id: string) => `/Classes/${id}/restore`,
    schedules: (classId: string) => `/Classes/${classId}/schedules`,
    students: (classId: string) => `/Classes/${classId}/students`,
    attendance: (classId: string) => `/Classes/${classId}/attendance`,
    payments: (classId: string) => `/Classes/${classId}/payments`,
    duplicate: (classId: string) => `/Classes/${classId}/duplicate`
  },
  classTransfers: {
    root: '/class-transfers',
    byId: (id: string) => `/class-transfers/${id}`,
    approve: (id: string) => `/class-transfers/${id}/approve`,
    reject: (id: string) => `/class-transfers/${id}/reject`,
    cancel: (id: string) => `/class-transfers/${id}/cancel`,
    byStudent: (studentId: string) => `/class-transfers/student/${studentId}`,
    pending: '/class-transfers/pending'
  },
  finance: {
    classTuitionSummary: (classId: string) => `/finance/summary/class/${classId}/tuition`,
    productSalesSummary: '/finance/summary/product-sales',
    classInstructorSummary: (classId: string, instructorId: string) =>
      `/finance/summary/class/${classId}/instructor/${instructorId}`,
    branchSummary: (branchId: string) => `/finance/summary/branch/${branchId}`,
    instructorClassCollections: (instructorId: string) => `/finance/instructors/${instructorId}/class-collections`,
    myClassCollections: '/finance/me/class-collections'
  },
  instructors: {
    root: '/Instructors',
    byId: (id: string) => `/Instructors/${id}`,
    restore: (id: string) => `/Instructors/${id}/restore`,
    statistics: (id: string) => `/Instructors/${id}/statistics`,
    schedules: (id: string) => `/Instructors/${id}/schedules`,
    classes: (id: string) => `/Instructors/${id}/classes`
  },
  leaveRequests: {
    root: '/leave-requests',
    byId: (id: string) => `/leave-requests/${id}`,
    approve: (id: string) => `/leave-requests/${id}/approve`,
    reject: (id: string) => `/leave-requests/${id}/reject`,
    pending: '/leave-requests/pending',
    myRequests: '/leave-requests/my-requests'
  },
  menu: {
    byRole: '/menu/by-role',
    seed: '/menu/seed'
  },
  payments: {
    root: '/payments',
    byId: (id: string) => `/payments/${id}`,
    byReceipt: (receiptNumber: string) => `/payments/receipt/${receiptNumber}`,
    restore: (id: string) => `/payments/${id}/restore`,
    byStudent: (studentId: string) => `/payments/by-student/${studentId}`,
    byClass: (classId: string) => `/payments/by-class/${classId}`,
    classSummary: (classId: string) => `/payments/summary/class/${classId}`,
    monthlyReport: '/payments/reports/monthly',
    classStatistics: (classId: string) => `/payments/statistics/class/${classId}`,
    overdue: '/payments/overdue',
    tuitionQuote: '/payments/tuition-quote',
    examFeeOptions: '/payments/exam-fee-options',

    studentDiscountConfigs: '/payments/student-discount-configs',
    studentDiscountConfigById: (id: string) => `/payments/student-discount-configs/${id}`,
    uploadTransferProof: '/payments/upload-transfer-proof',
    // --- Công nợ & tổng hợp thu chi (mới) ---
    outstanding: (studentId: string) => `/payments/outstanding/${studentId}`,
    summaryMy: '/payments/summary/my',
    summaryAdmin: '/payments/summary/admin',
    unpaid: '/payments/unpaid'
  },
  payroll: {
    root: '/Payroll',
    byId: (payrollId: string) => `/Payroll/${payrollId}`,
    byCoach: (coachId: string) => `/Payroll/coach/${coachId}`,
    calculate: '/Payroll/calculate'
  },
  productSales: {
    root: '/product-sales',
    byId: (id: string) => `/product-sales/${id}`,
    restore: (id: string) => `/product-sales/${id}/restore`
  },
  products: {
    root: '/products',
    byId: (id: string) => `/products/${id}`,
    restore: (id: string) => `/products/${id}/restore`
  },
  roles: {
    root: '/Roles',
    byId: (id: string) => `/Roles/${id}`,
    restore: (id: string) => `/Roles/${id}/restore`
  },
  schedules: {
    root: '/Schedules',
    byId: (id: string) => `/Schedules/${id}`,
    restore: (id: string) => `/Schedules/${id}/restore`,
    byDate: '/Schedules/by-date',
    byInstructor: (instructorId: string) => `/Schedules/by-instructor/${instructorId}`
  },
  students: {
    root: '/Students',
    byId: (id: string) => `/Students/${id}`,
    restore: (id: string) => `/Students/${id}/restore`,
    enroll: '/Students/enroll',
    byClass: (classId: string) => `/Students/by-class/${classId}`,
    enrollments: (studentId: string) => `/Students/${studentId}/enrollments`,
    tuitionStatus: (studentId: string) => `/Students/${studentId}/tuition-status`,
    examHistory: (studentId: string) => `/Students/${studentId}/exam-history`,
    payments: (studentId: string) => `/Students/${studentId}/payments`,
    attendance: (studentId: string) => `/Students/${studentId}/attendance`
  },
  users: {
    root: '/Users',
    byId: (id: string) => `/Users/${id}`,
    restore: (id: string) => `/Users/${id}/restore`,
    updateRoles: (id: string) => `/Users/${id}/roles`
  }
} as const

export type ApiEndpoints = typeof API_ENDPOINTS
