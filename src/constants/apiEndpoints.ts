export const API_ENDPOINTS = {
  auth: {
    google: process.env.NEXT_PUBLIC_LOGGING_ENDPOINT ?? '/Auth/google',
    refresh: process.env.NEXT_PUBLIC_REFRESH_ENDPOINT ?? '/Auth/refresh'
  },
  attendance: {
    checkIn: '/Attendance/check-in',
    checkOut: '/Attendance/check-out',
    manual: '/Attendance/manual',
    my: '/Attendance/my',
    myRecent: (count: number = 5) => `/Attendance/my/recent?count=${count}`,
    byUser: (userId: string) => `/Attendance/${userId}`,
    userDetail: (userId: string, month: number, year: number) => `/Attendance/admin/user-detail?userId=${userId}&month=${month}&year=${year}`,
    reportHistory: (month?: number, year?: number) => `/Attendance/admin/report-history${month ? `?month=${month}` : ''}${year ? `${month ? '&' : '?'}year=${year}` : ''}`,
    reportDownload: (reportId: string) => `/Attendance/admin/report-download/${reportId}`,
    tickets: '/Attendance/tickets',
    ticketApproval: (ticketId: string) => `/Attendance/tickets/${ticketId}/approval`,
    adminOverview: '/attendance/admin/overview',
    adminInstructorStats: '/attendance/admin/instructor-stats',
    adminClassSummary: '/attendance/admin/class-summary',
    adminGenerateReport: '/attendance/admin/generate-report',
    adminHistoryList: '/attendance/admin/history-list',
    myHistory: '/attendance/my-history',
    adminAllRecords: '/Attendance/admin/all-records',
    adminAllPairs: '/Attendance/admin/all-pairs',
    adminUpdateRecord: '/Attendance/admin/update-record',
    adminCancelRecord: (recordId: string) => `/Attendance/admin/cancel-record/${recordId}`,
    unassigned: '/Attendance/unassigned',
    missedSessions: '/Attendance/missed-sessions'
  },
  auditLogs: {
    root: '/audit-logs',
    byId: (id: string) => `/audit-logs/${id}`,
    byUser: (userId: string) => `/audit-logs/user/${userId}`,
    byEntity: (entityType: string, entityId: string) => `/audit-logs/entity/${entityType}/${entityId}`,
    cronJobs: '/audit-logs/cron-jobs',
    runZnsTuitionDue: '/audit-logs/cron-jobs/run-zns-tuition-due',
    runFederationSync: '/audit-logs/cron-jobs/run-federation-sync'
  },
  znsLogs: {
    root: '/zns-logs',
    retry: (id: string) => `/zns-logs/${id}/retry`
  },
  beltExams: {
    sessions: '/belt-exams/sessions',
    sessionById: (id: string) => `/belt-exams/sessions/${id}`,
    registrations: '/belt-exams/registrations',
    registrationBatch: '/belt-exams/registrations/batch',
    registrationResult: (id: string) => `/belt-exams/registrations/${id}/result`,

    // --- Luồng HLV đăng ký thi cấp (mới) ---
    openSessions: '/belt-exams/open',
    eligibleStudents: (sessionId: string, classId: string) =>
      `/belt-exams/${sessionId}/eligible-students/${classId}`,
    registrationList: (sessionId: string) => `/belt-exams/${sessionId}/registration-list`,
    myRegistrationList: (sessionId: string) => `/belt-exams/${sessionId}/registration-list/mine`,
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
    byId: (id: string) => `/cash-handovers/${id}`,
    confirm: (id: string) => `/cash-handovers/${id}/confirm`,
    reject: (id: string) => `/cash-handovers/${id}/reject`,
    invoices: (id: string) => `/cash-handovers/${id}/invoices`,
    lateTuitionStudents: '/cash-handovers/late-tuition-students',
    tuitionDebtReport: '/cash-handovers/tuition-debt-report',
    tuitionDebtReportExport: '/cash-handovers/tuition-debt-report/export'
  },
  classes: {
    root: '/Classes',
    lookup: '/Classes/lookup',
    byId: (id: string) => `/Classes/${id}`,
    restore: (id: string) => `/Classes/${id}/restore`,
    schedules: (classId: string) => `/Classes/${classId}/schedules`,
    students: (classId: string) => `/Classes/${classId}/students`,
    attendance: (classId: string) => `/Classes/${classId}/attendance`,
    payments: (classId: string) => `/Classes/${classId}/payments`,
    duplicate: (classId: string) => `/Classes/${classId}/duplicate`,
    permissions: (classId: string) => `/Classes/${classId}/permissions`,
    permissionsUser: (classId: string, userId: string) => `/Classes/${classId}/users/${userId}/permissions`,
    permissionsByUser: (classId: string, userId: string) => `/Classes/${classId}/permissions/${userId}`,
    permissionsCatalog: '/Classes/permissions/catalog'
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
    transactionSummary: '/finance/summary/transactions',
    classTuitionSummary: (classId: string) => `/finance/summary/class/${classId}/tuition`,
    productSalesSummary: '/finance/summary/product-sales',
    classInstructorSummary: (classId: string, instructorId: string) =>
      `/finance/summary/class/${classId}/instructor/${instructorId}`,
    branchSummary: (branchId: string) => `/finance/summary/branch/${branchId}`,
    instructorClassCollections: (instructorId: string) => `/finance/instructors/${instructorId}/class-collections`,
    classInvoices: (instructorId: string, classId: string) => `/finance/instructors/${instructorId}/class-collections/${classId}/invoices`,
    myClassCollections: '/finance/me/class-collections',
    myClassInvoices: (classId: string) => `/finance/me/class-collections/${classId}/invoices`
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
    byUser: (userId: string) => `/menu/by-user/${userId}`,
    seed: '/menu/seed',
    rbacCanonical: '/menu/rbac-canonical',
    patchPermissionRoles: (permissionId: string) => `/menu/permissions/${permissionId}/roles`,
    permissionFunctions: '/menu/permission-functions',
    patchPermissionFunctions: (permissionId: string) => `/menu/permissions/${permissionId}/functions`,
    functions: '/menu/functions',
    functionById: (functionId: string) => `/menu/functions/${functionId}`
  },
  payments: {
    root: '/payments',
    discountedReceipts: '/payments/discounted-receipts',
    receipts: '/payments/receipts',
    receiptsSummary: '/payments/receipts/summary',
    bulk: '/payments/bulk',
    byId: (id: string) => `/payments/${id}`,
    byReceipt: (receiptNumber: string) => `/payments/receipt/${receiptNumber}`,
    receiptZnsStatus: (receiptNumber: string) => `/payments/receipt/${receiptNumber}/zns-status`,
    receiptZnsRetry: (receiptNumber: string) => `/payments/receipt/${receiptNumber}/zns-retry`,
    restore: (id: string) => `/payments/${id}/restore`,
    byStudent: (studentId: string) => `/payments/by-student/${studentId}`,
    byClass: (classId: string) => `/payments/by-class/${classId}`,
    classSummary: (classId: string) => `/payments/summary/class/${classId}`,
    monthlyReport: '/payments/reports/monthly',
    classStatistics: (classId: string) => `/payments/statistics/class/${classId}`,
    overdue: '/payments/overdue',
    tuitionQuote: '/payments/tuition-quote',
    examFeeOptions: '/payments/exam-fee-options',

    uploadTransferProof: '/payments/upload-transfer-proof',

    // --- Công nợ & tổng hợp thu chi (mới) ---
    outstanding: (studentId: string) => `/payments/outstanding/${studentId}`,
    summaryMy: '/payments/summary/my',
    summaryAdmin: '/payments/summary/admin',
    unpaid: '/payments/unpaid'
  },
  payroll: {
    root: '/Payroll',
    byId: (payrollId: string) => `/Payroll/details/${payrollId}`,
    byCoach: (coachId: string) => `/Payroll/coach/${coachId}`,
    generate: '/Payroll/generate',
    calculate: '/Payroll/calculate'
  },
  productSales: {
    root: '/product-sales',
    byId: (id: string) => `/product-sales/${id}`,
    restore: (id: string) => `/product-sales/${id}/restore`
  },
  reports: {
    studentList: '/reports/students/list',
    classFinancial: '/reports/financial/class'
  },
  products: {
    root: '/products',
    saleOptions: '/products/sale-options',
    bundles: '/products/bundles',
    bundleSaleOptions: '/products/bundles/sale-options',
    bundleById: (id: string) => `/products/bundles/${id}`,
    inventory: '/products/inventory',
    inventoryTransactions: '/products/inventory/transactions',
    inventoryEntries: '/products/inventory/entries',
    inventoryEntriesBulk: '/products/inventory/entries/bulk',
    reportSummary: '/products/reports/summary',
    byId: (id: string) => `/products/${id}`,
    restore: (id: string) => `/products/${id}/restore`
  },
  roles: {
    root: '/Roles',
    byId: (id: string) => `/Roles/${id}`
  },
  schedules: {
    root: '/Schedules',
    my: '/Schedules/me',
    byId: (id: string) => `/Schedules/${id}`,
    restore: (id: string) => `/Schedules/${id}/restore`,
    byDate: '/Schedules/by-date',
    byInstructor: (instructorId: string) => `/Schedules/by-instructor/${instructorId}`
  },
  students: {
    root: '/Students',
    import: '/Students/import',
    importTemplate: '/Students/import-template',
    byId: (id: string) => `/Students/${id}`,
    restore: (id: string) => `/Students/${id}/restore`,
    suspend: (id: string) => `/Students/${id}/suspend`,
    resume: (id: string) => `/Students/${id}/resume`,
    enroll: '/Students/enroll',
    byClass: (classId: string) => `/Students/by-class/${classId}`,
    enrollments: (studentId: string) => `/Students/${studentId}/enrollments`,
    tuitionStatus: (studentId: string) => `/Students/${studentId}/tuition-status`,
    examHistory: (studentId: string) => `/Students/${studentId}/exam-history`,
    payments: (studentId: string) => `/Students/${studentId}/payments`,
    attendance: (studentId: string) => `/Students/${studentId}/attendance`,
    tuitionDiscountRequest: (studentId: string) => `/Students/${studentId}/tuition-discount/request`,
    tuitionDiscountDecide: (discountId: string) => `/Students/tuition-discount/${discountId}/decide`,
    tuitionDiscountDelete: (discountId: string) => `/Students/tuition-discount/${discountId}`,
    tuitionDiscountMy: '/Students/tuition-discount/requests/my',
    tuitionDiscountPending: '/Students/tuition-discount/requests/pending',
    tuitionDiscountHistory: '/Students/tuition-discount/requests/history',
    zaloVerifyPhone: '/Students/zalo/verify-phone',
    zaloUpdate: (id: string) => `/Students/${id}/zalo`,
    leaveRecords: (studentId: string) => `/Students/${studentId}/leave-records`
  },
  studentAttendance: {
    root: '/student-attendance',
    byId: (id: string) => `/student-attendance/${id}`,
    absences: '/student-attendance/absences',
    sessionLogs: '/student-attendance/session-logs',
    missingSessions: '/student-attendance/missing-sessions',
    coachClasses: '/student-attendance/coach/classes',
    coachSuggestedDate: (classId: string) => `/student-attendance/coach/class/${classId}/suggested-date`,
    coachSheet: (classId: string, date: string) => `/student-attendance/coach/class/${classId}/sheet/${date}`,
    coachSaveSheet: '/student-attendance/coach/sheet',
    exportSessionLogs: '/student-attendance/export-session-logs'
  },
  users: {
    root: '/Users',
    byId: (id: string) => `/Users/${id}`,
    restore: (id: string) => `/Users/${id}/restore`,
    updateRoles: (id: string) => `/Users/${id}/roles`,
    classes: (id: string) => `/Users/${id}/classes`,
    schedules: (id: string) => `/Users/${id}/schedules`,
    mySchedules: '/Users/me/schedules'
  },
  federationMembers: {
    root: '/FederationMembers',
    sync: '/FederationMembers/sync',
    byCode: (code: string) => `/FederationMembers/${encodeURIComponent(code)}`
  },
  instructorClassSalaries: {
    root: '/instructor-class-salaries',
    byId: (id: string) => `/instructor-class-salaries/${id}`,
    byUserAndClass: '/instructor-class-salaries/by-user-class',
  },
  systemConfig: {
    root: '/systemconfig',
    byKey: (key: string) => `/systemconfig/${key}`,
    reloadCache: '/systemconfig/reload-cache',
  },
  dashboard: {
    statistics: '/dashboard/statistics',
    revenue: '/dashboard/revenue',
    students: '/dashboard/students',
    classes: '/dashboard/classes',
    attendance: '/dashboard/attendance',
    systemNotifications: '/dashboard/system-notifications',
    studentMonthStats: '/dashboard/student-month-stats'
  },
  attendanceAdjustments: {
    root: '/attendance-adjustments',
    my: '/attendance-adjustments/my',
    byId: (id: string) => `/attendance-adjustments/${id}`,
    cancel: (id: string) => `/attendance-adjustments/${id}/cancel`,
    approve: (id: string) => `/attendance-adjustments/${id}/approve`,
    reject: (id: string) => `/attendance-adjustments/${id}/reject`,
    pendingCount: '/attendance-adjustments/pending-count',
    myPendingCount: '/attendance-adjustments/my-pending-count',
    canCreate: '/attendance-adjustments/can-create'
  },
  userDocuments: {
    // User-facing
    my: '/user-documents/my',
    myDelete: (id: string) => `/user-documents/my/${id}`,

    // Student-facing
    student: (studentId: string) => `/user-documents/students/${studentId}`,
    studentDelete: (studentId: string, docId: string) => `/user-documents/students/${studentId}/${docId}`,

    // Admin
    root: '/user-documents',
    byId: (id: string) => `/user-documents/${id}`,
    requestResubmission: (id: string) => `/user-documents/${id}/request-resubmission`,
  },
  zaloLinks: {
    stats: '/zalo-links/stats',
    unlinked: '/zalo-links/unlinked',
    lookup: '/zalo-links/lookup',
    coachOverview: '/zalo-links/coach/overview',
    coachStudents: '/zalo-links/coach/students'
  },
  miniAppLinks: {
    classes: '/mini-app-links/classes',
    students: '/mini-app-links/students',
    root: '/mini-app-links',
    byId: (id: string) => `/mini-app-links/${id}`
  },
  print: {
    receipt: (receiptNumber: string) => `/print/receipt/${receiptNumber}`
  },
  oneTimeFees: {
    options: '/one-time-fees/options',
    studentStatuses: (studentId: string) => `/one-time-fees/students/${studentId}`,
    adminStatuses: '/one-time-fees/admin-statuses',
    markPaid: '/one-time-fees/mark-paid',
    definitions: '/one-time-fees/definitions',
    createDefinition: '/one-time-fees/definitions',
    updateDefinition: (feeCode: string) => `/one-time-fees/definitions/${encodeURIComponent(feeCode)}`,
    prices: '/one-time-fees/prices',
    upsertPrice: '/one-time-fees/prices',
    importPaid: '/one-time-fees/import-paid'
  }
} as const

export type ApiEndpoints = typeof API_ENDPOINTS
