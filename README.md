# MMA301 - ASSIGNMENT 02: INTEGRATED E-COMMERCE MOBILE APP (GAMESTORE PRO)

> **Môn học:** MMA301 – Multiplatform Mobile App Development  
> **Nền tảng:** React Native (Expo SDK 57, Expo Router v57, TypeScript)  
> **Kiến trúc:** 5-Layer Separation of Concerns (UI → Hooks → Services → Persistence/API → Config)

---

## 1. TỔNG QUAN & BUSINESS WORKFLOW

Dự án **GameStore Pro** là ứng dụng thương mại điện tử chuyên biệt cho các tựa game bản quyền, tích hợp trọn vẹn chuỗi nghiệp vụ thực tế:

1. **Khởi động (Startup):** Tự động khôi phục dữ liệu giỏ hàng (`Cart`), khóa cấu hình (`Gemini API Key`) từ bộ nhớ cục bộ `AsyncStorage`.
2. **Khám phá & Tìm kiếm (Browse & Search):** Tải danh mục game từ Remote API (DummyJSON), hỗ trợ tìm kiếm Debounce, lọc theo Category, phân trang cuộn vô hạn (Infinite Scroll) với cơ chế chặn trùng lặp.
3. **Chi tiết & Giỏ hàng (Detail & Cart State):** Xem thông tin sản phẩm, quản lý số lượng, tự động tính toán các giá trị dẫn xuất (Derived Totals: Subtotal, Discount 10% cho đơn > 2.000.000 ₫, Free ship cho đơn > 1.000.000 ₫).
4. **Đơn hàng Firebase (Business Record):** Tạo đơn hàng và đồng bộ lên **Cloud Firestore** qua REST API kèm cơ chế **Offline Fallback** (luôn lưu AsyncStorage phòng khi mất kết nối).
5. **AI Game Critic & Shopping Advisor (Gemini AI):** Tích hợp Generative AI với Catalog Context:
   - *So sánh 2 tựa game:* Đối chiếu đồ họa, gameplay, giá trị tiền bạc và đưa ra lời khuyên.
   - *Tư vấn chọn game:* Phân tích sở thích + ngân sách của game thủ dựa trên kho game thực tế.
   - *Validation & Fallback:* Validate cấu trúc JSON trả về, tự động fallback thuật toán nội bộ khi offline.
6. **Thông báo (Notification Workflow):** Quản lý quyền thông báo linh hoạt (hỗ trợ cả Expo Go Android và Native Standalone Build). Bắn thông báo xác nhận ngay khi đặt hàng thành công.

---

## 2. BẢNG TRUY VẾT YÊU CẦU (RTM - REQUIREMENT TRACEABILITY MATRIX)

| ID | Yêu cầu | Bằng chứng Code / UI | File triển khai | Test case kiểm thử |
| :---: | :--- | :--- | :--- | :--- |
| **R01** | Remote product data | `productService.getProducts` | `src/services/productService.ts` | Hiển thị list / Xử lý khi lỗi mạng |
| **R02** | FlatList + pagination/infinite | `useProducts.fetchNextPage`, `skipRef`, guard chặn lặp | `src/hooks/useProducts.ts`<br>`src/app/(tabs)/index.tsx` | Cuộn xuống đáy tải thêm 10 item, không bị duplicate ID |
| **R03** | Search/filter + refresh | `handleSearch` (debounce), Category Filter bar, RefreshControl | `src/hooks/useProducts.ts`<br>`src/app/(tabs)/index.tsx` | Tìm kiếm ra kết quả đúng / kéo vuốt reload dữ liệu |
| **R04** | Product detail | Màn hình chi tiết game, xem ảnh, rating, nút Add to Cart | `src/app/product/[id].tsx` | Xem ID hợp lệ / ID không tồn tại |
| **R05** | Cart state | Context API `CartProvider`, `addToCart`, `updateQuantity`, `removeFromCart` | `src/context/CartContext.tsx` | Thêm mới, tăng giảm, xóa sản phẩm |
| **R06** | Derived totals | `useMemo` tính subtotal, discount, shipping, grandTotal | `src/context/CartContext.tsx` | Đơn 0 ₫, đơn < 1.000.000 ₫, đơn > 2.000.000 ₫ |
| **R07** | Persistence | Bọc `AsyncStorage` tập trung, tự động restore khi mở app | `src/services/storageService.ts` | Tắt app bật lại giỏ hàng và API Key còn nguyên |
| **R08** | Firebase use case | Đặt hàng lưu Firestore REST API + Offline Cache | `src/services/firebaseService.ts`<br>`src/hooks/useFirebaseOrders.ts` | Đặt hàng thành công, hiển thị lịch sử ở tab Orders |
| **R09** | Notification flow | Xin quyền, notification handler, bắn thông báo đặt hàng | `src/services/notificationService.ts` | Cấp quyền ➜ Nhận thông báo; Từ chối ➜ Không crash |
| **R10** | Gemini AI integration | So sánh 2 game & Tư vấn mua game theo Catalog context | `src/services/geminiService.ts`<br>`src/app/(tabs)/ai.tsx` | Trả JSON hợp lệ / Fallback nội bộ khi không có mạng/key |
| **R11** | Debug evidence | Hệ thống Logger đa tầng + Bảng Debug Log 2 lỗi thực tế | `src/services/loggerService.ts`<br>`README.md` | Truy vết lỗi mạng LDPlayer & Lỗi Expo SDK mismatch |
| **R12** | Release build ready | TypeScript typecheck 0 lỗi, Expo doctor/lint pass | `package.json`, `tsconfig.json` | `npx tsc --noEmit` & `npx expo lint` |

