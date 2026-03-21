# Project Full Audit - Missing Items (2026-03-21)

## 1) Ket qua tong quan

- TypeScript: `PASS` (`pnpm -s tsc --noEmit`)
- Build production: `PASS` (`pnpm -s build`)
- Lint: `FAIL`
  - Errors: `202`
  - Warnings: `18`

## 2) Nhom thieu/chua dat theo muc uu tien

### P0 - Can xu ly som (co nguy co loi moi truong)

1. Endpoint prefix khong dong nhat trong cung service (`/api/...` va `...`), co nguy co goi sai URL tuy theo `NEXT_PUBLIC_API_URL`.
   - Vi du:
     - `src/services/branchService.ts` dung ca `/Branches` va `/api/Branches/...`
     - `src/services/userService.ts` dung ca `/Users` va `/api/Users/...`
     - `src/services/roleService.ts` dung ca `/Roles` va `/api/Roles/...`
     - `src/services/attendanceService.ts` dung ca `/Attendance/...` va `/api/Attendance/...`
     - `src/services/payrollService.ts` dung `/api/Payroll/...` trong khi endpoint khac dung `/Payroll...`

2. Tai lieu backend status chua cap nhat theo bo API 03/2026.
   - `MISSING-APIS-FOR-BACKEND.md` van ghi cap nhat den Dec/2025.

### P1 - Thieu service mapping theo API docs

Doi chieu tu `API-Documentation-For-Frontend.md` cho thay cac endpoint sau **chua co wrapper trong `src/services`**:

1. `/api/auth/google`
2. `/api/auth/password`
3. `/api/auth/refresh`
4. `/api/auth/register`
5. `/api/attendance/check-out`
6. `/api/attendance/my`
7. `/api/attendance/{id}`
8. `/api/dashboard/statistics`
9. `/api/dashboard/revenue`
10. `/api/dashboard/students`
11. `/api/dashboard/classes`
12. `/api/dashboard/attendance`
13. `/api/payroll/calculate`
14. `/api/reports/students/list`
15. `/api/reports/financial/class`
16. `/api/student-attendance`
17. `/api/student-attendance/{id}`
18. `/api/student-attendance/batch`
19. `/api/student-attendance/class/{id}/date/{date}`
20. `/api/student-attendance/student/{id}/class/{id}`
21. `/api/student-attendance/statistics/student/{id}/class/{id}`
22. `/api/student-attendance/unmarked/class/{id}/date/{date}`
23. `/api/users/{id}/roles`

Note:
- Mot so endpoint co the dang duoc goi qua context/login flow thay vi service rieng, nhung hien tai khong co wrapper thong nhat trong `src/services`.

### P1 - Lint debt lon toan repo

Top file nhieu loi lint nhat hien tai:

1. `src/views/apps/class-transfer/list/ClassTransferListTable.tsx` (17 errors, 1 warning)
2. `src/views/apps/leave-request/list/LeaveRequestListTable.tsx` (16 errors)
3. `src/views/apps/class/list/AddStudentsToClassDrawer.tsx` (14 errors)
4. `src/views/apps/belt-exam/list/BeltExamListTable.tsx` (9 errors)
5. `src/views/apps/payment/list/AddPaymentDrawer.tsx` (9 errors)

Dang loi chinh:
- `padding-line-between-statements`
- `newline-before-return`
- `import/order`
- `@typescript-eslint/no-unused-vars`
- mot so `react-hooks/exhaustive-deps`

### P2 - Technical debt

1. `@ts-ignore`/`@ts-expect-error`: 18 vi tri trong `src`.
2. TODO/FIXME/HACK: 5 vi tri trong `src`.
3. Chua co test file unit/integration (`*test*`/`*spec*`) trong `src`.

### P2 - Chua day UI theo API da co

Trong bo API 03/2026:

1. Da co service cho:
   - `PUT /api/products/{id}`
   - `PUT /api/product-sales/{id}`
2. Nhung chua co man hinh edit tren UI (hien tai chi create/list/delete/restore).

## 3) Nhung gi da on

1. Menu route khong bi huong den trang khong ton tai (check qua `verticalMenuData` va `horizontalMenuData`).
2. Cac man hinh bo sung 03/2026 da build duoc:
   - Product
   - Product Sale
   - Finance Summary
   - Cash Handover
3. Typecheck va production build pass.

## 4) De xuat thu tu xu ly

1. Chuan hoa endpoint prefix trong services (`/api` strategy) de tranh 404 theo moi truong.
2. Xu ly lint errors theo tung cum module (uu tien apps dang su dung hang ngay).
3. Bo sung wrapper service cho cac endpoint chua co mapping (nhat la dashboard/reports/student-attendance).
4. Bo sung test co ban cho service layer va form critical (payment/class-transfer/cash-handover).
5. Cap nhat `MISSING-APIS-FOR-BACKEND.md` theo bo API moi nhat.

