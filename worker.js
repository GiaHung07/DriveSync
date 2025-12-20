// ═══════════════════════════════════════════════════════════════
// 🤖 DRIVE SYNC BOT - Admin Dashboard
// Professional Telegram Bot for Google Drive Synchronization
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// 📡 TELEGRAM API
// ═══════════════════════════════════════════════════════════════

async function sendMessage(token, chatId, text, options = {}) {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            ...options
        })
    });
}

async function answerCallback(token, callbackId) {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackId })
    });
}

// ═══════════════════════════════════════════════════════════════
// 📊 GITHUB API
// ═══════════════════════════════════════════════════════════════

async function getState(repo) {
    // List of repos to aggregate stats from
    const repos = [
        'GiaHung07/DriveSync',
        'PGHungg/DriveSync'
    ];

    let totalSyncs = 0;
    let totalFiles = 0;
    let allHistory = [];
    let lastSyncTime = '';

    for (const r of repos) {
        try {
            // Add cache busting
            const url = `https://raw.githubusercontent.com/${r}/main/state.json?t=${Date.now()}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                // Aggregate Stats
                totalSyncs += (data.stats.totalSyncs || 0);
                totalFiles += (data.stats.totalFiles || 0);

                // Track latest sync time
                if (data.stats.lastSync > lastSyncTime) {
                    lastSyncTime = data.stats.lastSync;
                }

                // Collect history
                if (Array.isArray(data.history)) {
                    allHistory = allHistory.concat(data.history);
                }
            }
        } catch (e) {
            console.error(`Error fetching state from ${r}:`, e);
        }
    }

    // Sort history by time (newest first)
    allHistory.sort((a, b) => new Date(b.time) - new Date(a.time));

    return {
        stats: {
            totalSyncs: totalSyncs,
            totalFiles: totalFiles,
            lastSync: lastSyncTime
        },
        history: allHistory
    };
}

async function triggerSync(repo, token, branch = 'main') {
    if (!token) return { ok: false, error: 'No Token' };

    // Helper to send request
    const send = async (ref) => {
        return await fetch(`https://api.github.com/repos/${repo}/actions/workflows/sync.yml/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Cloudflare-Worker'
            },
            body: JSON.stringify({ ref })
        });
    };

    let res = await send(branch);

    // If 422 (Unprocessable Entity) -> Likely wrong branch, try 'master'
    if (res.status === 422 && branch === 'main') {
        console.log(`Trigger on 'main' failed (422), retrying with 'master'...`);
        res = await send('master');
    }

    if (!res.ok) {
        const text = await res.text();
        console.error(`Sync failed on ${repo}: ${res.status} - ${text}`);

        if (res.status === 403) {
            return { ok: false, error: '⚠️ 403 Forbidden: Token thiếu quyền! (Cần tick "repo" hoặc "workflow")' };
        }
        if (res.status === 404) {
            return { ok: false, error: '⚠️ 404 Not Found: Sai tên Repo hoặc chưa có file sync.yml' };
        }

        return { ok: false, error: `${res.status} - ${text}` };
    }
    return { ok: true };
}

// ═══════════════════════════════════════════════════════════════
// 🎨 MESSAGE TEMPLATES
// ═══════════════════════════════════════════════════════════════

function formatNumber(n) {
    return n?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
}

function formatUptime() {
    return "99.9%";
}

function getStatusEmoji(success, total) {
    if (total === 0) return "⚪";
    const rate = (success / total) * 100;
    if (rate >= 95) return "🟢";
    if (rate >= 80) return "🟡";
    return "🔴";
}

// ═══════════════════════════════════════════════════════════════
// 📱 COMMAND HANDLERS
// ═══════════════════════════════════════════════════════════════

async function cmdStart(token, chatId) {
    const text = `🤖 <b>Drive Sync Bot</b>

📌 <b>Lệnh:</b>
/sync - 🔄 Đồng bộ ngay
/status - 📊 Xem trạng thái
/history - 📜 Lịch sử sync
/help - ❓ Trợ giúp

⏰ Auto-sync: 10 phút`;
    await sendMessage(token, chatId, text);
}

