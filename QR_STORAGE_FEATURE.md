# Tính năng Lưu trữ QR Code

## Tổng quan
Hệ thống đã được cập nhật để tự động lưu trữ tất cả QR codes được tạo ra, kèm theo tên thiết bị/camera tương ứng.

## Các thay đổi chính

### 1. Model mới: QRCode
**File:** `models/QRCode.ts`

Model này lưu trữ thông tin QR code:
- `cameraId`: ID của camera
- `name`: Tên hiển thị (lấy từ camera hoặc club)
- `qrImageBase64`: Ảnh QR code dạng base64
- `url`: URL được mã hóa trong QR
- `createdAt`: Thời gian tạo

### 2. API Endpoints mới

#### `/api/qrcodes`
- **POST**: Lưu QR code mới
- **GET**: Lấy danh sách tất cả QR codes đã tạo

#### `/api/camera-name`
- **GET**: Lấy tên camera từ cameraId
- Dùng để hiển thị tên đúng khi tạo QR từ StandaloneQR

### 3. Component cập nhật

#### `QRModal.tsx`
- Tự động lưu QR code vào database khi người dùng nhấn "Tải QR Code"
- Gửi request POST đến `/api/qrcodes` với thông tin đầy đủ

#### `StandaloneQR.tsx`
- Khi nhập Camera ID, hệ thống sẽ:
  1. Gọi API `/api/camera-name` để lấy tên camera từ database
  2. Hiển thị QR với tên camera chính xác
  3. Khi tải xuống, QR sẽ được lưu với tên camera

#### `DeviceForm.tsx`
- Khi tạo thiết bị mới và hiển thị QR:
  - QR được lưu với tên là `clubName` từ form
  - Tự động lưu khi người dùng tải xuống

### 4. Component mới: QRCodeList
**File:** `components/QRCodeList.tsx`

Hiển thị danh sách tất cả QR codes đã tạo với:
- Hình ảnh QR code
- Tên thiết bị/camera
- Camera ID
- Thời gian tạo
- Nút tải xuống lại
- Nút copy URL

### 5. Cập nhật trang chính
**File:** `app/page.tsx`

Thêm hiển thị:
- Danh sách thiết bị (DeviceList)
- Danh sách QR codes (QRCodeList)
- Tự động refresh khi có thiết bị mới

### 6. Cập nhật API devices
**File:** `app/api/devices/route.ts`

Thêm GET endpoint để lấy danh sách thiết bị đã tạo.

### 7. Cập nhật Camera Model
**File:** `models/Camera.ts`

Bật timestamps để có `createdAt` và `updatedAt`.

## Luồng hoạt động

### Khi tạo QR từ Form (DeviceForm):
1. Người dùng điền form và lưu thiết bị
2. QR modal hiển thị với `clubName` từ form
3. Khi nhấn "Tải QR Code":
   - QR được lưu vào database với tên = `clubName`
   - File được tải xuống máy

### Khi tạo QR từ nút "Tạo QR Code" (StandaloneQR):
1. Người dùng nhập Camera ID
2. Hệ thống gọi API để lấy tên camera từ database
3. QR modal hiển thị với tên camera chính xác
4. Khi nhấn "Tải QR Code":
   - QR được lưu vào database với tên = tên camera
   - File được tải xuống máy

## Database Collections

### `qrcodes`
```javascript
{
  _id: ObjectId,
  cameraId: String,
  name: String,
  qrImageBase64: String,
  url: String,
  createdAt: Date
}
```

### `cameras` (đã cập nhật)
```javascript
{
  _id: ObjectId,
  name: String,
  clubId: ObjectId,
  rtspUrl: String,
  scoreboardId: String,
  // ... các fields khác
  createdAt: Date,  // MỚI
  updatedAt: Date   // MỚI
}
```

## Lợi ích

1. **Lưu trữ lịch sử**: Tất cả QR codes được lưu trữ vĩnh viễn
2. **Tái sử dụng**: Có thể tải lại QR codes cũ mà không cần tạo mới
3. **Quản lý tập trung**: Xem tất cả QR codes đã tạo ở một nơi
4. **Tên chính xác**: QR luôn được lưu với tên đúng của thiết bị/camera
5. **Audit trail**: Biết được QR nào được tạo khi nào
6. **Copy & Share dễ dàng**: Nhấn vào ảnh QR để copy và paste vào bất kỳ đâu (chat, email, document)

## Sử dụng

### Xem và quản lý QR codes
1. **Xem danh sách QR codes**: Cuộn xuống trang chính
2. **Copy ảnh QR**: 
   - Nhấn vào ảnh QR code
   - Hoặc nhấn nút "Copy ảnh"
   - Sau đó paste (Ctrl+V) vào bất kỳ đâu: Telegram, Zalo, Email, Word, v.v.
3. **Tải lại QR code**: Nhấn nút "Tải xuống" để lưu file PNG
4. **Copy URL**: Nhấn icon link để sao chép URL

### Tạo QR mới
1. **Từ form**: Điền thông tin thiết bị → Lưu → QR hiển thị
   - Nhấn vào ảnh QR để copy
   - Hoặc nhấn "Copy Ảnh" để copy vào clipboard
   - Hoặc nhấn "Tải QR Code" để lưu file
2. **Từ nút "Tạo QR Code"**: 
   - Nhấn nút ở góc dưới phải
   - Nhập Camera ID
   - QR hiển thị với tên camera từ database
   - Copy hoặc tải xuống như trên

## Tính năng Copy Ảnh

### Cách hoạt động
- Sử dụng Clipboard API của trình duyệt
- Copy ảnh QR dạng PNG vào clipboard
- Có thể paste trực tiếp vào:
  - Ứng dụng chat (Telegram, Zalo, Messenger, WhatsApp)
  - Email clients
  - Microsoft Word, Google Docs
  - Photoshop, Paint
  - Bất kỳ ứng dụng nào hỗ trợ paste ảnh

### Trải nghiệm người dùng
- **Hover effect**: Di chuột vào ảnh QR sẽ hiển thị hint "Nhấn để copy ảnh"
- **Visual feedback**: Khi copy thành công hiển thị "✓ Đã copy!"
- **Loading state**: Hiển thị "Đang copy..." khi đang xử lý
- **Fallback**: Nếu trình duyệt không hỗ trợ, hiển thị hướng dẫn thay thế

### Yêu cầu trình duyệt
- Chrome/Edge 76+
- Firefox 87+
- Safari 13.1+
- Yêu cầu HTTPS (hoặc localhost cho development)