---

## 3. WORKSHEET 2.2: GIẢI PHÁP & TRẢ LỜI CÂU HỎI KIẾN TRÚC

### 1. Source of truth của Product / Cart / Orders là gì?
- **Product:** Source of truth là Remote API (`DummyJSON /products`), lưu tạm tại `products` state trong hook `useProducts`.
- **Cart:** Source of truth là `CartContext`, đồng bộ tự động 2 chiều xuống `AsyncStorage` (`@app_cart_items`).
- **Orders:** Source of truth là Cloud Firestore (`orders` collection) với bản sao lưu Offline tại `AsyncStorage` (`@app_saved_orders`).

### 2. Phân loại State: Local vs Shared vs Persistent vs Remote?
- **Local State:** `searchQuery`, `selectedCategory`, `isLoadingMore` (trong màn hình Store / hook `useProducts`), `activeTab` (trong màn hình AI).
- **Shared State:** `items` giỏ hàng, `totals` được cung cấp qua `CartContext` cho toàn bộ các tab và màn hình Product Detail.
- **Persistent State:** Giỏ hàng (`@app_cart_items`), Lịch sử đơn hàng (`@app_saved_orders`), Gemini API Key (`@app_gemini_api_key`).
- **Remote State:** Danh sách game từ DummyJSON API, Đơn hàng trên Firebase Firestore.

### 3. Pagination thật hay Client-side? Cách xác định End-of-list?
- **Pagination thật:** Dùng API query parameters `limit=10&skip={skipRef.current}` trực tiếp từ DummyJSON API.
- **End-of-list:** Xác định bằng công thức `skipRef.current >= res.total`. Khi đó `hasMore` chuyển thành `false`, Footer hiển thị thông báo đã tải hết và ngừng gọi API.
- **Chặn gọi trùng lặp (Guard):** 
  ```typescript
  if (isLoading || isLoadingMore || !hasMore || error) return;
  ```

### 4. Firebase use case giải quyết nghiệp vụ gì?
- **Nghiệp vụ:** Tiếp nhận và lưu trữ đơn đặt hàng (Order Submission).
- **Cấu trúc bản ghi:** Mỗi document trong collection `orders` chứa: `id`, `createdAt`, `totalAmount`, `totalQuantity`, `customerName`, `customerPhone`, `customerAddress`, `itemCount`.
- **Khả năng chịu lỗi:** Gọi Firestore REST API kèm `AbortController` (timeout 6s). Nếu mạng lỗi hoặc timeout, đơn hàng vẫn được lưu an toàn vào `AsyncStorage` và trả về trạng thái `syncedOnline: false`.

### 5. Gemini AI nhận context nào? Validation thế nào?
- **Context đầu vào:** Truyền danh sách tóm tắt (ID, Title, Price, Rating, Category) của 10 sản phẩm thực tế từ Catalog vào prompt.
- **Validation:** Ép AI trả về Pure JSON Schema (`ComparisonResponse` / `RecommendationResponse`). Ứng dụng parse và validate ID đề xuất. Nếu AI trả về ID không tồn tại hoặc parse lỗi, tự động chuyển sang `generateLocalFallback...` đảm bảo UI không bao giờ sập.

### 6. Notification gắn với event nào? Xử lý khi Denied?
- **Event:** Gắn với sự kiện đặt hàng thành công (`placeOrder`).
- **Xử lý khi Denied:** Nếu người dùng từ chối quyền, ứng dụng không crash, tự động chuyển sang hiển thị Banner thông báo trong ứng dụng (In-app banner) và ghi nhật ký thông qua `loggerService`.

### 7. Secret / Config handling?
- **Không hard-code API Key thật vào Git repository.**
- Khóa bí mật Gemini API Key được cấu hình động bởi người dùng trong màn hình **Settings**, lưu trữ mã hóa cục bộ trong `AsyncStorage`.