async function cmdDashboard(token, chatId, repo) {
    const state = await getState(repo);
    const s = state.stats;

    const text = `📊 <b>Dashboard</b>

🔄 Tổng sync: ${s.totalSyncs || 0}
📁 Files đã sync: ${s.totalFiles || 0}
⏰ Lần cuối: ${s.lastSync || 'Chưa có'}

⚙️ Chu kỳ: 10 phút | Mode: Copy`;

    const keyboard = {
        inline_keyboard: [
            [
                { text: '🔄 Sync', callback_data: 'sync' },
                { text: '📜 History', callback_data: 'history' }
            ]
        ]
    };

    await sendMessage(token, chatId, text, { reply_markup: keyboard });
}

async function cmdStatus(token, chatId, repo) {
    const state = await getState(repo);
    const s = state.stats;

    const text = `📈 <b>Status</b>

🟢 Trạng thái: Online
🔄 Tổng sync: ${s.totalSyncs || 0}
📁 Files: ${s.totalFiles || 0}
⏰ Lần cuối: ${s.lastSync || 'N/A'}
⚙️ Chu kỳ: 10 phút`;

    await sendMessage(token, chatId, text);
}

async function cmdStats(token, chatId, repo) {
    const state = await getState(repo);
    const s = state.stats;
    const avg = s.totalSyncs > 0 ? Math.round(s.totalFiles / s.totalSyncs * 10) / 10 : 0;

    const text = `📊 <b>Statistics</b>

🔄 Tổng sync: ${s.totalSyncs || 0}
📁 Tổng files: ${s.totalFiles || 0}
📈 TB/sync: ${avg} files
⚡ Mode: Copy 1 chiều`;

    await sendMessage(token, chatId, text);
}

async function cmdHistory(token, chatId, repo) {
    const state = await getState(repo);
    const history = state.history || [];

    if (history.length === 0) {
        await sendMessage(token, chatId, '📭 Chưa có lịch sử');
        return;
    }

    // Header
    let text = `📜 <b>Lịch sử Sync (10 gần nhất)</b>\n`;

    // Take last 5 events
    const recent = history.slice(0, 5);

    for (const h of recent) {
        const icon = h.files > 0 ? '✅' : '⚪';
        const fileCount = h.files > 0 ? `(${h.files} files)` : '';

        text += `\n${icon} <b>${h.time.split(' ')[1]}</b> ${fileCount}`;

        // Show file details if available
        if (h.files > 0 && h.details) {
            const files = h.details.trim().split('\n');
            // Limit to 3 files per event to save space, or 10 if it's the very latest
            const displayFiles = files.slice(0, 5);

            for (const f of displayFiles) {
                // Formatting: Remove box header if exist, just show filenames
                let cleanName = f.replace(/�.*->.*/, '').replace('- ', '').trim();
                // If line was just a header "📦...", keep it bold
                if (f.includes('📦')) {
                    text += `\n   └─ <b>${f}</b>`;
                } else if (cleanName) {
                    text += `\n   └─ 📄 ${cleanName}`;
                }
            }
            if (files.length > 5) text += `\n   └─ <i>...và ${files.length - 5} file khác</i>`;
        }
    }

    text += `\n\n💡 <i>Chi tiết xem tại /dashboard</i>`;

    await sendMessage(token, chatId, text);
}

async function cmdReport(token, chatId, repo) {
    const state = await getState(repo);
    const s = state.stats;
    const history = state.history || [];

    const last24h = history.filter(h => {
        const hTime = new Date(h.time).getTime();
        return Date.now() - hTime < 24 * 60 * 60 * 1000;
    });
    const files24h = last24h.reduce((sum, h) => sum + (h.files || 0), 0);

    const text = `📑 <b>Report 24h</b>

🔄 Sync hôm nay: ${last24h.length} lần
📁 Files hôm nay: ${files24h}
📊 Tổng sync: ${s.totalSyncs || 0}
📂 Tổng files: ${s.totalFiles || 0}`;

    await sendMessage(token, chatId, text);
}

