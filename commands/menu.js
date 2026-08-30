// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMAND: MENU (Animated Loading via Edit)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const config = require("../config");
const { formatUptime, getRAMUsage, getSpeed, animateMessage } = require("../utils/helpers");

module.exports = {
    name: "menu",
    aliases: ["help", "cmds"],
    async execute(sock, from, args, msg, extra = {}) {
        const commands = extra.commands || {};
        const cmdCount = Object.keys(commands).length;

        const buildFrame = (pct, status) => {
            const barLength = 20;
            const filled = Math.round((pct / 100) * barLength);
            const bar = "█".repeat(filled) + "░".repeat(barLength - filled);
            return `🔄 *LOADING MENU...*\n\n✦ ${config.BOT_NAME} ✦\n\n${bar} ${pct}%\n${status}`;
        };

        const frames = [
            buildFrame(15, "⚡ Initializing System..."),
            buildFrame(40, "📂 Loading Command Modules..."),
            buildFrame(65, "🛡️ Loading Protection System..."),
            buildFrame(90, "🎨 Generating Interface..."),
            buildFrame(100, "✅ Menu Loaded!"),
        ];

        await animateMessage(sock, from, frames, 500);

        const uptime = formatUptime();
        const ram = getRAMUsage();
        const speed = getSpeed();
        const divider = "───────────────────────";

        const ownerDisplay = config.OWNER_NAME.length > 15
            ? config.OWNER_NAME.slice(0, 15) + "..."
            : config.OWNER_NAME;

        const finalMenu = `✦ ${config.BOT_NAME} ✦
${divider}
📌 Prefix   : ${config.PREFIX}
👑 Owner    : ${ownerDisplay}
🔓 Mode     : Public
🌐 Platform : Render
⚡ Speed    : ${speed}
⏱️ Uptime   : ${uptime}
🧠 RAM      : ${ram.bar} (${ram.percent}%)
📦 Commands : ${cmdCount}
${divider}
🌐 *PROXY*: .proxy — Get Supreme Prime Proxy
🛡️ *PROTECTION*: antilink, antispam, antibug
👑 *OWNER*: mode, setprefix, restart
📥 *MEDIA*: tiktok, ig, fb, ytaudio, ytvideo
🎮 *FUN*: joke, fact, quote, meme
🧠 *AI*: ai
🐙 *REPO*: repo
${divider}
✦ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 ${config.BOT_NAME} ✦`;

        try {
            await sock.sendMessage(from, {
                image: { url: config.MENU_IMAGE },
                caption: finalMenu
            });
        } catch (e) {
            console.log("❌ Menu: failed to send final menu:", e.message);
        }
    }
};
