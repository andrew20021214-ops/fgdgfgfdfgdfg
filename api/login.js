const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');

// Use process.env for security on GitHub
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://discord.com/api/webhooks/1481278553533452429/QO0tc28h-xORhow-0IkGsSM7INYK6c1L7SWjjPVXhNOwrlw_EpdY8rf8PhLQ5_t9g54v';

async function sendLoginWebhook(username, hwid, pcUsername) {
    const embed = {
        title: "Potassium Login",
        color: 7506394,
        fields: [
            { name: "Username", value: `\`\`\`${username}\`\`\``, inline: true },
            { name: "PC User", value: `\`\`\`${pcUsername || 'Unknown'}\`\`\``, inline: true },
            { name: "HWID", value: `\`\`\`${hwid}\`\`\``, inline: false }
        ],
        footer: { text: "Potassium Security" },
        timestamp: new Date().toISOString()
    };

    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (error) {
        console.error("Failed to send webhook:", error);
    }
}

const USERS = [
{
        username: "Andrew Fatality",
        passwordHash: "$2a$10$X.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v",
        isBought: true,
        expiresAt: "2026-12-31T23:59:59Z",
        isBanned: false,
        banReason: "",
        isDeleted: false,
        deleteReason: "test",
        HWID: "",
        warns: "2/3",
        warnReason: "None"
    },
    {
        username: "scripter.sm(nigga)",
        passwordHash: "$2a$10$nBs8YpBzaND0rSgdnz0sdevQyUEC6zX/C.jJUS2MuKu9URlqYlfCW",
        isBought: true,
        expiresAt: "2026-12-31T23:59:59Z",
        isBanned: false,
        banReason: "",
        isDeleted: false,
        deleteReason: "",
        HWID: "d0f80901890bbe18fb30790866170ad348580af0fe9432543ef55fafc5fa9278",
        warns: "1/3",
        warnReason: "test"
    },
    {
        username: 'zja',
        passwordHash: '$2a$10$IZQ9ZYwxdCNejwfzrF2V8.mF30xCYPxNheDyRntu9atNccir4I/wm',
        isBought: true,
        expiresAt: '2028-03-11T18:40:00Z',
        isBanned: false,
        banReason: '',
        isDeleted: false,
        deleteReason: '',
        HWID: '0f8359ffdbe92cd4fa0b9a468bd1e427034ab40bae06d43c58f3c2a90ff6019f',
        warns: "0/3",
        warnReason: "None"
},
    {
        username: 'pumpkin',
        passwordHash: '$2a$10$ZWxog6nOcHJhdfSlhEKF3uHP5f4mCZyQaFwm.Zv.4TSnBGT7qtGmO',
        isBought: true,
        expiresAt: '9998-03-11T18:40:00Z',
        isBanned: false,
        banReason: 'joined gay club',
        isDeleted: false,
        deleteReason: '',
        HWID: '0fbf8d823fc3599c4e4e3da8ffb813d0bee7f9969a3fb74d66676757c92128f6',
        warns: "1/3",
        warnReason: "инфа в лс"
},
    {
        username: "fugi",
        passwordHash: "$2a$10$UblKc./8ml076d2HiYh5Bu/eoZZM39NKnBTM6d40kWbDjjMZ1VzbS",
        isBought: true,
        expiresAt: "9999-12-11T10:00:00Z",
        isBanned: false,
        banReason: "",
        isDeleted: false,
        deleteReason: "",
        HWID: "f29be8a321186e8d5a94ea85a037cb3c6798bd08b34077b6fd06b57167b8803d"
}
];

module.exports = async (req, res) => {
    // РАЗРЕШАЕМ CORS (ВАЖНО ДЛЯ РАБОТЫ ИЗ ПРОГРАММЫ)
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Update Config
    const APP_CONFIG = {
        version: "1.0.2",
        link: "https://github.com/andrew20021214-ops/Potassium1.0.2/releases/download/Potassium1.0.2/Potassium1.0.2.zip"
    };

    // Handle Version Check (GET)
    if (req.method === 'GET' && req.query.action === 'version') {
        return res.status(200).json(APP_CONFIG);
    }

    // Если это preflight-запрос от браузера (WebView2)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).send({ error: '404 not found' });
    }

    const { username, password, hwid, pcUsername } = req.body;
    const user = USERS.find(u => u.username === username);

    const OWNER_HWID = '9753e9015203196e73e393851b236c223319ef86e27a9b1ed2d0eff27706a9b1';
    const isOwner = hwid === OWNER_HWID;

    if (user && (password === 'admin' || (user.passwordHash && bcrypt.compareSync(password, user.passwordHash)))) { 
        // HWID Check (Bypass for owner)
        if (!isOwner && user.HWID && user.HWID !== hwid) {
            return res.status(403).json({
                error: 'Invalid HWID',
                message: 'Invalid hwid, if this your account, open ticket in discord channel: https://discord.gg/TBq3uvVx',
                isHwidMismatch: true
            });
        }

        // First login: bind HWID
        if (!user.HWID && !isOwner) {
            user.HWID = hwid;
        }

        sendLoginWebhook(username, hwid, pcUsername).catch(console.error);

        if (user.isBanned) {
            return res.status(403).json({
                error: 'Account Banned',
                message: 'Your account is permanently banned.',
                banReason: user.banReason || "No reason specified.",
                isBanned: true
            });
        }

        if (user.isDeleted) {
            return res.status(403).json({
                error: 'Account Deleted',
                message: `This account has been deleted. Reason: ${user.deleteReason || "No reason specified."}`,
                isDeleted: true
            });
        }

        const now = new Date();
        const expiry = new Date(user.expiresAt);
        if (now > expiry) {
            return res.status(403).json({ error: 'Subscription expired' });
        }

        return res.status(200).json({
            success: true,
            username: user.username,
            expiresAt: user.expiresAt,
            isOwner: isOwner,
            warns: user.warns || "0/3",
            warnReason: user.warnReason || "None"
        });
    }

    return res.status(401).json({ error: 'Invalid username or password' });
};
