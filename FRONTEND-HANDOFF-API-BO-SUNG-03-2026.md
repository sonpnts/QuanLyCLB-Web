# Frontend Handoff - API Bo Sung Thang 03/2026

Tai lieu nay mo ta phan giao dien da bo sung de tuong thich voi section **"API Bo Sung Thang 03/2026 (Cho Client Web)"** trong file `API-Documentation-For-Frontend.md`.

## 1) Cac man hinh da bo sung

### 1.1 Quan ly san pham
- Route: `/apps/product/list`
- Files chinh:
  - `src/views/apps/product/list/ProductListTable.tsx`
  - `src/views/apps/product/list/AddProductDrawer.tsx`
  - `src/services/productService.ts`
  - `src/types/apps/productTypes.ts`
- Chuc nang:
  - Danh sach san pham (`GET /api/products`)
  - Loc theo `code`, `category`, `isActive`
  - Tao san pham (`POST /api/products`)
  - Xoa mem (`DELETE /api/products/{id}`)
  - Khoi phuc (`POST /api/products/{id}/restore`)

### 1.2 Giao dich ban san pham
- Route: `/apps/product-sale/list`
- Files chinh:
  - `src/views/apps/product-sale/list/ProductSaleListTable.tsx`
  - `src/views/apps/product-sale/list/AddProductSaleDrawer.tsx`
  - `src/services/productSaleService.ts`
  - `src/types/apps/productSaleTypes.ts`
- Chuc nang:
  - Danh sach giao dich (`GET /api/product-sales`)
  - Loc theo `productId`, `classId`, `soldByUserId`, `saleDateFrom`, `saleDateTo`
  - Tao giao dich (`POST /api/product-sales`)
  - Xoa mem / khoi phuc giao dich
  - Hien thi tong tien `quantity * unitPrice` tren form

### 1.3 Thong ke tai chinh
- Route: `/apps/finance/summary`
- Files chinh:
  - `src/views/apps/finance/summary/index.tsx`
  - `src/services/financeService.ts`
  - `src/types/apps/financeTypes.ts`
- Chuc nang:
  - Tong hoc phi 1 lop:
    - `GET /api/finance/summary/class/{classId}/tuition`
  - Tong doanh thu ban san pham:
    - `GET /api/finance/summary/product-sales`
  - Tong tien HLV thu theo lop:
    - `GET /api/finance/summary/class/{classId}/instructor/{instructorId}`
  - Tong doanh thu 1 chi nhanh:
    - `GET /api/finance/summary/branch/{branchId}`
  - Danh sach tong thu theo tung lop cua HLV:
    - `GET /api/finance/instructors/{instructorId}/class-collections`
    - Hoac `GET /api/finance/me/class-collections`

### 1.4 Ban giao tien
- Route: `/apps/cash-handover/list`
- Files chinh:
  - `src/views/apps/cash-handover/list/CashHandoverListTable.tsx`
  - `src/views/apps/cash-handover/list/AddCashHandoverDrawer.tsx`
  - `src/views/apps/cash-handover/list/CashHandoverDetailDialog.tsx`
  - `src/services/cashHandoverService.ts`
  - `src/types/apps/cashHandoverTypes.ts`
- Chuc nang:
  - Lich su ban giao (`GET /api/cash-handovers`)
  - Tao phieu ban giao (`POST /api/cash-handovers`)
  - Chi tiet phieu (`GET /api/cash-handovers/{id}`)
  - Validate tren client:
    - So tien nop > 0
    - Neu co du lieu class-collections thi khong cho nop vuot `availableToHandover`

### 1.5 Dieu chinh chuyen lop + payment
- Chuyen lop (`src/views/apps/class-transfer/list/AddTransferDrawer.tsx`)
  - Neu khong phai Admin: chi hien thi lop nguon duoc phan cong cho user
  - Bat loi `403 Forbidden` khi tao request khong dung rule
- Payment (`src/views/apps/payment/list/AddPaymentDrawer.tsx`, `src/services/paymentService.ts`)
  - Them field `collectedByUserId` theo update moi cua API `POST /api/payments`

## 2) Vi du payload de FE test nhanh

### 2.1 Tao san pham
```json
{
  "code": "SP-VO-PHUC-01",
  "name": "Vo phuc tre em",
  "category": "Vo phuc",
  "unitPrice": 350000,
  "description": "Size 140"
}
```

### 2.2 Tao giao dich ban san pham
```json
{
  "productId": "guid-product",
  "classId": "guid-class",
  "quantity": 2,
  "unitPrice": 180000,
  "soldByUserId": "guid-coach",
  "buyerName": "Nguyen Van A",
  "notes": "Ban sau buoi hoc"
}
```

### 2.3 Tao phieu ban giao tien
```json
{
  "classId": "guid-class",
  "instructorId": "guid-coach",
  "amountHandedOver": 5000000,
  "notes": "Nop tien dot 1"
}
```

### 2.4 Tao payment co nguoi thu tien
```json
{
  "studentId": "guid-student",
  "classId": "guid-class",
  "type": 0,
  "amount": 1200000,
  "paymentDate": "2026-03-21",
  "method": 0,
  "forMonth": 3,
  "forYear": 2026,
  "description": "Hoc phi thang 3",
  "collectedByUserId": "guid-coach"
}
```

## 3) Mapping nhanh API -> service method

- Product:
  - `getProducts`, `createProduct`, `updateProduct`, `deleteProduct`, `restoreProduct`
- Product sales:
  - `getProductSales`, `createProductSale`, `updateProductSale`, `deleteProductSale`, `restoreProductSale`
- Finance:
  - `getClassTuitionSummary`
  - `getProductSalesSummary`
  - `getClassInstructorSummary`
  - `getBranchSummary`
  - `getClassCollectionsByInstructor`
  - `getMyClassCollections`
- Cash handover:
  - `getCashHandovers`, `getCashHandoverById`, `createCashHandover`

## 4) Cac route da them vao menu

- `/apps/product/list`
- `/apps/product-sale/list`
- `/apps/finance/summary`
- `/apps/cash-handover/list`

Da cap nhat ca `verticalMenuData.tsx` va `horizontalMenuData.tsx`.

## 5) Luu y cho team client web viet tiep

- API phan bo endpoint dang theo namespace lowercase (`/products`, `/product-sales`, `/finance`, `/cash-handovers`), can thong nhat voi `NEXT_PUBLIC_API_URL`.
- Cac service moi dang map linh hoat cho 2 dang response list:
  - `data.items`
  - `data.records`
- Neu backend bo sung endpoint edit chi tiet tren UI (sua phieu ban giao, sua giao dich ban hang), chi can them action va drawer edit, service da co ham `update` cho product va product-sale.
- Validation nghiep vu quan trong nen giu o ca backend va frontend:
  - Coach chi tao request chuyen lop cho lop duoc phan cong
  - So tien ban giao khong vuot so co the ban giao

## 6) Chuan hoa endpoint 1 diem

- Da gom endpoint vao `src/constants/apiEndpoints.ts`.
- Da gom ca endpoint auth/password/google/refresh ve cung 1 diem.
- Da co tai lieu huong dan: `ENDPOINT-STANDARDIZATION-03-2026.md`.
