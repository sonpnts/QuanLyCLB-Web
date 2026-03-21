# Backend Request - Missing/Gap APIs (03/2026)

Ngay kiem tra: 2026-03-21  
Scope doi chieu: section **"API Bo Sung Thang 03/2026 (Cho Client Web)"** trong `API-Documentation-For-Frontend.md` voi giao dien frontend hien tai.

## 1) Checklist API 03/2026 vs Frontend

### 1.1 Chuyen lop
- `POST /api/class-transfers`: **Da map UI**
  - Frontend da cap nhat rule theo role (Coach/Admin) va bat loi `403`.

### 1.2 Product APIs
- `GET /api/products`: **Da map UI**
- `POST /api/products`: **Da map UI**
- `PUT /api/products/{id}`: **Da co service, chua co man hinh edit**
- `DELETE /api/products/{id}`: **Da map UI**
- `POST /api/products/{id}/restore`: **Da map UI**

### 1.3 Product Sales APIs
- `GET /api/product-sales`: **Da map UI**
- `POST /api/product-sales`: **Da map UI**
- `PUT /api/product-sales/{id}`: **Da co service, chua co man hinh edit**
- `DELETE /api/product-sales/{id}`: **Da map UI**
- `POST /api/product-sales/{id}/restore`: **Da map UI**

### 1.4 Finance Summary APIs
- `GET /api/finance/summary/class/{classId}/tuition`: **Da map UI**
- `GET /api/finance/summary/product-sales`: **Da map UI**
- `GET /api/finance/summary/class/{classId}/instructor/{instructorId}`: **Da map UI**
- `GET /api/finance/summary/branch/{branchId}`: **Da map UI**
- `GET /api/finance/instructors/{instructorId}/class-collections`: **Da map UI**
- `GET /api/finance/me/class-collections`: **Da map UI**

### 1.5 Cash Handover APIs
- `POST /api/cash-handovers`: **Da map UI**
- `GET /api/cash-handovers`: **Da map UI**
- `GET /api/cash-handovers/{id}`: **Da map UI**

### 1.6 Payment API update
- `POST /api/payments` + field `collectedByUserId`: **Da map UI**

---

## 2) API can backend xac nhan da deploy (uu tien)

`MISSING-APIS-FOR-BACKEND.md` hien tai moi cap nhat den Dec/2025, chua liet ke bo API 03/2026.  
De tranh sai lech moi truong, can backend xac nhan cac endpoint sau da co tren environment dung cho web:

1. `GET /api/products`
2. `POST /api/products`
3. `PUT /api/products/{id}`
4. `DELETE /api/products/{id}`
5. `POST /api/products/{id}/restore`
6. `GET /api/product-sales`
7. `POST /api/product-sales`
8. `PUT /api/product-sales/{id}`
9. `DELETE /api/product-sales/{id}`
10. `POST /api/product-sales/{id}/restore`
11. `GET /api/finance/summary/class/{classId}/tuition`
12. `GET /api/finance/summary/product-sales`
13. `GET /api/finance/summary/class/{classId}/instructor/{instructorId}`
14. `GET /api/finance/summary/branch/{branchId}`
15. `GET /api/finance/instructors/{instructorId}/class-collections`
16. `GET /api/finance/me/class-collections`
17. `POST /api/cash-handovers`
18. `GET /api/cash-handovers`
19. `GET /api/cash-handovers/{id}`
20. `POST /api/class-transfers` (xac nhan rule moi 403 theo class assignment)
21. `POST /api/payments` (xac nhan nhan field moi `collectedByUserId`)

---

## 3) API gap de xuat bo sung (de UI van hanh on dinh hon)

### 3.1 Preview ban giao truoc khi tao phieu (khuyen nghi cao)
- De xuat: `GET /api/cash-handovers/preview?classId={guid}&instructorId={guid}&asOfDate={date?}`
- Ly do:
  - UI can lay snapshot chinh xac tai thoi diem tao phieu.
  - Giam sai so do lech thoi gian giua luc load class-collections va luc submit POST.

### 3.2 API danh sach lop cua user hien tai (khuyen nghi)
- De xuat: `GET /api/me/classes`
- Ly do:
  - Hien tai frontend suy ra lop duoc phan cong tu `GET /api/Classes` va field `userIds/coachIds`.
  - API rieng cho "my classes" se chuan hon cho rule chuyen lop, ban san pham, ban giao tien.

### 3.3 API danh muc san pham (khuyen nghi)
- De xuat: `GET /api/products/categories`
- Ly do:
  - UI dang cho nhap text tu do category.
  - Neu co danh muc chuan tu backend se dong bo bao cao va bo loc.

---

## 4) Note khong phai backend-thieu (de dong bo roadmap)

1. Frontend hien tai chua lam man hinh edit cho:
   - `PUT /api/products/{id}`
   - `PUT /api/product-sales/{id}`
2. Services da co san, co the bo sung drawer/dialog edit trong sprint tiep theo.

