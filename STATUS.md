# Arena Device Form - Current Status

**Last Updated:** May 6, 2026

## ✅ Completed Features

### 1. Device Management Form
- Club name input field
- Device ID with auto-verification (debounced 700ms)
- RTSP URL with auto-check (debounced 800ms)
- Visual status indicators (spinner/checkmark/error)
- Blue color scheme throughout UI
- Fully responsive (mobile + desktop)

### 2. Database Integration
- MongoDB connection to `arena_ai` database
- Dual-collection write:
  - **clubs** collection: name, branchId, description, workerId, type, phone
  - **cameras** collection: name, clubId, rtspUrl, scoreboardId, tableCorners, etc.
- Automatic ID linking between collections

### 3. Table Corner Detection
- Browser-based corner picker (full-screen modal)
- Frame capture from RTSP using ffmpeg
- Interactive canvas with:
  - 1-finger drag for corners or pan
  - 2-finger pinch-to-zoom
  - Real-time coordinate display
  - Image resolution display
- Coordinates mapped 1:1 to original image pixels
- Saves to `camera.tableCorners` in MongoDB

### 4. QR Code Generation
- **✅ NEW:** Standalone QR generator button (floating bottom-right)
- **✅ UPDATED:** QR modal no longer shows Camera ID or URL
- Generates QR for: `https://academy.arenabilliard.com?cameraId=<camera._id>`
- Auto-generates after device creation
- Manual generation via floating button (input Camera ID)
- Download QR as PNG
- Form resets after 2s but QR modal persists until manually closed

### 5. Production Deployment
- PM2 ecosystem configuration
- Automated deploy script (`deploy.sh`)
- Port 3002 configuration
- Tailscale network access
- Server: http://100.74.187.40:3002
- **✅ FIXED:** ffmpeg path detection with FFMPEG_PATH env variable support

## 🏗️ Technical Stack

- **Framework:** Next.js 16.2.4 with Turbopack
- **Database:** MongoDB (arena_ai)
- **Process Manager:** PM2
- **Video Processing:** ffmpeg (RTSP frame capture)
- **QR Generation:** qrcode library
- **Styling:** Tailwind CSS

## 📁 Key Files

### Components
- `components/DeviceForm.tsx` - Main form with auto-verification
- `components/QRModal.tsx` - QR code display modal (no Camera ID/URL shown)
- `components/StandaloneQR.tsx` - **NEW:** Floating QR generator button
- `components/TableCornerPicker.tsx` - Interactive corner selection

### API Routes
- `app/api/check-device/route.ts` - Device ID verification
- `app/api/check-rtsp/route.ts` - RTSP connectivity check
- `app/api/capture-frame/route.ts` - Frame capture from RTSP (with ffmpeg path detection)
- `app/api/devices/route.ts` - Save to MongoDB

### Models
- `models/Club.ts` - Club schema
- `models/Camera.ts` - Camera schema

### Configuration
- `ecosystem.config.js` - PM2 configuration (port 3002)
- `deploy.sh` - Deployment automation script
- `check-ffmpeg.sh` - **NEW:** ffmpeg installation checker
- `.env.local` - Local environment variables
- `.env.production.example` - Production env template (includes FFMPEG_PATH)

### Documentation
- `FFMPEG_INSTALL.md` - **NEW:** ffmpeg installation guide for server

## 🚀 Deployment Instructions

### 1. First Time Setup on Server

```bash
# Cài đặt ffmpeg (bắt buộc cho table corner detection)
sudo apt update
sudo apt install -y ffmpeg

# Kiểm tra ffmpeg
which ffmpeg
ffmpeg -version

# Copy và cấu hình env
cp .env.production.example .env.production
nano .env.production
# Điền: MONGODB_URI, API_KEY
# Optional: FFMPEG_PATH nếu ffmpeg không trong PATH
```

### 2. Deploy

```bash
cd ~/form-add-new-club  # or your project directory
git pull origin main
./deploy.sh
```

### 3. Access

- Local: http://localhost:3002
- Tailscale: http://100.74.187.40:3002

## 🔧 Build Status

✅ **Build:** Passing (1 warning về next.config.ts - không ảnh hưởng)
✅ **TypeScript:** No diagnostics
✅ **Deployment:** Configured for port 3002

## 🐛 Troubleshooting

### Lỗi: "ffmpeg not found"

Xem hướng dẫn chi tiết trong `FFMPEG_INSTALL.md`

**Quick fix:**
```bash
# Cài ffmpeg
sudo apt install -y ffmpeg

# Restart PM2
pm2 restart arena-device-form
```

## 📝 User Preferences

- Blue color scheme (not purple)
- Auto-verification (no manual buttons)
- Simple status messages: "Xác minh thành công" / "Vui lòng kiểm tra lại"
- No branchId/scoreboardId display in UI
- QR modal persists until manually closed
- **NEW:** No Camera ID or URL display in QR modal
- **NEW:** Floating button for standalone QR generation

## 🎯 Latest Changes (May 6, 2026)

1. ✅ Added floating "Tạo QR Code" button (bottom-right, emerald green)
2. ✅ Removed Camera ID display from QR modal
3. ✅ Fixed ffmpeg path detection with FFMPEG_PATH env variable
4. ✅ Added ffmpeg installation checker script
5. ✅ Added comprehensive ffmpeg installation guide

## 🎯 Next Steps (if needed)

- Test standalone QR generator on production
- Verify ffmpeg installation on server
- Monitor table corner detection functionality

