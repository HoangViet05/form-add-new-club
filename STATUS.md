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
- **✅ FIXED:** QR modal now stays open until user manually closes it
- Generates QR for: `https://academy.arenabilliard.com?cameraId=<camera._id>`
- Displays camera ID (no URL shown per user request)
- Download QR as PNG
- Form resets after 2s but QR modal persists

### 5. Production Deployment
- PM2 ecosystem configuration
- Automated deploy script (`deploy.sh`)
- Port 3002 configuration
- Tailscale network access
- Server: http://100.74.187.40:3002

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
- `components/QRModal.tsx` - QR code display modal
- `components/TableCornerPicker.tsx` - Interactive corner selection

### API Routes
- `app/api/check-device/route.ts` - Device ID verification
- `app/api/check-rtsp/route.ts` - RTSP connectivity check
- `app/api/capture-frame/route.ts` - Frame capture from RTSP
- `app/api/devices/route.ts` - Save to MongoDB

### Models
- `models/Club.ts` - Club schema
- `models/Camera.ts` - Camera schema

### Configuration
- `ecosystem.config.js` - PM2 configuration (port 3002)
- `deploy.sh` - Deployment automation script
- `.env.local` - Local environment variables
- `.env.production.example` - Production env template

## 🚀 Deployment Instructions

1. **On Server:**
   ```bash
   cd ~/form-add-new-club  # or your project directory
   git pull origin main     # if using git
   ./deploy.sh
   ```

2. **First Time Setup:**
   - Copy `.env.production.example` to `.env.production`
   - Fill in `MONGODB_URI` and `API_KEY`
   - Ensure Node.js v18+ is installed
   - Ensure ffmpeg is installed
   - Run `pm2 update` if daemon version mismatch

3. **Access:**
   - Local: http://localhost:3002
   - Tailscale: http://100.74.187.40:3002

## 🔧 Build Status

✅ **Build:** Passing (no errors)
✅ **TypeScript:** No diagnostics
✅ **Deployment:** Configured for port 3002

## 📝 User Preferences

- Blue color scheme (not purple)
- Auto-verification (no manual buttons)
- Simple status messages: "Xác minh thành công" / "Vui lòng kiểm tra lại"
- No branchId/scoreboardId display in UI
- QR modal persists until manually closed
- No URL display in QR modal (only Camera ID)

## 🎯 Next Steps (if needed)

- Monitor production deployment
- Test QR modal behavior on production server
- Gather user feedback for improvements