### 8. Khả năng phục hồi (Resilience): Nếu cả API, Firebase và Gemini đều lỗi?
- Ứng dụng **hoàn toàn không bị crash**:
  - API lỗi ➜ Hiển thị Empty/Error state kèm nút **"Thử lại" (Retry)**.
  - Firebase lỗi ➜ Đơn hàng chuyển sang lưu trữ Offline trên máy.
  - Gemini lỗi ➜ Tự động chuyển sang bộ máy phân tích nội bộ (Rule-based Fallback).

---

## 4. DESIGN DECISION RECORD (6 QUYẾT ĐỊNH CỐT LÕI)

| Quyết định | Lựa chọn | Lý do | Impact nếu đổi requirement |
| :--- | :--- | :--- | :--- |
| **State management** | Context API (`CartContext`) | Phù hợp quy mô vừa, Cart là state toàn cục duy nhất. Tránh boilerplate của Redux. | Đổi sang Zustand/Redux chỉ cần viết lại tầng hook `useCart`, UI không đổi. |
| **API structure** | Service Layer (`productService.ts`) | Phân tách UI và data fetch, áp dụng Singleton pattern. | Đổi nguồn API hoặc GraphQL chỉ cần sửa trong file Service. |
| **Pagination** | Offset pagination (`skip` / `limit`) | Khớp với REST API của DummyJSON, kết hợp `useRef` chống re-render. | Đổi sang cursor pagination chỉ cần sửa tham số `skip` thành `cursor`. |
| **Persistence** | AsyncStorage bọc qua `storageService` | Gom toàn bộ key quản lý tại 1 nơi, chuẩn hóa JSON parsing và xử lý lỗi. | Đổi sang SQLite/MMKV chỉ cần sửa 4 hàm trong `storageService.ts`. |
| **Firebase** | Firestore qua REST API + Fallback | Không phụ thuộc nặng vào Native SDK nặng nề, hỗ trợ tốt trên mọi nền tảng. | Đổi sang Realtime DB chỉ cần thay endpoint URL. |
| **Gemini AI** | Pure JSON Prompting + Offline Fallback | Đảm bảo tính ổn định và tính dự đoán của dữ liệu khi render UI. | Đổi sang OpenAI API chỉ cần sửa request adapter trong `geminiService.ts`. |

---

## 5. DEBUG LOG (2 LỖI THẬT ĐÃ XỬ LÝ)

### Lỗi 1: `java.io.IOException: Failed to download remote update` trên giả lập LDPlayer
- **Hiện tượng:** Mở Expo Go trên giả lập LDPlayer báo lỗi đỏ không tải được bundle.
- **Giả thiết:** Giả lập không kết nối được tới server Metro bundler của máy tính.
- **Kiểm tra:** Kiểm tra IP mạng Wi-Fi máy tính (`192.168.1.83`). Máy đang kết nối Wi-Fi nhà trọ ("Nha Tro A29") ở chế độ Public Network và bật AP Isolation. LDPlayer chạy card mạng ảo NAT nên bị chặn.
- **Root Cause:** Thiết bị trong mạng NAT của LDPlayer không thể định tuyến tới IP LAN máy chủ do tường lửa và router chặn.
- **Khắc phục:** Cài đặt `@expo/ngrok`, thêm script `npm run tunnel` (`npx expo start --tunnel`) để chạy qua Cloudflare/ngrok proxy trung gian.
- **Retest:** Chạy `npm run tunnel`, LDPlayer quét URL tunnel và tải bundle thành công 100%.

### Lỗi 2: Cảnh báo lệch phiên bản Expo SDK 57 (`npx expo install --check`)
- **Hiện tượng:** Terminal cảnh báo `expo@57.0.28 → ~57.0.29` cùng 5 thư viện (`@expo/ui`, `expo-router`, `expo-notifications`, `expo-linking`, `expo-constants`).
- **Giả thiết:** Project đang dùng các bản patch cũ của Expo SDK 57.
- **Kiểm tra:** Chạy `npx expo install --check` thấy báo lỗi lệch phiên bản.
- **Root Cause:** Sau khi update Expo core, các package phụ trợ chưa được đồng bộ theo khuyến nghị của SDK 57.
- **Khắc phục:** Chạy `npx expo install --fix` để tự động nâng cấp đồng bộ.
- **Retest:** Chạy `npx expo install --check` trả về `Dependencies are up to date`. Chạy `npx tsc --noEmit` đạt 0 lỗi.

---

## 6. HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

2. **Chạy ứng dụng bằng Tunnel Mode (Khuyên dùng cho mọi thiết bị / Giả lập):**
   ```bash
   npm run tunnel
   ```

3. **Chạy thông thường (Nếu cùng mạng Wi-Fi không có AP Isolation):**
   ```bash
   npm start
   # hoặc: npm run dev
   ```

4. **Kiểm tra chất lượng code (Lint & Typecheck):**
   ```bash
   npx tsc --noEmit
   npx expo lint
   ```
