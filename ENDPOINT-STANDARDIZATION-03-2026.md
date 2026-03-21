# Endpoint Standardization 03/2026

Tai lieu nay mo ta chuan endpoint da duoc thong nhat de tranh sai lech `/api` va de de bao tri ve sau.

## 1) Single source of truth

- Tat ca endpoint backend tap trung tai:
  - `src/constants/apiEndpoints.ts`
- Khong hardcode endpoint trong `service`, `context`, `view`.

## 2) Quy uoc su dung

- Service/context chi duoc goi:
  - `API_ENDPOINTS.<group>.<name>`
- Vi du:
  - `API_ENDPOINTS.products.root`
  - `API_ENDPOINTS.classTransfers.approve(id)`
  - `API_ENDPOINTS.auth.password`

## 3) Chuan hoa `/api` prefix

- `src/utils/apiClient.ts` co `normalizeEndpoint(...)`.
- Neu `NEXT_PUBLIC_API_URL` da ket thuc bang `/api`, client se tu dong bo `/api` o dau endpoint de tranh goi thanh `/api/api/...`.

## 4) Auth endpoint cung da gom chung

- `authContext` khong hardcode nua.
- Dang dung:
  - `API_ENDPOINTS.auth.password`
  - `API_ENDPOINTS.auth.google`
- Refresh token dang dung:
  - `API_ENDPOINTS.auth.refresh`

## 5) Cach them endpoint moi

1. Them endpoint vao `src/constants/apiEndpoints.ts`.
2. Su dung lai endpoint do trong service/context lien quan.
3. Khong dat string endpoint truc tiep trong component.
4. Chay:
   - `pnpm -s tsc --noEmit`
   - `pnpm -s build`

## 6) Luu y cho backend/frontend

- He thong hien dang co ca namespace PascalCase (`/Users`, `/Classes`) va lowercase (`/products`, `/finance`).
- Frontend da map dung theo API docs hien tai, khong tu y doi hoa-thuong.
- Neu backend doi endpoint, FE chi can sua tai `src/constants/apiEndpoints.ts`.
