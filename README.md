# Tiệm Sách Quýt Next Storefront

Next.js storefront của Tiệm Sách Quýt dùng data layer có cấu trúc. Runtime đọc nội dung từ Cloud Firestore và đọc ảnh từ Firebase Storage.

## Cách Hoạt Động

- App dùng Next.js App Router, TypeScript và static generation.
- Runtime đọc Firestore qua repository `src/lib/storefront.ts`.
- Backend dùng Next.js Route Handlers trong `src/app/api` cho storefront APIs, auth, cart, checkout và orders.
- Hình ảnh nằm trên Firebase Storage bucket cấu hình bằng `FIREBASE_STORAGE_BUCKET`.
- Stylesheet được nạp từ `public/media/styles` để giữ fidelity giao diện trong v1.

## Phạm Vi Hiện Có

- Trang chủ
- 1220 product pages
- 22 collection pages
- Blog/category pages
- Article page
- Static pages như giới thiệu, liên hệ, chính sách
- Search page gọi `/api/search`
- Cart/checkout backend qua Firestore

## Không Bao Gồm

- Admin/CMS
- Social login Google/Facebook
- Payment gateway tự động
- JS theme gốc của Sapo

## Chạy Local

```bash
npm install
npm run dev
```

Mặc định app chạy tại `http://localhost:3000`.

## Build Production

```bash
npm run build
npm run start
```

## Deploy Netlify

Repo đã có `netlify.toml` cho Netlify:

- Build command: `npm run build`
- Publish directory: `.next`
- Node runtime: `22`

Không commit `.env.local`. Trên Netlify, thêm các biến môi trường trong **Site configuration → Environment variables** với scope **Builds** và **Functions**:

```txt
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_WEB_API_KEY=
FIREBASE_STORAGE_BUCKET=
SEED_DEFAULT_INVENTORY_QUANTITY=1
```

`FIREBASE_PRIVATE_KEY` nên nhập dạng một dòng có `\n`:

```txt
-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

Nếu dùng Netlify CLI sau khi login/link site, có thể import biến từ local mà không commit secret:

```bash
npx netlify-cli env:import .env.local
```

Sau khi đổi environment variables trên Netlify, trigger deploy lại để server functions nhận giá trị mới.

## Backend Firestore

Tạo `.env.local` từ `.env.example`:

```txt
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_WEB_API_KEY=
FIREBASE_STORAGE_BUCKET=
SEED_DEFAULT_INVENTORY_QUANTITY=1
```

Schema docs có thể import vào Firestore bằng:

```bash
npm run seed:schemas
```

Backend APIs chính:

- `GET /api/site-settings`, `GET /api/home`
- `GET /api/products`, `GET /api/products/[slug]`
- `GET /api/collections`, `GET /api/collections/[slug]`
- `GET /api/search?query=...`
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/[itemId]`, `DELETE /api/cart/items/[itemId]`
- `POST /api/shipping/quote`, `POST /api/discounts/validate`, `POST /api/checkout`

Firestore client access is denied by default in `firestore.rules`; Next.js backend uses Firebase Admin SDK.

## Admin Phase 7

Admin UI chạy tại:

```txt
/admin
```

Admin APIs yêu cầu user đã login bằng Firebase session cookie và document `customers/{uid}` có:

```json
{
  "role": "admin"
}
```

Admin endpoints:

- `GET/POST /api/admin/products`, `GET/PATCH/DELETE /api/admin/products/[slug]`
- `GET/POST /api/admin/collections`, `GET/PATCH /api/admin/collections/[slug]`
- `GET /api/admin/orders`, `GET/PATCH /api/admin/orders/[orderId]`
- `GET/POST /api/admin/discount-codes`, `GET/PATCH/DELETE /api/admin/discount-codes/[code]`
- `GET /api/admin/shipping-rates`, `GET/PATCH /api/admin/shipping-rates/[id]`
- `GET/PATCH /api/admin/site-settings`
- `GET /api/admin/pages|blogs|articles`, `GET/PATCH /api/admin/pages|blogs|articles/[slug]`

Product delete trong admin là archive mềm: `status = "archived"`. Order không có delete endpoint.

## Chỉnh Sửa Nội Dung

- Product data: Firestore collection `products`
- Collection data: Firestore collection `collections`
- Page/article/blog data: Firestore collections `pages`, `articles`, `blogs`
- Header, menu, footer, contact: Firestore document `siteSettings/main`
- Search index: Firestore collection `searchIndex`
- Media files: Firebase Storage path `media/assets/*`, metadata mapping ở Firestore collection `mediaAssets`
- Stylesheet files: `public/media/styles`

## Kiến Trúc Chính

- `src/content/types.ts`: schema TypeScript cho storefront data.
- `src/lib/storefront.ts`: repository đọc Firestore cho runtime.
- `src/app/page.tsx` và `src/app/[...slug]/page.tsx`: static routes, metadata và rendering.
- `src/components/site-page.tsx`: renderer cho các loại page.
- `src/components/search-products.tsx`: client-side search qua `/api/search`.

## Dữ Liệu Hiện Tại

- `1253` route được import.
- `1220` product.
- `22` collection.
- `5` static page.
- `2` blog list và `1` article.
- `1443` media asset đã được đưa lên Firebase Storage.
