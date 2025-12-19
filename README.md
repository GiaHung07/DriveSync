# 🔄 Google Drive Auto Sync với GitHub Actions

![Sync Status](https://github.com/YOUR_USERNAME/gdrive-sync/actions/workflows/sync.yml/badge.svg)

Tự động sync 2 folder Google Drive mỗi **5 phút**, **miễn phí 100%**, không cần credit card!

> 💡 Workflow này được tạo dựa trên logic của `main.go` - bao gồm retry, exclude patterns, và thống kê chi tiết.

---

## 📋 Các folder được sync

| Tên | Source | Destination | Status |
|-----|--------|-------------|--------|
| test | `01` | `02` | ✅ Active |
| c++ | `C++ T10 2025` | `C++` | ✅ Active |

## ✨ Tính năng (từ main.go)

| Tính năng | Mô tả |
|-----------|-------|
| ✅ **Retry Logic** | 3 lần retry, đợi 30s giữa mỗi lần |
| ✅ **Internet Check** | Kiểm tra kết nối trước khi sync |
| ✅ **Exclude Patterns** | `*.tmp`, `~$*`, `Thumbs.db`, v.v. |
| ✅ **JSON Log Parsing** | Parse log để lấy danh sách files |
| ✅ **Stats Summary** | Tổng hợp files/bytes đã sync |
| ✅ **Notifications** | Discord & Telegram (tuỳ chọn) |

---

## 🚀 Hướng dẫn Setup

### Bước 1: Tạo GitHub Repository

1. Vào [github.com/new](https://github.com/new)
2. Đặt tên repo (ví dụ: `gdrive-sync`)
3. Chọn **Public** (để được unlimited free minutes)
4. Click **Create repository**

### Bước 2: Lấy rclone config từ máy tính

Mở **PowerShell** và chạy:

```powershell
# Hiển thị nội dung file config
Get-Content "$env:APPDATA\rclone\rclone.conf"
```

Hoặc mở file tại đường dẫn:
```
C:\Users\<TÊN_USER>\AppData\Roaming\rclone\rclone.conf
```

**Copy toàn bộ nội dung** file này (bao gồm cả `[gdrive]` header).

### Bước 3: Thêm Secret vào GitHub

1. Vào repo GitHub của bạn
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

**Secret bắt buộc:**

| Name | Value |
|------|-------|
| `RCLONE_CONFIG` | Toàn bộ nội dung file `rclone.conf` |

**Secret tuỳ chọn (cho notifications):**

| Name | Value |
|------|-------|
| `DISCORD_WEBHOOK` | Discord webhook URL |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_CHAT_ID` | Telegram chat/group ID |

### Bước 4: Push code lên GitHub

```bash
# Clone repo về máy
git clone https://github.com/YOUR_USERNAME/gdrive-sync.git
cd gdrive-sync

# Copy thư mục .github vào (từ thư mục này)
# Hoặc copy file sync.yml vào .github/workflows/

# Push lên
git add .
git commit -m "Add auto sync workflow"
git push
```

### Bước 5: Kích hoạt Actions

1. Vào tab **Actions** trong repo
2. Click **"I understand my workflows, go ahead and enable them"**
3. Workflow sẽ tự động chạy mỗi 5 phút!

---

## 📊 Theo dõi Sync

### Xem logs trực tiếp:
1. Vào repo → Tab **Actions**
2. Click vào workflow run mới nhất
3. Xem chi tiết từng step

### Xem status badge:
Thêm vào README của repo:
```markdown
![Sync Status](https://github.com/YOUR_USERNAME/gdrive-sync/actions/workflows/sync.yml/badge.svg)
```

### Nhận thông báo:

**Email (mặc định):**
- GitHub tự động gửi email khi workflow **FAIL**

**Discord:**
1. Tạo webhook trong Discord server
2. Thêm secret `DISCORD_WEBHOOK`

**Telegram:**
1. Tạo bot với [@BotFather](https://t.me/BotFather)
2. Lấy chat ID từ [@userinfobot](https://t.me/userinfobot)
3. Thêm 2 secrets: `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID`

---

## ⚙️ Tùy chỉnh

### Thay đổi tần suất sync:

Sửa dòng `cron` trong file `.github/workflows/sync.yml`:

```yaml
# Mỗi 5 phút (minimum, khuyên dùng)
- cron: '*/5 * * * *'

# Mỗi 10 phút
- cron: '*/10 * * * *'

# Mỗi 30 phút
- cron: '*/30 * * * *'

# Mỗi giờ
- cron: '0 * * * *'

# Mỗi 6 giờ
- cron: '0 */6 * * *'
```

### Thêm folder sync mới:

Thêm step mới vào file workflow (copy từ folder hiện có và sửa):

```yaml
- name: "Sync Folder: NEW_NAME (SRC -> DST)"
  id: sync_new
  run: |
    FOLDER_NAME="new"
    SRC="${{ env.REMOTE_NAME }}:SOURCE_PATH"
    DST="${{ env.REMOTE_NAME }}:DEST_PATH"
    # ... (copy phần còn lại từ step hiện có)
```

### Thay đổi retry config:

Sửa trong phần `env:`:

```yaml
env:
  RETRY_COUNT: 5      # Số lần retry (mặc định: 3)
  RETRY_DELAY: 60     # Đợi bao lâu giữa các lần (giây, mặc định: 30)
```

### Thêm/bỏ exclude patterns:

Sửa trong phần `env:`:

```yaml
EXCLUDES: "--exclude *.tmp --exclude *.bak --exclude node_modules"
```

---

## 🔒 Bảo mật

- ✅ `rclone.conf` được lưu trong **GitHub Secrets** (mã hóa)
- ✅ Không ai xem được nội dung secrets
- ✅ Secrets không hiện trong logs
- ⚠️ **Lưu ý**: Nếu repo là **Public**, ai cũng có thể thấy workflow runs (nhưng không thấy secrets)

---

## ❓ FAQ

**Q: Có tốn tiền không?**
A: KHÔNG! Hoàn toàn miễn phí với public repo.

**Q: Sao không sync mỗi 3 phút được?**
A: GitHub Actions giới hạn minimum là 5 phút cho scheduled workflows.

**Q: Sync có bị miss file không?**
A: Không. Workflow dùng `rclone copy` - chỉ copy file mới/thay đổi, không xoá file cũ.

**Q: Nếu workflow fail thì sao?**
A: 
- Tự động retry 3 lần
- Email thông báo (mặc định)
- Lần chạy tiếp theo (sau 5 phút) sẽ thử lại

**Q: Token Google Drive có hết hạn không?**
A: Có! Cần refresh token. Nếu sync fail liên tục, chạy lại `rclone config` trên máy và update secret.

---

## 🔗 Links hữu ích

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Rclone Google Drive Setup](https://rclone.org/drive/)
- [Cron Expression Generator](https://crontab.guru/)
- [Discord Webhooks Guide](https://support.discord.com/hc/en-us/articles/228383668)

---

## 📝 Changelog

### v2.0 (Dựa trên main.go)
- ✅ Thêm retry logic (3 lần, đợi 30s)
- ✅ Thêm internet check
- ✅ Parse JSON logs để lấy file list
- ✅ Stats summary cuối mỗi run
- ✅ Discord & Telegram notifications
- ✅ Drive space check

### v1.0 (Basic)
- ✅ Basic rclone sync
- ✅ Scheduled every 5 minutes
