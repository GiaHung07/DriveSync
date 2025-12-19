# 🔄 Drive Sync - Cloud Auto Sync với Telegram Bot

![Sync Status](https://github.com/PGHungg/DriveSync/actions/workflows/sync.yml/badge.svg)

Tự động sync Google Drive mỗi **5 phút**, điều khiển và theo dõi qua **Telegram Bot**.

---

## ✨ Tính năng

- 🔄 **Auto sync** mỗi 5 phút
- 🔁 **Retry logic** - 3 lần retry, delay 30s
- 📊 **Stats tracking** - Thống kê chi tiết
- 📜 **History** - Lưu 100 lần sync gần nhất
- 🤖 **Telegram Bot** - Điều khiển và nhận thông báo
- 🔐 **Secure** - Config mã hóa trong GitHub Secrets

---

## 🤖 Telegram Bot Commands

| Command | Mô tả |
|---------|-------|
| `/status` | Xem trạng thái hiện tại |
| `/stats` | Xem thống kê chi tiết |
| `/history` | 10 lần sync gần nhất |
| `/sync` | Trigger sync ngay |
| `/help` | Hiển thị help |

---

## 🚀 Setup

### 1. Tạo Telegram Bot
1. Mở Telegram, tìm [@BotFather](https://t.me/BotFather)
2. Gửi `/newbot` và làm theo hướng dẫn
3. Copy **Token** được cấp
4. Gửi tin nhắn cho bot của bạn
5. Truy cập `https://api.telegram.org/bot<TOKEN>/getUpdates` để lấy Chat ID

### 2. Thêm Secrets vào GitHub
Vào Settings → Secrets → Actions, thêm:

| Secret | Giá trị |
|--------|---------|
| `RCLONE_CONFIG` | Nội dung file rclone.conf |
| `SYNC_CONFIG` | Config JSON (xem bên dưới) |
| `TELEGRAM_BOT_TOKEN` | Token từ BotFather |
| `TELEGRAM_CHAT_ID` | Chat ID của bạn |

### 3. Format SYNC_CONFIG

```json
{
  "folders": [
    {"name": "folder1", "src": "Source/Path", "dst": "Dest/Path", "on": true},
    {"name": "folder2", "src": "Another/Source", "dst": "Another/Dest", "on": true}
  ],
  "excludes": ["*.tmp", "~$*", "Thumbs.db", "desktop.ini", ".DS_Store"],
  "retryCount": 3,
  "retryDelay": 30
}
```

---

## 📊 State Tracking

File `state.json` tự động cập nhật sau mỗi lần sync:

```json
{
  "stats": {
    "totalSyncs": 100,
    "totalFiles": 500,
    "success": 98,
    "fail": 2,
    "lastSync": "2025-12-19 19:30:00"
  },
  "history": [...]
}
```

---

## 🔒 Security Notes

- ✅ `RCLONE_CONFIG` - Encrypted trong GitHub Secrets
- ✅ `SYNC_CONFIG` - Encrypted, không hiện trong code
- ✅ Telegram tokens - Encrypted
- ℹ️ `state.json` chỉ chứa stats, KHÔNG chứa folder names

---

## 📝 Changelog

### v2.0 - Telegram Bot Edition
- 🤖 Telegram Bot integration
- 📊 State tracking (stats, history)
- 🔐 Config từ secrets
- 🔁 Retry logic
- 📜 History 100 records
