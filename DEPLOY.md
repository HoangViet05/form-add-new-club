# Deploy lên Server Local (Tailscale)

## Yêu cầu trên server
- ✅ Linux
- ✅ Node.js (v18+)
- ✅ ffmpeg
- ✅ PM2: `npm install -g pm2`
- ✅ Tailscale đã cài và đang chạy

## Bước deploy

### 1. Copy code lên server
```bash
# Từ máy local
scp -r arena-device-form user@<server-ip>:/path/to/deploy/
```

Hoặc dùng git:
```bash
# Trên server
git clone <repo-url>
cd arena-device-form
```

### 2. Tạo file `.env.production`
```bash
cd arena-device-form
cp .env.production.example .env.production
nano .env.production
```

Điền:
```
MONGODB_URI=mongodb+srv://...
API_KEY=your_arena_api_key
```

### 3. Chạy deploy script
```bash
chmod +x deploy.sh
./deploy.sh
```

Script sẽ tự động:
- Install dependencies
- Build production
- Start/reload PM2
- Hiển thị Tailscale IP để truy cập

### 4. Truy cập
```
http://<tailscale-ip>:3000
```

## Quản lý PM2

```bash
# Xem logs
pm2 logs arena-device-form

# Xem status
pm2 status

# Restart
pm2 restart arena-device-form

# Stop
pm2 stop arena-device-form

# Xoá khỏi PM2
pm2 delete arena-device-form
```

## Cập nhật code sau này

```bash
cd arena-device-form
git pull  # hoặc scp code mới
./deploy.sh
```

## Troubleshooting

**Port 3000 đã bị chiếm:**
```bash
# Sửa port trong ecosystem.config.js
env: {
  PORT: 3001,  # đổi port khác
}
```

**PM2 không tự start sau reboot:**
```bash
pm2 startup
# Copy lệnh nó in ra rồi chạy
pm2 save
```

**ffmpeg không tìm thấy:**
```bash
which ffmpeg
# Nếu không có → cài: sudo apt install ffmpeg
```

**MongoDB connection timeout:**
- Kiểm tra IP whitelist trên MongoDB Atlas
- Thêm IP của server vào whitelist (hoặc dùng 0.0.0.0/0 cho test)