async function cmdSync(token, chatId, repo, ghToken) {
    if (!ghToken) {
        await sendMessage(token, chatId, '⚠️ LỖI: Chưa cài GITHUB_TOKEN trong Cloudflare!');
        return;
    }
    await sendMessage(token, chatId, '⏳ Đang thử trigger sync...');

    const repos = [
        'GiaHung07/DriveSync',
        'PGHungg/DriveSync'
    ];

    // Sort random
    const shuffled = repos.sort(() => Math.random() - 0.5);
    let lastError = '';

    for (const r of shuffled) {
        try {
            const result = await triggerSync(r, ghToken);
            if (result.ok) {
                await sendMessage(token, chatId, `✅ Đã trigger thành công trên server: ${r.split('/')[0]}!`);
                return;
            } else {
                console.log(`Manual Sync: Failed on ${r}, trying next...`);
                lastError = result.error;
            }
        } catch (e) {
            console.error(e);
            lastError = e.message;
        }
    }

    await sendMessage(token, chatId, `❌ Lỗi: Không thể trigger cả 2 server.\nCode: ${lastError}\n\n👉 Kiểm tra lại GITHUB_TOKEN trong Cloudflare / Check tên nhánh (main/master)!`);
}

async function cmdSettings(token, chatId, repo) {
    const text = `⚙️ <b>Settings</b>

⏱️ Interval: ~2 phút (Turbo Mode)
📤 Mode: Copy 1 chiều
🔔 Notify: Khi có file mới

📝 Sửa: GitHub Secrets`;

    const keyboard = {
        inline_keyboard: [[
            { text: '🔗 GitHub', url: `https://github.com/${repo}` }
        ]]
    };
    await sendMessage(token, chatId, text, { reply_markup: keyboard });
}

async function cmdHelp(token, chatId) {
    const text = `❓ <b>Help</b>

📌 <b>Lệnh:</b>
/sync - 🔄 Đồng bộ ngay
/status - 📊 Trạng thái
/history - 📜 Lịch sử
/stats - 📈 Thống kê
/settings - ⚙️ Cài đặt

⏰ Auto-sync mỗi ~2 phút (Turbo)`;
    await sendMessage(token, chatId, text);
}

// ═══════════════════════════════════════════════════════════════
// 🚀 GOOGLE DRIVE WEBHOOK
// ═══════════════════════════════════════════════════════════════

async function getAccessToken(env) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            refresh_token: env.GOOGLE_REFRESH_TOKEN,
            grant_type: 'refresh_token'
        })
    });
    const data = await res.json();
    return data.access_token;
}

async function setupDriveWatch(env, folderId, webhookUrl) {
    const accessToken = await getAccessToken(env);
    const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${folderId}/watch`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: 'drive-sync-' + Date.now(),
                type: 'web_hook',
                address: webhookUrl,
                expiration: Date.now() + (7 * 24 * 60 * 60 * 1000)
            })
        }
    );
    return res.json();
}

// ═══════════════════════════════════════════════════════════════
// 🚀 MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Google Drive Webhook endpoint
        if (url.pathname === '/drive-webhook') {
            const resourceState = request.headers.get('X-Goog-Resource-State');
            if (resourceState === 'change' || resourceState === 'update') {
                const REPO = env.GITHUB_REPO || 'GiaHung07/DriveSync';
                if (env.GITHUB_TOKEN) {
                    await triggerSync(REPO, env.GITHUB_TOKEN);
                    console.log('Drive webhook: sync triggered!');
                }
            }
            return new Response('OK', { status: 200 });
        }

        // Setup watch endpoint
        if (url.pathname === '/setup-watch' && request.method === 'POST') {
            try {
                const { folderId } = await request.json();
                const result = await setupDriveWatch(env, folderId, url.origin + '/drive-webhook');
                return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), { status: 500 });
            }
        }

        // Status page
        if (request.method === 'GET') {
            return new Response('🤖 Drive Sync Bot v4.0 - Webhook Active', { status: 200 });
        }

        // Telegram handler (POST to root)

        const TOKEN = env.BOT_TOKEN;
        const CHAT_ID = env.CHAT_ID;
        const GH_TOKEN = env.GITHUB_TOKEN || '';
        const REPO = env.GITHUB_REPO || 'PGHungg/DriveSync';

        try {
            const update = await request.json();

            // Callback queries
            if (update.callback_query) {
                const chatId = update.callback_query.message.chat.id.toString();
                if (chatId !== CHAT_ID) return new Response('OK');

                await answerCallback(TOKEN, update.callback_query.id);

                const action = update.callback_query.data;
                switch (action) {
                    case 'dashboard': await cmdDashboard(TOKEN, chatId, REPO); break;
                    case 'status': await cmdStatus(TOKEN, chatId, REPO); break;
                    case 'stats': await cmdStats(TOKEN, chatId, REPO); break;
                    case 'history': await cmdHistory(TOKEN, chatId, REPO); break;
                    case 'report': await cmdReport(TOKEN, chatId, REPO); break;
                    case 'sync': await cmdSync(TOKEN, chatId, REPO, GH_TOKEN); break;
                    case 'settings': await cmdSettings(TOKEN, chatId, REPO); break;
                    case 'help': await cmdHelp(TOKEN, chatId); break;
                }
                return new Response('OK');
            }

            // Messages
            const msg = update.message;
            if (!msg || !msg.text) return new Response('OK');

            const chatId = msg.chat.id.toString();
            if (chatId !== CHAT_ID) return new Response('OK');

            const cmd = msg.text.split(' ')[0].toLowerCase().replace(/@\w+/, '');

            switch (cmd) {
                case '/start': await cmdStart(TOKEN, chatId); break;
                case '/dashboard':
                case '/menu': await cmdDashboard(TOKEN, chatId, REPO); break;
                case '/status': await cmdStatus(TOKEN, chatId, REPO); break;
                case '/stats': await cmdStats(TOKEN, chatId, REPO); break;
                case '/history': await cmdHistory(TOKEN, chatId, REPO); break;
                case '/report': await cmdReport(TOKEN, chatId, REPO); break;
                case '/sync': await cmdSync(TOKEN, chatId, REPO, GH_TOKEN); break;
                case '/settings': await cmdSettings(TOKEN, chatId, REPO); break;
                case '/help': await cmdHelp(TOKEN, chatId); break;
                default:
                    await sendMessage(TOKEN, chatId, '❓ Lệnh không hợp lệ. Gửi /help để xem hướng dẫn.');
            }

        } catch (e) {
            console.error('Error:', e);
        }

        return new Response('OK', { status: 200 });
    },

    // Cron Trigger: Auto sync mỗi 2 phút (Turbo Mode)
    async scheduled(event, env, ctx) {
        // Load Balancing: Chọn ngẫu nhiên 1 trong 2 repo
        const repos = [
            env.GITHUB_REPO || 'GiaHung07/DriveSync',
            'PGHungg/DriveSync'
        ];

        // Shuffle array
        repos = repos.sort(() => Math.random() - 0.5);
        // Lọc trùng
        repos = [...new Set(repos)];

        const GH_TOKEN = env.GITHUB_TOKEN;
        if (!GH_TOKEN) return;

        // 2. Try từng repo, nếu lỗi thử cái tiếp theo
        for (const repo of repos) {
            try {
                const ok = await triggerSync(repo, GH_TOKEN);
                if (ok) {
                    console.log(`Turbo Sync: Triggered SUCCESS on ${repo}`);
                    break; // Thành công thì dừng, không spam repo kia
                } else {
                    console.log(`Turbo Sync: Failed on ${repo}, trying next...`);
                }
            } catch (e) {
                console.error(`Turbo Sync: Error on ${repo}:`, e);
            }
        }
    }
};
